/**
 * Advanced Customer Metrics Utilities
 * Tính toán các chỉ số phân tích khách hàng nâng cao cho TP.HCM
 *
 * Metrics bao gồm:
 * - CLV (Customer Lifetime Value)
 * - Churn Risk Score
 * - Customer Health Score
 * - Loyalty Stage
 * - Repurchase Rate
 * - Behavioral Patterns
 * - Product Affinity
 */

// ========== CLV CALCULATION ==========

/**
 * Tính Customer Lifetime Value (Giá trị trọn đời khách hàng)
 * @param {Object} customer - Customer object với orders, aov, createdAt
 * @returns {number} CLV dự kiến (VND)
 */
export const calculateCLV = (customer) => {
  const tenureDays = customer.createdAt
    ? Math.max(1, (Date.now() - new Date(customer.createdAt)) / (1000 * 60 * 60 * 24))
    : 365;

  // Tần suất mua hàng/năm
  const purchaseFrequencyPerYear = (customer.orders || 0) / Math.max(tenureDays / 365, 0.1);

  // Dự đoán tuổi thọ khách hàng
  // - Khách mới (1-2 đơn): 1 năm
  // - Khách trung thành (3-5 đơn): 1.5 năm
  // - Khách VIP (6+ đơn): 2 năm
  let predictedLifespanYears = 1;
  if (customer.orders >= 6) predictedLifespanYears = 2;
  else if (customer.orders >= 3) predictedLifespanYears = 1.5;

  // CLV = AOV × Tần suất mua/năm × Tuổi thọ dự kiến
  const clv = (customer.aov || 0) * purchaseFrequencyPerYear * predictedLifespanYears;

  return Math.round(clv);
};

/**
 * Xác định phân khúc CLV
 * @param {number} clv - Customer's CLV
 * @param {Array} allCustomers - All customers for percentile calculation
 * @returns {string} 'VIP' | 'High' | 'Medium' | 'Low'
 */
export const getCLVSegment = (clv, allCLVs) => {
  if (!allCLVs || allCLVs.length === 0) return 'Medium';

  const sorted = [...allCLVs].sort((a, b) => b - a);
  const index = sorted.findIndex(val => val <= clv);

  if (index === -1) return 'Low';

  const percentile = index / sorted.length;

  if (percentile <= 0.10) return 'VIP'; // Top 10%
  if (percentile <= 0.30) return 'High'; // 10-30%
  if (percentile <= 0.70) return 'Medium'; // 30-70%
  return 'Low'; // 70%+
};

/**
 * Get CLV segment color
 */
export const getCLVSegmentColor = (segment) => {
  const colors = {
    'VIP': 'bg-purple-100 text-purple-800 border-purple-300',
    'High': 'bg-blue-100 text-blue-800 border-blue-300',
    'Medium': 'bg-green-100 text-green-800 border-green-300',
    'Low': 'bg-gray-100 text-gray-800 border-gray-300'
  };
  return colors[segment] || colors['Medium'];
};

// ========== CHURN RISK ==========

/**
 * Tính Churn Risk Score (Điểm rủi ro khách hàng rời bỏ)
 * @param {Object} customer - Customer with rfm, orders, trend
 * @returns {Object} { level, score, label, color }
 */
