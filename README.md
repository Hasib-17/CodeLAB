# 🚀 CodeLAB

A real‑world coding lab and interview simulation platform to make programming exams and technical interviews more interactive, secure, and effective.

---

## ✨ Key Features

- ✅ Code problems & testing with Piston API (supports CodeChef format)
- 📞 Video calls for viva/interviews using Jitsi Meet
- 🔄 Collaborative code pad with real‑time sync via Socket.IO
- 👤 User profiles and dashboards
- 🔑 Secure login & signup using NextAuth.js
- 🛡️ Cheating prevention:
  - Tab‑switch detection & full‑screen enforcement
  - Copy‑paste blocking in editor
  - USB flash drive detection & blocking during exams

---

## 🛠 Technologies Used

- **Frontend:** Next.js, React.js, Tailwind CSS
- **Backend:** Node.js, Express.js,Python FastAPI, MongoDB
- **Realtime:** Socket.IO
- **Authentication:** NextAuth.js
- **Code execution:** Piston API
- **Video:** Jitsi Meet

---

## 📦 How to Use Locally

1️⃣ **Clone the repository:**
```bash
git clone https://github.com/Hasib-17/CodeLAB.git
cd CodeLAB
```
##2️⃣ Install dependencies:
```bash
npm install
npm run dev
```
##3️⃣ Setup environment:

Create a .env file in the root folder.
Copy contents from .env.example and add your config (database URI, NextAuth secret, etc).
##4️⃣ Run the development server:
```bash
npm run dev
```
Visit http://localhost:3000 to see the app.

📄 License
MIT License

🙏 Acknowledgments
Piston API – code execution

Jitsi Meet – video conferencing

NextAuth.js – authentication

Socket.IO – real‑time sync
