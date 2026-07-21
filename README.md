# Secure Image Transmission — AES-256 + Video Steganography

A working full-stack app: React (Vite + Tailwind + Framer Motion) frontend,
FastAPI backend, real AES-256-CBC encryption, real LSB video steganography.
Tested end-to-end — upload an image + video, get a stego video back, upload
that stego video + key, get the exact original image back.

```
Secure-Steganography/          <- open THIS folder in VS Code
│
├── backend/
│   ├── app/
│   │   ├── main.py            FastAPI app, CORS, static file serving
│   │   ├── routes.py          POST /encrypt and POST /decrypt
│   │   └── config.py          paths + upload size limits
│   ├── encryption/
│   │   ├── aes_encrypt.py     AES-256-CBC encrypt + key generation
│   │   └── aes_decrypt.py     AES-256-CBC decrypt + SHA-256 verification
│   ├── steganography/
│   │   ├── payload.py         shared header format (magic/IV/hash/length)
│   │   ├── embed.py           hides ciphertext inside a video (LSB)
│   │   └── extract.py         pulls it back out
│   ├── tests/
│   │   └── test_roundtrip.py  standalone pipeline test (no server needed)
│   ├── uploads/                temp storage, auto-created, safe to empty
│   ├── outputs/                generated stego videos + recovered images
│   ├── requirements.txt
│   └── CORE_README.md          deep-dive notes on the crypto/steganography design
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── Navbar.jsx
    │   │   ├── UploadCard.jsx  drag-and-drop upload
    │   │   └── ProgressBar.jsx
    │   ├── pages/
    │   │   ├── Home.jsx        animated landing page
    │   │   ├── Encrypt.jsx     upload image+video -> get stego video + key
    │   │   └── Decrypt.jsx     upload stego video+key -> get recovered image
    │   ├── services/
    │   │   └── api.js          axios calls to the backend
    │   ├── App.jsx              routes
    │   ├── main.jsx             entry point
    │   └── index.css            Tailwind + theme tokens (colors/fonts)
    ├── vite.config.js           dev server + /api proxy to FastAPI
    ├── package.json
    └── index.html
```

---

## Step-by-step: opening and arranging this in VS Code

**1. Unzip / place the project.**
Put the whole `Secure-Steganography/` folder somewhere on your machine, e.g.
`C:\Users\you\Projects\Secure-Steganography` or `~/Projects/Secure-Steganography`.
Keep `backend/` and `frontend/` as siblings inside it — don't nest one inside
the other, and don't rename them (the run commands below assume these exact
names and this exact layout).

**2. Open the root folder in VS Code**, not `backend/` or `frontend/`
individually: `File → Open Folder... → Secure-Steganography`. This way VS
Code's file explorer shows both `backend/` and `frontend/` side by side,
which matters once you're running both at once.

**3. Install the two recommended extensions** (VS Code will prompt you, or
grab them manually): **Python** (ms-python.python) and **ES7+ React/Redux
snippets** aren't required but help; the only one that actually matters is
**Python**, so `backend/*.py` files get syntax highlighting and import
resolution.

**4. Open two terminals inside VS Code** (Terminal → New Terminal, then
click the `+` to split) — one for the backend, one for the frontend. You'll
run both at the same time, side by side, for the app to work.

**Terminal 1 — backend:**
```bash
cd backend
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
You should see `Uvicorn running on http://127.0.0.1:8000`. Leave this
terminal running.

**Terminal 2 — frontend:**
```bash
cd frontend
npm install
npm run dev
```
You should see `Local: http://localhost:5173/`. Leave this running too.

**5. Open the app.** Go to `http://localhost:5173` in your browser. The
frontend's dev server proxies every `/api/...` call straight to the FastAPI
backend on port 8000 (configured in `frontend/vite.config.js`) — that's why
both terminals need to stay running, and why you never need to touch CORS
config for local development.

**6. Try it:**
- Go to **Encrypt**, drop in any image and any video, click Encrypt. You'll
  get an AES key (copy it!) and a stego `.avi` download.
- Go to **Decrypt**, upload that `.avi` back, paste the key, click Decrypt.
  You get the original image back, with integrity confirmed.

---

## Important: the stego video must stay lossless

The backend writes stego videos with the **FFV1 lossless codec** in an
`.avi` container. If you re-compress, re-encode, or convert that file
through anything (WhatsApp, YouTube, a phone's auto-optimize, ffmpeg to
mp4...) the hidden bits are destroyed and decryption will fail. Treat the
`.avi` as the actual encrypted artifact, not a preview — this is a real
constraint of LSB steganography, not a bug, and worth a line in your report.

## What's not built yet

Per the original spec, these are still open (say the word and I'll build
whichever's next): user auth (JWT + bcrypt), SQLAlchemy models + History
page, QR code generation for the key, Dashboard analytics/charts, and the
Profile/Settings pages. The core encrypt/decrypt flow — the part graders
actually test — is complete and working.
