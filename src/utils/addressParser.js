/**
 * TP.HCM Address Parser
 * Parse địa chỉ TP. Hồ Chí Minh để lấy thông tin quận/huyện và zone
 *
 * Zones:
 * - Trung tâm: Q1, Q3, Q5, Q10, Phú Nhuận
 * - Đông: Q2, Q9, Thủ Đức
 * - Nam: Q4, Q7, Q8, Nhà Bè
 * - Tây: Q6, Q11, Tân Bình, Tân Phú
 * - Bắc: Gò Vấp, Bình Thạnh, Q12
 * - Ngoại thành: Hóc Môn, Củ Chi, Bình Chánh, Cần Giờ
 */

// Danh sách đầy đủ 24 quận/huyện TP.HCM
export const HCM_DISTRICTS = [
  // Quận nội thành
  { name: 'Quận 1', aliases: ['q1', 'quan 1', 'q.1'], zone: 'Trung tâm' },
  { name: 'Quận 2', aliases: ['q2', 'quan 2', 'q.2', 'thu duc q2'], zone: 'Đông' },
  { name: 'Quận 3', aliases: ['q3', 'quan 3', 'q.3'], zone: 'Trung tâm' },
  { name: 'Quận 4', aliases: ['q4', 'quan 4', 'q.4'], zone: 'Nam' },
  { name: 'Quận 5', aliases: ['q5', 'quan 5', 'q.5'], zone: 'Trung tâm' },
  { name: 'Quận 6', aliases: ['q6', 'quan 6', 'q.6'], zone: 'Tây' },
  { name: 'Quận 7', aliases: ['q7', 'quan 7', 'q.7'], zone: 'Nam' },
  { name: 'Quận 8', aliases: ['q8', 'quan 8', 'q.8'], zone: 'Nam' },
  { name: 'Quận 9', aliases: ['q9', 'quan 9', 'q.9', 'thu duc q9'], zone: 'Đông' },
  { name: 'Quận 10', aliases: ['q10', 'quan 10', 'q.10'], zone: 'Trung tâm' },
  { name: 'Quận 11', aliases: ['q11', 'quan 11', 'q.11'], zone: 'Tây' },
  { name: 'Quận 12', aliases: ['q12', 'quan 12', 'q.12'], zone: 'Bắc' },

  // Quận/Huyện khác
  { name: 'Thủ Đức', aliases: ['thu duc', 'thủ đức', 'tp thu duc'], zone: 'Đông' },
  { name: 'Bình Thạnh', aliases: ['binh thanh', 'bình thạnh', 'q binh thanh'], zone: 'Bắc' },
  { name: 'Tân Bình', aliases: ['tan binh', 'tân bình', 'q tan binh'], zone: 'Tây' },
  { name: 'Tân Phú', aliases: ['tan phu', 'tân phú', 'q tan phu'], zone: 'Tây' },
  { name: 'Phú Nhuận', aliases: ['phu nhuan', 'phú nhuận', 'q phu nhuan'], zone: 'Trung tâm' },
  { name: 'Gò Vấp', aliases: ['go vap', 'gò vấp', 'q go vap'], zone: 'Bắc' },
  { name: 'Bình Tân', aliases: ['binh tan', 'bình tân', 'q binh tan'], zone: 'Tây' },

  // Huyện ngoại thành
  { name: 'Hóc Môn', aliases: ['hoc mon', 'hóc môn', 'h hoc mon'], zone: 'Ngoại thành' },
  { name: 'Củ Chi', aliases: ['cu chi', 'củ chi', 'h cu chi'], zone: 'Ngoại thành' },
  { name: 'Bình Chánh', aliases: ['binh chanh', 'bình chánh', 'h binh chanh'], zone: 'Ngoại thành' },
  { name: 'Nhà Bè', aliases: ['nha be', 'nhà bè', 'h nha be'], zone: 'Nam' },
  { name: 'Cần Giờ', aliases: ['can gio', 'cần giờ', 'h can gio'], zone: 'Ngoại thành' }
];

/**
 * Parse địa chỉ để lấy quận/huyện và zone
 * @param {string} address - Địa chỉ đầy đủ
 * @returns {Object} { district, zone, raw }
 */
