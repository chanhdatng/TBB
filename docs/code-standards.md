# The Butter Bake - Code Standards & Best Practices

## Overview

This document defines the coding standards, architectural patterns, naming conventions, and best practices followed in The Butter Bake codebase. All contributors should adhere to these guidelines to maintain code consistency and quality.

**Last Updated**: 2025-12-04

---

## Table of Contents

1. [Project Structure](#project-structure)
2. [Naming Conventions](#naming-conventions)
3. [Component Architecture](#component-architecture)
4. [State Management](#state-management)
5. [Data Flow Patterns](#data-flow-patterns)
6. [Styling Guidelines](#styling-guidelines)
7. [Code Quality](#code-quality)
8. [Performance Best Practices](#performance-best-practices)
9. [Error Handling](#error-handling)
10. [Documentation Standards](#documentation-standards)

---

## Project Structure

### Directory Organization

```
src/
├── assets/           # Static assets (images, fonts)
├── components/       # Reusable React components
│   ├── Common/      # Shared UI components
│   ├── [Feature]/   # Feature-specific components
│   └── Layout/      # Layout components
├── contexts/        # React Context providers
├── data/            # Static data files (JSON)
├── hooks/           # Custom React hooks
├── pages/           # Page components (routes)
├── styles/          # CSS files
├── utils/           # Utility functions
├── App.jsx          # Root component
├── main.jsx         # Entry point
└── firebase.js      # Firebase configuration
```

### Feature-Based Organization

Components are organized by feature for better maintainability:

```
components/
├── Orders/
│   ├── CreateOrderModal.jsx
│   ├── OrderDetailsModal.jsx
│   └── InvoiceModal.jsx
├── Customers/
│   └── CustomerDetailsModal.jsx
├── Dashboard/
│   ├── StatsCard.jsx
│   └── RevenueChart.jsx
└── DataSync/
    ├── SyncDataModal.jsx
    └── PhoneFormatModal.jsx
```

**Rationale**: Feature-based structure makes it easier to locate related components and understand feature boundaries.

---

## Naming Conventions

### Files and Folders

**React Components**: PascalCase with `.jsx` extension
```
CreateOrderModal.jsx
CustomerDetailsModal.jsx
StatsCard.jsx
```

**Utility Files**: camelCase with `.js` extension
```
rfm.js
imageGenerator.js
animations.js
```

**Context Files**: PascalCase ending with `Context.jsx`
```
DataContext.jsx
AuthContext.jsx
ToastContext.jsx
```

**Page Components**: PascalCase matching route name
```
Dashboard.jsx       → /
Orders.jsx          → /orders
Customers.jsx       → /customers
PreorderLanding.jsx → /preorder
```

### Variables and Functions

**Constants**: UPPER_SNAKE_CASE
```javascript
const MAX_ITEMS_PER_PAGE = 100;
const DEFAULT_PAGINATION_SIZE = 10;
const CF_ABSOLUTE_TIME_OFFSET = 978307200;
```

**Variables**: camelCase
```javascript
const customerData = ...;
const enrichedCustomers = ...;
const daysSinceLastOrder = ...;
```

**Functions**: camelCase, verb-first
```javascript
const calculateRFMScore = (customer, allCustomers) => { ... };
const formatLocalDate = (date) => { ... };
const handleSubmit = () => { ... };
```

**Event Handlers**: `handle` prefix
```javascript
const handleOrderCreate = () => { ... };
const handleCustomerSelect = (customer) => { ... };
const handleDateChange = (date) => { ... };
```

**Boolean Variables**: `is`, `has`, `should` prefix
```javascript
const isLoading = true;
const hasOrders = orders.length > 0;
const shouldShowModal = ...;
```

### React Components

**Component Names**: PascalCase, descriptive noun
```javascript
export default function CreateOrderModal() { ... }
export default function CustomerDetailsModal() { ... }
export default function StatsCard({ title, value, icon }) { ... }
```

**Component Props**: camelCase
```javascript
function OrderCard({ orderId, customerName, totalPrice, onSelect }) {
  // ...
}
```

---

## Component Architecture

### Component Types

#### 1. Page Components

Located in `/src/pages`, mapped to routes.

**Characteristics**:
- Top-level components rendered by React Router
- Handle data fetching via `useData` hook
- Contain page-specific business logic
- Compose smaller components

**Example**:
```javascript
// src/pages/Customers.jsx
import React, { useMemo, useState } from 'react';
import { useData } from '../contexts/DataContext';
import { calculateRFMScore } from '../utils/rfm';
import CustomerDetailsModal from '../components/Customers/CustomerDetailsModal';

export default function Customers() {
  const { customers, orders } = useData();
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const enrichedCustomers = useMemo(() => {
    return customers.map(customer => {
      const customerOrders = orders.filter(o => o.customer.phone === customer.phone);
      const rfm = calculateRFMScore(customer, customers);
      return { ...customer, orders: customerOrders, rfm };
    });
  }, [customers, orders]);

  return (
    <div className="customers-page">
      {/* Page content */}
    </div>
  );
}
```

**Best Practices**:
- Keep page components focused on data orchestration
- Extract complex UI into separate components
- Use `useMemo` for expensive calculations
- Handle loading and error states

#### 2. Layout Components

Located in `/src/components/Layout`.

**Purpose**: Define application structure and navigation.

**Example**:
```javascript
// src/components/Layout/MainLayout.jsx
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

export default function MainLayout() {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 overflow-auto">
          <Outlet /> {/* Nested route content */}
        </main>
      </div>
    </div>
  );
}
```

#### 3. Feature Components

Located in `/src/components/[Feature]`.

**Purpose**: Components specific to a feature (Orders, Customers, Dashboard).

**Characteristics**:
- Receive data via props
- Handle feature-specific UI logic
- May use local state
- Reusable within the feature

**Example**:
```javascript
// src/components/Orders/CreateOrderModal.jsx
export default function CreateOrderModal({ isOpen, onClose, onOrderCreated }) {
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});

  const handleSubmit = async () => {
    // Validation
    if (!validateForm(formData)) {
      setErrors(validationErrors);
      return;
    }

    // Submit to Firebase
    await createOrder(formData);
    onOrderCreated();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      {/* Form content */}
    </Modal>
  );
}
```

#### 4. Common Components

Located in `/src/components/Common`.

**Purpose**: Shared UI components used across multiple features.

**Characteristics**:
- Highly reusable
- Minimal business logic
- Props-driven behavior
- Well-documented props

**Example**:
```javascript
// src/components/Common/LoadingSpinner.jsx
export default function LoadingSpinner({ size = 'md', text = 'Loading...' }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <div className="flex flex-col items-center justify-center">
      <div className={`animate-spin ${sizeClasses[size]}`}>
        {/* Spinner icon */}
      </div>
      {text && <p className="mt-2 text-gray-600">{text}</p>}
    </div>
  );
}
```

### Component Guidelines

#### Single Responsibility Principle

Each component should have one clear purpose.

**Good**:
```javascript
// Separate components for different responsibilities
<CustomerList customers={customers} onSelect={setSelectedCustomer} />
<CustomerDetailsModal customer={selectedCustomer} onClose={closeModal} />
<CustomerFilters onFilterChange={handleFilterChange} />
```

**Bad**:
```javascript
// One massive component doing everything
<CustomerManagement />
```

#### Component Size

**Guideline**: Keep components under 300 lines. If larger, extract sub-components.

**Example Refactoring**:
```javascript
// Before: 500-line CreateOrderModal.jsx
export default function CreateOrderModal() {
  // Customer selection UI (100 lines)
  // Product selection UI (150 lines)
  // Price calculation UI (100 lines)
  // Delivery options UI (100 lines)
  // Form submission logic (50 lines)
}

// After: Extracted sub-components
export default function CreateOrderModal() {
  return (
    <Modal>
      <CustomerSelector value={customer} onChange={setCustomer} />
      <ProductSelector items={items} onChange={setItems} />
      <PriceCalculator items={items} fees={fees} onChange={setTotal} />
      <DeliveryOptions value={delivery} onChange={setDelivery} />
      <OrderSummary data={orderData} onSubmit={handleSubmit} />
    </Modal>
  );
}
```

#### Props Interface

Always document expected props for complex components.

**Example**:
```javascript
/**
 * CustomerDetailsModal
 *
 * Displays comprehensive customer information including RFM analytics.
 *
 * @param {Object} customer - Customer object
 * @param {string} customer.id - Unique customer ID
 * @param {string} customer.name - Customer name
 * @param {string} customer.phone - Customer phone number
 * @param {Object} customer.rfm - RFM scores
 * @param {Array} customer.orders - Customer order history
 * @param {boolean} isOpen - Modal visibility state
 * @param {Function} onClose - Close handler
 */
export default function CustomerDetailsModal({ customer, isOpen, onClose }) {
  // ...
}
```

---

## State Management

### Context API Pattern

The Butter Bake uses React Context API for global state management.

#### Context Structure

**DataContext** - Application data
```javascript
// src/contexts/DataContext.jsx
export const DataProvider = ({ children }) => {
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Firebase listeners
  }, []);

  return (
    <DataContext.Provider value={{ orders, customers, products, loading }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => useContext(DataContext);
```

**AuthContext** - Authentication state
```javascript
// src/contexts/AuthContext.jsx
export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  return (
    <AuthContext.Provider value={{ isAuthenticated, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
```

#### Context Best Practices

1. **Separate Concerns**: One context per domain (Data, Auth, Toast)
2. **Custom Hooks**: Export `useContextName()` hook for each context
3. **Minimal Re-renders**: Only provide values that change together
4. **Performance**: Use `useMemo` for computed values in context

**Example**:
```javascript
// Bad: Everything in one context
<AppContext.Provider value={{ orders, customers, products, user, theme, ...}} >

// Good: Separate contexts by domain
<AuthProvider>
  <DataProvider>
    <ToastProvider>
      <App />
    </ToastProvider>
  </DataProvider>
</AuthProvider>
```

### Local State

Use `useState` for component-specific state.

**When to use local state**:
- Form inputs
- Modal visibility
- UI state (expanded, selected)
- Temporary data (search query, filters)

**Example**:
```javascript
export default function OrderList() {
  const { orders } = useData(); // Global state
  const [searchQuery, setSearchQuery] = useState(''); // Local state
  const [selectedOrder, setSelectedOrder] = useState(null); // Local state
  const [isModalOpen, setIsModalOpen] = useState(false); // Local state

  const filteredOrders = useMemo(() =>
    orders.filter(o => o.customer.name.includes(searchQuery)),
    [orders, searchQuery]
  );

  return (
    <>
      <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
      <OrderTable orders={filteredOrders} onSelect={setSelectedOrder} />
      {isModalOpen && <OrderDetailsModal order={selectedOrder} />}
    </>
  );
}
```

### Performance Optimization with useMemo

Use `useMemo` for expensive calculations that depend on specific inputs.

**Pattern**:
```javascript
const enrichedCustomers = useMemo(() => {
  return customers.map(customer => {
    const customerOrders = orders.filter(o => o.customer.phone === customer.phone);
    const totalSpent = customerOrders.reduce((sum, o) => sum + o.rawPrice, 0);
    const rfm = calculateRFMScore(customer, customers);

    return {
      ...customer,
      orders: customerOrders.length,
      totalSpent,
      rfm
    };
  });
}, [customers, orders]); // Only recalculate when customers or orders change
```

**Guidelines**:
- Use for calculations involving loops, filters, sorts
- Specify exact dependencies
- Don't overuse - simple operations don't need memoization

---

## Data Flow Patterns

### Firebase Integration

#### Real-Time Data Subscription

**Pattern**:
```javascript
useEffect(() => {
  const ordersRef = ref(database, 'orders');

  const unsubscribe = onValue(ordersRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      const ordersList = Object.keys(data).map(key => ({
        id: key,
        ...processOrderData(data[key])
      }));
      setOrders(ordersList);
    }
  });

  return () => unsubscribe(); // Cleanup on unmount
}, []);
```

**Key Points**:
- Subscribe once in context
- Always clean up listeners
- Transform data to application format
- Handle null/undefined data

#### Data Transformation

Transform Firebase data to consistent format:

**Before** (Firebase):
```json
{
  "order_123": {
    "customer": { "name": "John", "phone": "0912345678" },
    "cakes": [{ "name": "Cake", "amount": 2, "price": 50000 }],
    "orderDate": 756820800,
    "state": "Hoàn thành"
  }
}
```

**After** (Application):
```javascript
{
  id: "order_123",
  customer: { name: "John", phone: "+84912345678" },
  items: [{ name: "Cake", amount: 2, price: 50000 }],
  timeline: {
    ordered: { date: "25 Nov", time: "14:30" },
    received: { date: "26 Nov", time: "08:00", raw: Date }
  },
  date: "2025-11-26",
  price: "100,000 VND",
  rawPrice: 100000,
  status: "Completed"
}
```

#### Writing Data to Firebase

**Pattern**:
```javascript
import { ref, push, set } from 'firebase/database';

const createOrder = async (orderData) => {
  try {
    const ordersRef = ref(database, 'orders');
    const newOrderRef = push(ordersRef);
    await set(newOrderRef, {
      ...orderData,
      createDate: Date.now() / 1000, // Unix timestamp in seconds
      state: 'pending'
    });
    return newOrderRef.key; // Return generated ID
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
};
```

### Props Drilling vs Context

**Use props** when:
- Data is only needed by 1-2 child components
- Parent-child relationship is clear
- Data changes frequently (avoid unnecessary re-renders)

**Use context** when:
- Data is needed by many components at different levels
- Data is global (user auth, theme, app data)
- Avoids prop drilling through 3+ levels

**Example**:
```javascript
// Good: Props for immediate children
<OrderList>
  <OrderCard order={order} onSelect={handleSelect} />
</OrderList>

// Good: Context for deep nesting
function DeepNestedComponent() {
  const { orders } = useData(); // Accessed deep in tree
}
```

---

## Styling Guidelines

### Tailwind CSS

The Butter Bake uses Tailwind CSS for styling.

#### Utility-First Approach

**Pattern**:
```javascript
<div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
  <h2 className="text-xl font-semibold text-gray-800">Title</h2>
  <button className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark">
    Action
  </button>
</div>
```

#### Custom Colors

Use theme colors defined in `tailwind.config.js`:

```javascript
// Primary colors (bakery green)
bg-primary
text-primary
border-primary
bg-primary-light
bg-primary-dark

// Bakery theme
bg-bakery-bg       // #FFFBF2 (cream)
text-bakery-text   // #4A3B32 (brown)
bg-bakery-accent   // #E89F45 (golden)
```

#### Responsive Design

Mobile-first approach with breakpoints:

```javascript
// Default: Mobile (<640px)
<div className="p-2">

// Tablet (≥768px)
<div className="p-2 md:p-4">

// Desktop (≥1024px)
<div className="p-2 md:p-4 lg:p-6">

// Large Desktop (≥1280px)
<div className="p-2 md:p-4 lg:p-6 xl:p-8">
```

**Breakpoints**:
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1536px

#### Component-Specific Styles

For complex styles, use separate CSS files:

```javascript
// src/styles/Toast.css
.toast-container {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 9999;
}

.toast-enter {
  transform: translateX(100%);
  opacity: 0;
}

.toast-enter-active {
  transform: translateX(0);
  opacity: 1;
  transition: all 300ms ease;
}
```

#### Class Name Organization

Order classes logically:

```javascript
// Layout → Spacing → Sizing → Colors → Typography → States
<div className="
  flex items-center justify-between
  p-4 m-2
  w-full h-auto
  bg-white text-gray-800
  font-semibold text-lg
  hover:bg-gray-50 focus:ring-2
">
```

---

## Code Quality

### ESLint Configuration

The project uses ESLint for code quality enforcement.

**Rules** (`eslint.config.js`):
- React plugin (JSX rules)
- React Hooks plugin (hooks dependencies)
- React Refresh plugin (HMR compatibility)

**Run linting**:
```bash
npm run lint
```

### Code Formatting

**Indentation**: 2 spaces
**Quotes**: Single quotes for strings
**Semicolons**: Required
**Line Length**: 100 characters (soft limit)

**Example**:
```javascript
// Good
const greeting = 'Hello';
const sum = (a, b) => a + b;

// Bad
const greeting = "Hello"
const sum = (a, b) => a + b
```

### Import Organization

Order imports by type:

```javascript
// 1. React and React ecosystem
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

// 2. Third-party libraries
import { Loader2, Plus, Filter } from 'lucide-react';

// 3. Context and hooks
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';

// 4. Components
import CustomerDetailsModal from '../components/Customers/CustomerDetailsModal';
import LoadingSpinner from '../components/Common/LoadingSpinner';

// 5. Utilities and helpers
import { calculateRFMScore } from '../utils/rfm';
import { formatDate } from '../utils/dateHelpers';

// 6. Styles
import './Customers.css';
```

### Comments

#### When to Comment

**Do comment**:
- Complex algorithms (e.g., RFM calculation)
- Business logic that isn't obvious
- Workarounds for bugs
- Important decisions ("why" not "what")

**Don't comment**:
- Self-explanatory code
- Redundant explanations

**Examples**:

**Good**:
```javascript
// Calculate percentile rank for monetary score
// Customers are sorted descending by spending, so lower index = higher spending
const percentile = index / sorted.length;
```

**Bad**:
```javascript
// Set the customer name
setCustomerName(name);
```

#### Function Documentation

Document complex functions:

```javascript
/**
 * Calculate RFM (Recency, Frequency, Monetary) score for a customer
 *
 * Recency: Days since last order (1-5, 5=most recent)
 * Frequency: Total lifetime orders (1-5, 5=most frequent)
 * Monetary: Spending percentile (1-5, 5=top 20%)
 *
 * @param {Object} customer - Customer with orders, totalSpent, rawLastOrder
 * @param {Array} allCustomers - All customers for percentile calculation
 * @returns {Object} { R, F, M, total, pattern, segment }
 */
export const calculateRFMScore = (customer, allCustomers) => {
  // Implementation...
};
```

---

## Performance Best Practices

### React Performance

#### 1. Use useMemo for Expensive Calculations

```javascript
// Expensive: Runs on every render
const enrichedCustomers = customers.map(c => ({
  ...c,
  rfm: calculateRFMScore(c, customers)
}));

// Optimized: Only recalculates when dependencies change
const enrichedCustomers = useMemo(() =>
  customers.map(c => ({
    ...c,
    rfm: calculateRFMScore(c, customers)
  })),
  [customers]
);
```

#### 2. Avoid Inline Function Definitions in JSX

```javascript
// Bad: Creates new function on every render
<button onClick={() => handleClick(item.id)}>Click</button>

// Good: Use callback with proper binding
const handleItemClick = useCallback((id) => {
  handleClick(id);
}, [handleClick]);

<button onClick={() => handleItemClick(item.id)}>Click</button>
```

#### 3. Lazy Load Components

```javascript
import React, { lazy, Suspense } from 'react';

const HeavyComponent = lazy(() => import('./HeavyComponent'));

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <HeavyComponent />
    </Suspense>
  );
}
```

#### 4. Virtualize Long Lists

For lists with 100+ items, consider virtualization:

```javascript
import { FixedSizeList as List } from 'react-window';

<List
  height={600}
  itemCount={customers.length}
  itemSize={100}
  width="100%"
>
  {({ index, style }) => (
    <div style={style}>
      <CustomerCard customer={customers[index]} />
    </div>
  )}
</List>
```

### Firebase Performance

#### 1. Minimize Data Fetched

```javascript
// Bad: Fetch all orders every time
const ordersRef = ref(database, 'orders');

// Good: Fetch with query constraints
const recentOrdersRef = query(
  ref(database, 'orders'),
  orderByChild('orderDate'),
  limitToLast(100)
);
```

#### 2. Batch Writes

```javascript
import { ref, update } from 'firebase/database';

// Bad: Multiple writes
orders.forEach(order => {
  set(ref(database, `orders/${order.id}`), order);
});

// Good: Batch update
const updates = {};
orders.forEach(order => {
  updates[`orders/${order.id}`] = order;
});
await update(ref(database), updates);
```

---

## Error Handling

### Try-Catch for Async Operations

```javascript
const createOrder = async (orderData) => {
  try {
    const ordersRef = ref(database, 'orders');
    const newOrderRef = push(ordersRef);
    await set(newOrderRef, orderData);

    showToast('Order created successfully', 'success');
    return newOrderRef.key;
  } catch (error) {
    console.error('Error creating order:', error);
    showToast('Failed to create order. Please try again.', 'error');
    throw error; // Re-throw for upstream handling
  }
};
```

### Form Validation

```javascript
const validateOrderForm = (formData) => {
  const errors = {};

  if (!formData.customer?.name) {
    errors.customer = 'Customer name is required';
  }

  if (!formData.items || formData.items.length === 0) {
    errors.items = 'At least one item is required';
  }

  if (formData.deliveryDate && new Date(formData.deliveryDate) < new Date()) {
    errors.deliveryDate = 'Delivery date must be in the future';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};
```

### User-Friendly Error Messages

```javascript
// Bad
showToast(error.message, 'error');

// Good
const getUserFriendlyErrorMessage = (error) => {
  if (error.code === 'permission-denied') {
    return 'You do not have permission to perform this action.';
  }
  if (error.code === 'network-error') {
    return 'Network error. Please check your internet connection.';
  }
  return 'An unexpected error occurred. Please try again.';
};

showToast(getUserFriendlyErrorMessage(error), 'error');
```

---

## Documentation Standards

### README Files

Each major feature should have a README explaining its purpose.

**Example**:
```markdown
# Customer Analytics

This module implements RFM (Recency, Frequency, Monetary) analysis for customer segmentation.

## Features
- RFM score calculation
- 11-segment customer classification
- Customer lifetime value (CLV) estimation

## Usage
\`\`\`javascript
import { calculateRFMScore } from './utils/rfm';

const rfm = calculateRFMScore(customer, allCustomers);
// { R: 5, F: 4, M: 5, total: 14, segment: 'Champions' }
\`\`\`

## Segments
- Champions: R=5, F=5, M=5
- Loyal: R=5, F=4, M=4
- ...
```

### Inline Code Comments

Comment complex logic:

```javascript
// Parse CFAbsoluteTime (Apple's timestamp format)
// CFAbsoluteTime: seconds since 2001-01-01 00:00:00 UTC
// JavaScript Date: milliseconds since 1970-01-01 00:00:00 UTC
// Offset: 978307200 seconds (31 years difference)
const parseCFTime = (timestamp) => {
  return new Date((timestamp + 978307200) * 1000);
};
```

### API Documentation

Document utility functions:

```javascript
/**
 * Normalize Vietnamese phone number to international format
 *
 * Adds +84 country code and removes formatting characters
 *
 * @param {string} phone - Phone number in any format
 * @returns {string} Normalized phone number (e.g., "+84912345678")
 *
 * @example
 * normalizePhone("0912 345 678")  // "+84912345678"
 * normalizePhone("84912345678")   // "+84912345678"
 */
export const normalizePhone = (phone) => {
  // Implementation...
};
```

---

## Git Workflow

### Commit Messages

**Format**: `<type>: <description>`

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `refactor`: Code refactoring
- `style`: Code style changes (formatting)
- `docs`: Documentation updates
- `test`: Add/update tests
- `chore`: Build/config changes

**Examples**:
```
feat: add RFM customer segmentation
fix: correct order total calculation for percentage discounts
refactor: extract order form into separate components
docs: add API documentation for rfm.js
```

### Branch Naming

**Pattern**: `<type>/<short-description>`

**Examples**:
```
feature/rfm-analytics
bugfix/order-total-calculation
refactor/customer-modal-components
```

---

## Conclusion

Following these code standards ensures:
- Consistent codebase across all contributors
- Maintainable and scalable architecture
- High performance and code quality
- Easy onboarding for new developers

**Key Takeaways**:
1. Organize by feature, not type
2. Use Context API for global state
3. Leverage `useMemo` for performance
4. Follow Tailwind utility-first approach
5. Document complex logic
6. Handle errors gracefully

---

**Document Version**: 1.0
**Created**: 2025-12-04
**Author**: Technical Documentation Specialist
**Status**: Active
**Next Review**: Quarterly
