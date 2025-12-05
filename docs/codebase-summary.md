# The Butter Bake - Codebase Summary

## Overview

This document provides a comprehensive summary of The Butter Bake codebase, including directory structure, key modules, component architecture, data flow patterns, and external dependencies.

**Last Updated**: 2025-12-04
**Total Files**: 113 source files
**Total Lines**: ~20M characters (including data files)
**Primary Language**: JavaScript (React/JSX)

---

## Directory Structure

```
volatile-asteroid/
├── .agent/                    # Agent workflows (UI/UX automation)
├── .claude/                   # Claude Code configuration
├── .shared/                   # Shared utilities (UI/UX Pro Max data)
├── backend/                   # Express.js backend server
├── docs/                      # Project documentation (this folder)
├── plans/                     # Implementation plans and reports
├── public/                    # Static assets
│   ├── assets/icons/         # Product category icons
│   └── vite.svg              # Vite logo
├── scripts/                   # Utility scripts (image generation)
├── src/                       # Main application source code
│   ├── assets/               # Application assets
│   ├── components/           # React components
│   │   ├── Common/          # Reusable UI components
│   │   ├── Customers/       # Customer-related components
│   │   ├── Dashboard/       # Dashboard widgets
│   │   ├── DataSync/        # Data synchronization modals
│   │   ├── Layout/          # Layout components
│   │   └── Orders/          # Order management components
│   ├── contexts/            # React Context providers
│   ├── data/                # Static data files
│   ├── hooks/               # Custom React hooks
│   ├── pages/               # Page components (routes)
│   ├── styles/              # CSS stylesheets
│   └── utils/               # Utility functions
├── .gitignore               # Git ignore rules
├── eslint.config.js         # ESLint configuration
├── index.html               # HTML entry point
├── package.json             # npm dependencies
├── postcss.config.js        # PostCSS configuration
├── tailwind.config.js       # Tailwind CSS configuration
├── vite.config.js           # Vite build configuration
└── *.md                     # Documentation files
```

---

## Source Code Structure (`/src`)

### 1. Entry Points

#### `/src/main.jsx`
- Application entry point
- Renders React root component
- Imports global CSS styles

#### `/src/App.jsx`
- Root application component
- Defines React Router routing structure
- Wraps app in context providers (Auth, Data, Toast)
- Implements protected route logic

**Key Routes**:
```javascript
/login           → Login page (public)
/preorder        → Pre-order landing page (public)
/                → Main layout (protected)
  ├── /          → Dashboard
  ├── /orders    → Orders management
  ├── /pre-orders → Pre-orders management
  ├── /products  → Products catalog
  ├── /customers → Customer management & analytics
  ├── /data-sync → Data synchronization tools
  ├── /analytics → Business analytics
  └── /settings  → Application settings
```

---

### 2. Contexts (`/src/contexts`)

Context API providers for global state management.

#### `/src/contexts/DataContext.jsx` (230 lines)
**Purpose**: Central data management for the entire application

**Responsibilities**:
- Fetches data from Firebase Realtime Database
- Subscribes to real-time updates for orders, pre-orders, customers, products
- Transforms raw Firebase data into application-friendly format
- Parses CFAbsoluteTime timestamps from legacy iOS app
- Calculates order totals and formats currency
- Provides loading state during initial data fetch

**Exported Data**:
```javascript
{
  orders: Array,      // Regular orders
  preOrders: Array,   // Pre-orders
  customers: Array,   // Customer records
  products: Array,    // Product catalog
  loading: Boolean    // Initial loading state
}
```

**Key Functions**:
- `formatLocalDate(date)`: Converts Date to YYYY-MM-DD
- `parseCFTime(timestamp)`: Converts CFAbsoluteTime to JavaScript Date

**Firebase Collections**:
- `/orders` - Regular orders
- `/preorders` - Pre-orders
- `/newCustomers` - Customer records
- `/cakes` - Product catalog

#### `/src/contexts/AuthContext.jsx`
**Purpose**: Authentication state management

