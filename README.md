# Local Artisan Marketplace

A React frontend prototype for a local business marketplace connecting Indian artisans with customers.

**Stack:** React 18 + Vite + React Router v6 + plain CSS (no Tailwind, no UI framework) + Context API/useReducer for state + mock data (no backend yet).

## Getting Started

```bash
npm install
npm run dev
```

Then open the printed local URL (usually http://localhost:5173).

To build for production:

```bash
npm run build
npm run preview
```

## Demo Accounts

| Role     | Email                                        | Password            |
|----------|----------------------------------------------|---------------------|
| Admin    | admin@lam.in / admin@artisanmarketplace.com  | ArtisanAdmin#2026!  |
| Artisan  | artisan@lam.in / rajesh.potter@jaipurcrafts.com | JaipurArtisan#2026! |
| Customer | customer@lam.in / priya.sharma@example.com   | CraftCustomer#2026! |

You can also register a new Customer or Artisan account from `/register`.

## Project Structure

```
src/
├── components/
│   ├── common/       Button, Badge, StatCard, ProductCard, ShopCard, Rating, SearchBar, Pagination, Swatch
│   ├── layout/        Sidebar, DashboardLayout, DashboardTopbar, PublicNavbar, Footer, PublicLayout
│   ├── shared/        OrderDetailView (reused by Customer/Artisan/Admin)
│   └── ProtectedRoute.jsx
├── context/            AuthContext, CartContext, OrdersContext, ProductsContext (each backed by useReducer)
├── reducers/           authReducer.js, cartReducer.js, orderReducer.js, productReducer.js
├── hooks/               useAuth.js, useCart.js, useOrders.js, useProducts.js (thin wrappers around context)
├── pages/                public/ customer/ artisan/ admin/
├── data/                 mockData.js (temporary frontend data - no backend yet)
├── styles/               global.css, components.css, utilities.css, pages.css
├── App.jsx, main.jsx, index.css
```

## Notes on Images

No real photography assets were provided, so the app uses a deterministic gradient placeholder component (`Swatch`) everywhere the original design shows a photo. Swap these for real `<img>` tags once asset files are available.
