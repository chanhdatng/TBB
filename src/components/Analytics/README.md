# Analytics Components

This directory contains React components for displaying production analytics and metrics in the ButterBake Cake Shop Management System.

## Components Overview

### Core Components

#### 1. ProductionOverviewCards
Displays key production metrics with growth indicators.
- **Props**:
  - `productionMetrics` (Object): Production metrics data
  - `previousMetrics` (Object): Previous period metrics for comparison
  - `growthRates` (Object): Growth rate percentages
  - `loading` (boolean): Loading state

#### 2. DailyProductionChart
Visualizes daily production using Recharts bar chart.
- **Props**:
  - `data` (Array): Daily production data
  - `height` (number): Chart height (default: 300)
  - `loading` (boolean): Loading state

#### 3. TimeSlotDistribution
Shows production distribution across time slots.
- **Props**:
  - `data` (Object): Time slot distribution data
  - `height` (number): Chart height (default: 400)
  - `loading` (boolean): Loading state

#### 4. ProductComparisonTable
Sortable table comparing product production metrics.
- **Props**:
  - `data` (Object): Product production data
  - `loading` (boolean): Loading state

#### 5. TimeSlotHeatmap (Optional)
Interactive heatmap showing production by time and product.
- **Props**:
  - `orders` (Array): Order data for heatmap
  - `height` (number): Heatmap height (default: 400)
  - `loading` (boolean): Loading state

#### 6. ExportButton
Export analytics data to CSV format.
- **Props**:
  - `productionMetrics` (Object): Production metrics to export
  - `timeRange` (string): Current time range filter
  - `disabled` (boolean): Disable export button

#### 7. GrowthIndicator
Reusable component for displaying growth percentages.
- **Props**:
  - `value` (number): Growth percentage value
  - `showIcon` (boolean): Show up/down arrow (default: true)
  - `className` (string): Additional CSS classes
  - `size` (string): 'sm', 'md', or 'lg' (default: 'md')
  - `format` (string): 'percentage' or 'number' (default: 'percentage')

#### 8. ErrorBoundary
Error boundary component for catching and displaying errors.
- Wraps components to prevent crashes
- Shows error details in development mode
- Provides retry functionality

## Utility Functions

### productionAnalytics.js
Core utilities for processing order data and calculating metrics:
- `createProductionMetrics(orders, timeRange)`: Main function for calculating production metrics
- `parseTimeSlot(timeSlot)`: Normalizes time slot formats
- `categorizeTimeSlot(timeSlot)`: Groups time slots into categories
- `calculateDailyProduction(orders, days)`: Calculates daily production data
- `analyzeTimeSlots(orders)`: Analyzes time slot distribution
- `calculateGrowthRates(current, previous)`: Computes growth percentages
- `getPreviousPeriodData(orders, timeRange)`: Gets previous period for comparison

### exportAnalytics.js
Export utilities for CSV functionality:
- `exportProductionMetrics(metrics, timeRange, date)`: Export production summary
- `exportProductComparison(products, timeRange, date)`: Export product data
- `exportTimeSlotAnalysis(slots, timeRange, date)`: Export time slot data
- `exportAllAnalytics(data, timeRange, date)`: Export all data in one file

## Data Structure

### Production Metrics Object
```javascript
{
  totalProduction: number,
  dailyProduction: { [date]: number },
  timeSlotDistribution: { [timeSlot]: number },
  productProduction: {
    [productName]: {
      total: number,
      orders: number,
      timeSlots: { [timeSlot]: number }
    }
  },
  summary: {
    today: number,
    thisWeek: number,
    thisMonth: number,
    averagePerDay: number
  }
}
```

## Usage Example

```jsx
import {
  ProductionOverviewCards,
  DailyProductionChart,
  TimeSlotDistribution,
  ProductComparisonTable,
  ExportButton,
  ErrorBoundary
} from './Analytics';

// In your component:
<ErrorBoundary>
  <ProductionOverviewCards
    productionMetrics={metrics}
    previousMetrics={previous}
    growthRates={growth}
    loading={loading}
  />

  <ExportButton
    productionMetrics={metrics}
    timeRange={timeRange}
    disabled={!metrics}
  />
</ErrorBoundary>
```

## Performance Considerations

1. **Memoization**: Components use React.memo and useMemo for optimization
2. **Large Datasets**: TimeSlotHeatmap limits products to top 20 for performance
3. **Debouncing**: Consider implementing for real-time data updates

## Styling

Components use Tailwind CSS with consistent design patterns:
- Colors: Blue for primary, Green for success, Red for errors
- Rounded corners: `rounded-lg` or `rounded-xl`
- Shadows: `shadow-sm` for cards
- Hover states for interactive elements

## Accessibility

Components include:
- ARIA labels where appropriate
- Keyboard navigation support
- High contrast colors for readability
- Semantic HTML structure

## Error Handling

1. **ErrorBoundary**: Catches component errors and displays fallback UI
2. **Graceful Degradation**: Components handle missing/empty data
3. **Loading States**: Show skeleton/placeholder content during loading
4. **Empty States**: Display helpful messages when no data is available

## Future Enhancements

1. **TypeScript Migration**: Add type definitions for all components
2. **Virtual Scrolling**: For large datasets in tables
3. **Advanced Filters**: Date range picker, product filters
4. **Real-time Updates**: WebSocket integration for live data
5. **Print Styles**: Optimized layouts for printing reports