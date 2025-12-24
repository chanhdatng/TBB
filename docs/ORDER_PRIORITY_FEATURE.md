# Order Priority Feature (Phase 01) - Quick Reference Guide

**Last Updated**: 2025-12-25
**Feature Status**: IMPLEMENTED & DOCUMENTED
**Version**: 1.0

---

## Quick Overview

The Order Priority system enables staff to categorize orders by urgency level (High/Normal/Low) with automatic sorting to surface high-priority orders first. This feature is integrated into the order creation/editing workflow and displays prominent visual indicators on the Orders page.

---

## Priority Levels

| Level | Vietnamese | Display | Icon | Color | Use Case |
|-------|------------|---------|------|-------|----------|
| **High** | Gấp | Badge | Alert Circle | Red | Rush/urgent orders |
| **Normal** | Bình thường | Badge | None | Gray | Regular orders (default) |
| **Low** | Thấp | Badge | Down Arrow | Gray | Flexible deadline orders |

---

## User Guide

### Creating an Order with Priority

1. Open **Orders** page → Click **"Add Order"** button
2. Fill in customer information and products
3. Scroll to **"Delivery Time"** section
4. Click one of the priority buttons:
   - **Gấp** (Red) - for rush orders
   - **Bình thường** (Gray) - for regular orders (default)
   - **Thấp** (Gray) - for flexible orders
5. Complete order creation

### Editing Order Priority

1. Click an order in the orders list
2. Click **"Edit"** button in the order details modal
3. Scroll to **"Delivery Time"** section
4. Select new priority level
5. Click **"Save Changes"**

### Viewing High-Priority Orders

- High-priority orders display a red **"Gấp"** badge next to the customer name
- Badge includes an alert icon for quick visual identification
- Orders are automatically sorted to show high-priority first within each time slot

### Using Drafts with Priority

1. When creating order, click **"Save Draft"** button
2. Priority level is automatically saved with draft
3. When resuming draft, priority is restored
4. Can modify priority before finalizing

---

## How Orders Are Sorted

Orders are sorted using a 3-level hierarchy:

**Level 1: Delivery Time Slot** (Primary)
```
10:00 - 12:00
    ↓
12:00 - 14:00
    ↓
14:00 - 16:00
    ↓
16:00 - 18:00
    ↓
18:00 - 20:00
```

**Level 2: Priority** (Secondary - within each time slot)
```
High (Gấp) = 1     ← sorted first
Normal (Bình thường) = 2
Low (Thấp) = 3     ← sorted last
```

**Level 3: Received Time** (Tertiary - within same slot & priority)
```
Earlier orders appear first
```

---

## Visual Indicators

### Priority Badge Styles

**High Priority (Gấp)**:
```
┌─────────────┐
│ 🚨 Gấp     │  ← Red background
│ Customer    │     Red text
│ +84912345   │     Alert icon
└─────────────┘
```

**Normal Priority (Bình thường)**:
```
┌─────────────┐
│ Customer    │  ← No badge
│ +84912345   │
│ Address     │
└─────────────┘
```

**Low Priority (Thấp)**:
```
Customer info without badge
```

---

## Implementation Details

### File Locations

**Frontend Components**:
- **CreateOrderModal.jsx**: Priority selector UI (lines 920-940)
- **Orders.jsx**: Sorting logic (lines 261-291), badge display (lines 531-536)

**State Management**:
- Priority stored as React state in CreateOrderModal
- Persisted to Firebase under `orders/{orderId}/priority`
- Included in draft data for persistence

### Database Schema

**Orders Collection** (`/orders/{orderId}`):
```javascript
{
  customer: { ... },
  cakes: [ ... ],
  orderDate: number,
  createDate: number,
  deliveryTimeSlot: string,
  state: string,
  shipFee: number,
  discount: number,
  priority: "high" | "normal" | "low"  // NEW
}
```

### Code Examples

**Getting Priority from Order**:
```javascript
const priority = order.originalData?.priority || 'normal';
```

**Setting Priority in Form**:
```javascript
const [priority, setPriority] = useState('normal');
// User clicks button
setPriority('high');
```

**Including Priority in Order Creation**:
```javascript
const orderData = {
  customer: { ... },
  cakes: [ ... ],
  priority: priority,  // 'high', 'normal', or 'low'
  ...otherFields
};
```