**Responsibilities**:
- Manages Firebase Authentication state
- Provides login/logout functions
- Tracks authentication status
- Handles loading state during auth check

**Exported Data**:
```javascript
{
  isAuthenticated: Boolean,
  loading: Boolean,
  login: Function,
  logout: Function
}
```

#### `/src/contexts/ToastContext.jsx`
**Purpose**: Global toast notification system

**Responsibilities**:
- Displays success/error/info notifications
- Auto-dismiss after 3 seconds
- Manages multiple simultaneous toasts

**Exported Functions**:
```javascript
{
  showToast(message, type), // type: 'success' | 'error' | 'info'
}
```

---

### 3. Pages (`/src/pages`)

Page-level components mapped to routes.

#### `/src/pages/Dashboard.jsx` (21,512 lines)
**Purpose**: Main business analytics dashboard

**Features**:
- Revenue overview cards (total, average per order)
- Order statistics (total, pending, completed, cancelled)
- Product performance rankings
- Recent orders list
- Revenue trend chart (Recharts)
- Date range filtering

**Key Metrics**:
- Total revenue (all-time and filtered)
- Average order value
- Order count by status
- Top 5 products by quantity sold
- Last 10 orders

#### `/src/pages/Orders.jsx` (38,259 lines)
**Purpose**: Order management interface

**Features**:
- Order list with pagination (10/25/50/100 per page)
- Create new orders modal
- View order details modal
- Generate and print invoices
- Advanced filtering (date range, status, customer search)
- Order status management
- Real-time order updates

**Components Used**:
- `CreateOrderModal` - Order creation form
- `OrderDetailsModal` - Order details view
- `InvoiceModal` - Invoice generation
- `AdvancedFilterModal` - Filter options
- `DateSelector` - Date range picker

#### `/src/pages/PreOrders.jsx` (32,167 lines)
**Purpose**: Pre-order management interface

**Features**:
- Pre-order list with status badges
- View pre-order details
- Confirm/complete/cancel pre-orders
- Date and time slot filtering
- Customer information display

**Status Values**:
- Pending (default)
- Confirmed
- Completed
- Cancelled

#### `/src/pages/PreorderLanding.jsx` (21,689 lines)
**Purpose**: Customer-facing pre-order interface

**Features**:
- Product catalog organized by category
- AI-generated product images (Gemini API)
- Shopping cart functionality
- Checkout with delivery date/time selection
- Customer information form
- Order confirmation

**Categories**:
- Banana, Brownie, Bread, Canelé, Cookie, Croissant, Shiopan, Roll, CheeseBurn

**Components**:
- `PreorderCartModal` - Shopping cart
- `PreorderCheckoutModal` - Checkout process

#### `/src/pages/Customers.jsx` (33,541 lines)
**Purpose**: Customer management and RFM analytics

**Features**:
- Customer list with RFM segment badges
- Search by name/phone/email
- Filter by customer segment
- RFM score visualization
- Customer detail modal with comprehensive metrics
- Activity status indicators

**RFM Segments** (11 total):
1. Champions - Best customers
2. Loyal - Regular high-value
3. Potential Loyalists - Recent high-value
4. New Customers - Just started
5. Promising - Recent medium spend
6. Need Attention - Showing decline
7. About to Sleep - Declining frequency
8. At Risk - Were valuable, now inactive
9. Cannot Lose Them - High spenders gone quiet
10. Hibernating - Long inactive
11. Lost - Inactive with low value

**Metrics Displayed**:
- Total orders, total spent
- Last order date
- RFM scores (R, F, M)
- Customer segment
- Activity status
- Average order value
- Customer tenure

**Components**:
- `CustomerDetailsModal` - Detailed customer view with RFM breakdown

#### `/src/pages/Products.jsx` (9,964 lines)
**Purpose**: Product catalog management

**Features**:
- Product list with categories
- Product information (name, type, description, price)
- Category filtering
- Product search

#### `/src/pages/Analytics.jsx` (4,245 lines)
**Purpose**: Business analytics and reporting