export const calculateChurnRisk = (customer) => {
  const daysSinceLastOrder = customer.rfm?.daysSinceLastOrder || 999;
  const orderCount = customer.orders || 0;
  const trend = customer.trend || 0;

  let riskScore = 0;

  // Factor 1: Recency (50% weight)
  // Càng lâu không mua = càng nguy hiểm
  if (daysSinceLastOrder > 180) riskScore += 50;
  else if (daysSinceLastOrder > 120) riskScore += 40;
  else if (daysSinceLastOrder > 90) riskScore += 30;
  else if (daysSinceLastOrder > 60) riskScore += 20;
  else if (daysSinceLastOrder > 45) riskScore += 15;
  else if (daysSinceLastOrder > 30) riskScore += 10;

  // Factor 2: Declining trend (30% weight)
  // Xu hướng giảm spending
  if (trend < -50) riskScore += 30;
  else if (trend < -30) riskScore += 25;
  else if (trend < -10) riskScore += 15;
  else if (trend < 0) riskScore += 5;

  // Factor 3: Was valuable customer? (20% weight)
  // Khách hàng từng có giá trị cao thì mất đi càng nguy hiểm
  if (orderCount >= 10 && daysSinceLastOrder > 90) riskScore += 20;
  else if (orderCount >= 5 && daysSinceLastOrder > 60) riskScore += 15;
  else if (orderCount >= 3 && daysSinceLastOrder > 45) riskScore += 10;

  // Convert to level
  let level, label, color;
  if (riskScore >= 60) {
    level = 'high';
    label = 'Nguy cơ cao';
    color = 'bg-red-100 text-red-800 border-red-300';
  } else if (riskScore >= 30) {
    level = 'medium';
    label = 'Nguy cơ TB';
    color = 'bg-orange-100 text-orange-800 border-orange-300';
  } else {
    level = 'low';
    label = 'Ổn định';
    color = 'bg-green-100 text-green-800 border-green-300';
  }

  return { level, score: riskScore, label, color };
};

// ========== CUSTOMER HEALTH SCORE ==========

/**
 * Tính Customer Health Score (0-100)
 * Tổng hợp nhiều yếu tố để đánh giá sức khỏe tổng thể
 */
export const calculateHealthScore = (customer) => {
  let score = 0;

  // Recency (25 points)
  score += (customer.rfm?.R || 0) * 5;

  // Frequency (25 points)
  score += (customer.rfm?.F || 0) * 5;

  // Monetary (25 points)
  score += (customer.rfm?.M || 0) * 5;

  // Trend (25 points)
  const trend = customer.trend || 0;
  if (trend > 50) score += 25;
  else if (trend > 30) score += 22;
  else if (trend > 10) score += 18;
  else if (trend > 0) score += 15;
  else if (trend > -10) score += 12;
  else if (trend > -30) score += 8;
  else if (trend > -50) score += 4;
  else score += 0;

  return Math.min(100, Math.max(0, Math.round(score)));
};

/**
 * Get health score label and color
 */
export const getHealthScoreLevel = (score) => {
  if (score >= 80) return { label: 'Xuất sắc', color: 'text-green-600', bgColor: 'bg-green-500' };
  if (score >= 60) return { label: 'Tốt', color: 'text-blue-600', bgColor: 'bg-blue-500' };
  if (score >= 40) return { label: 'Trung bình', color: 'text-yellow-600', bgColor: 'bg-yellow-500' };
  if (score >= 20) return { label: 'Yếu', color: 'text-orange-600', bgColor: 'bg-orange-500' };
  return { label: 'Rất yếu', color: 'text-red-600', bgColor: 'bg-red-500' };
};

// ========== LOYALTY STAGE ==========

/**
 * Xác định giai đoạn trung thành của khách hàng
 * @returns {string} 'New' | 'Growing' | 'Loyal' | 'Champion' | 'At Risk' | 'Lost'
 */
