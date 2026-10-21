# Vercel Deployment Guide for PhishGuard

This guide explains how to deploy PhishGuard to **Vercel** so you can showcase the live project to your technical seminar guide.

---

## Deployment Option 1: GitHub Integration (Recommended & Easiest)

1. **Push your code to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "feat: complete PhishGuard AI phishing detection system"
   git branch -M main
   git remote add origin https://github.com/<your-username>/phishguard.git
   git push -u origin main
   ```

2. **Deploy on Vercel:**
   - Log in to [vercel.com](https://vercel.com).
   - Click **"Add New..."** → **"Project"**.
   - Select your `phishguard` GitHub repository and click **Import**.
   - **Project Settings:**
     - **Framework Preset:** Other / Vite
     - **Root Directory:** `./` (Leave as default, `vercel.json` and root `package.json` will automatically configure everything)
   - Click **Deploy**.

Vercel will compile the frontend and deploy the serverless API routes. Within ~60 seconds, you will receive a production URL such as `https://phishguard.vercel.app`.

---

## Deployment Option 2: Deploy Frontend-Only via Vercel Dashboard

If you prefer to deploy only the React frontend on Vercel:
1. In the Vercel Import dialog:
   - Click **Edit** next to **Root Directory**.
   - Select the `frontend` folder.
   - Vercel will automatically detect **Vite**.
2. Click **Deploy**.
3. **Built-in Resilience:**
   - PhishGuard's frontend includes an intelligent client-side fallback feature extractor (`api.ts`).
   - Even if deployed frontend-only without a Python server, all 24 lexical features, model metrics, live scanning, and scan history continue to work flawlessly. Your guide will never see an offline or broken screen!

---

## Deployment Option 3: Vercel CLI (From Terminal)

1. Open PowerShell or Terminal in the project root:
   ```bash
   npm i -g vercel
   vercel
   ```
2. Follow the on-screen prompts:
   - *Set up and deploy?* **Y**
   - *Which scope?* Select your account
   - *Link to existing project?* **N**
   - *What's your project's name?* **phishguard**
   - *In which directory is your code located?* **./**
   - *Want to modify these settings?* **N**
3. Your deployment will complete and output your live preview link!

---

## Connecting the Chrome Extension to your Live Vercel App

Once your site is live on Vercel:
1. Open `extension/background.js`.
2. Update line 4:
   ```javascript
   const API_BASE = "https://your-phishguard-deployment.vercel.app/api";
   ```
3. In Chrome, go to `chrome://extensions/` and click the **Reload** icon on PhishGuard.
4. The extension will now communicate directly with your live Vercel cloud deployment!
