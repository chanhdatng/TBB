# The Butter Bake - Bakery Management System

A comprehensive bakery management system with customer analytics, order management, and pre-order functionality. Built with React and Firebase for real-time data synchronization.

![Version](https://img.shields.io/badge/version-0.0.0-blue)
![React](https://img.shields.io/badge/React-19.2.0-61DAFB?logo=react)
![Firebase](https://img.shields.io/badge/Firebase-12.6.0-FFCA28?logo=firebase)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.1.17-38B2AC?logo=tailwind-css)

---

## Features

### Core Features

- **Order Management**: Create, track, and manage bakery orders with full customer and product details
- **Pre-Order System**: Customer-facing landing page for placing advance orders with AI-generated product images
- **Customer Analytics**: RFM (Recency, Frequency, Monetary) segmentation with 11 customer segments
- **Business Dashboard**: Real-time revenue tracking, product statistics, and order analytics
- **Data Synchronization**: Tools for migrating and cleaning legacy data from external systems
- **Invoice Generation**: Printable invoices with product images and order details

### Advanced Features

- **Real-Time Updates**: Firebase Realtime Database for live data synchronization
- **Customer Segmentation**: Champions, Loyal, Potential Loyalists, New Customers, Promising, Need Attention, About to Sleep, At Risk, Cannot Lose Them, Hibernating, Lost
- **AI Image Generation**: Google Gemini API for professional bakery product images
- **Responsive Design**: Mobile-first design with Tailwind CSS
- **Authentication**: Firebase Authentication with protected routes

---

## Quick Start

### Prerequisites

- Node.js 16+ and npm
- Firebase account with Realtime Database enabled
- Google Gemini API key (optional, for image generation)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd volatile-asteroid
   ```

2. **Install dependencies**
   ```bash
   npm install
   cd backend && npm install && cd ..
   ```

3. **Configure Firebase**

   Create a `.env` file in the root directory:
   ```env
   REACT_APP_FIREBASE_API_KEY=your_api_key
   REACT_APP_FIREBASE_AUTH_DOMAIN=your_auth_domain
   REACT_APP_FIREBASE_DATABASE_URL=your_database_url
   REACT_APP_FIREBASE_PROJECT_ID=your_project_id
   REACT_APP_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   REACT_APP_FIREBASE_APP_ID=your_app_id
   REACT_APP_GEMINI_API_KEY=your_gemini_api_key
   ```

4. **Start development servers**

   Terminal 1 (Frontend):
   ```bash
   npm run dev
   ```

   Terminal 2 (Backend):
   ```bash
   cd backend
   node server.js
   ```

5. **Access the application**
   - Frontend: http://localhost:3001
   - Backend API: http://localhost:3000

---

## Project Structure

```
volatile-asteroid/
├── docs/                      # Documentation
│   ├── project-overview-pdr.md
│   ├── codebase-summary.md
│   ├── code-standards.md
│   └── system-architecture.md
├── src/
│   ├── components/           # React components
│   │   ├── Common/          # Reusable UI components
│   │   ├── Customers/       # Customer management
│   │   ├── Dashboard/       # Dashboard widgets
│   │   ├── DataSync/        # Data synchronization
│   │   ├── Layout/          # Layout components
│   │   └── Orders/          # Order management
│   ├── contexts/            # React Context providers
│   │   ├── AuthContext.jsx
│   │   ├── DataContext.jsx
│   │   └── ToastContext.jsx
│   ├── pages/               # Page components (routes)
│   │   ├── Dashboard.jsx
│   │   ├── Orders.jsx
│   │   ├── PreOrders.jsx
│   │   ├── PreorderLanding.jsx
│   │   ├── Customers.jsx
│   │   ├── Products.jsx
│   │   ├── Analytics.jsx
│   │   ├── DataSync.jsx
│   │   ├── Login.jsx
│   │   └── Settings.jsx
│   ├── utils/               # Utility functions
│   │   ├── rfm.js          # RFM analytics
│   │   ├── imageGenerator.js
│   │   ├── animations.js
│   │   └── clipboard.js
│   ├── data/                # Static data
│   ├── styles/              # CSS files
│   ├── App.jsx              # Root component
│   ├── main.jsx             # Entry point
│   └── firebase.js          # Firebase config
├── backend/
│   └── server.js            # Express server
├── public/                  # Static assets
├── package.json
├── vite.config.js
└── tailwind.config.js
```

---

## Technology Stack

### Frontend
- **React 19.2.0** - UI framework
- **React Router DOM 7.9.6** - Routing
- **Tailwind CSS 4.1.17** - Styling
- **Framer Motion 12.23.24** - Animations
- **Lucide React 0.554.0** - Icons
- **Recharts 3.4.1** - Charts and data visualization

### Backend
- **Firebase Realtime Database** - Data storage
- **Firebase Authentication** - User authentication
- **Express.js** - Static file server
- **Google Gemini API** - AI image generation

### Build Tools
- **Vite 7.2.4** - Build tool and dev server
- **ESLint 9.39.1** - Code linting
- **PostCSS 8.5.6** - CSS processing

---

## Available Scripts

### Development
```bash
npm run dev       # Start Vite dev server (port 3001)
npm run lint      # Run ESLint
```

### Production
```bash
npm run build     # Build for production
npm run preview   # Preview production build
```

### Backend
```bash
cd backend && node server.js   # Start Express server (port 3000)
```

---

## Key Features in Detail

### 1. Order Management

- Create orders with customer information, product selection, and delivery scheduling
- Track order status (Pending, Completed, Cancelled)
- Calculate totals with shipping, fees, and discounts
- Generate printable invoices with product images
- Advanced filtering by date, status, and customer

### 2. Customer Analytics (RFM)

**RFM Scoring**:
- **Recency (R)**: Days since last order (1-5 scale)
- **Frequency (F)**: Total lifetime orders (1-5 scale)
- **Monetary (M)**: Spending percentile (1-5 scale)

**Customer Segments**:
- **Champions** (555, 554, 544, 545): Best customers
- **Loyal** (543, 444, 435, etc.): Regular high-value customers
- **At Risk** (255, 254, 245, etc.): Were valuable, now inactive
- **Lost** (111, 112, 121, etc.): Inactive with low value
- ...and 7 more segments

### 3. Pre-Order System

- Customer-facing landing page with product catalog
- Categories: Banana, Brownie, Bread, Canelé, Cookie, Croissant, Shiopan, Roll, CheeseBurn
- AI-generated product images using Google Gemini API
- Shopping cart and checkout flow
- Delivery date and time slot selection

### 4. Data Synchronization

Tools for migrating data from legacy systems (iOS/Swift app):
- Phone number normalization (+84 format)
- CFAbsoluteTime to Unix timestamp conversion
- Customer data cleanup and deduplication
- Order key renaming and validation

---

## Development Workflow

### 1. Authentication Flow

```
User → Login Page → Firebase Auth → Dashboard (Protected)
```

### 2. Data Flow

```
Firebase Realtime DB
    ↓ (Real-time listeners)
DataContext (React Context)
    ↓ (Provider)
Pages/Components (useData hook)
    ↓ (UI rendering)
User Interface
```

### 3. RFM Calculation Flow

```
Customers + Orders
    ↓ (useMemo)
Calculate metrics (total orders, total spent, last order)
    ↓
Calculate RFM scores (R, F, M)
    ↓
Assign customer segment
    ↓
Display in UI with badges and filters
```

---

## Firebase Database Structure

```
firebase-database/
├── orders/
│   └── order_id
│       ├── customer: { name, phone, address, socialLink }
│       ├── cakes: [ { name, amount, price } ]
│       ├── orderDate: CFAbsoluteTime
│       ├── createDate: CFAbsoluteTime
│       ├── state: string
│       └── ...
├── preorders/
│   └── preorder_id
│       ├── customerName, phone, address
│       ├── items: [ { name, amount, price } ]
│       ├── deliveryDate, deliveryTime
│       └── state: "pending" | "confirmed" | "completed" | "cancelled"
├── newCustomers/
│   └── customer_id
│       ├── name, phone, email
│       ├── address, socialLink
│       └── createDate
└── cakes/
    └── product_id
        ├── name, type, description
        ├── price
        └── image
```

---

## Configuration

### Tailwind CSS Theme

Custom colors for bakery aesthetic:
```javascript
colors: {
  'bakery-bg': '#FFFBF2',      // Cream background
  'bakery-accent': '#E89F45',  // Golden accent
  'bakery-text': '#4A3B32',    // Brown text
  primary: {
    DEFAULT: '#0F5132',        // Bakery green
    light: '#198754',
    dark: '#0B3D26',
  },
}
```

### Vite Configuration

- Dev server: Port 3001
- API proxy: `/api` → `http://localhost:3000`
- Code splitting: vendor, firebase, framer-motion, charts

---

## Performance Considerations

### Client-Side Performance

**RFM Calculation**:
- Complexity: O(n log n)
- Acceptable for <1,000 customers
- Uses `useMemo` for optimization

**Recommendations**:
- 0-500 customers: Excellent performance (<500ms)
- 500-1,000 customers: Acceptable (500-1,500ms)
- 1,000+ customers: Consider server-side calculation

### Optimization Strategies

1. **Code Splitting**: Separate chunks for vendor, firebase, animations, charts
2. **Lazy Loading**: Route-based code splitting
3. **Memoization**: `useMemo` for expensive calculations
4. **Pagination**: 10/25/50/100 items per page
5. **Real-Time Updates**: Only changed data triggers re-render

---

## Deployment

### Build for Production

```bash
npm run build
```

Output: `/dist` directory with static files

### Hosting Options

1. **Firebase Hosting** (Recommended)
   ```bash
   npm install -g firebase-tools
   firebase init hosting
   firebase deploy
   ```

2. **Vercel/Netlify**
   - Connect GitHub repository
   - Auto-deploy on push

3. **Custom Server**
   - Use Express to serve `/dist`
   - Configure reverse proxy (Nginx)

---

## Documentation

Comprehensive documentation is available in the `/docs` directory:

- **[Project Overview & PDR](docs/project-overview-pdr.md)**: Project goals, features, requirements, and business rules
- **[Codebase Summary](docs/codebase-summary.md)**: Directory structure, key modules, data flow, and dependencies
- **[Code Standards](docs/code-standards.md)**: Naming conventions, component patterns, and best practices
- **[System Architecture](docs/system-architecture.md)**: Architecture diagrams, state management, and scalability

---

## Contributing

### Code Standards

- **File Naming**: PascalCase for React components (`.jsx`), camelCase for utilities (`.js`)
- **Component Structure**: Feature-based organization
- **State Management**: React Context API for global state, `useState` for local state
- **Styling**: Tailwind CSS utility-first approach
- **Linting**: ESLint with React plugins

### Git Workflow

**Commit Message Format**: `<type>: <description>`

Types: `feat`, `fix`, `refactor`, `style`, `docs`, `test`, `chore`

**Example**:
```
feat: add customer segment filtering
fix: correct order total calculation
docs: update README with deployment instructions
```

---

## Roadmap

### Phase 3: Advanced Features (Planned)
- [ ] Inventory management
- [ ] Supplier management
- [ ] Production scheduling
- [ ] Staff roles and permissions
- [ ] Email/SMS notifications
- [ ] Customer loyalty program

### Phase 4: Business Intelligence (Planned)
- [ ] Predictive analytics
- [ ] Cohort analysis
- [ ] Churn prediction with ML
- [ ] Automated marketing campaigns

### Phase 5: Integration & Automation (Planned)
- [ ] Payment gateway integration
- [ ] Accounting software sync
- [ ] WhatsApp/Zalo notifications
- [ ] Third-party delivery integration

---

## Troubleshooting

### Common Issues

**Issue**: Firebase connection error
- **Solution**: Check Firebase config in `.env` file and ensure Realtime Database is enabled

**Issue**: RFM calculation slow
- **Solution**: Check customer count. Consider pagination or server-side calculation for >1,000 customers

**Issue**: Images not generating
- **Solution**: Verify Gemini API key in `.env` and check API quota

**Issue**: Hot module reload not working
- **Solution**: Restart Vite dev server with `npm run dev`

---

## License

This project is proprietary software. All rights reserved.

---

## Support

For questions, issues, or feature requests:
- Check documentation in `/docs`
- Review codebase comments
- Contact the development team

---

## Acknowledgments

- **Firebase**: Backend infrastructure
- **Google Gemini API**: AI image generation
- **Recharts**: Data visualization
- **Lucide**: Icon library
- **Tailwind CSS**: Styling framework

---

**Last Updated**: 2025-12-04
**Version**: 0.0.0
**Status**: Active Development