export const getLoyaltyStage = (customer) => {
  const orders = customer.orders || 0;
  const daysSinceLastOrder = customer.rfm?.daysSinceLastOrder || 999;
  const trend = customer.trend || 0;

  // Lost - Đã mất khách
  if (daysSinceLastOrder > 180 && orders >= 2) {
    return { stage: 'Lost', label: 'Đã mất', color: 'bg-slate-100 text-slate-800 border-slate-300', icon: 'UserX' };
  }

  // At Risk - Có nguy cơ mất
  if (daysSinceLastOrder > 90 && orders >= 3) {
    return { stage: 'At Risk', label: 'Nguy cơ cao', color: 'bg-red-100 text-red-800 border-red-300', icon: 'AlertCircle' };
  }

  // Champion - Khách hàng xuất sắc
  if (orders >= 10 && daysSinceLastOrder <= 45 && trend >= 0) {
    return { stage: 'Champion', label: 'Champion', color: 'bg-yellow-100 text-yellow-800 border-yellow-300', icon: 'Award' };
  }

  // Loyal - Trung thành
  if (orders >= 5 && daysSinceLastOrder <= 60) {
    return { stage: 'Loyal', label: 'Trung thành', color: 'bg-blue-100 text-blue-800 border-blue-300', icon: 'Heart' };
  }

  // Growing - Đang phát triển
  if (orders >= 2 && daysSinceLastOrder <= 60) {
    return { stage: 'Growing', label: 'Phát triển', color: 'bg-purple-100 text-purple-800 border-purple-300', icon: 'TrendingUp' };
  }

  // New - Khách mới
  return { stage: 'New', label: 'Mới', color: 'bg-green-100 text-green-800 border-green-300', icon: 'UserPlus' };
};

// ========== REPURCHASE RATE ==========

/**
 * Tính tỷ lệ mua lại (% khách hàng có 2+ đơn)
 */
export const calculateRepurchaseRate = (allCustomers) => {
  const withOrders = allCustomers.filter(c => (c.orders || 0) >= 1);
  const withRepurchase = allCustomers.filter(c => (c.orders || 0) >= 2);

  if (withOrders.length === 0) return 0;

  return (withRepurchase.length / withOrders.length) * 100;
};

// ========== COHORT ANALYSIS ==========

/**
 * Xác định cohort group của khách hàng
 */
export const getCohortGroup = (customer) => {
  if (!customer.createdAt) return { monthly: 'Unknown', quarterly: 'Unknown', yearly: 'Unknown' };

  const date = new Date(customer.createdAt);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const quarter = Math.ceil(month / 3);

  return {
    monthly: `${year}-${String(month).padStart(2, '0')}`,
    monthlyLabel: `Tháng ${month}/${year}`,
    quarterly: `${year}-Q${quarter}`,
    quarterlyLabel: `Q${quarter} ${year}`,
    yearly: String(year),
    yearlyLabel: `Năm ${year}`
  };
};

/**
 * Build cohort retention data
 */
export const buildCohortRetentionData = (customers, orders) => {
  // Group customers by cohort month
  const cohorts = {};

  customers.forEach(customer => {
    const cohort = customer.cohort?.monthly;
    if (!cohort || cohort === 'Unknown') return;

    if (!cohorts[cohort]) {
      cohorts[cohort] = {
        cohort,
        label: customer.cohort?.monthlyLabel,
        customers: [],
        size: 0
      };
    }

    cohorts[cohort].customers.push(customer);
    cohorts[cohort].size++;
  });

  // Calculate retention for each cohort
  const cohortData = Object.values(cohorts).map(cohort => {
    const cohortDate = new Date(cohort.cohort + '-01');
    const retention = [];

    // Calculate retention for months 0-11 (1 year)
    for (let monthOffset = 0; monthOffset <= 11; monthOffset++) {
      const targetDate = new Date(cohortDate);
      targetDate.setMonth(targetDate.getMonth() + monthOffset);
      const targetMonth = targetDate.getMonth();
      const targetYear = targetDate.getFullYear();

      // Count customers who made purchase in target month
      const activeCustomers = cohort.customers.filter(customer => {
        return orders.some(order => {
          if (order.customer.phone !== customer.phone) return false;
          const orderDate = new Date(order.timeline?.received?.raw);
          return orderDate.getMonth() === targetMonth && orderDate.getFullYear() === targetYear;
        });
      });

      const retentionRate = (activeCustomers.length / cohort.size) * 100;
      retention.push({
        month: monthOffset,
        rate: retentionRate,
        active: activeCustomers.length,
        total: cohort.size
      });
    }

    return {
      ...cohort,
      retention
    };
  });

  // Sort by cohort date (newest first)
  return cohortData.sort((a, b) => b.cohort.localeCompare(a.cohort));
};

