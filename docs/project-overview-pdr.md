# The Butter Bake - Project Overview & Product Development Requirements (PDR)

## Project Information

- **Project Name**: The Butter Bake (volatile-asteroid)
- **Project Type**: Bakery Management System & Customer Analytics Platform
- **Version**: 0.0.0 (Development)
- **Last Updated**: 2025-12-04
- **Repository**: /Users/mac/.gemini/antigravity/playground/volatile-asteroid

---

## Executive Summary

The Butter Bake is a comprehensive bakery management system designed to streamline operations for artisanal bakeries. The platform combines order management, customer analytics, pre-order functionality, and data synchronization into a unified dashboard. Built with modern web technologies, it provides real-time insights into business performance, customer behavior, and operational efficiency.

### Key Value Propositions

1. **Unified Order Management**: Single platform for managing both regular orders and pre-orders
2. **Customer Intelligence**: RFM (Recency, Frequency, Monetary) analytics for customer segmentation
3. **Data Synchronization**: Tools for cleaning and migrating legacy data from external systems
4. **Pre-Order Landing Page**: Customer-facing interface for placing pre-orders with AI-generated product images
5. **Business Analytics**: Real-time dashboard with revenue tracking, product statistics, and order trends

---

## Target Users

### Primary Users

1. **Bakery Owners/Managers**
   - Need comprehensive business insights
   - Manage customer relationships
   - Track revenue and product performance
   - Make data-driven business decisions

2. **Bakery Staff/Order Managers**
   - Process daily orders
   - Manage customer information
   - Handle pre-orders and delivery schedules
   - Generate invoices

3. **Customers (Pre-Order System)**
   - Browse bakery products
   - Place pre-orders for specific dates
   - View product descriptions and images
   - Select delivery time slots

### Secondary Users

4. **Data Administrators**
   - Migrate data from legacy systems
   - Clean and normalize customer/order data
   - Maintain data integrity

---

## Core Features & Functionality

### 1. Order Management System

**Purpose**: Centralized system for managing all bakery orders

**Features**:
- Create, view, edit, and track orders
- Customer information management
- Item selection with pricing
- Status tracking (Pending, Completed, Cancelled)
- Delivery scheduling with date and time slots
- Invoice generation with product images
- Advanced filtering by date, status, customer
- Order timeline tracking (ordered date vs received date)

**User Stories**:
- As a staff member, I want to create new orders quickly so I can process customer requests efficiently
- As a manager, I want to filter orders by date range so I can analyze daily/weekly performance
- As staff, I want to generate invoices with product images so customers have clear receipts

### 2. Pre-Order System

**Purpose**: Enable customers to place orders in advance for specific dates

**Features**:
- Customer-facing landing page
- Product catalog by category (Banana, Brownie, Bread, Canelé, Cookie, Croissant, etc.)
- AI-generated product images using Gemini API
- Category descriptions and product details
- Shopping cart functionality
- Checkout with delivery date/time selection
- Order confirmation
- Status tracking (Pending, Confirmed, Completed, Cancelled)

**User Stories**:
- As a customer, I want to browse products by category so I can find what I'm looking for
- As a customer, I want to select a delivery date and time so I can plan my schedule
- As staff, I want to view all pre-orders by date so I can prepare production schedules

### 3. Customer Analytics & RFM Segmentation

**Purpose**: Understand customer behavior and identify high-value customers

**Features**:
- RFM scoring (Recency, Frequency, Monetary)
- 11 customer segments: Champions, Loyal, Potential Loyalists, New Customers, Promising, Need Attention, About to Sleep, At Risk, Cannot Lose Them, Hibernating, Lost
- Customer lifetime value (CLV) calculation
- Activity status tracking
- Purchase pattern analysis
- Customer detail modal with comprehensive metrics
- Segment-based filtering and search
- Risk score calculation for churn prediction

**Metrics Tracked**:
- Total orders per customer
- Total spent
- Last order date
- Average order value
- Days since last order
- Purchase frequency
- Customer tenure

**User Stories**:
- As a manager, I want to identify my best customers so I can provide VIP treatment
- As a marketer, I want to segment customers by behavior so I can create targeted campaigns
- As staff, I want to see at-risk customers so I can proactively reach out

### 4. Business Analytics Dashboard

**Purpose**: Provide real-time insights into business performance

**Features**:
- Revenue overview (total, average per order)
- Order statistics (total, pending, completed, cancelled)
- Product performance tracking
- Recent orders list
- Revenue trend charts
- Product popularity rankings
- Daily/weekly/monthly filters
- Visual KPI cards

