export const developmentBoard = {
  "id": "development",
  "title": "Development TI",
  "columns": [
    {
      "id": "planning",
      "title": "Planning",
      "color": "border-blue-500",
      "cards": [
        {
          "id": "task-1",
          "title": "Setup Arsitektur Microservices",
          "startDate": "2026-05-01",
          "endDate": "2026-05-10",
          "description": "Mempersiapkan infrastruktur dasar untuk layanan baru.",
          "priority": "high",
          "subtasks": [
            {
              "id": "st-1",
              "text": "Design DB Schema",
              "completed": true
            },
            {
              "id": "st-2",
              "text": "Dockerization",
              "completed": false
            }
          ],
          "comments": []
        },
        {
          "id": "task-7",
          "title": "Research Next.js 15",
          "startDate": "2026-05-15",
          "endDate": "2026-05-20",
          "description": "Mempelajari fitur baru App Router.",
          "priority": "low",
          "subtasks": [],
          "comments": []
        }
      ]
    },
    {
      "id": "progress",
      "title": "Progress",
      "color": "border-amber-500",
      "cards": [
        {
          "id": "task-2",
          "title": "Integrasi Payment Gateway",
          "startDate": "2026-05-05",
          "endDate": "2026-05-20",
          "description": "Menghubungkan sistem dengan provider pembayaran.",
          "priority": "medium",
          "subtasks": [
            {
              "id": "st-3",
              "text": "Sandbox Testing",
              "completed": true
            }
          ],
          "comments": []
        },
        {
          "title": "Testing",
          "description": "",
          "priority": "medium",
          "storyPoints": "",
          "startDate": "2026-05-12",
          "endDate": "2026-05-12",
          "id": "task-1778554066284",
          "subtasks": [],
          "comments": [],
          "attachments": []
        }
      ]
    },
    {
      "id": "focused",
      "title": "Focused",
      "color": "border-purple-500",
      "cards": [
        {
          "id": "task-3",
          "title": "Refactoring Auth Module",
          "startDate": "2026-05-10",
          "endDate": "2026-05-12",
          "description": "Meningkatkan keamanan dan performa modul autentikasi.",
          "priority": "high",
          "subtasks": [],
          "comments": []
        },
        {
          "id": "task-8",
          "title": "Optimization Query SQL",
          "startDate": "2026-05-11",
          "endDate": "2026-05-11",
          "description": "Fix slow queries di dashboard utama.",
          "priority": "high",
          "subtasks": [],
          "comments": []
        }
      ]
    },
    {
      "id": "uat",
      "title": "UAT",
      "color": "border-indigo-500",
      "cards": [
        {
          "id": "task-4",
          "title": "Feature Chat Real-time",
          "startDate": "2026-04-20",
          "endDate": "2026-05-15",
          "description": "Testing fitur chat dengan user internal.",
          "priority": "low",
          "subtasks": [],
          "comments": []
        }
      ]
    },
    {
      "id": "selesai",
      "title": "Selesai",
      "color": "border-emerald-500",
      "cards": [
        {
          "id": "task-5",
          "title": "Migrasi Database Legacy",
          "startDate": "2026-04-01",
          "endDate": "2026-04-15",
          "description": "Pemindahan data dari sistem lama ke sistem baru.",
          "priority": "medium",
          "subtasks": [],
          "comments": []
        },
        {
          "id": "task-6",
          "title": "Cleanup Assets Folder",
          "startDate": "2026-04-10",
          "endDate": "2026-04-12",
          "description": "Menghapus file yang tidak digunakan di folder public.",
          "priority": "low",
          "subtasks": [],
          "comments": []
        }
      ]
    }
  ]
};
