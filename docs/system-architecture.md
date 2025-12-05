# The Butter Bake - System Architecture

## Overview

This document provides a comprehensive overview of The Butter Bake's system architecture, including application structure, component hierarchy, state management, data layer, and deployment architecture.

**Last Updated**: 2025-12-04

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Application Architecture](#application-architecture)
3. [Component Hierarchy](#component-hierarchy)
4. [State Management Architecture](#state-management-architecture)
5. [Data Layer Architecture](#data-layer-architecture)
6. [API Architecture](#api-architecture)
7. [Build and Deployment Architecture](#build-and-deployment-architecture)
8. [Security Architecture](#security-architecture)
9. [Performance Architecture](#performance-architecture)
10. [Scalability Considerations](#scalability-considerations)

---

## Architecture Overview

### High-Level Architecture

The Butter Bake follows a **Client-Heavy Architecture** with Firebase as the backend.

```
┌─────────────────────────────────────────────────────────────┐
│                         CLIENT TIER                          │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                  React Application (SPA)                │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │ │
│  │  │   UI Layer   │  │ State Mgmt   │  │  Business    │ │ │
│  │  │  (Components)│  │  (Contexts)  │  │   Logic      │ │ │
│  │  │              │  │              │  │  (Utils)     │ │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘ │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              ↕
                   Firebase SDK (Real-time)
                              ↕
┌─────────────────────────────────────────────────────────────┐
│                       BACKEND TIER                           │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              Firebase Realtime Database                 │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐            │ │
│  │  │  Orders  │  │Customers │  │ Products │            │ │
│  │  └──────────┘  └──────────┘  └──────────┘            │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              Firebase Authentication                    │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────┐
│                   EXTERNAL SERVICES                          │
│  ┌────────────────────────────────────────────────────────┐ │
│  │         Google Gemini API (Image Generation)            │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Architecture Pattern

**Pattern Name**: Client-Heavy Firebase Architecture

**Characteristics**:
- **Client-Side Heavy**: Business logic and data processing on client
- **Real-Time Synchronization**: Firebase handles live data updates
- **Stateless Backend**: No custom backend server for data operations
- **BaaS (Backend as a Service)**: Firebase provides authentication, database, and hosting

**Advantages**:
- Rapid development
- Real-time updates out-of-the-box
- Scalable infrastructure (Firebase handles scaling)
- Low operational overhead
- No backend code deployment

**Trade-offs**:
- Limited server-side processing
- Client performs expensive operations (RFM calculations)
- Security rules in Firebase (not custom middleware)
- Firebase pricing based on usage

---

## Application Architecture

### Layer Architecture

```
┌───────────────────────────────────────────────────────────┐
│                     PRESENTATION LAYER                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │
│  │   Pages     │  │  Components │  │   Styles    │      │
│  │ (Routes)    │  │  (UI/Logic) │  │ (Tailwind)  │      │
│  └─────────────┘  └─────────────┘  └─────────────┘      │
└───────────────────────────────────────────────────────────┘
                          ↕
┌───────────────────────────────────────────────────────────┐
│                    STATE MANAGEMENT LAYER                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │
│  │    Data     │  │    Auth     │  │   Toast     │      │
│  │  Context    │  │  Context    │  │  Context    │      │
│  └─────────────┘  └─────────────┘  └─────────────┘      │
└───────────────────────────────────────────────────────────┘
                          ↕
┌───────────────────────────────────────────────────────────┐
│                     BUSINESS LOGIC LAYER                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │
│  │  RFM Utils  │  │ Image Gen   │  │ Animations  │      │
│  │             │  │             │  │             │      │
│  └─────────────┘  └─────────────┘  └─────────────┘      │
└───────────────────────────────────────────────────────────┘
                          ↕
┌───────────────────────────────────────────────────────────┐
│                        DATA LAYER                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │
│  │  Firebase   │  │   Gemini    │  │   Local     │      │
│  │     SDK     │  │     API     │  │  Storage    │      │
│  └─────────────┘  └─────────────┘  └─────────────┘      │
└───────────────────────────────────────────────────────────┘
```

### Presentation Layer

**Responsibility**: User interface rendering and user interaction

**Components**:
- **Pages**: Top-level route components (`Dashboard.jsx`, `Orders.jsx`, etc.)
- **Components**: Reusable UI components organized by feature
- **Styles**: Tailwind CSS utilities and custom CSS

**Key Technologies**:
- React 19.2.0
- React Router DOM 7.9.6
- Tailwind CSS 4.1.17
- Framer Motion 12.23.24 (animations)
- Lucide React (icons)

### State Management Layer

**Responsibility**: Global application state and data orchestration

**Contexts**:

1. **DataContext**:
   - Fetches and manages orders, customers, products
   - Subscribes to Firebase real-time updates
   - Transforms raw Firebase data

2. **AuthContext**:
   - Manages authentication state
   - Provides login/logout functions
   - Protects routes

3. **ToastContext**:
   - Manages notification state
   - Displays success/error messages

**Pattern**: React Context API with custom hooks

### Business Logic Layer

**Responsibility**: Application-specific business rules and calculations

**Modules**:
- **RFM Analytics** (`utils/rfm.js`): Customer segmentation algorithms
- **Image Generation** (`utils/imageGenerator.js`): AI product image generation
- **Animations** (`utils/animations.js`): Animation presets
- **Clipboard** (`utils/clipboard.js`): Copy-to-clipboard utility

### Data Layer

**Responsibility**: Data fetching, persistence, and external API communication

**Services**:
- **Firebase SDK**: Database and authentication
- **Gemini API**: Image generation
- **Local Storage**: Caching (future enhancement)

---

## Component Hierarchy

### Application Component Tree

```
App.jsx
├── AuthProvider
│   └── DataProvider
│       └── ToastProvider
│           └── BrowserRouter
│               ├── Route: /login
│               │   └── Login
│               │
│               ├── Route: /preorder
│               │   └── PreorderLanding
│               │       ├── ProductCatalog
│               │       ├── PreorderCartModal
│               │       └── PreorderCheckoutModal
│               │
│               └── Route: / (Protected)
│                   └── MainLayout
│                       ├── Sidebar
│                       ├── Header
│                       └── Outlet
│                           ├── Dashboard
│                           │   ├── StatsCard (×4)
│                           │   ├── RevenueChart
│                           │   ├── ProductStatsCard (×N)
│                           │   └── RecentOrders
│                           │
│                           ├── Orders
│                           │   ├── OrderTable
│                           │   ├── CreateOrderModal
│                           │   ├── OrderDetailsModal
│                           │   ├── InvoiceModal
│                           │   └── AdvancedFilterModal
│                           │
│                           ├── PreOrders
│                           │   ├── PreOrderTable
│                           │   └── ConfirmPreOrderModal
│                           │
│                           ├── Customers
│                           │   ├── CustomerList
│                           │   ├── CustomerDetailsModal
│                           │   │   ├── RFMScorecard
│                           │   │   └── OrderHistory
│                           │   └── CustomerFilters
│                           │
│                           ├── Products
│                           │   └── ProductList
│                           │
│                           ├── Analytics
│                           │   └── AnalyticsDashboard
│                           │
│                           ├── DataSync
│                           │   ├── SyncDataModal
│                           │   ├── PhoneFormatModal
│                           │   ├── CustomerDataFixModal
│                           │   └── CleanupModal
│                           │
│                           └── Settings
│                               └── SettingsPanel
```

### Component Communication Patterns

#### 1. Parent-to-Child (Props)

```
OrderList (Parent)
    ↓ props: { order, onSelect }
OrderCard (Child)
```

#### 2. Child-to-Parent (Callbacks)

```
CreateOrderModal (Child)
    ↑ callback: onOrderCreated()
Orders (Parent)
```

#### 3. Context-Based (Global State)

```
DataContext (Provider)
    ↓ useData()
CustomerList (Consumer)
```

#### 4. Sibling Communication (Via Parent)

```
CustomerList (Sibling 1)
    ↑ callback: onSelect(customer)
Customers (Parent - holds state)
    ↓ props: { customer }
CustomerDetailsModal (Sibling 2)
```

---

## State Management Architecture

### Context Providers Hierarchy

```javascript
<AuthProvider>
  <DataProvider>
    <ToastProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ToastProvider>
  </DataProvider>
</AuthProvider>
```

### DataContext Architecture

**Purpose**: Central data hub for the application

**Data Flow**:
```
Firebase Realtime DB
    ↓ onValue (real-time listener)
DataContext (useEffect)
    ↓ setState
State: { orders, preOrders, customers, products, loading }
    ↓ Context Provider
Pages/Components (useData hook)
```

**Implementation**:
```javascript
// src/contexts/DataContext.jsx
export const DataProvider = ({ children }) => {
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Subscribe to Firebase collections
    const ordersRef = ref(database, 'orders');
    const customersRef = ref(database, 'newCustomers');
    const productsRef = ref(database, 'cakes');

    const unsubscribeOrders = onValue(ordersRef, snapshot => {
      const data = snapshot.val();
      const transformed = transformOrdersData(data);
      setOrders(transformed);
    });

    const unsubscribeCustomers = onValue(customersRef, snapshot => {
      const data = snapshot.val();
      const transformed = transformCustomersData(data);
      setCustomers(transformed);
    });

    const unsubscribeProducts = onValue(productsRef, snapshot => {
      const data = snapshot.val();
      const transformed = transformProductsData(data);
      setProducts(transformed);
      setLoading(false);
    });

    return () => {
      unsubscribeOrders();
      unsubscribeCustomers();
      unsubscribeProducts();
    };
  }, []);

  return (
    <DataContext.Provider value={{ orders, customers, products, loading }}>
      {children}
    </DataContext.Provider>
  );
};
```

### Local State vs Context State

**Use Context For**:
- Application-wide data (orders, customers, products)
- User authentication state
- Global UI state (theme, notifications)

**Use Local State For**:
- Component-specific UI state (modals, dropdowns)
- Form inputs
- Temporary data (search queries, filters)
- Derived data (filtered/sorted lists)

**Example**:
```javascript
function Customers() {
  // Context state (global)
  const { customers, orders } = useData();

  // Local state (component-specific)
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSegment, setSelectedSegment] = useState('all');
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // Derived state (memoized)
  const enrichedCustomers = useMemo(() => {
    return customers.map(c => enrichCustomer(c, orders));
  }, [customers, orders]);

  const filteredCustomers = useMemo(() => {
    return enrichedCustomers.filter(c =>
      c.name.includes(searchQuery) &&
      (selectedSegment === 'all' || c.rfm.segment === selectedSegment)
    );
  }, [enrichedCustomers, searchQuery, selectedSegment]);

  return (
    <div>
      <SearchBar value={searchQuery} onChange={setSearchQuery} />
      <SegmentFilter value={selectedSegment} onChange={setSelectedSegment} />
      <CustomerList customers={filteredCustomers} onSelect={setSelectedCustomer} />
      {selectedCustomer && (
        <CustomerDetailsModal
          customer={selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
        />
      )}
    </div>
  );
}
```

---

## Data Layer Architecture

### Firebase Realtime Database Structure

```
firebase-database (root)
├── orders/
│   ├── order_id_1
│   │   ├── customer: { name, phone, address, socialLink }
│   │   ├── cakes: [ { name, amount, price }, ... ]
│   │   ├── orderDate: CFAbsoluteTime (delivery)
│   │   ├── createDate: CFAbsoluteTime (creation)
│   │   ├── deliveryTimeSlot: string
│   │   ├── state: string (Vietnamese: "Hoàn thành", "Hủy", etc.)
│   │   ├── shipFee: number
│   │   ├── otherFee: number
│   │   ├── discount: number
│   │   └── note: string
│   └── ...
│
├── preorders/
│   ├── preorder_id_1
│   │   ├── customerName: string
│   │   ├── phone: string
│   │   ├── address: string
│   │   ├── items: [ { name, amount, price }, ... ]
│   │   ├── deliveryDate: YYYY-MM-DD
│   │   ├── deliveryTime: string
│   │   ├── total: number
│   │   ├── state: string ("pending", "confirmed", "completed", "cancelled")
│   │   ├── createDate: Unix timestamp (seconds)
│   │   └── note: string
│   └── ...
│
├── newCustomers/
│   ├── customer_id_1
│   │   ├── name: string
│   │   ├── phone: string
│   │   ├── email: string
│   │   ├── address: string
│   │   ├── socialLink: string
│   │   └── createDate: CFAbsoluteTime or Unix timestamp
│   └── ...
│
└── cakes/
    ├── product_id_1
    │   ├── name: string
    │   ├── type: string (category)
    │   ├── description: string
    │   ├── price: number (VND)
    │   └── image: string (URL or path)
    └── ...
```

### Data Transformation Pipeline

**Raw Firebase Data → Application Data**

**Step 1: Fetch from Firebase**
```javascript
const ordersRef = ref(database, 'orders');
onValue(ordersRef, (snapshot) => {
  const rawData = snapshot.val();
  // { "order_id_1": { ... }, "order_id_2": { ... } }
});
```

**Step 2: Convert Object to Array**
```javascript
const ordersList = Object.keys(rawData).map(key => ({
  id: key,
  ...rawData[key]
}));
// [{ id: "order_id_1", ... }, { id: "order_id_2", ... }]
```

**Step 3: Parse Timestamps**
```javascript
const parseCFTime = (cfTime) => new Date((cfTime + 978307200) * 1000);

ordersList.forEach(order => {
  order.orderDateObj = parseCFTime(order.orderDate);
  order.createDateObj = parseCFTime(order.createDate);
});
```

**Step 4: Format Dates**
```javascript
order.timeline = {
  ordered: {
    date: order.createDateObj.toLocaleDateString('en-GB'),
    time: order.createDateObj.toLocaleTimeString('en-US')
  },
  received: {
    date: order.orderDateObj.toLocaleDateString('en-GB'),
    time: order.deliveryTimeSlot || order.orderDateObj.toLocaleTimeString(),
    raw: order.orderDateObj
  }
};
```

**Step 5: Calculate Prices**
```javascript
const subtotal = order.cakes.reduce((sum, cake) =>
  sum + (cake.price * cake.amount), 0
);

let total = subtotal + order.shipFee + order.otherFee;
const discountAmount = order.discount <= 100
  ? (subtotal * order.discount) / 100
  : order.discount;
total -= discountAmount;

order.rawPrice = total;
order.price = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND'
}).format(total);
```

**Step 6: Map Status**
```javascript
const stateLower = order.state.toLowerCase();
if (stateLower.includes('hoàn thành')) {
  order.status = 'Completed';
} else if (stateLower.includes('hủy')) {
  order.status = 'Cancelled';
} else {
  order.status = 'Pending';
}
```

### RFM Data Enrichment

**Customer Enrichment Pipeline**:
```
Raw Customers + Orders
    ↓
Customer-Order Linking (by phone)
    ↓
Aggregate Metrics (orders count, total spent, last order)
    ↓
RFM Score Calculation
    ↓
Segment Assignment
    ↓
Enriched Customer Object
```

**Implementation**:
```javascript
const enrichedCustomers = useMemo(() => {
  return customers.map(customer => {
    // Link orders
    const customerOrders = orders.filter(o =>
      o.customer.phone === customer.phone
    );

    // Aggregate metrics
    const totalSpent = customerOrders.reduce((sum, o) => sum + o.rawPrice, 0);
    const lastOrderDate = Math.max(...customerOrders.map(o => o.timeline.received.raw));

    // RFM calculation
    const rfm = calculateRFMScore(
      { ...customer, orders: customerOrders.length, totalSpent, rawLastOrder: lastOrderDate },
      customers
    );

    // Return enriched customer
    return {
      ...customer,
      orders: customerOrders.length,
      totalSpent,
      lastOrder: new Date(lastOrderDate).toLocaleDateString(),
      rawLastOrder: lastOrderDate,
      rfm
    };
  });
}, [customers, orders]);
```

---

## API Architecture

### Firebase API Integration

**SDK**: Firebase JavaScript SDK v12.6.0

**Modules Used**:
- `firebase/app` - Core Firebase app
- `firebase/database` - Realtime Database
- `firebase/auth` - Authentication

**Configuration** (`src/firebase.js`):
```javascript
import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);
export const auth = getAuth(app);
```

### Gemini API Integration

**API**: Google Generative AI (Gemini 2.0)
**Purpose**: AI-powered product image generation

**Implementation** (`src/utils/imageGenerator.js`):
```javascript
export const generateCakeImage = async (cakeName, description) => {
  const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
  const prompt = craftCakePrompt(cakeName, description);

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }]
      })
    }
  );

  const data = await response.json();
  return extractImageUrl(data);
};

