# PRD: FitAI Full-Stack Implementation

## Overview
Implement the FitAI Virtual Try-On web application using Next.js (frontend) and FastAPI (backend) with a database. The UI must strictly follow the provided Stitch design screenshots, featuring a premium aesthetic with neutral tones and clean typography.

## Task 1: Database Setup and Models
Set up the backend database models according to the implementation plan.
- Update `backend/models.py` with `User`, `Garment`, `UserPhoto`, and `TryOnJob` tables.
- Update `backend/schemas.py` with corresponding Pydantic validation models.
- Ensure database connection logic in `backend/database.py` is functional for SQLite (development) or PostgreSQL (production).

## Task 2: Backend Authentication Routes
Implement robust user authentication endpoints.
- Finalize `POST /api/auth/register` and `POST /api/auth/login` in `backend/routes/auth_routes.py`.
- Ensure JWT token generation, hashing, and validation in `backend/auth.py`.

## Task 3: Backend Core API Routes
Implement the core API endpoints for garments, photos, and try-on jobs.
- Implement CRUD routes for Garments in `backend/routes/garment_routes.py`.
- Implement endpoints for uploading User Photos in `backend/routes/photo_routes.py`.
- Implement endpoints for creating and fetching TryOnJobs in `backend/routes/tryon_routes.py`.

## Task 4: Frontend Global Setup & Navigation
Set up the base layout, typography, and navigation based on the Stitch UI.
- Update `frontend/src/app/globals.css` and `tailwind.config.ts` (if applicable) with the design's color palette (White/Charcoal base, Sand/Beige/Green accents).
- Build a responsive `Navbar` component matching the design: "FitAI" logo on left, "Discovery | Studio | Assistant" centered, and Cart/User icons on the right.

## Task 5: Frontend Landing Page (Home)
Build the main landing page matching the "The Future of Fitting" screenshot.
- Create a Hero section with split text/image and "Start Your Studio" / "Explore Collections" buttons.
- Build "The Process" section with 3 icon-based steps (Upload, Try-On, Style).
- Build the "AI Stylist Showcase" section using a premium bento-box image grid layout.

## Task 6: Frontend Studio Page
Build the core Virtual Try-On workspace matching the "Studio Controls" screenshot.
- Create the left sidebar for Studio Controls (Model, Garments, Textures, Lighting, Layers) with appropriate icons.
- Build the center Model viewer with the bottom floating action bar ("Fit Analysis", "Save to Wardrobe").
- Create the right sidebar for Garment selection, featuring image cards with title, price, and a '+' selection button.

## Task 7: Frontend Assistant/AI Stylist Page
Build the "Curated Look" assistant page matching the Stitch design.
- Create the left sidebar AI chat interface with suggested prompt pills and a chat input field.
- Build the center main model preview.
- Create the right sidebar showing the "Selected" item details and "Suggested" pairings.

## Task 8: Frontend Discovery Page
Build the Discovery inspiration gallery matching the design.
- Implement the header with title "Discovery" and subtitle.
- Create the horizontal scrolling or flex-wrapped filter pills (Minimal, Avant-Garde, Casual, Evening).
- Build a responsive image grid for curated looks, along with a "Load More Inspirations" pill button.

## Task 9: Frontend Profile Page
Build the user profile and saved outfits page.
- Create the User header with avatar, name, email, style tags (Minimal, Avant-Garde, AI Pro), and "Edit Profile"/"Settings" buttons.
- Build the "Saved Outfits" section featuring a large featured card (with a heart icon) and smaller carousel/grid cards for other outfits.

## Task 10: API Integration & State Management
Connect the React frontend to the FastAPI backend.
- Ensure the previously built Login/Signup page correctly authenticates, stores the JWT, and redirects to the Studio.
- Connect the Studio and Assistant pages to the backend Garment and TryOn API endpoints using Axios or Fetch.
- Implement global state management (e.g., Zustand or React Context) for the user's selected garments and active model.
