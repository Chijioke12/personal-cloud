
# Setup & Deployment Checklist (Complete, non-coder friendly)

This checklist walks you through **everything** you need to do to get your personal cloud live on Vercel.
Follow each step in order. If you get stuck, copy the exact text from the step and paste it into the Vercel/GitHub fields.

---
## 1) Prepare files (you already have them)
You should have downloaded `personal-cloud-final.zip` from the assistant. If you don't, ask the assistant to generate it again.

Unzip it on your computer so you can upload the files to GitHub. If your computer auto-opens the folder, that's fine. You will upload the folder contents to GitHub.

---
## 2) Create a GitHub repository (web only — no code needed)
1. Go to https://github.com and sign in or create an account.
2. Click the **+** icon (top-right) → **New repository**.
3. Repository name: `personal-cloud` (or any name you like).
4. Choose **Public** or **Private** (private is fine).
5. Click **Create repository** (do NOT initialize with a README — we will upload files).

### Upload files to GitHub (two options)
**Option A — Drag & Drop (recommended for non-coders)**
1. On the new empty repository page, click **uploading an existing file** (link).
2. Drag the contents of the unzipped folder (all files and folders) into the upload area. Wait for upload to finish.
3. Scroll down, add a commit message like `initial commit`, then click **Commit changes**.

**Option B — GitHub Desktop (if you prefer an app)**
1. Download GitHub Desktop: https://desktop.github.com/
2. Open GitHub Desktop and sign in.
3. File → Add local repository → Select the folder you unzipped.
4. Click "Publish repository" and follow prompts.

---
## 3) Import repository to Vercel (no terminal)
1. Go to https://vercel.com and sign in or create an account.
2. Click **New Project** → **Import Git Repository**.
3. Choose GitHub and connect your GitHub account (authorize if prompted).
4. Select the repository you created (`personal-cloud`) and click **Import**.
5. On the “Configure Project” screen, set Environment Variables (see next section).
6. Click **Deploy**. Wait — the build may take a few minutes. When it's done, Vercel will show a live URL.

---
## 4) Environment Variables to add on the Vercel "Configure Project" screen
Enter these exact names and values (values below are examples — replace with your real values where indicated):

**Required:**
- `JWT_SECRET` = a long unreadable string (example: `q2D9s8...`)
- `JWT_EXPIRES_IN` = `8h` (optional)

**Choose one database method:**
- Local (dev only): `DATABASE_URL` = `file:./dev.db` (not for production)
- Postgres (production, recommended): `DATABASE_URL` = `postgresql://USER:PASSWORD@HOST:PORT/DATABASE` (get credentials from Neon or Supabase)

**Optional (choose one or both):**
- Vercel Blob: create a Blob store in your Vercel project (Project → Storage → Create Blob Store). Add any token env vars Vercel gives you, e.g., `BLOB_READ_WRITE_TOKEN` and `VERCEL_BLOB_STORE_ID`.
- S3: `S3_BUCKET`, `S3_REGION`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, and optionally `S3_ENDPOINT` for non-AWS providers.

---
## 5) After deploy: first-run checks
1. Open the URL Vercel gives you.
2. Register a new username and password on the site.
3. Upload a small image (single-shot upload). Confirm it lists in Files.
4. Try the chunked upload: select a medium file (>2MB) and choose chunked upload in the UI. Wait until "upload complete".
5. Download the file to ensure the presigned URL works.

---
## 6) If something fails (quick troubleshooting)
- Build error on Vercel: open the Vercel project dashboard → Deployments → select the failed deployment → click "View Build Logs". Copy the error and ask the assistant (paste the error).
- Upload fails: check your environment variables for storage (Vercel Blob/S3). For local dev, ensure `storage/` folder exists (Vercel doesn't persist local storage — use Blob or S3).
- Authentication fails: ensure `JWT_SECRET` is set.

---
If you want, I can also generate a simple 8-step PNG checklist (visual) showing the exact clicks for GitHub and Vercel. Ask me to "generate the PNG checklist" and I'll create it for you.