**Sorting with Priority**:
```javascript
const getPriorityOrder = (priority) => {
  if (priority === 'high') return 1;    // First
  if (priority === 'low') return 3;     // Last
  return 2;                              // Middle
};
```

---

## Features

### Current (Phase 01)
- [x] 3-level priority system
- [x] Priority selector in order creation/editing
- [x] Priority badge for high-priority orders
- [x] Automatic sorting by priority within time slots
- [x] Draft persistence with priority
- [x] Vietnamese labels (Gấp, Bình thường, Thấp)
- [x] Visual indicators (colors, icons)
- [x] Backward compatibility

### Future Enhancements (Planned)
- [ ] Priority filtering in advanced filters
- [ ] Priority change history/audit log
- [ ] Priority-based notifications (email/SMS)
- [ ] Priority presets for repeat customers
- [ ] Priority statistics on dashboard
- [ ] API endpoint for priority management

---

## Frequently Asked Questions

**Q: What's the default priority for new orders?**
A: Normal (Bình thường). This ensures existing workflow continues smoothly.

**Q: Can I change priority after creating an order?**
A: Yes. Click the order, then "Edit" to modify the priority level.

**Q: Will old orders (before this feature) work correctly?**
A: Yes. Orders without a priority field automatically default to "Normal" and sort correctly.

**Q: How are orders sorted if multiple have the same priority?**
A: They're sorted by received time (order creation time) within the same time slot and priority level.

**Q: Can I filter orders by priority?**
A: Currently, high-priority orders are visually highlighted with a red badge. Advanced filtering by priority is planned for a future phase.

**Q: Does priority affect order pricing?**
A: No. Priority is purely for organization and sorting. It doesn't affect pricing or fees.

**Q: Can customers set priority when ordering online?**
A: Currently no. Priority is set by staff during order creation. Customer-facing priority selection is planned for future phases.

---

## Troubleshooting

### Priority Badge Not Showing

**Issue**: High-priority order doesn't show red badge on customer name

**Solutions**:
1. Verify order was saved with `priority: 'high'` in Firebase
2. Check that order is displayed on the Orders page (correct date filter)
3. Refresh page to reload data from Firebase
4. Check browser console for errors

### Orders Not Sorting Correctly

**Issue**: Orders not appearing in priority order

**Solutions**:
1. Verify all orders have valid priorities (high, normal, low)
2. Check that orders are on same date (date filter affects sorting)
3. Ensure browser has JavaScript enabled
4. Clear browser cache and reload

### Priority Not Saving in Draft

**Issue**: Draft saved but priority resets to Normal

**Solutions**:
1. Check browser's localStorage is enabled
2. Verify sufficient storage space available
3. Check browser console for JavaScript errors
4. Try creating new draft

---

## Best Practices

1. **Use High Priority Sparingly**: Reserve "Gấp" for truly urgent orders to maintain prioritization effectiveness
2. **Communicate with Team**: Ensure all staff understand priority levels and their implications
3. **Set Priority at Creation**: Assign priority when creating order, not afterwards
4. **Review Sorting**: Check that orders are sorted as expected for your workflow
5. **Check Draft Restoration**: Verify priority is restored correctly when resuming drafts

---

## Technical Support

### Debug Information to Collect

If priority feature isn't working:
1. Order ID (from order list)
2. Expected vs actual priority level
3. Current browser (Chrome, Safari, Firefox, etc.)
4. Steps to reproduce issue
5. Browser console error messages (F12 → Console tab)

### Common Error Messages

**"Priority field undefined"**:
- Order missing priority field, using default 'normal'
- Not an error, expected for old orders

**"Sorting not updating"**:
- Refresh page to reload data
- Check JavaScript console for errors
- Verify Firefox allows localStorage

---

## Documentation References

- **Full Feature Documentation**: `/docs/codebase-summary.md` (lines 1227-1310)
- **Component Documentation**: `/docs/codebase-summary.md` (Orders.jsx section, CreateOrderModal section)
- **Database Schema**: `/docs/codebase-summary.md` (Database Schema section)

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-12-25 | Initial Order Priority feature (Phase 01) |

---

**Last Updated**: 2025-12-25
**Status**: Ready for Production
**Contact**: Development Team
