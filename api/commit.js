// api/commit.js

export default async function handler(req, res) {
  // Hanya menerima method POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { boardId, data, commitMessage } = req.body;

    // Pastikan GITHUB_TOKEN tersedia (disetting di Vercel Environment Variables)
    if (!process.env.GITHUB_TOKEN) {
      return res.status(500).json({ error: 'GITHUB_TOKEN is missing in environment variables. Please add it in Vercel settings.' });
    }

    // Konfigurasi Repository (Ganti jika repo/owner berubah)
    const owner = 'asstroboyz';
    const repo = 'development-tree';

    // Menentukan nama file dan lokasi path di repo
    const fileName = `${boardId}-board.js`;
    const filePath = `src/data/${fileName}`;

    // Menggenerate nama variabel export secara dinamis
    const varName = boardId.replace(/-([a-z])/g, (_, c) => c.toUpperCase()) + 'Board';

    // Membuat string kode javascript
    const jsContent = `export const ${varName} = ${JSON.stringify(data, null, 2)};\n`;

    // Encoding content menjadi Base64 (Syarat wajib GitHub API)
    const contentEncoded = Buffer.from(jsContent).toString('base64');

    const headers = {
      'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'Vercel-Serverless-Function'
    };

    // 1. Dapatkan SHA dari file yang sudah ada (diperlukan GitHub untuk update file)
    let sha = null;
    const getRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${filePath}?ref=main`, {
      headers
    });

    if (getRes.ok) {
      const getJson = await getRes.json();
      sha = getJson.sha;
    }

    // 2. Commit dan Push (Buat baru atau update file)
    const putBody = {
      message: commitMessage || `Update board: ${boardId}`,
      content: contentEncoded,
      branch: 'main'
    };

    if (sha) {
      putBody.sha = sha; // Masukkan SHA jika file sudah ada sebelumnya
    }

    const putRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(putBody)
    });

    if (!putRes.ok) {
      const errorJson = await putRes.json();
      throw new Error(`GitHub API error: ${errorJson.message}`);
    }

    // Response sukses
    return res.status(200).json({
      success: true,
      pushed: true,
      file: fileName,
      message: putBody.message
    });

  } catch (err) {
    console.error('Commit error:', err);
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}
