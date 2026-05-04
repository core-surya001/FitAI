# FitAI Deployment Guide

Apne FitAI project ko internet par live karne ke liye hum 2 platforms ka use karenge:
1. **Render.com** - Backend (FastAPI) ke liye (Free tier available)
2. **Vercel.com** - Frontend (Next.js) ke liye (Free and best for Next.js)

Dono platforms aapke GitHub repo (`https://github.com/core-surya001/FitAI.git`) se directly connect ho jayenge.

---

## Part 1: Backend Deployment (Render.com)

Sabse pehle hum backend deploy karenge taaki hume uska live URL mil sake.

1. **Account Banayein:** [Render.com](https://render.com) par jayein aur GitHub se signup/login karein.
2. **Naya Service Banayein:** Dashboard mein **"New +"** button par click karein aur **"Web Service"** select karein.
3. **Repo Connect Karein:** Apna `FitAI` repository select karein aur connect karein.
4. **Settings Fill Karein:**
   * **Name:** `fitai-backend` (ya kuch bhi)
   * **Root Directory:** `backend` (Ye bahut zaroori hai!)
   * **Environment:** `Python 3`
   * **Build Command:** `pip install -r requirements.txt`
   * **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
   * **Instance Type:** Free (ya Starter) select karein.
5. **Environment Variables (.env):** "Environment Variables" section mein "Add Environment Variable" par click karke ye keys add karein:
   * `GEMINI_API_KEY` : (Aapki Gemini Key)
   * `HF_TOKEN` : (Aapka Hugging Face Token)
   * `SECRET_KEY` : (Koi bhi random lamba password dal dein)
   * `BASE_URL` : (Isko abhi blank rakhein, deploy hone ke baad jo URL milega wahi yahan daalna hai, e.g., `https://fitai-backend.onrender.com`)
6. **Deploy:** "Create Web Service" par click karein.
7. *Note: Deploy hone me 3-5 minute lagenge. Jab green "Live" aa jaye, tab jo URL mile usko copy kar lein (e.g., `https://fitai-backend.onrender.com`).*

> ⚠️ **Free Tier Limit:** Render ke free tier me jab server restart hota hai toh `uploads` folder aur `sqlite` database clear ho jata hai. Production ke liye aapko AWS S3 (images ke liye) aur PostgreSQL (database ke liye) lagana padega. Demo ke liye ye thik hai!

---

## Part 2: Frontend Deployment (Vercel.com)

Ab hum us backend URL ka use karke apna frontend live karenge.

1. **Account Banayein:** [Vercel.com](https://vercel.com) par jayein aur GitHub se login karein.
2. **Naya Project Add Karein:** Dashboard mein **"Add New..." > "Project"** par click karein.
3. **Repo Import Karein:** Apna `FitAI` repository import karein.
4. **Configure Project:**
   * **Project Name:** `fitai-studio` 
   * **Framework Preset:** `Next.js` (Ye auto-detect ho jayega)
   * **Root Directory:** Edit par click karke `frontend` select karein. (Ye bahut zaroori hai!)
5. **Environment Variables:** "Environment Variables" toggle open karein aur ye add karein:
   * **Key:** `NEXT_PUBLIC_API_URL`
   * **Value:** `https://fitai-backend.onrender.com/api` *(Dhyan rahe, yahan aapko apne Render backend ka URL daalna hai, aur aakhir mein `/api` zaroor lagana hai).*
6. **Deploy:** "Deploy" button par click karein.
7. *Deploy hone me 1-2 minute lagenge, aur phir Vercel aapko ek live URL de dega (e.g., `https://fitai-studio.vercel.app`).*

---

## Part 3: Final Setup

Ek baar Vercel par frontend deploy ho jaye, uske baad:
1. Wapas **Render.com** par apne backend ke "Environment Variables" mein jayein.
2. Wahan `BASE_URL` mein apna Render ka URL (e.g., `https://fitai-backend.onrender.com`) daal dein taaki images load ho sakein.

**Congratulations! 🎉 Aapka AI Stylist aur Virtual Try-on Studio ab globally live hai!**
