// Helper functions for pre-order system

/**
 * Generate MongoDB-style ObjectId
 * 24 hex characters: timestamp (8) + machine (6) + process (4) + counter (6)
 */
export const generateObjectId = () => {
  const timestamp = Math.floor(Date.now() / 1000).toString(16).padStart(8, '0');
  const machineId = Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
  const processId = Math.floor(Math.random() * 65535).toString(16).padStart(4, '0');
  const counter = Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
  return timestamp + machineId + processId + counter;
};

/**
 * Convert Date to CFAbsoluteTime (seconds since 2001-01-01)
 * iOS/macOS Core Foundation time format
 */
export const toCFAbsoluteTime = (date) => {
  const time2001 = 978307200000; // Milliseconds since epoch for 2001-01-01
  return (date.getTime() - time2001) / 1000;
};

/**
 * Format currency as Vietnamese Dong
 */
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(amount);
};

/**
 * Format date as YYYY-MM-DD (for input fields)
 */
export const formatLocalDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Get today's date as YYYY-MM-DD
 */
export const getTodayDate = () => {
  return formatLocalDate(new Date());
};

/**
 * Check if a time slot is still available for the selected date
 */
export const isTimeSlotAvailable = (slot, selectedDate) => {
  // If date is not today, all slots are available
  if (selectedDate !== getTodayDate()) return true;

  // For today, check if the slot is in the future
  const now = new Date();
  const [startTime] = slot.split(' - ');
  const [hours] = startTime.split(':').map(Number);

  return hours > now.getHours();
};

/**
 * Calculate cart subtotal
 */
export const calculateCartTotal = (cart) => {
  return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
};

/**
 * Predefined time slots for delivery
 */
export const TIME_SLOTS = [
  "10:00 - 12:00",
  "12:00 - 14:00",
  "14:00 - 16:00",
  "16:00 - 18:00",
  "18:00 - 20:00"
];

/**
 * Determine the appropriate delivery time slot based on order date/time
 * @param {Date|number} date - Date object or timestamp
 * @returns {string|null} The matching time slot or null if outside all slots
 */
export const getTimeSlotFromDate = (date) => {
  if (!date) return null;
  
  const dateObj = date instanceof Date ? date : new Date(date);
  if (isNaN(dateObj.getTime())) return null;
  
  const hour = dateObj.getHours();
  
  // Map hour to time slot
  if (hour >= 10 && hour < 12) return "10:00 - 12:00";
  if (hour >= 12 && hour < 14) return "12:00 - 14:00";
  if (hour >= 14 && hour < 16) return "14:00 - 16:00";
  if (hour >= 16 && hour < 18) return "16:00 - 18:00";
  if (hour >= 18 && hour < 20) return "18:00 - 20:00";
  
  // Outside business hours - return closest slot
  if (hour < 10) return "10:00 - 12:00"; // Before opening
  if (hour >= 20) return "18:00 - 20:00"; // After closing
  
  return null;
};

/**
 * Get placeholder image based on product type
 */
export const getPlaceholderImage = (productType) => {
  const placeholders = {
    'Canele': 'https://images.unsplash.com/photo-1509365465985-25d11c17e812?w=400',
    'Shiopan': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400',
    'Cinnamon Roll': 'https://images.unsplash.com/photo-1509365465985-25d11c17e812?w=400',
    'Cheese Burn Cake': 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400',
    'Birthday Cake': 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=400',
    'Brownie': 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400',
    'Banana Cake': 'https://images.unsplash.com/photo-1606890737304-57a1ca8a5b62?w=400',
    'Pastry': 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400',
    'Croissant': 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400',
    'Bread': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400',
    'Cookie': 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=400',
    'Cupcake': 'https://images.unsplash.com/photo-1614707267537-b85aaf00c4b7?w=400',
    'Muffin': 'https://images.unsplash.com/photo-1614707267537-b85aaf00c4b7?w=400'
  };

  return placeholders[productType] || 'https://images.unsplash.com/photo-1517433670267-08bbd4be890f?w=400';
};