**Features**:
- Customer analytics overview
- Segment distribution
- Trend analysis

#### `/src/pages/DataSync.jsx` (46,370 lines)
**Purpose**: Data migration and synchronization tools

**Features**:
- Import customer data from JSON backups
- Normalize phone numbers (+84 format)
- Convert CFAbsoluteTime to Unix timestamps
- Rename order keys
- Clean duplicate records
- Validate data integrity
- Batch operations

**Modals**:
- `SyncDataModal` - Main sync interface
- `CustomerDataFixModal` - Fix customer data
- `PhoneFormatModal` - Normalize phone numbers
- `RenameOrderKeysModal` - Convert timestamps
- `CustomerFieldsModal` - Merge customer fields
- `OrderIdsModal` - Validate order references
- `CleanupModal` - Remove duplicates

#### `/src/pages/Login.jsx` (7,405 lines)
**Purpose**: Authentication page

**Features**:
- Email/password login form
- Firebase Authentication integration
- Error handling
- Redirect to dashboard on success

#### `/src/pages/Settings.jsx` (4,070 lines)
**Purpose**: Application settings

**Features**:
- User preferences
- Configuration options

---

### 4. Components (`/src/components`)

Modular, reusable React components.

#### Common Components (`/src/components/Common`)

**`AnimatedPage.jsx`** (1,047 lines)
- Framer Motion page transition wrapper
- Fade-in animation for route changes

**`LoadingSpinner.jsx`** (2,239 lines)
- Centralized loading indicator
- Multiple size variants

**`PasswordModal.jsx`** (3,823 lines)
- Password verification for sensitive operations
- Used before destructive actions

**`SkeletonCard.jsx`** (2,047 lines)
- Loading placeholder for card components

**`SkeletonStats.jsx`** (2,315 lines)
- Loading placeholder for stat cards

**`SkeletonTable.jsx`** (2,504 lines)
- Loading placeholder for tables

#### Dashboard Components (`/src/components/Dashboard`)

**`StatsCard.jsx`**
- KPI card component
- Displays metric name, value, and icon

**`RevenueChart.jsx`**
- Recharts line/bar chart for revenue trends
- Responsive design

**`RecentOrders.jsx`**
- Recent order list widget
- Click to view order details

**`ProductStatsCard.jsx`**
- Product performance card
- Shows sales metrics per product

#### Order Components (`/src/components/Orders`)

**`CreateOrderModal.jsx`** (46,920 lines)
- Comprehensive order creation form
- Customer selection/creation
- Product selection with quantities
- Price calculation (subtotal, fees, discounts)
- Delivery date/time selection
- Form validation

**`OrderDetailsModal.jsx`**
- Order information display
- Status management
- Invoice generation trigger

**`InvoiceModal.jsx`**
- Invoice preview and printing
- Product images on invoice
- Customer and order details
- Total breakdown

**`PreorderCartModal.jsx`**
- Shopping cart for pre-orders
- Quantity adjustment
- Item removal
- Total calculation

**`PreorderCheckoutModal.jsx`**
- Checkout form for pre-orders
- Customer information input
- Delivery date/time picker
- Order confirmation

**`ConfirmPreOrderModal.jsx`** (8,736 lines)
- Pre-order confirmation dialog
- Status change confirmation

**`AdvancedFilterModal.jsx`** (10,613 lines)
- Multi-criteria filtering
- Date range, status, customer search

**`DateSelector.jsx`** (4,334 lines)
- Date picker component
- Custom date range selection

**`DraftListModal.jsx`** (5,070 lines)
- Draft order management
- Save incomplete orders

**`ShiftSummaryCards.jsx`**
- Daily shift summary
- Order count and revenue by shift

#### Customer Components (`/src/components/Customers`)

**`CustomerDetailsModal.jsx`**
- Comprehensive customer profile
- RFM scorecard with visual indicators
- Order history timeline
- Activity status
- Purchase patterns
- Segment badge and description

