# 🌟 SUGA — Artisan & Bespoke Tailoring Marketplace Platform

SUGA is a premium, multi-tenant digital marketplace that connects shoppers directly with master tailors, weavers, and independent boutique fashion artisans. 

The platform is designed to support custom sizing, appointment booking with tailors, order fulfillment pipelines, review moderation, customer support threads, and a robust vendor verification security gateway.

---

## 🏛️ System Architecture

SUGA is composed of three primary directories:

```text
├── suga_frontend/     # React 18 / TypeScript / Vite / TailwindCSS SPA
├── suga_backend/      # Django REST Framework (DRF) / JWT API Backend
└── e2e/               # Playwright End-to-End Automated Test Suite
```

- **Frontend**: A fully responsive SPA built with React, Vite, and TailwindCSS. It implements premium glassmorphic styling, HSL custom color palettes, and micro-animations to deliver a modern, luxury boutique aesthetic.
- **Backend**: A decoupled Django REST Framework API that exposes endpoints for accounts, products, ordering, reviews, ad promotions, and support tickets.
- **E2E Testing**: A Playwright integration suite verifying all features across Customer, Vendor, and Admin roles.

---

## ✨ Features & Role Capabilities

### 🛍️ Customers (Shoppers)
* **Bespoke Measurement Profile**: Customize virtual sizing parameters (Chest, Waist, Hips, Inseam, etc.) before purchasing items.
* **Smart Cart & Single-Page Checkout**: Add custom configurations, review cart content, and make simulated test payments.
* **Artisan Consultation Scheduler**: Reserve video/in-person consultation slots directly with master tailors using an interactive booking calendar.
* **Verified Reviews**: Post rating scores, headlines, and reviews only on products the shopper has successfully purchased.
* **Customer Support Desk**: Raise help tickets and reply to ongoing support message threads.

### 🧵 Vendors (Artisans & Tailors)
* **Onboarding & Verification Gate**: Automatically placed in `pending` status upon sign-up. Restricted from adding products or requesting ad campaigns until approved.
* **Product Catalog Manager**: Create, read, update, and delete boutique listings, upload images, tag categories, and manage inventory levels.
* **Promotions Request Hub**: Submit homepage carousel or banner advertisement campaigns to admins for moderation.
* **Threaded Ticket Support**: Receive customer inquiries and reply directly to admin-mediated support conversations.

### 🛡️ Platform Administrators
* **Vendor Approval Panel**: Approve or reject pending artisan applications.
* **Review Moderation**: Hide or flag inappropriate user reviews.
* **Ad Campaign Manager**: Approve, reject, and schedule homepage banner/carousel requests from vendors.
* **Threaded Admin Support Desk**: Intervene, message, and close customer/vendor support tickets.

---

## 🚀 Quick Start & Local Setup

### Prerequisites
* Python 3.10+
* Node.js 18+ & npm

---

### 1. Backend Setup (`suga_backend/`)

Navigate to the backend directory and set up a virtual environment:
```bash
cd suga_backend
python3 -m venv venv
source venv/bin/activate
```

Install requirements:
```bash
pip install -r requirements.txt
```

Run database migrations:
```bash
python manage.py migrate
```

Seed the default database with mock data:
```bash
python manage.py seed_data
```

Start the Django local development server:
```bash
python manage.py runserver
```
*The API is now running on `http://localhost:8000`.*

---

### 2. Frontend Setup (`suga_frontend/`)

Navigate to the frontend directory:
```bash
cd ../suga_frontend
npm install
```

Start the Vite development server:
```bash
npm run dev
```
*The Web UI is now running on `http://localhost:5173`.*

---

### 3. Running Automated E2E Tests (`e2e/`)

Playwright verifies all user flows, login constraints, vendor guards, cart checkouts, and admin actions.

Navigate to the E2E directory:
```bash
cd ../e2e
npm install
npx playwright install
```

To run the test suite:
1. Ensure the Django dev backend is running.
2. Seed the database specifically for test environments:
   ```bash
   cd ../suga_backend
   python manage.py seed_e2e_data
   ```
3. Run Playwright:
   ```bash
   cd ../e2e
   npx playwright test
   ```

---

## 🔑 Test Credentials (Seeded Data)

You can log in to the application locally using these pre-seeded accounts:

| Role | Username | Password | Notes |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin` | `admin123` | Full moderation, ticket replies, and approvals |
| **Customer** | `priya` | `customer123` | Sizing profile, cart checkout, and consultations |
| **Approved Vendor** | `raja_tailors` | `vendor123` | Unrestricted product listing, ad campaign request |
| **Pending Vendor** | `kashmiri_looms` | `vendor123` | Dashboard warning banners, actions blocked |

---

## 📦 Deployment Configuration

### Frontend (Vercel)
The directory contains a custom [vercel.json](suga_frontend/vercel.json) config:
- Configures URL rewrites to prevent HTTP 404 errors when deep-linking inside the React Router SPA.

### Backend (Render / Heroku)
The directory contains [build.sh](suga_backend/build.sh) and [runtime.txt](suga_backend/runtime.txt):
- `build.sh` automatically installs dependencies, migrates databases, and collects static files.
- Static assets are optimized and served directly via `whitenoise.storage.CompressedManifestStaticFilesStorage`.
- Secure media storage is integrated out of the box using **Cloudinary** (configured in [settings.py](suga_backend/suga_backend/settings.py)).
