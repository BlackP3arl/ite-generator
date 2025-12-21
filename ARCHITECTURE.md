# Application Architecture

## Visual Structure

```
┌─────────────────────────────────────────────────────────────┐
│                      Login Page (/)                          │
│                                                              │
│  ┌────────────────────────────────────────────────┐         │
│  │  📋 ITE Generator                              │         │
│  │  Sign In to Continue                            │         │
│  └────────────────────────────────────────────────┘         │
│                                                              │
│            ↓ (Authenticated users redirect)                  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                  Dashboard Framework                         │
│                                                              │
│  ┌──────────┬──────────────────────────────────────────┐   │
│  │          │  ┌──────────────────────────────────┐    │   │
│  │          │  │  Search...    [User Profile ▼]  │    │   │
│  │          │  └──────────────────────────────────┘    │   │
│  │  SIDEBAR │  ┌──────────────────────────────────┐    │   │
│  │          │  │                                   │    │   │
│  │  ⊞       │  │                                   │    │   │
│  │ Dashboard│  │                                   │    │   │
│  │          │  │                                   │    │   │
│  │  ┌─────┐ │  │         CONTENT AREA              │    │   │
│  │  │ 📋  │ │  │                                   │    │   │
│  │  │ ITE │ │  │   (Changes based on route)        │    │   │
│  │  └─────┘ │  │                                   │    │   │
│  │          │  │                                   │    │   │
│  │  ┌─────┐ │  │                                   │    │   │
│  │  │ 📊  │ │  │                                   │    │   │
│  │  │ M2  │ │  │                                   │    │   │
│  │  └─────┘ │  │                                   │    │   │
│  │          │  └──────────────────────────────────┘    │   │
│  │  ┌─────┐ │                                          │   │
│  │  │ 📈  │ │                                          │   │
│  │  │ M3  │ │                                          │   │
│  │  └─────┘ │                                          │   │
│  │          │                                          │   │
│  │  ⚙️      │                                          │   │
│  │ Settings │                                          │   │
│  │          │                                          │   │
│  │   ◀      │                                          │   │
│  │ Collapse │                                          │   │
│  └──────────┴──────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Route Structure

```
/
├── page.js                          → Login/Redirect Page
├── layout.js                        → Root Layout
├── globals.css                      → Global Styles
│
├── dashboard/
│   ├── layout.js                    → Dashboard Layout (Sidebar + Header)
│   ├── page.js                      → Dashboard Home
│   │
│   ├── ite/
│   │   └── page.js                  → ITE Module
│   │
│   ├── [future-module-2]/
│   │   └── page.js                  → Future Module 2
│   │
│   └── [future-module-3]/
│       └── page.js                  → Future Module 3
│
├── admin/
│   └── page.js                      → Admin Panel (unchanged)
│
├── components/
│   ├── layout/
│   │   ├── Sidebar.js               → Navigation Sidebar
│   │   └── DashboardHeader.js       → Top Header Bar
│   │
│   ├── StatusBadge.js               → Status Badge Component
│   ├── WorkflowActions.js           → Workflow Actions
│   └── AuditLogViewer.js            → Audit Log Viewer
│
├── styles/
│   └── dashboard.css                → Dashboard Styles
│
└── api/
    ├── auth/
    ├── ite/
    ├── user/
    └── extract-*/