**User Stories**:
- As a manager, I want to see today's revenue so I can track daily performance
- As an owner, I want to identify best-selling products so I can optimize inventory
- As staff, I want to see recent orders at a glance so I can prioritize work

### 5. Data Synchronization Tools

**Purpose**: Migrate and clean data from legacy systems (iOS/Swift app to Firebase)

**Features**:
- Customer data import and validation
- Phone number format normalization
- Order key renaming (handling CFAbsoluteTime timestamps)
- Duplicate detection and cleanup
- Field mapping and transformation
- Data integrity checks
- Batch operations

**Technical Functions**:
- Phone format standardization (+84 prefix)
- CFAbsoluteTime to Unix timestamp conversion
- Customer field merging
- Order ID validation
- Data backup before operations

**User Stories**:
- As a data admin, I want to import customer data from the old system so I can maintain history
- As an admin, I want to clean duplicate records so the database stays organized
- As staff, I want reliable data so I can trust customer information

### 6. Product Management

**Purpose**: Maintain product catalog and pricing

**Features**:
- Product listing with names, types, descriptions
- Category organization
- Image management (AI-generated or uploaded)
- Price updates
- Product availability status

**User Stories**:
- As staff, I want to update product prices so they reflect current costs
- As a manager, I want to organize products by category so customers can browse easily

### 7. Authentication & Security

**Purpose**: Protect sensitive business data

**Features**:
- Login system with Firebase Authentication
- Protected routes (redirect to login if not authenticated)
- Password verification for sensitive operations
- Session management

**User Stories**:
- As a manager, I want secure access so unauthorized users cannot view business data
- As staff, I want to stay logged in during my shift so I don't have to re-authenticate constantly

---

## Technology Stack

### Frontend

- **Framework**: React 19.2.0
- **Build Tool**: Vite 7.2.4
- **Routing**: React Router DOM 7.9.6
- **Styling**: Tailwind CSS 4.1.17
- **Animations**: Framer Motion 12.23.24
- **Icons**: Lucide React 0.554.0
- **Charts**: Recharts 3.4.1
- **Image Generation**: html-to-image 1.11.13

### Backend

- **Database**: Firebase Realtime Database
- **Authentication**: Firebase Auth
- **Backend Server**: Express.js (Node.js)
- **API Proxy**: Vite dev server proxy

### Development Tools

- **Linting**: ESLint 9.39.1
- **CSS Processing**: PostCSS 8.5.6, Autoprefixer 10.4.22
- **Package Manager**: npm

### External APIs

- **Google Gemini API**: AI-powered product image generation

### Deployment

- **Build**: Vite static build
- **Hosting**: Static hosting (dist folder)
- **Backend**: Express server (port 3000)
- **Dev Server**: Vite dev server (port 3001)

---

## System Architecture Overview

### Architecture Pattern

**Client-Side Heavy Architecture** with Firebase backend

- **Frontend**: React SPA (Single Page Application)
- **State Management**: React Context API (DataContext, AuthContext, ToastContext)
- **Data Layer**: Firebase Realtime Database (real-time sync)
- **Authentication**: Firebase Authentication
- **API Layer**: Express server for static file serving and simple API endpoints

### Data Flow

```
Firebase Realtime DB (orders, preorders, customers, products)
    ↓ (Real-time subscriptions)
DataContext (React Context)
    ↓ (Provider)
Pages/Components (consume data via useData hook)
    ↓ (UI rendering)
User Interface
```

### Key Architectural Decisions

1. **Client-Side RFM Calculations**: All customer analytics computed in browser using useMemo for performance
2. **Real-Time Data Sync**: Firebase onValue listeners for live updates
3. **Context-Based State**: Global state managed via React Context (no Redux/Zustand)
4. **Lazy Loading**: Route-based code splitting, component-level lazy loading
5. **Optimistic UI**: Immediate UI updates with Firebase handling persistence

---

## Development Requirements

### Functional Requirements

#### FR-1: Order Management
- System must allow creating orders with customer info, items, pricing, and delivery schedule
- System must calculate order totals including shipping, fees, and discounts
- System must track order status lifecycle
- System must generate printable invoices

#### FR-2: Pre-Order System
- System must display customer-facing product catalog
- System must allow customers to add items to cart and checkout
- System must accept delivery date/time selection
- System must send pre-orders to Firebase for staff processing

