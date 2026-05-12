import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'

function gitCommitPlugin() {
  return {
    name: 'git-commit-api',
    configureServer(server) {
      server.middlewares.use('/api/commit', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.end(JSON.stringify({ error: 'Method not allowed' }))
          return
        }

        let body = ''
        req.on('data', chunk => { body += chunk })
        req.on('end', () => {
          try {
            const { boardId, data, commitMessage } = JSON.parse(body)

            // Determine file path from boardId
            const fileName = `${boardId}-board.js`
            const filePath = path.resolve(__dirname, 'src', 'data', fileName)

            // Generate proper export variable name: "development-ti" -> "developmentTiBoard"
            const varName = boardId.replace(/-([a-z])/g, (_, c) => c.toUpperCase()) + 'Board'
            const jsContent = `export const ${varName} = ${JSON.stringify(data, null, 2)};\n`

            // Write file
            fs.writeFileSync(filePath, jsContent, 'utf-8')

            // Git operations
            const cwd = path.resolve(__dirname)
            const msg = commitMessage || `Update board: ${boardId}`

            execSync('git add .', { cwd })
            execSync(`git commit -m "${msg.replace(/"/g, '\\"')}"`, { cwd })

            let pushed = false
            try {
              execSync('git push origin main', { cwd, timeout: 15000 })
              pushed = true
            } catch (pushErr) {
              console.warn('Push failed (will retry later):', pushErr.message)
            }

            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({
              success: true,
              pushed,
              file: fileName,
              message: msg
            }))
          } catch (err) {
            console.error('Commit error:', err)
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: err.message }))
          }
        })
      })
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), gitCommitPlugin()],
})
