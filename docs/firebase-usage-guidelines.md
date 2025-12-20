# Firebase Usage Guidelines for Staff

**Purpose:** Optimize bandwidth usage and stay within free tier limits

## Tab Management

### Why It Matters
- Each browser tab = separate Firebase connection
- 15 tabs = 15x bandwidth usage
- Exceeding free tier costs money (currently 12x over limit)
- Extra tabs slow down the app for everyone

### Best Practices

✅ **DO:**
- Keep **1 active tab** open per user
- Bookmark the app URL for easy access
- Use browser navigation (back/forward buttons) instead of opening new tabs
- **Close tabs when done for the day**
- Refresh the page if data seems stale

❌ **DON'T:**
- Open multiple tabs "just in case"
- Leave tabs open overnight or over weekends
- Open app in multiple browsers simultaneously
- Keep tabs open in the background while not working

### Current Usage Target
- **Target:** 1 tab per user
- **Maximum acceptable:** 2 tabs per user (e.g., one for Orders, one for Analytics)
- **Current problem:** Average 3 tabs per user = 15 total connections

## How to Check Active Tabs

1. Look at your browser's tab bar
2. Count how many ButterBake tabs you have open
3. Close any extras (right-click → Close Tab)
4. Alternative: Check Task Manager → Browser → See how many ButterBake processes are running

## Benefits of Following Guidelines

✅ **Faster app performance** - Less network congestion
✅ **Lower costs** - Stay within free tier
✅ **Better reliability** - Fewer connection errors
✅ **Real-time updates** - Data syncs more reliably with fewer connections

## Monitoring

We monitor Firebase connections to ensure compliance:
- Firebase Console shows concurrent connections
- Target: <10 connections total
- Current: ~15 connections
- Goal: Reduce by 50%

## Training Checklist

For Staff:
- [ ] Understand why 1 tab matters
- [ ] Bookmark the app URL
- [ ] Close tabs when finished working
- [ ] Check for duplicate tabs weekly

For Managers:
- [ ] Send guidelines email to team
- [ ] Brief demo in team meeting
- [ ] Monitor Firebase connections weekly
- [ ] Follow up with users exceeding 2 tabs

## Questions?

Contact the tech team if you:
- Notice slow app performance
- Get disconnection errors
- Need clarification on these guidelines
- Have suggestions for improvement

---

**Last updated:** December 21, 2025
**Phase:** 7 - User Behavior Optimization
**Impact:** -50% to -66% bandwidth through user education