export const parseAddress = (address) => {
  if (!address) {
    return { district: 'Unknown', zone: 'Unknown', raw: '' };
  }

  const addressLower = address.toLowerCase()
    .replace(/,/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Tìm quận/huyện trong địa chỉ
  for (const districtInfo of HCM_DISTRICTS) {
    // Check exact name
    if (addressLower.includes(districtInfo.name.toLowerCase())) {
      return {
        district: districtInfo.name,
        zone: districtInfo.zone,
        raw: address
      };
    }

    // Check aliases
    for (const alias of districtInfo.aliases) {
      if (addressLower.includes(alias)) {
        return {
          district: districtInfo.name,
          zone: districtInfo.zone,
          raw: address
        };
      }
    }
  }

  // Không tìm thấy
  return { district: 'Unknown', zone: 'Unknown', raw: address };
};

/**
 * Thống kê địa lý theo quận/huyện
 */
export const calculateGeographicStats = (customers) => {
  const stats = {
    byDistrict: {},
    byZone: {},
    topDistricts: [],
    topZones: [],
    totalIdentified: 0,
    totalUnknown: 0
  };

  customers.forEach(customer => {
    const { district, zone } = customer.location || {};

    if (district === 'Unknown') {
      stats.totalUnknown++;
      return;
    }

    stats.totalIdentified++;

    // Count by district
    if (!stats.byDistrict[district]) {
      stats.byDistrict[district] = {
        count: 0,
        revenue: 0,
        customers: []
      };
    }
    stats.byDistrict[district].count++;
    stats.byDistrict[district].revenue += customer.totalSpent || 0;
    stats.byDistrict[district].customers.push(customer);

    // Count by zone
    if (zone && zone !== 'Unknown') {
      if (!stats.byZone[zone]) {
        stats.byZone[zone] = {
          count: 0,
          revenue: 0,
          customers: []
        };
      }
      stats.byZone[zone].count++;
      stats.byZone[zone].revenue += customer.totalSpent || 0;
      stats.byZone[zone].customers.push(customer);
    }
  });

  // Top districts by customer count
  stats.topDistricts = Object.entries(stats.byDistrict)
    .map(([district, data]) => ({
      district,
      count: data.count,
      revenue: data.revenue,
      avgOrderValue: data.customers.reduce((sum, c) => sum + (c.aov || 0), 0) / data.count,
      avgOrders: data.customers.reduce((sum, c) => sum + (c.orders || 0), 0) / data.count
    }))
    .sort((a, b) => b.count - a.count);

  // Top zones by customer count
  stats.topZones = Object.entries(stats.byZone)
    .map(([zone, data]) => ({
      zone,
      count: data.count,
      revenue: data.revenue,
      avgOrderValue: data.customers.reduce((sum, c) => sum + (c.aov || 0), 0) / data.count,
      avgOrders: data.customers.reduce((sum, c) => sum + (c.orders || 0), 0) / data.count
    }))
    .sort((a, b) => b.count - a.count);

  return stats;
};

/**
 * Get zone color for visualization
 */
export const getZoneColor = (zone) => {
  const colors = {
    'Trung tâm': { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-300', hex: '#9333ea' },
    'Đông': { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300', hex: '#3b82f6' },
    'Nam': { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300', hex: '#22c55e' },
    'Tây': { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300', hex: '#eab308' },
    'Bắc': { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-300', hex: '#f97316' },
    'Ngoại thành': { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-300', hex: '#6b7280' },
    'Unknown': { bg: 'bg-slate-100', text: 'text-slate-800', border: 'border-slate-300', hex: '#64748b' }
  };
  return colors[zone] || colors['Unknown'];
};

/**
 * Get district delivery tier (based on logistics)
 * Tier 1: Giao nhanh, phí thấp (trung tâm)
 * Tier 2: Giao bình thường (ngoại thành gần)
 * Tier 3: Giao xa, phí cao (ngoại thành xa)
 */
export const getDeliveryTier = (district) => {
  const tier1 = ['Quận 1', 'Quận 3', 'Quận 5', 'Quận 10', 'Phú Nhuận', 'Tân Bình'];
  const tier3 = ['Hóc Môn', 'Củ Chi', 'Cần Giờ'];

  if (tier1.includes(district)) return { tier: 1, label: 'Giao nhanh', color: 'text-green-600' };
  if (tier3.includes(district)) return { tier: 3, label: 'Giao xa', color: 'text-red-600' };
  return { tier: 2, label: 'Giao bình thường', color: 'text-blue-600' };
};