**RFM Scorecard Display**:
```
┌──────────────────────────┐
│ RFM Scores               │
│ Recency:    ████████ 5/5 │
│ Frequency:  ██████   4/5 │
│ Monetary:   ████████ 5/5 │
│ Total: 14/15             │
│ Segment: Champions       │
└──────────────────────────┘
```

#### DataSync Components (`/src/components/DataSync`)

**`SyncDataModal.jsx`**
- Main data sync interface
- File upload and parsing
- Operation selection

**`CustomerDataFixModal.jsx`**
- Fix customer data issues
- Merge duplicate customers

**`PhoneFormatModal.jsx`**
- Normalize phone number format
- Add country code (+84)
- Remove formatting characters

**`RenameOrderKeysModal.jsx`**
- Convert CFAbsoluteTime to Unix timestamps
- Batch key renaming

**`CustomerFieldsModal.jsx`**
- Merge customer field data
- Handle field conflicts

**`OrderIdsModal.jsx`**
- Validate order-customer relationships
- Fix missing order IDs

**`CleanupModal.jsx`**
- Remove duplicate records
- Data integrity checks

**`ConfirmSyncModal.jsx`**
- Confirmation dialog for sync operations
- Preview changes before commit

#### Layout Components (`/src/components/Layout`)

**`MainLayout.jsx`**
- Main application layout wrapper
- Sidebar + Header + Content area
- Outlet for nested routes

**`Sidebar.jsx`**
- Navigation sidebar
- Active route highlighting
- Icons for each section

**`Header.jsx`**
- Top navigation bar
- User info
- Logout button

#### Toast Component (`/src/components/Toast.jsx`)

- Toast notification renderer
- Success/error/info styles
- Auto-dismiss animation
- Multiple toast stacking

---

### 5. Utilities (`/src/utils`)

Helper functions and business logic.

#### `/src/utils/rfm.js` (282 lines)
**Purpose**: RFM (Recency, Frequency, Monetary) customer analytics

**Exported Functions**:

**Scoring Functions**:
- `calculateRecencyScore(daysSinceLastOrder)` → 1-5
- `calculateFrequencyScore(totalOrders)` → 1-5
- `calculateMonetaryScore(customer, allCustomers)` → 1-5
- `calculateRFMScore(customer, allCustomers)` → { R, F, M, total, pattern, segment }

**Segmentation**:
- `getCustomerSegment(rfm)` → segment name (e.g., "Champions")

**Visual Helpers**:
- `getSegmentColor(segment)` → Tailwind CSS classes
- `getSegmentIcon(segment)` → Lucide icon name
- `getSegmentDescription(segment)` → human-readable description
- `getScoreColor(score)` → color class for progress bars
- `getScoreLabel(score)` → "Excellent", "Good", "Average", etc.

**Algorithm**:
```javascript
// Recency Score (1-5)
0-7 days     → 5 (Most recent)
8-30 days    → 4
31-90 days   → 3
91-180 days  → 2
181+ days    → 1 (Least recent)

// Frequency Score (1-5)
10+ orders   → 5 (Most frequent)
6-9 orders   → 4
3-5 orders   → 3
2 orders     → 2
1 order      → 1 (Least frequent)

// Monetary Score (1-5, percentile-based)
Top 20%      → 5 (Highest spender)
20-40%       → 4
40-60%       → 3
60-80%       → 2
Bottom 20%   → 1 (Lowest spender)
```

#### `/src/utils/imageGenerator.js`
**Purpose**: AI-powered product image generation

**Functions**:
- `craftCakePrompt(cakeName, description)` - Enhanced prompt engineering for bakery images
- `generateCakeImage(cakeName, description)` - Calls Gemini API to generate image

**Prompt Template**:
```
Professional bakery product photography: [cake name]
Style: Modern, high-end patisserie aesthetic
Lighting: Soft studio lighting with natural highlights
Background: Clean white or cream surface
Details: Texture, frosting, decorative elements
Quality: Ultra high quality, appetizing
```

