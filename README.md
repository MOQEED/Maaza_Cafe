# Maaza Cafe Management System

A comprehensive, high-performance cafe and restaurant operations web application for **Maaza Cafe** featuring daily inventory tracking, spending ledgers, billing register, shift notes, and historical audit reports.

---

## 🛠️ Technologies Used

### Frontend
- **React 19** – Modern UI components and Single Page Application (SPA) architecture
- **JavaScript (JSX)** – Component structure, state machines, and application logic
- **React Router 7** – Dynamic client-side routing, query parameter synchronization, and `<ProtectedRoute>` route guard wrappers
- **Axios** – Centralized HTTP client configured with request/response interceptors for automatic Bearer JWT attachment and session handling
- **CSS** – Modern responsive styling with custom cafe color palettes, warm light & dark mode themes, and fluid layout cards
- **Vite 6** – High-speed development server and optimized production bundler
- **ESLint** – Strict frontend static code checking, React Hooks rule enforcement, and JSX validation
- **js-cookie** – Browser cookie persistence for secure token storage, user session tracking, and theme preferences
- **React Icons** – High-clarity, unified SVG icon set (`react-icons/fi`, `react-icons/fa6`, `react-icons/md`)
- **React Spinners** – Polished loading indicators (`SyncLoader`, `ClipLoader`, `PulseLoader`) for smooth feedback during asynchronous operations

---

## 🌟 Quick Start (Run Both Frontend & Backend at the Same Time)

### Option 1: Using npm (Recommended)
From the project root directory (`c:\Users\91901\Desktop\MaazaCafe`):
```bash
npm run dev
```
*(or `npm start`)*

This single command launches both **Backend** (`http://localhost:5001`) and **Frontend** (`http://localhost:5173`) simultaneously with live color-coded logs.

### Option 2: Using the PowerShell Startup Script
```powershell
.\start-dev.ps1
```

Or start each service individually:

### Backend
```bash
cd backend
npm install
npm run dev
```
Runs at: `http://localhost:5001`

### Frontend
```bash
cd frontend
npm install
npm run dev
```
Runs at: `http://localhost:5173`

---

## 🔐 Credentials

| User | Username | Password | Access Level |
|---|---|---|---|
| Manager / Admin | `admin` | `admin123` | Full access (Spending, Bills History, Admin Settings, Management) |
| Counter Staff / Public | *No login needed* | *No login needed* | Daily Items Bought, Today's Bill, Dashboard, Daily Notes |

*Note: Protected routes (`/spending`, `/bills-history`, `/admin`) are guarded by `<ProtectedRoute>` which automatically prompts with a one-click login gateway if accessed by unauthenticated users.*

---

## 📁 Project Architecture

```
Maaza Cafe/
├── start-dev.ps1                     # One-click startup script
├── package.json                      # Root workspace orchestrator (concurrently)
├── backend/                          # Backend Node.js / Express API
│   ├── config/db.js                  # MongoDB Mongoose connection
│   ├── controllers/                  # CRUD handlers for items, bills, notes, and stats
│   ├── middleware/                   # JWT auth & Multer image uploads
│   ├── models/                       # MongoDB schemas
│   ├── routes/                       # Express API endpoints
│   ├── uploads/                      # Uploaded receipts & item images
│   ├── utils/seedAdmin.js            # Default admin seeder
│   └── server.js                     # Express server entry point
└── frontend/                         # Frontend React 19 + Vite 6
    ├── src/
    │   ├── components/               # Modular UI components
    │   │   ├── common/
    │   │   │   ├── Navbar.jsx        # Sticky top navigation with React Icons & theme toggle
    │   │   │   ├── MobileBottomNav.jsx # Fixed mobile navigation bar
    │   │   │   ├── ProtectedRoute.jsx  # React Router 7 protected route guard
    │   │   │   ├── TableToolbar.jsx  # Search, date/month pickers & PDF export triggers
    │   │   │   ├── ToastNotification.jsx # Auto-dismiss feedback toasts
    │   │   │   ├── TotalBanner.jsx   # Live total calculations banner
    │   │   │   ├── EditStatusBadge.jsx # Edit count & timestamp status pill
    │   │   │   ├── ChangeHistoryModal.jsx # Full field-level diff modal
    │   │   │   └── ImagePreview.jsx  # High-res lightbox modal
    │   │   ├── DateCart.jsx          # Date-grouped item & billing cart cards
    │   │   ├── NoteDateCard.jsx      # Date-grouped shift note register
    │   │   ├── ReceiptModal.jsx      # Thermal printable receipt generator
    │   │   ├── LoadingSpinner.jsx    # React Spinners café loading hero & inline spinner
    │   │   ├── DeleteConfirmModal.jsx # Single record delete confirmation
    │   │   └── DeleteMonthModal.jsx  # Monthly bulk wipe confirmation
    │   ├── context/
    │   │   ├── AuthContext.jsx       # Auth provider & state machine
    │   │   ├── auth-context.js       # Base React context
    │   │   └── useAuth.js            # Custom authentication hook
    │   ├── hooks/useAutoDateTime.js  # Live synchronized date/time generator
    │   ├── pages/
    │   │   ├── Dashboard.jsx         # Live cafe stats, metrics & cash flow overview
    │   │   ├── DailyItems.jsx        # Public daily inventory tracker
    │   │   ├── Spending.jsx          # Protected spending ledger
    │   │   ├── TodayBill.jsx         # Public daily billing register
    │   │   ├── BillsHistory.jsx      # Protected historical archives
    │   │   ├── Notes.jsx             # Daily shift notes & tasks
    │   │   ├── AdminSettings.jsx     # Protected manager credential management
    │   │   └── Login.jsx             # Admin login card with auto-fill shortcut
    │   ├── services/api.js           # Axios API client with cookie auth & offline resilience
    │   ├── utils/
    │   │   ├── cookies.js            # js-cookie session & theme handling
    │   │   └── exportUtils.js        # PDF, Image, & Excel exports
    │   ├── App.jsx                   # React Router 7 routing tree
    │   ├── index.css                 # CSS variables, typography & Tailwind styling
    │   └── main.jsx                  # React DOM 19 root mount
    ├── vite.config.js                # Vite 6 config with backend proxy
    ├── eslint.config.js              # ESLint 9 configuration
    └── package.json                  # Frontend dependencies
```