// ========== PRODUCT AFFINITY ==========

/**
 * Tính product affinity cho một khách hàng
 */
export const calculateProductAffinity = (customer, orders) => {
  const customerOrders = orders.filter(o => o.customer.phone === customer.phone);

  // Đếm sản phẩm
  const productCount = {};
  const productRevenue = {};

  customerOrders.forEach(order => {
    order.items?.forEach(item => {
      if (item.name) {
        const amount = item.amount || 1;
        const price = item.price || 0;

        productCount[item.name] = (productCount[item.name] || 0) + amount;
        productRevenue[item.name] = (productRevenue[item.name] || 0) + (price * amount);
      }
    });
  });

  // Top sản phẩm theo số lượng
  const topByQuantity = Object.entries(productCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({
      name,
      quantity: count,
      revenue: productRevenue[name] || 0
    }));

  return topByQuantity;
};

/**
 * Phân tích product affinity theo segment
 */
export const analyzeProductAffinityBySegment = (customers, orders) => {
  const segmentProducts = {};

  // Group by RFM segment
  customers.forEach(customer => {
    const segment = customer.rfm?.segment || 'Other';
    if (!segmentProducts[segment]) {
      segmentProducts[segment] = {};
    }

    const customerOrders = orders.filter(o => o.customer.phone === customer.phone);
    customerOrders.forEach(order => {
      order.items?.forEach(item => {
        if (item.name) {
          segmentProducts[segment][item.name] = (segmentProducts[segment][item.name] || 0) + (item.amount || 1);
        }
      });
    });
  });

  // Get top products per segment
  const bySegment = {};
  Object.entries(segmentProducts).forEach(([segment, products]) => {
    bySegment[segment] = Object.entries(products)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, quantity: count }));
  });

  return { bySegment };
};

// ========== BEHAVIORAL PATTERNS ==========

/**
 * Phân tích behavioral patterns của khách hàng
 */
export const analyzeBehavioralPatterns = (customer, orders) => {
  const customerOrders = orders.filter(o => o.customer.phone === customer.phone);

  if (customerOrders.length === 0) {
    return {
      peakDay: 'N/A',
      peakHour: 'N/A',
      avgDaysBetweenOrders: 0
    };
  }

  // Peak order day (thứ mấy trong tuần)
  const dayCount = {};
  const dayNames = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

  customerOrders.forEach(order => {
    const date = new Date(order.timeline?.received?.raw);
    const dayIndex = date.getDay();
    const dayName = dayNames[dayIndex];
    dayCount[dayName] = (dayCount[dayName] || 0) + 1;
  });

  const peakDay = Object.entries(dayCount).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

  // Peak order hour
  const hourCount = {};
  customerOrders.forEach(order => {
    const date = new Date(order.timeline?.received?.raw);
    const hour = date.getHours();
    hourCount[hour] = (hourCount[hour] || 0) + 1;
  });

  const peakHourNum = Object.entries(hourCount).sort((a, b) => b[1] - a[1])[0]?.[0];
  const peakHour = peakHourNum !== undefined ? `${peakHourNum}:00` : 'N/A';

  // Average days between orders
  const orderDates = customerOrders
    .map(o => o.timeline?.received?.raw)
    .filter(d => d)
    .sort((a, b) => a - b);

  let avgDaysBetweenOrders = 0;
  if (orderDates.length > 1) {
    const intervals = [];
    for (let i = 1; i < orderDates.length; i++) {
      intervals.push((orderDates[i] - orderDates[i - 1]) / (1000 * 60 * 60 * 24));
    }
    avgDaysBetweenOrders = intervals.reduce((sum, val) => sum + val, 0) / intervals.length;
  }

  return {
    peakDay,
    peakHour,
    avgDaysBetweenOrders: Math.round(avgDaysBetweenOrders)
  };
};