#### `/src/utils/animations.js`
**Purpose**: Framer Motion animation presets

**Exports**:
- Page transition variants
- Card animation variants
- List item stagger animations

#### `/src/utils/clipboard.js`
**Purpose**: Clipboard operations

**Functions**:
- Copy text to clipboard
- Success/error notifications

---

### 6. Data (`/src/data`)

Static data files.

#### `/src/data/cakes.json`
**Purpose**: Product catalog data

**Structure**:
```json
{
  "categories": {
    "Banana": {
      "description": "Naturally sweet and moist banana-based treats...",
      "order": 1
    },
    ...
  },
  "product_id": {
    "name": "Product Name",
    "type": "Category",
    "description": "Product description",
    "price": 50000,
    "image": "url_or_path"
  }
}
```

---

### 7. Hooks (`/src/hooks`)

Custom React hooks.

#### `/src/hooks/useAnimations.js`
**Purpose**: Animation hook for Framer Motion

**Exports**:
- Page transition hooks
- Animation state management

---

### 8. Styles (`/src/styles`)

CSS stylesheets.

#### `/src/index.css`
**Purpose**: Global styles and Tailwind imports

**Contents**:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Global custom styles */
```

#### `/src/App.css`
**Purpose**: App-specific styles

#### `/src/styles/Toast.css`
**Purpose**: Toast notification styles

**Features**:
- Toast positioning
- Slide-in/slide-out animations
- Success/error/info color schemes

---

## Backend (`/backend`)

### `/backend/server.js` (39 lines)
**Purpose**: Express.js server for static file serving and API

**Features**:
- Serves Vite build output (`/dist`)
- CORS enabled
- SPA fallback routing (connect-history-api-fallback)
- Health check endpoint (`/api/health`)
- Mock login endpoint (`/api/login`)

**Configuration**:
- Port: 3000
- Static files: `../dist`

**API Endpoints**:
```
GET  /api/health  → Server health check
POST /api/login   → Mock authentication (demo only)
```

**Note**: Authentication is primarily handled by Firebase Auth in production.

---

## Configuration Files

### `/vite.config.js`
**Purpose**: Vite build configuration

**Key Settings**:
- Dev server port: 3001
- API proxy: `/api` → `http://localhost:3000`
- Manual code splitting:
  - `framer-motion` chunk
  - `vendor` chunk (React, React DOM, React Router)
  - `firebase` chunk
  - `charts` chunk (Recharts)

**Benefits**:
- Faster initial load time
- Better caching strategy
- Parallel chunk loading

### `/tailwind.config.js`
**Purpose**: Tailwind CSS configuration

**Custom Theme**:
```javascript
colors: {
  'bakery-bg': '#FFFBF2',      // Warm cream background
  'bakery-accent': '#E89F45',  // Golden accent
  'bakery-text': '#4A3B32',    // Brown text
  primary: {
    DEFAULT: '#0F5132',        // Bakery green
    light: '#198754',
    dark: '#0B3D26',
  },
  secondary: '#F8F9FA',
  accent: '#D1E7DD',
}

fontFamily: {
  sans: ['Open Sans', 'sans-serif'],
  heading: ['Poppins', 'sans-serif'],
}
```

**Plugins**:
- `tailwindcss-animate` - Animation utilities

### `/package.json`
**Purpose**: npm dependencies and scripts

**Scripts**:
```bash
npm run dev      # Start Vite dev server (port 3001)
npm run build    # Build for production
npm run lint     # Run ESLint
npm run preview  # Preview production build
```

**Key Dependencies**:
- `react@19.2.0` - React framework
- `firebase@12.6.0` - Firebase SDK
- `react-router-dom@7.9.6` - Routing
- `framer-motion@12.23.24` - Animations
- `tailwindcss@4.1.17` - Utility CSS
- `recharts@3.4.1` - Charts
- `lucide-react@0.554.0` - Icons
- `html-to-image@1.11.13` - Invoice generation

### `/eslint.config.js`
**Purpose**: ESLint code quality rules