```

## Component Hierarchy

```
App
│
├── RootLayout (layout.js)
│   │
│   ├── Providers (NextAuth)
│   │
│   └── [Route Pages]
│       │
│       ├── Login Page (/)
│       │
│       ├── DashboardLayout (/dashboard/*)
│       │   │
│       │   ├── Sidebar
│       │   │   ├── Dashboard Button
│       │   │   ├── Module Tiles
│       │   │   │   ├── ITE Module (Active)
│       │   │   │   ├── Module 2 (Coming Soon)
│       │   │   │   └── Module 3 (Coming Soon)
│       │   │   ├── Settings Button (Admin Only)
│       │   │   └── Collapse Button
│       │   │
│       │   ├── DashboardHeader
│       │   │   ├── Search Input
│       │   │   └── User Profile Dropdown
│       │   │       ├── User Info
│       │   │       └── Sign Out Button
│       │   │
│       │   └── Content Area
│       │       │
│       │       ├── Dashboard Home (/dashboard)
│       │       │   ├── Welcome Section
│       │       │   ├── Module Cards Grid
│       │       │   └── Quick Actions
│       │       │
│       │       └── ITE Module (/dashboard/ite)
│       │           ├── Role Switcher (Admin)
│       │           ├── ITE Dashboard View
│       │           │   ├── Stats Cards
│       │           │   └── ITE List Table
│       │           └── ITE Workflow Views
│       │               ├── Step 1: Upload ITS
│       │               ├── Step 2: Confirm Specs
│       │               ├── Step 3: Upload Quotes
│       │               └── Step 4: Review ITE
│       │
│       └── Admin Panel (/admin)
│           ├── User Management
│           └── Role Statistics
```

## Data Flow

```
User Authentication Flow:
┌─────────┐
│  Login  │
└────┬────┘
     │
     ├─ Not Authenticated → Stay on Login Page
     │
     └─ Authenticated → Redirect to /dashboard
                        │
                        ├─ DashboardLayout wraps all routes
                        │  ├─ Sidebar (persistent)
                        │  ├─ Header (persistent)
                        │  └─ Content (changes per route)
                        │
                        └─ User can navigate between modules
```

```
Module Navigation Flow:
┌──────────────┐
│   Dashboard  │
│     Home     │
└──────┬───────┘
       │
       ├─→ Click ITE Module → /dashboard/ite
       │                       │
       │                       ├─ View ITE List
       │                       ├─ Create New ITE
       │                       ├─ Edit Existing ITE
       │                       └─ Export/Delete ITE
       │
       ├─→ Click Module 2 → /dashboard/module2 (Coming Soon)
       │
       ├─→ Click Module 3 → /dashboard/module3 (Coming Soon)
       │
       └─→ Click Settings → /admin (Admin Only)
```

## State Management

```
Global State (NextAuth Session):
├── User Information
├── Role
└── Authentication Status

Module State (Local Component State):
└── ITE Module
    ├── Current ITE Data
    ├── Form State (steps 1-4)
    ├── File Uploads
    ├── Workflow Status
    └── UI State (modals, menus, etc.)
```

## Responsive Breakpoints

```
Desktop (>1024px):
├── Full Sidebar (280px)
├── Full Header
└── Optimal Content Layout

Tablet (768px - 1024px):
├── Collapsed Sidebar (80px)
├── Full Header
└── Adjusted Content Layout

Mobile (<768px):
├── Horizontal Sidebar
├── Stacked Header
└── Mobile-Optimized Content
```

## API Integration

```
Frontend (React Components)
    │
    ├─→ /api/auth/[...nextauth]     → Authentication
    │
    ├─→ /api/ite                     → ITE CRUD Operations
    │   ├─ GET  → List ITEs
    │   ├─ POST → Create ITE
    │   └─ PUT/DELETE → Update/Delete ITE
    │
    ├─→ /api/ite/[id]/workflow      → Workflow Actions
    │   └─ POST → Submit/Review/Approve
    │
    ├─→ /api/ite/[id]/export-pdf    → PDF Export
    │
    ├─→ /api/ite/stats              → Dashboard Statistics
    │
    ├─→ /api/extract-its            → ITS PDF Processing
    │
    ├─→ /api/extract-quotes         → Supplier Quote Processing
    │
    └─→ /api/user/*                 → User Management
        ├─ /list     → Get Users
        ├─ /password → Update Password
        └─ /role     → Update Role
```

## Security Model

```
Route Protection:
├── / (Public - Login Page)
│
├── /dashboard/* (Protected)
│   └── Requires Authentication
│       └── DashboardLayout checks session
│
├── /admin (Protected + Role Check)
│   └── Requires ADMIN role
│
└── /api/* (Protected)
    └── API routes verify session
        └── Some routes check specific roles
```

## Future Extensibility

To add a new module:

1. **Create Route**: `app/dashboard/[module-name]/page.js`
2. **Update Sidebar**: Add module config to `Sidebar.js`
3. **Update Dashboard Home**: Add module card to `dashboard/page.js`
4. **Create API Routes**: Add necessary API endpoints
5. **Add Database Schema**: Update Prisma schema if needed

The framework is designed for easy expansion!