const craftCakePrompt = (cakeName, description) => {
  return `Professional bakery product photography: ${description || cakeName} cake
    Style: Modern, high-end patisserie aesthetic
    Lighting: Soft studio lighting with natural highlights
    Background: Clean white or cream surface with subtle shadows
    Details: Show texture, frosting details, decorative elements
    Quality: Ultra high quality, appetizing, professional food photography
    Mood: Elegant, luxury, artisanal baked goods
    Focus: Prominent display of the cake's most appealing features`;
};
```

### Express Backend API

**Server**: Express.js (minimal backend)
**Purpose**: Static file serving and SPA fallback

**Endpoints** (`backend/server.js`):
```
GET  /api/health          → Health check
POST /api/login           → Mock login (demo)
GET  /*                   → Serve static files or SPA fallback
```

**Note**: Authentication is handled by Firebase Auth, not Express endpoints.

---

## Build and Deployment Architecture

### Development Environment

**Dev Server**: Vite dev server (port 3001)
**Backend Server**: Express server (port 3000)
**Proxy**: Vite proxies `/api` requests to Express

**Configuration** (`vite.config.js`):
```javascript
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001,
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
});
```

**Workflow**:
```
Developer runs: npm run dev
    ↓
Vite starts on localhost:3001
    ↓
Vite serves React app with HMR
    ↓
API requests to /api/* proxied to localhost:3000 (Express)
```

### Production Build

**Build Process**:
```
npm run build
    ↓
Vite compiles React app
    ↓
Outputs static files to /dist
    ↓
Code splitting (chunks):
  - main.js (app code)
  - vendor.js (React, React DOM, React Router)
  - firebase.js (Firebase SDK)
  - framer-motion.js (animations)
  - charts.js (Recharts)
```

**Build Configuration** (`vite.config.js`):
```javascript
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        'framer-motion': ['framer-motion'],
        'vendor': ['react', 'react-dom', 'react-router-dom'],
        'firebase': ['firebase/app', 'firebase/database', 'firebase/auth'],
        'charts': ['recharts']
      }
    }
  }
}
```

**Deployment Architecture**:
```
/dist (Static Build)
    ↓
Express Server (serves static files)
    ↓
Deployed to hosting platform
    ↓
Users access via https://domain.com
```

### Hosting Options

1. **Firebase Hosting** (Recommended)
   - Automatic HTTPS
   - Global CDN
   - Integration with Firebase services
   - Deploy command: `firebase deploy`

2. **Vercel/Netlify**
   - Git integration
   - Automatic deployments
   - Edge functions

3. **Custom Server**
   - Express server serves `/dist`
   - Nginx reverse proxy
   - PM2 for process management

---

## Security Architecture

### Authentication Flow

```
User → Login Page
    ↓
Enter email/password
    ↓
Firebase Authentication API
    ↓ (Success)
Set isAuthenticated = true
    ↓
Redirect to Dashboard
    ↓
Protected Routes Accessible
```

**Implementation**:
```javascript
// src/contexts/AuthContext.jsx
export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const login = async (email, password) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
```

### Protected Routes

```javascript
// src/App.jsx
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <LoadingSpinner />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
};

<Route path="/" element={
  <ProtectedRoute>
    <MainLayout />
  </ProtectedRoute>
}>
  <Route index element={<Dashboard />} />
  {/* Other protected routes */}