**Configuration**:
- React plugin
- React Hooks plugin
- React Refresh plugin

---

## Data Flow Architecture

### 1. Data Fetching Flow

```
Firebase Realtime Database
    ↓ (onValue listeners)
DataContext (useEffect)
    ↓ (Real-time updates)
State (orders, preOrders, customers, products)
    ↓ (Context Provider)
Pages/Components (useData hook)
    ↓ (useMemo for calculations)
Enriched Data (with RFM scores)
    ↓ (Rendering)
User Interface
```

### 2. RFM Calculation Flow

```
DataContext.customers
    ↓ (useData hook)
Customers.jsx
    ↓ (useMemo)
enrichedCustomers = customers.map(customer => {
    orders: customerOrders.length,
    totalSpent: sum(orders.rawPrice),
    lastOrder: max(orders.date),
    rfm: calculateRFMScore(customer, allCustomers),
    segment: getCustomerSegment(rfm)
})
    ↓ (Filtering/Sorting)
Displayed Customer List
```

**Performance Optimization**:
- `useMemo` prevents recalculation on every render
- Calculations only re-run when `customers` or `orders` arrays change
- Acceptable performance for <1000 customers

### 3. Order Creation Flow

```
User fills CreateOrderModal form
    ↓
Validation (customer, items, prices)
    ↓
Calculate total (subtotal + fees - discount)
    ↓
Firebase.push('/orders', newOrder)
    ↓ (Real-time sync)
DataContext receives update
    ↓
Orders page re-renders with new order
    ↓
Toast notification shown
```

### 4. Pre-Order Flow

```
Customer browses PreorderLanding
    ↓
Adds items to cart
    ↓
Opens PreorderCheckoutModal
    ↓
Enters delivery info and date/time
    ↓
Submit order → Firebase.push('/preorders', preOrder)
    ↓ (Staff dashboard)
PreOrders.jsx shows new pre-order
    ↓
Staff confirms/completes order
    ↓
Status updated in Firebase
```

### 5. Invoice Generation Flow

```
User clicks "Generate Invoice" in OrderDetailsModal
    ↓
InvoiceModal opens with order data
    ↓
html-to-image library captures modal as PNG
    ↓
PNG opens in new window for printing
    ↓
User prints invoice
```

---

## External Dependencies

### Firebase Services

**Realtime Database**:
- `/orders` - Order records
- `/preorders` - Pre-order records
- `/newCustomers` - Customer records
- `/cakes` - Product catalog

**Authentication**:
- Email/password authentication
- Session management

**Configuration** (`/src/firebase.js`):
```javascript
import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getAuth } from 'firebase/auth';

// Firebase config from environment variables
const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);
export const auth = getAuth(app);
```

### Google Gemini API

**Purpose**: AI-powered image generation for bakery products

**Usage** (`/src/utils/imageGenerator.js`):
```javascript
// Generates professional bakery product images
generateCakeImage(cakeName, description)
```

