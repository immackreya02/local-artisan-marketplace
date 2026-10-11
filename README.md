# 🏺 Local Artisan Marketplace

> An authentic full-stack platform empowering traditional Indian artisans by directly connecting them with global conscious consumers.

[![Live Deployment](https://img.shields.io/badge/Live%20Demo-Vercel-blue?style=for-the-badge&logo=vercel)](https://local-artisan-marketplace-nu.vercel.app/)

---

## 🌐 Live Application
* **Frontend Web Application (Vercel):** [https://local-artisan-marketplace-nu.vercel.app/](https://local-artisan-marketplace-nu.vercel.app/)
* **Platform Database:** MongoDB Atlas M0 Cloud Cluster (High-availability replication)

---

## 📖 Project Overview
The **Local Artisan Marketplace** addresses the challenges faced by rural and independent Indian artisans—such as middleman exploitation, limited digital marketing exposure, and lack of real-time inventory insights. 

By eliminating intermediaries, the platform ensures fair remuneration for makers while providing buyers with verified, 100% authentic handmade treasures


---

## ✨ Key Features

### 🛍️ Customer Experience
* **Curated Craft Catalogue:** Multi-attribute filtering by craft categories, regions, price brackets, and availability types (Ready-to-Ship, Made-to-Order, Limited Edition).
* **Direct Artisan Engagement:** One-click official WhatsApp Click-to-Chat protocol enabling buyers to converse directly with artisans for inquiries and custom orders.
* **Streamlined Cart & Checkout:** Multi-address management, dynamic discount calculations, and instant order creation.
* **Custom Commission Requests:** Direct bidding and custom order proposal workflows between buyers and artisans.
* **Real-time In-App Bell Hub:** Instant badge alerts on order confirmation, shipment dispatch, and status updates.

### 🏺 Artisan Management Portal
* **Digital Storefront Setup:** Dedicated artisan shop profiles showcasing workshop history, regional craft specialties, ratings, and customer reviews.
* **Product Catalog & Permanent Media Uploads:** Add and manage handcrafted products with a **direct computer file picker** (client-compressed and saved permanently into MongoDB Atlas) or via web image URLs.
* **Order Processing Hub:** Track incoming buyer orders, manage fulfillment stages (Pending, Confirmed, Shipped, Delivered), and log dispatch tracking codes.
* **Earnings & Shop Analytics:** Real-time visibility into order velocity, customer reviews, and earnings breakdown.

### 🛡️ Admin & Business Intelligence (BI) Hub
* **Artisan Onboarding Verification:** Comprehensive review workflow for pending artisan shop applications with verification badges.
* **Stock & Sales Intelligence:** Advanced BI analytics identifying out-of-stock products, fast-moving crafts, inventory health alerts, and platform GMV (Gross Merchandise Value).
* **System-wide Multi-Channel Monitoring:** Oversight of platform communications, user activities, and category distributions.

### 📡 Multi-Channel Communications Engine
* 📧 **Automated Transactional Emails:** Integrated via Nodemailer with Gmail SMTP for instant order confirmations, tracking dispatch, and account alerts.
* 📱 **Cellular SMS Notifications:** Connected with Fast2SMS API Gateway for real-time order alerts and 6-digit OTP verification dispatches.
* 💬 **WhatsApp Click-to-Chat:** Direct deep-link communication protocol (`wa.me`) without requiring Meta Business API overhead.
* 🔔 **In-App Bell Hub:** Real-time MongoDB-backed notification center with live unread badge updates and mark-as-read controls.

---

## 🛠️ Technology Stack

| Layer | Technologies & Services |
|---|---|
| **Frontend** | React 18, Vite, React Router v6, Lucide Icons, Pure CSS Design System |
| **Styling & Aesthetics** | Handcrafted Indian Heritage Palettes (Warm Terracotta, Royal Indigo, Emerald Green) |
| **Backend API** | Node.js, Express.js REST Architecture, JWT Authentication, bcryptjs |
| **Identity & OAuth** | Google Cloud OAuth 2.0 Identity Platform, JWT Token Authorization |
| **Database & Cloud** | MongoDB Atlas (Cloud Cluster M0), Mongoose ODM, MongoDB Compass |
| **Cloud Hosting** | Vercel (Edge Frontend Deployment), Render (Node Container API Hosting) |
| **External APIs** | Fast2SMS Gateway (Cellular SMS), Gmail SMTP Service (Email), WhatsApp Deep-Link Protocol |

---

## 📁 Repository Architecture

```text
Local-Artisan-Platform/
├── backend/
│   ├── src/
│   │   ├── config/          # MongoDB Atlas connection with SRV DNS resolver
│   │   ├── controllers/     # Express REST controllers (Auth, Products, Orders, Analytics, etc.)
│   │   ├── models/          # Mongoose Schemas (User, Shop, Product, Order, Review, Notification)
│   │   ├── routes/          # API route definitions (/api/*)
│   │   ├── services/        # Communication services (Fast2SMS, Gmail Nodemailer, WhatsApp)
│   │   └── utils/           # Database seeder scripts and token helpers
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/      # UI components (Common, Layout, Admin BI, Public)
│   │   ├── context/         # React Context state (Auth, Products, Shops, Cart, Theme)
│   │   ├── pages/           # Views (Public marketplace, Customer, Artisan, Admin)
│   │   ├── services/        # Central API client and communication handlers
│   │   └── styles/          # Indian heritage design system tokens and utilities
│   ├── vercel.json          # SPA routing configuration for Vercel
│   └── package.json
└── README.md
```

---

## ⚙️ Local Development Setup

### 1. Prerequisites
* Node.js (v18 or higher)
* MongoDB (Local instance or MongoDB Atlas cluster connection string)

### 2. Backend Setup
```bash
cd backend
npm install
# Configure your environment variables in .env
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

The application will be available at `http://localhost:5173`.

---

## 🔐 Security & Data Protection
* **Password Hashing:** Passwords are encrypted using `bcrypt` with 10 salt rounds before storage.
* **Stateless Authorization:** Authenticated requests utilize cryptographically signed JSON Web Tokens (JWT).
* **Payload Sanitation:** Express payload limits (`10mb`) prevent memory overflows during media uploads.
* **CORS & Environment Isolation:** Secure Cross-Origin Resource Sharing with strict production environment isolation.

---

## 📄 License
This project is developed for educational and academic evaluation purposes.