</Route>
```

### Firebase Security Rules

**Recommended Rules**:
```json
{
  "rules": {
    ".read": "auth != null",
    ".write": "auth != null",
    "orders": {
      ".indexOn": ["orderDate", "state"],
      "$orderId": {
        ".validate": "newData.hasChildren(['customer', 'cakes', 'orderDate'])"
      }
    },
    "customers": {
      ".indexOn": ["phone"],
      "$customerId": {
        ".validate": "newData.hasChildren(['name', 'phone'])"
      }
    }
  }
}
```

### Data Validation

**Client-Side Validation**:
```javascript
const validateOrderForm = (formData) => {
  const errors = {};

  if (!formData.customer?.name) {
    errors.customer = 'Customer name is required';
  }

  if (!formData.items || formData.items.length === 0) {
    errors.items = 'At least one item is required';
  }

  if (!formData.deliveryDate) {
    errors.deliveryDate = 'Delivery date is required';
  }

  return { isValid: Object.keys(errors).length === 0, errors };
};
```

---

## Performance Architecture

### Optimization Strategies

#### 1. Code Splitting

**Vite Configuration**:
```javascript
manualChunks: {
  'framer-motion': ['framer-motion'],
  'vendor': ['react', 'react-dom', 'react-router-dom'],
  'firebase': ['firebase/app', 'firebase/database', 'firebase/auth'],
  'charts': ['recharts']
}
```

**Benefits**:
- Parallel chunk loading
- Better caching (vendor chunk rarely changes)
- Faster initial load time

#### 2. Lazy Loading

**Route-Based Lazy Loading**:
```javascript
import React, { lazy, Suspense } from 'react';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Orders = lazy(() => import('./pages/Orders'));
const Customers = lazy(() => import('./pages/Customers'));