**API Endpoint**: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`

**Features**:
- Text-to-image generation
- Professional bakery photography style
- High-quality results
- Fallback to default images on error

### Third-Party Libraries

**UI Components**:
- `lucide-react` - Icon library (500+ icons)
- `recharts` - Charting library
- `framer-motion` - Animation library

**Utilities**:
- `html-to-image` - Convert DOM to image (for invoices)
- `react-router-dom` - Client-side routing

**Development**:
- `vite` - Build tool and dev server
- `tailwindcss` - Utility-first CSS framework
- `eslint` - Code linting

---

## Database Schema

### Orders Collection (`/orders`)

```javascript
{
  "order_id": {
    "customer": {
      "name": "John Doe",
      "phone": "+84123456789",
      "address": "123 Street, City",
      "socialLink": "facebook.com/johndoe"
    },
    "cakes": [
      {
        "name": "Chocolate Cake",
        "amount": 2,
        "price": 150000
      }
    ],
    "orderDate": 756820800,        // CFAbsoluteTime (delivery date)
    "createDate": 756734400,       // CFAbsoluteTime (order date)
    "deliveryTimeSlot": "14:00-16:00",
    "state": "Hoàn thành",         // Vietnamese status
    "shipFee": 20000,
    "otherFee": 5000,
    "discount": 10,                // Percentage or fixed amount
    "note": "Customer note"
  }
}
```

### Pre-Orders Collection (`/preorders`)

```javascript
{
  "preorder_id": {
    "customerName": "Jane Smith",
    "phone": "+84987654321",
    "address": "456 Avenue, City",
    "items": [
      {
        "name": "Croissant",
        "amount": 5,
        "price": 25000
      }
    ],
    "deliveryDate": "2025-12-10",  // YYYY-MM-DD
    "deliveryTime": "08:00-10:00",
    "total": 125000,
    "state": "pending",            // pending | confirmed | completed | cancelled
    "createDate": 1733241600,      // Unix timestamp (seconds)
    "note": "Early morning delivery please"
  }
}
```

### Customers Collection (`/newCustomers`)

```javascript
{
  "customer_id": {
    "name": "Alice Johnson",
    "phone": "+84912345678",
    "email": "alice@example.com",
    "address": "789 Road, City",
    "socialLink": "instagram.com/alice",
    "createDate": 756734400       // CFAbsoluteTime or Unix timestamp
  }
}
```

### Products Collection (`/cakes`)

```javascript
{
  "product_id": {
    "name": "Banana Bread",
    "type": "Banana",
    "description": "Moist and tender banana bread...",
    "price": 50000,
    "image": "https://example.com/banana-bread.jpg"
  }
}
```

---

## Key Algorithms & Business Logic

### 1. Order Total Calculation

```javascript
// In DataContext.jsx
const subtotal = order.cakes.reduce((sum, cake) =>
  sum + (cake.price * cake.amount), 0
);

let total = subtotal;
total += Number(order.shipFee || 0);
total += Number(order.otherFee || 0);

const discountVal = Number(order.discount || 0);
const discountAmount = discountVal <= 100
  ? (subtotal * discountVal) / 100  // Percentage
  : discountVal;                     // Fixed amount

total -= discountAmount;
```

### 2. RFM Score Calculation

See `/src/utils/rfm.js` for complete implementation.

**Summary**:
1. Calculate days since last order
2. Score Recency (1-5) based on time thresholds
3. Score Frequency (1-5) based on order count
4. Score Monetary (1-5) based on spending percentile
5. Combine scores into pattern (e.g., "545")
6. Map pattern to segment (e.g., "Champions")

### 3. CFAbsoluteTime Conversion

```javascript
// Apple's CFAbsoluteTime: seconds since 2001-01-01 00:00:00 UTC
// JavaScript Date: milliseconds since 1970-01-01 00:00:00 UTC

const parseCFTime = (cfTime) => {
  // 978307200 = seconds between 1970-01-01 and 2001-01-01
  return new Date((cfTime + 978307200) * 1000);
};
```

### 4. Phone Number Normalization

```javascript
// In PhoneFormatModal.jsx
const normalizePhone = (phone) => {
  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, '');

  // Add +84 prefix if not present
  if (!cleaned.startsWith('84')) {
    // Remove leading 0 if present
    if (cleaned.startsWith('0')) {
      cleaned = cleaned.substring(1);
    }
    cleaned = '84' + cleaned;
  }

  return '+' + cleaned;
};