#### FR-3: Customer Analytics
- System must calculate RFM scores for all customers
- System must segment customers into 11 predefined categories
- System must display customer metrics in detail modal
- System must allow filtering customers by segment

#### FR-4: Business Dashboard
- System must display real-time revenue and order statistics
- System must show product performance rankings
- System must visualize revenue trends over time
- System must allow date range filtering

#### FR-5: Data Synchronization
- System must import customer/order data from JSON backups
- System must normalize phone numbers and timestamps
- System must detect and handle duplicates
- System must validate data integrity before commits

#### FR-6: Authentication
- System must require login for admin dashboard access
- System must maintain user sessions
- System must redirect unauthenticated users to login
- System must allow logout functionality

### Non-Functional Requirements

#### NFR-1: Performance
- Page load time < 2 seconds on 4G connection
- RFM calculation for 500 customers < 500ms
- Real-time data updates within 1 second of Firebase change
- Smooth animations (60fps) on modern browsers

#### NFR-2: Usability
- Responsive design for desktop (1024px+), tablet (768px-1024px), mobile (<768px)
- Intuitive navigation with clear visual hierarchy
- Consistent UI patterns across all pages
- Accessible color contrast ratios (WCAG AA)

#### NFR-3: Reliability
- 99% uptime for Firebase services
- Graceful error handling with user-friendly messages
- Data validation before all database writes
- Automatic retry for failed network requests

#### NFR-4: Security
- Protected routes require authentication
- Password verification for destructive operations
- Firebase security rules enforce data access control
- No sensitive data in client-side code or console logs

#### NFR-5: Maintainability
- Modular component architecture
- Consistent code style (ESLint rules)
- Reusable utility functions
- Clear separation of concerns (components, contexts, utils, pages)

#### NFR-6: Scalability
- Client-side calculations acceptable for <1000 customers
- Firebase structure supports horizontal scaling
- Lazy loading for large datasets
- Pagination for order/customer lists

---

## Business Rules

### Order Business Rules

1. **Order Total Calculation**:
   - Subtotal = Sum of (item.price × item.amount)
   - Total = Subtotal + shipFee + otherFee - discount
   - Discount: If ≤100, treat as percentage; else treat as fixed amount

2. **Order Status Lifecycle**:
   - New orders default to "Pending"
   - Status changes: Pending → Completed or Pending → Cancelled
   - Completed orders cannot be edited (only viewed)
   - Cancelled orders remain in history for reporting

3. **Delivery Schedule**:
   - Order date (createDate): When customer placed order
   - Receive date (orderDate): When customer wants delivery
   - Time slots: Configurable (e.g., "08:00-10:00", "14:00-16:00", "Anytime")

### Customer Business Rules

1. **Customer Creation**:
   - Customers auto-created when first order is placed
   - Required fields: name, phone
   - Optional fields: email, address, socialLink

2. **RFM Scoring Rules**:
   - Recency (R): 5=0-7 days, 4=8-30 days, 3=31-90 days, 2=91-180 days, 1=181+ days
   - Frequency (F): 5=10+ orders, 4=6-9 orders, 3=3-5 orders, 2=2 orders, 1=1 order
   - Monetary (M): Percentile-based (5=top 20%, 4=20-40%, 3=40-60%, 2=60-80%, 1=bottom 20%)

3. **Customer Segmentation**:
   - Segment assignment based on RFM pattern (e.g., "555" = Champions)
   - 11 segments with specific business actions for each
   - Segment colors and icons for visual identification

### Pre-Order Business Rules

1. **Pre-Order Workflow**:
   - Customers select products and delivery date/time
   - Pre-orders submitted to Firebase /preorders collection
   - Staff reviews and confirms pre-orders
   - Status: Pending → Confirmed → Completed or Cancelled

2. **Product Availability**:
   - All products available by default
   - Category-based organization
   - AI-generated images fallback if no image provided

### Data Synchronization Business Rules

1. **Phone Number Format**:
   - Standardize to +84 prefix for Vietnamese numbers
   - Remove spaces, dashes, parentheses
   - Validate 10-digit format after country code

2. **Timestamp Conversion**:
   - Legacy system uses CFAbsoluteTime (seconds since 2001-01-01)
   - Convert to Unix timestamp: (CFTime + 978307200) × 1000
   - Store as milliseconds for JavaScript Date compatibility

3. **Data Validation**:
   - Check for duplicate customers (by phone number)
   - Validate order references to existing customers
   - Ensure all orders have valid status values