<Suspense fallback={<LoadingSpinner />}>
  <Route path="/" element={<Dashboard />} />
  <Route path="/orders" element={<Orders />} />
  <Route path="/customers" element={<Customers />} />
</Suspense>
```

#### 3. Memoization

**RFM Calculation Memoization**:
```javascript
const enrichedCustomers = useMemo(() => {
  return customers.map(c => enrichCustomer(c, orders));
}, [customers, orders]);
```

**Benefits**:
- Prevents expensive recalculations on every render
- Only recalculates when dependencies change

#### 4. Pagination

**Order List Pagination**:
```javascript
const [pageSize, setPageSize] = useState(25);
const [currentPage, setCurrentPage] = useState(1);

const paginatedOrders = useMemo(() => {
  const start = (currentPage - 1) * pageSize;
  return filteredOrders.slice(start, start + pageSize);
}, [filteredOrders, currentPage, pageSize]);
```

### Performance Metrics

**Target Metrics**:
- **Time to First Byte (TTFB)**: <500ms
- **First Contentful Paint (FCP)**: <1.5s
- **Time to Interactive (TTI)**: <3s
- **RFM Calculation**: <500ms for 500 customers

**Monitoring**:
- Chrome DevTools Performance tab
- Lighthouse audits
- Firebase Performance Monitoring (optional)

---

## Scalability Considerations

### Current Scale

**Acceptable Performance**:
- Customers: <1,000
- Orders: <10,000
- Products: <500

### Scaling Strategies

#### 1. Client-Side Optimization

**For 1,000 - 2,000 customers**:
- Implement virtualized lists (react-window)
- More aggressive memoization
- Lazy load customer details

#### 2. Server-Side Processing

**For >2,000 customers**:
- Move RFM calculation to Firebase Cloud Functions
- Server-side pagination
- Background jobs for analytics

**Example Cloud Function**:
```javascript
exports.calculateRFM = functions.https.onCall(async (data, context) => {
  const customers = await admin.database().ref('newCustomers').once('value');
  const orders = await admin.database().ref('orders').once('value');

  const enriched = customers.val().map(c => enrichCustomer(c, orders.val()));

  return enriched;
});
```

#### 3. Database Optimization

**Indexing**:
```json
{
  "rules": {
    "orders": {
      ".indexOn": ["orderDate", "customer/phone"]
    },
    "customers": {
      ".indexOn": ["phone", "createDate"]
    }
  }
}
```

**Pagination Queries**:
```javascript
const ordersRef = query(
  ref(database, 'orders'),
  orderByChild('orderDate'),
  limitToLast(100)
);
```

#### 4. Caching

**LocalStorage Caching**:
```javascript
// Cache RFM scores
localStorage.setItem('rfm_cache', JSON.stringify({
  customers: enrichedCustomers,
  timestamp: Date.now()
}));

// Retrieve cache (if <1 hour old)
const cache = JSON.parse(localStorage.getItem('rfm_cache'));
if (cache && Date.now() - cache.timestamp < 3600000) {
  return cache.customers;
}
```

---

## Conclusion

The Butter Bake's architecture is designed for:
- **Rapid Development**: Firebase handles backend complexity
- **Real-Time Updates**: Live data synchronization
- **Scalability**: Horizontal scaling via Firebase
- **Maintainability**: Clear separation of concerns

**Key Architectural Decisions**:
1. Client-heavy processing for <1,000 customers
2. Real-time Firebase synchronization
3. Context API for state management
4. Component-based UI architecture
5. Utility-first styling with Tailwind CSS

**Future Architecture Evolution**:
- Migrate to TypeScript for type safety
- Implement server-side analytics for scale
- Add service workers for offline support
- Introduce micro-frontends for large teams

---

**Document Version**: 1.0
**Created**: 2025-12-04
**Author**: Technical Documentation Specialist
**Status**: Active
**Next Review**: Quarterly or upon major architectural changes