// Example: "0912 345 678" → "+84912345678"
```

---

## Performance Considerations

### Client-Side Performance

**RFM Calculation Performance**:
- **Complexity**: O(n log n) due to sorting for monetary percentile
- **Benchmark**: <500ms for 500 customers
- **Optimization**: useMemo prevents unnecessary recalculations
- **Limitation**: Performance degrades with >1000 customers

**Recommendations**:
- For <500 customers: Client-side is ideal
- For 500-1000 customers: Acceptable with optimization
- For >1000 customers: Consider server-side calculation

**Current Optimizations**:
- `useMemo` for expensive calculations
- Pagination for large lists (10/25/50/100 per page)
- Lazy loading of images
- Code splitting (Vite chunks)
- Real-time updates only for changed data

### Firebase Performance

**Data Fetching**:
- Real-time listeners (onValue) for live updates
- Single subscription per collection
- No unnecessary re-fetches

**Query Optimization**:
- Fetch all data once, filter client-side
- No complex Firebase queries (all data pre-fetched)
- Acceptable for small-to-medium datasets (<10,000 records)

**Recommendations**:
- Add Firebase indexes if querying by multiple fields
- Consider pagination for orders if exceeding 1000 records
- Use Firebase security rules to limit data exposure

---

## Security Considerations

### Authentication

**Protected Routes**:
- All admin routes require authentication
- Redirect to `/login` if not authenticated
- Firebase Auth session management

**Password Verification**:
- `PasswordModal` for destructive operations
- Used before data sync operations
- Prevents accidental data loss

### Data Security

**Firebase Security Rules** (should be configured):
```javascript
{
  "rules": {
    ".read": "auth != null",
    ".write": "auth != null",
    "orders": {
      ".indexOn": ["orderDate", "state"]
    },
    "customers": {
      ".indexOn": ["phone"]
    }
  }
}
```

**Client-Side Security**:
- No sensitive data in console logs
- Firebase config in environment variables (production)
- No hardcoded API keys in source code

---

## Testing Strategy

### Current State

**Testing Coverage**: Minimal (no test files found)

**Recommended Testing Approach**:

1. **Unit Tests** (Jest + React Testing Library):
   - `rfm.js` utility functions
   - Data transformation functions in `DataContext`
   - Price calculation logic

2. **Component Tests**:
   - Form validation in `CreateOrderModal`
   - Cart functionality in `PreorderCartModal`
   - RFM scorecard in `CustomerDetailsModal`

3. **Integration Tests**:
   - Order creation flow
   - Pre-order submission flow
   - Customer analytics enrichment

4. **E2E Tests** (Cypress/Playwright):
   - Complete order creation workflow
   - Pre-order customer journey
   - Data sync operations

---

## Future Improvements

### Code Quality

1. **TypeScript Migration**:
   - Add type safety
   - Improve IDE autocomplete
   - Catch errors at compile-time

2. **Component Refactoring**:
   - Extract large components into smaller pieces
   - Create design system with reusable components
   - Standardize prop patterns

3. **Error Handling**:
   - Add error boundaries
   - Comprehensive error logging
   - User-friendly error messages

### Performance

1. **Virtualization**:
   - Implement react-window for long lists
   - Improve rendering performance for large datasets

2. **Server-Side Analytics**:
   - Move RFM calculation to backend for >1000 customers
   - Use Firebase Cloud Functions or separate API

3. **Caching**:
   - Implement localStorage caching for customer segments
   - Service worker for offline support

### Features

1. **Real-Time Collaboration**:
   - Multiple staff members editing simultaneously
   - Live order updates for all users

2. **Advanced Analytics**:
   - Cohort analysis
   - Churn prediction with ML
   - Inventory forecasting

3. **Notifications**:
   - Email/SMS notifications for order confirmations
   - WhatsApp/Zalo integration for Vietnamese market
   - Push notifications for staff

---

## Conclusion

The Butter Bake is a well-structured React application with clear separation of concerns, real-time data synchronization, and advanced customer analytics. The codebase follows modern React patterns, leverages Firebase for backend services, and provides a comprehensive solution for bakery management.

**Strengths**:
- Clean component architecture
- Real-time data updates
- Advanced RFM analytics
- Responsive design
- Data migration tools

**Areas for Improvement**:
- Add comprehensive testing
- Migrate to TypeScript
- Optimize for large datasets
- Improve error handling
- Add offline support

---

**Document Version**: 1.0
**Created**: 2025-12-04
**Author**: Technical Documentation Specialist
**Status**: Active
**Next Review**: Quarterly