---

## Success Metrics

### Business KPIs

1. **Order Processing Efficiency**
   - Time to create new order: <2 minutes
   - Order error rate: <1%
   - Staff onboarding time: <1 hour

2. **Customer Engagement**
   - Pre-order adoption rate: >30% of customers
   - Repeat customer rate: >50%
   - Customer retention (90-day): >60%

3. **Business Growth**
   - Month-over-month revenue growth: Track
   - Average order value trend: Track
   - New customer acquisition: Track

### Technical Metrics

1. **Performance**
   - Page load time: <2 seconds
   - Time to interactive: <3 seconds
   - RFM calculation time: <500ms for 500 customers

2. **Reliability**
   - System uptime: >99%
   - Data sync success rate: >99.5%
   - Error recovery rate: 100%

3. **User Experience**
   - Mobile usability score: >90
   - Customer satisfaction with pre-order system: >4/5
   - Staff satisfaction with dashboard: >4/5

---

## Roadmap & Future Enhancements

### Phase 1: Foundation (Completed)
- ✅ Order management system
- ✅ Customer database
- ✅ Basic dashboard
- ✅ Authentication system

### Phase 2: Analytics & Pre-Orders (Completed)
- ✅ RFM customer analytics
- ✅ Customer segmentation
- ✅ Pre-order landing page
- ✅ Data synchronization tools

### Phase 3: Advanced Features (Planned)
- [ ] Inventory management
- [ ] Supplier management
- [ ] Production scheduling
- [ ] Staff management and roles
- [ ] Email/SMS notifications
- [ ] Customer loyalty program
- [ ] Mobile app (React Native)

### Phase 4: Business Intelligence (Planned)
- [ ] Advanced predictive analytics
- [ ] Cohort analysis
- [ ] Customer lifetime value forecasting
- [ ] Churn prediction with ML
- [ ] Automated marketing campaigns
- [ ] A/B testing framework

### Phase 5: Integration & Automation (Planned)
- [ ] Payment gateway integration
- [ ] Accounting software sync (QuickBooks, Xero)
- [ ] Social media integration
- [ ] WhatsApp/Zalo order notifications
- [ ] Automated inventory alerts
- [ ] Third-party delivery integration

---

## Risk Assessment

### Technical Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Firebase costs exceed budget | High | Medium | Implement caching, optimize queries, monitor usage |
| Client-side performance degradation with >1000 customers | High | Medium | Migrate to server-side analytics, implement pagination |
| Data loss during synchronization | High | Low | Mandatory backups, transaction-based writes, validation |
| Browser compatibility issues | Medium | Low | Use standard APIs, polyfills, cross-browser testing |

### Business Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Low user adoption | High | Medium | User training, intuitive UI, staff feedback loops |
| Data migration errors | High | Low | Thorough testing, staged rollout, backup/rollback plan |
| Competitor with similar features | Medium | Medium | Focus on bakery-specific features, customer relationships |
| Feature scope creep | Medium | High | Strict phase boundaries, prioritization framework |

---

## Compliance & Standards

### Data Privacy

- **Customer Data**: Stored securely in Firebase with access controls
- **Personal Information**: Limited collection (name, phone, email, address)
- **Data Retention**: No automatic deletion (business requirement)
- **Data Export**: Customers can request their data (manual process)

### Accessibility

- **WCAG 2.1 Level AA**: Target compliance
- **Keyboard Navigation**: All interactive elements accessible
- **Screen Reader Support**: Semantic HTML, ARIA labels where needed
- **Color Contrast**: 4.5:1 minimum for text

### Code Quality

- **ESLint**: Enforced coding standards
- **Component Structure**: Modular, reusable components
- **Git Workflow**: Feature branches, meaningful commits
- **Documentation**: Inline comments for complex logic

---

## Glossary

- **CFAbsoluteTime**: Apple's time format (seconds since 2001-01-01 00:00:00 UTC)
- **RFM**: Recency, Frequency, Monetary - customer segmentation methodology
- **CLV**: Customer Lifetime Value - predicted total revenue from a customer
- **Pre-Order**: Order placed in advance for future delivery date
- **Firebase**: Google's Backend-as-a-Service (BaaS) platform
- **SPA**: Single Page Application
- **VND**: Vietnamese Dong (currency)

---

## Document Version

- **Version**: 1.0
- **Created**: 2025-12-04
- **Author**: Technical Documentation Specialist
- **Status**: Active
- **Next Review**: Quarterly or upon major feature release
