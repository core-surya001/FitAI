# ✨ FitAI - AI-Powered Virtual Try-On Platform

FitAI is a cutting-edge web application that allows users to virtually try on clothing using advanced AI models. By simply uploading a photo of themselves and a picture of a garment, the platform generates a highly realistic image of the user wearing the new outfit.

## 🚀 Key Features

- **Virtual Try-On Magic:** Powered by Hugging Face's `IDM-VTON` model to seamlessly and realistically blend garments onto user photos.
- **AI Stylist:** An integrated chat assistant powered by **Google Gemini** that provides fashion advice, outfit recommendations, and styling tips.
- **Digital Wardrobe:** Users can upload and manage their photos and garments in a personal digital closet.
- **Credit-Based System:** A robust credit economy where users spend credits to generate looks. Includes a mock payment gateway for subscription upgrades (Free, Pro, Unlimited).
- **Recent Looks History:** Save, view, download, and delete previously generated AI looks.
- **Responsive Modern UI:** A beautiful, "Glassmorphism" styled interface built with Next.js, Tailwind CSS, and Framer Motion animations.

## 🛠️ Technology Stack

### **Frontend**
- **Framework:** Next.js 14+ (App Router, React)
- **Styling:** Tailwind CSS, Framer Motion
- **State Management:** Zustand
- **Icons:** Lucide React
- **API Requests:** Axios

### **Backend**
- **Framework:** FastAPI (Python)
- **Database:** SQLite (Local Development) & PostgreSQL (Production)
- **ORM:** SQLAlchemy
- **Authentication:** JWT (JSON Web Tokens) with Bcrypt password hashing
- **AI Integrations:** 
  - `gradio_client` (For Hugging Face IDM-VTON Spaces)
  - `google-generativeai` (For Gemini Stylist)

---

## 📁 Project Structure

```text
FitAI/
├── frontend/                 # Next.js React application
│   ├── src/app/              # Next.js App Router pages (Home, Studio, Login, Pricing)
│   ├── src/components/       # Reusable UI components (Navbar, etc.)
│   └── src/lib/              # Zustand store and Axios API configuration
├── backend/                  # FastAPI Python application
│   ├── routes/               # API Endpoints (Auth, Tryon, Garments, Photos, Credits)
│   ├── models.py             # SQLAlchemy Database Models
│   ├── database.py           # DB connection setup (SQLite/PostgreSQL fallback)
│   ├── main.py               # FastAPI entry point & CORS config
│   └── requirements.txt      # Python dependencies (includes gunicorn & psycopg2)
└── deployment_guide.md       # Detailed cloud deployment steps
```

---

## ⚙️ Environment Variables Setup

To run this project, you need to configure the `.env` files in both directories.

### **Backend (`backend/.env`)**
```env
# Security
SECRET_KEY=your_super_secret_jwt_key
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# AI API Keys
GEMINI_API_KEY=your_gemini_api_key_here
HF_TOKEN=your_hugging_face_token_here

# Database (Leave empty to default to local SQLite)
DATABASE_URL=postgresql://user:password@hostname/dbname

# CORS (For production frontend URL)
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173,https://your-vercel-app.vercel.app
```

### **Frontend (`frontend/.env.local`)**
```env
# Backend API URL (Default is localhost:8000 for dev)
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

---

## 💻 Local Development Setup

### 1. Start the Backend
```bash
cd backend
python -m venv venv
# Activate virtual environment
# Windows: venv\Scripts\activate
# Mac/Linux: source venv/bin/activate

pip install -r requirements.txt
uvicorn main:app --reload
```
*The backend will run on `http://localhost:8000`*

### 2. Start the Frontend
```bash
cd frontend
npm install
npm run dev
```
*The frontend will run on `http://localhost:3000`*

---

## ☁️ Production Deployment

The project is structured to be easily deployed on modern cloud platforms.

- **Frontend:** Highly optimized for **Vercel**. Ensure you set the `NEXT_PUBLIC_API_URL` environment variable to point to your live backend URL (with the `/api` prefix).
- **Backend:** Ready for **Render.com** or **Heroku**. 
  - Connect a PostgreSQL database instance.
  - Set the Start Command to: `cd backend && gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app`

---
*Designed with ❤️ for the future of Fashion.*
