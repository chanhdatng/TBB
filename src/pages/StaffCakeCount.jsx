import React, { useState, useMemo, useEffect, useRef } from 'react';
import { database } from '../firebase';
import { ref, get, set, push } from "firebase/database";
import { Loader2 } from 'lucide-react';
import { useStocksData } from '../contexts/StocksDataContext';
import { 
  User, 
  Search, 
  Plus, 
  Minus, 
  Package, 
  TrendingUp, 
  AlertCircle,
  Calendar,
  ChefHat,
  History,
  Clock,
  ArrowRight,
  X,
  Edit2,
  Copy,
  Check,
  RotateCcw
} from 'lucide-react';

const StaffCakeCount = () => {
  const { products, orders, activeEmployees, stocks, loading } = useStocksData();

  const [selectedStaff, setSelectedStaff] = useState(() => {
    return localStorage.getItem('countCakeSelectedStaff') || '';
  });
  const [otherName, setOtherName] = useState(() => {
    return localStorage.getItem('countCakeOtherName') || '';
  });
  const [isEnteringOther, setIsEnteringOther] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [productionQuantities, setProductionQuantities] = useState({});
  const [lastSavedQuantities, setLastSavedQuantities] = useState({});
  const [isUpdating, setIsUpdating] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showFooter, setShowFooter] = useState(true);
  const lastScrollY = useRef(window.scrollY);
  const scrollTimer = useRef(null);
  const [showHistory, setShowHistory] = useState(false);
  const [historyData, setHistoryData] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Function to scroll to a specific type
  const scrollToType = (type) => {
    const element = document.getElementById(`type-${type.replace(/\s+/g, '-').toLowerCase()}`);
    if (element) {
      // First scroll to the element
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      // Alternative approach for better centering:
      // Get element's position and calculate center position
      // element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      // setTimeout(() => {
      //   const rect = element.getBoundingClientRect();
      //   const centerY = rect.top + window.scrollY + (rect.height / 2);
      //   window.scrollTo({ top: centerY - (window.innerHeight / 2), behavior: 'smooth' });
      // }, 300);
    }
  };

  // Handle scroll effect for header and footer visibility
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const diff = currentScrollY - lastScrollY.current;
      
      // Footer logic: Luôn ẩn khi đang cuộn
      setShowFooter(false);
      
      // Xoá timer cũ và set timer mới để hiện lại sau 1s dừng cuộn
      if (scrollTimer.current) clearTimeout(scrollTimer.current);
      scrollTimer.current = setTimeout(() => {
        setShowFooter(true);
      }, 750);

      // Logic Header (giữ nguyên ngưỡng 10px để tránh bị nháy)
      if (Math.abs(diff) >= 10) {
        if (diff > 0) { // Đang cuộn xuống
          if (currentScrollY > 50) setIsScrolled(true);
        } else { // Đang cuộn lên
          if (currentScrollY <= 20) setIsScrolled(false);
        }
        lastScrollY.current = currentScrollY;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimer.current) clearTimeout(scrollTimer.current);
    };
  }, []);
  const fetchHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const historyRef = ref(database, 'reportStocks');
      const snapshot = await get(historyRef);
      if (snapshot.exists()) {
        const data = snapshot.val();
        const historyList = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        })).sort((a, b) => b.timestamp - a.timestamp);
        setHistoryData(historyList.slice(0, 50)); // Last 50 entries
      }
    } catch (error) {
      console.error("Error fetching history:", error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (showHistory) {
      fetchHistory();
    }
  }, [showHistory]);

  // Persist staff selection
  useEffect(() => {
    if (selectedStaff) {
      localStorage.setItem('countCakeSelectedStaff', selectedStaff);
    } else {
      localStorage.removeItem('countCakeSelectedStaff');
    }
  }, [selectedStaff]);

  useEffect(() => {
    if (otherName) {
      localStorage.setItem('countCakeOtherName', otherName);
    } else {
      localStorage.removeItem('countCakeOtherName');
    }
  }, [otherName]);

  // Initialize stocks from context (only when stocks data is loaded)
  useEffect(() => {
    if (!loading && stocks) {
      setProductionQuantities(stocks);
      setLastSavedQuantities(stocks);
      console.log('✅ Initialized stocks from context');
    }
  }, [loading, stocks]);

  const hasChanges = useMemo(() => {
    return JSON.stringify(productionQuantities) !== JSON.stringify(lastSavedQuantities);
  }, [productionQuantities, lastSavedQuantities]);

  const handleUpdate = async () => {
    setIsUpdating(true);
    const staffInfo = activeEmployees?.find(e => e.id === selectedStaff);
    let staffNameFinal = 'Unknown';
    if (selectedStaff === 'other') {
      staffNameFinal = otherName || 'Người khác';
    } else if (staffInfo) {
      staffNameFinal = `${staffInfo.firstName} ${staffInfo.lastName}`;
    }

    // Calculate changes
    const changes = {};
    Object.keys(productionQuantities).forEach(code => {
      const newVal = productionQuantities[code];
      const oldVal = lastSavedQuantities[code] || 0;
      if (newVal !== oldVal) {
        const product = products.find(p => p.code === code);
        changes[code] = {
          name: product?.name || code,
          from: oldVal,
          to: newVal,
          diff: newVal - oldVal
        };
      }
    });

    try {
      // 1. Update current stocks
      await set(ref(database, 'stocks'), productionQuantities);
      
      // 2. Create history report
      const reportRef = ref(database, 'reportStocks');
      await push(reportRef, {
        staffId: selectedStaff,
        staffName: staffNameFinal,
        timestamp: Date.now(),
        date: new Date().toISOString(),
        changes: changes,
        summary: totals
      });

      setLastSavedQuantities({ ...productionQuantities });
    } catch (error) {
      console.error("Error updating stocks:", error);
      alert("Failed to update stocks. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  // Helper to format date as YYYY-MM-DD in local time (matching DataContext)
  const formatLocalDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Filter sold items for TODAY only
  const soldQuantities = useMemo(() => {
    const todayStr = formatLocalDate(new Date());
    const soldMap = {};
    
    if (orders && Array.isArray(orders)) {
      orders.forEach(order => {
        // Check if order is from today (using the 'date' field from DataContext which is YYYY-MM-DD)
        if (order.date === todayStr && order.status !== 'Cancelled') {
          (order.items || []).forEach(item => {
            if (item && item.name) {
              const normalizedName = item.name.trim();
              soldMap[normalizedName] = (soldMap[normalizedName] || 0) + Number(item.amount || 0);
            }
          });
        }
      });
    }
    
    return soldMap;
  }, [orders]);

  // Combined Data for Display
  const displayProducts = useMemo(() => {
    if (!products || !Array.isArray(products)) return [];
    
    let filtered = [...products];
    
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        (p.name && p.name.toLowerCase().includes(lowerQuery)) || 
        (p.type && p.type.toLowerCase().includes(lowerQuery)) ||
        (p.category && p.category.toLowerCase().includes(lowerQuery))
      );
    }
    
    return filtered.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [products, searchQuery]);

  // Grouped Products
  const groupedProducts = useMemo(() => {
    const groups = {};
    displayProducts.forEach(product => {
      const type = product.type || 'Other';
      if (!groups[type]) groups[type] = [];
      groups[type].push(product);
    });
    
    // Sort group names
    return Object.keys(groups)
      .sort((a, b) => a.localeCompare(b))
      .reduce((acc, key) => {
        acc[key] = groups[key];
        return acc;
      }, {});
  }, [displayProducts]);

  // Grouped History by Date
  const groupedHistory = useMemo(() => {
    const groups = {};
    historyData.forEach(report => {
      const date = new Date(report.timestamp).toLocaleDateString('vi-VN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      if (!groups[date]) groups[date] = [];
      groups[date].push(report);
    });
    return groups;
  }, [historyData]);

  // Aggregate Totals
  const totals = useMemo(() => {
    let totalMade = 0;
    let totalSold = 0;
    
    if (Array.isArray(displayProducts)) {
      displayProducts.forEach(p => {
        totalMade += (productionQuantities[p.code] || 0);
        totalSold += (soldQuantities[p.name] || 0);
      });
    }

    return { totalMade, totalSold, remaining: totalMade - totalSold };
  }, [displayProducts, productionQuantities, soldQuantities]);

  const handleQuantityChange = (product, delta) => {
    const productCode = product.code;
    if (!productCode) {
      console.error('Product code missing for', product.name);
      return;
    }

    setProductionQuantities(prev => {
      const current = prev[productCode] || 0;
      const newValue = Math.max(0, current + delta);
      return { ...prev, [productCode]: newValue };
    });
  };

  const handleCopy = () => {
    let copyText = "";
    const activeGroups = {};

    // Sử dụng products gốc để lấy TOÀN BỘ danh sách, không phụ thuộc vào ô tìm kiếm
    products.forEach(product => {
      const made = productionQuantities[product.code] || 0;
      const sold = soldQuantities[product.name] || 0;
      const remaining = made - sold;

      if (remaining > 0) {
        const type = product.type || 'Khác';
        if (!activeGroups[type]) activeGroups[type] = [];
        activeGroups[type].push({
          name: product.name,
          remaining: remaining
        });
      }
    });

    const sortedTypes = Object.keys(activeGroups).sort();

    if (sortedTypes.length === 0) {
      alert("Hiện tại chưa có bánh nào có số lượng > 0 trong kho.");
      return;
    }

    sortedTypes.forEach((type, groupIdx) => {
      copyText += `*${type.toUpperCase()}*\n`;
      const groupItems = activeGroups[type].sort((a, b) => a.name.localeCompare(b.name));
      
      groupItems.forEach((item, itemIdx) => {
        copyText += `${item.name}: ${item.remaining}`;
        if (itemIdx < groupItems.length - 1) {
          copyText += "\n\n"; // Cách 1 dòng mỗi bánh
        }
      });

      if (groupIdx < sortedTypes.length - 1) {
        copyText += "\n\n\n"; // Cách 2 dòng mỗi loại
      }
    });

    if (copyText) {
      navigator.clipboard.writeText(copyText);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleReset = () => {
    if (window.confirm("Bỏ qua mọi thay đổi chưa lưu?")) {
      setProductionQuantities({ ...lastSavedQuantities });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div 
      onClick={() => !showFooter && setShowFooter(true)}
      className="min-h-screen bg-slate-50 relative pb-32 font-sans selection:bg-indigo-100 selection:text-indigo-900"
    >
      {/* Background Decor */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-32 left-20 w-[500px] h-[500px] bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 w-full px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className={`sticky top-0 z-50 transition-all duration-500 ease-in-out ${isScrolled ? 'bg-white/90 backdrop-blur-md shadow-sm -mx-4 px-4 py-2' : 'bg-transparent pt-6 pb-4'}`}>
          <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isScrolled ? 'max-h-0 opacity-0 mb-0' : 'max-h-[200px] opacity-100 mb-4'}`}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent leading-tight text-center md:text-left">
                  Daily Stock Check
                </h1>
                <p className="text-slate-500 font-medium flex items-center mt-1 justify-center md:justify-start">
                  <Calendar className="w-4 h-4 mr-2" />
                  <span className="text-xs md:text-sm">
                    {new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </span>
                </p>
              </div>
              
              {/* Staff Header Info & History Action */}
              <div className="flex items-center justify-center md:justify-end gap-3 scale-90 md:scale-100 origin-center md:origin-right">
                {selectedStaff && (
                  <div className="flex items-center gap-3 bg-white/80 backdrop-blur-md px-4 py-2 rounded-full border border-slate-200 shadow-sm">
                    <div className="bg-indigo-100 p-2 rounded-full">
                      <User className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 leading-none">Working as</p>
                      <p className="text-sm font-bold text-slate-700 leading-tight">
                        {selectedStaff === 'other' 
                          ? otherName 
                          : (activeEmployees?.find(e => e.id === selectedStaff)?.firstName + ' ' + activeEmployees?.find(e => e.id === selectedStaff)?.lastName)
                        }
                      </p>
                    </div>
                    <button 
                      onClick={() => {
                        setSelectedStaff('');
                        setIsEnteringOther(false);
                        // We no longer clear otherName here to allow persistence
                      }}
                      className="ml-2 text-xs font-semibold text-indigo-600 hover:text-indigo-700 p-1 px-2 hover:bg-indigo-50 rounded-lg transition-colors"
                    >
                      Change
                    </button>
                  </div>
                )}

                <button 
                  onClick={() => setShowHistory(true)}
                  className="p-3 bg-white/80 backdrop-blur-md text-slate-500 hover:text-indigo-600 rounded-full border border-slate-200 shadow-sm transition-all hover:shadow-md active:scale-95"
                  title="View History"
                >
                  <History className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Search Bar - Stays sticky with compact padding */}
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            </div>
            <input
              type="text"
              placeholder="Search cakes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`block w-full pl-10 pr-4 border-0 rounded-xl bg-white/50 ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all duration-500 placeholder:text-slate-400 shadow-sm text-sm ${isScrolled ? 'py-2' : 'py-2.5 md:py-3'}`}
            />
          </div>
        </div>

        {/* Type Navigation */}
        <div className="mt-4 mb-2 sticky top-16 z-40 bg-slate-50/90 backdrop-blur-sm border border-slate-100 rounded-xl p-2 shadow-sm">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {Object.keys(groupedProducts).map((type) => (
              <button
                key={type}
                onClick={() => scrollToType(type)}
                className="flex-shrink-0 px-3 py-1.5 text-xs sm:text-sm font-medium bg-white hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 rounded-lg border border-slate-200 hover:border-indigo-200 transition-all whitespace-nowrap"
              >
                {type} ({groupedProducts[type].length})
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="mt-4 space-y-4">
          {!selectedStaff ? (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
              <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
                <div className="bg-indigo-600 p-6 md:p-8 text-white text-center">
                  <div className="bg-white/20 w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4 backdrop-blur-sm">
                    <ChefHat className="w-8 h-8 md:w-10 md:h-10 text-white" />
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold">Who is counting?</h3>
                  <p className="text-indigo-100 mt-1 md:mt-2 text-sm md:text-base opacity-90">Pick your name to start today's stock check</p>
                </div>
                
                <div className="p-4 md:p-6 max-h-[60vh] overflow-y-auto">
                  {!isEnteringOther ? (
                    <div className="grid gap-2 md:gap-3">
                      {Array.isArray(activeEmployees) && activeEmployees.map(emp => (
                        <button
                          key={emp.id}
                          onClick={() => setSelectedStaff(emp.id)}
                          className="flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-xl md:rounded-2xl border-2 border-slate-50 hover:border-indigo-100 hover:bg-slate-50 transition-all duration-200 text-left group"
                        >
                          <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-slate-100 flex items-center justify-center group-hover:bg-indigo-100 transition-colors shrink-0">
                            <User className="w-5 h-5 md:w-6 md:h-6 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 text-sm md:text-base leading-tight">{emp.firstName} {emp.lastName}</p>
                            <p className="text-xs text-slate-500">Staff Member</p>
                          </div>
                        </button>
                      ))}
                      
                      <div className="relative group">
                        <button
                          onClick={() => {
                            if (otherName) {
                              setSelectedStaff('other');
                            } else {
                              setIsEnteringOther(true);
                            }
                          }}
                          className="w-full flex items-center justify-between p-3 md:p-4 rounded-xl md:rounded-2xl border-2 border-dashed border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all duration-200 text-left"
                        >
                          <div className="flex items-center gap-3 md:gap-4 flex-1">
                            <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-slate-50 flex items-center justify-center group-hover:bg-white transition-colors shrink-0">
                              {otherName ? (
                                <User className="w-5 h-5 md:w-6 md:h-6 text-indigo-600" />
                              ) : (
                                <Plus className="w-5 h-5 md:w-6 md:h-6 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                              )}
                            </div>
                            <div>
                              <p className="font-bold text-slate-600 group-hover:text-indigo-700 text-sm md:text-base leading-tight">
                                {otherName ? otherName : 'Người khác / Khách'}
                              </p>
                              <p className="text-xs text-slate-400">
                                {otherName ? 'Nhấn để chọn nhanh' : 'Nhập tên thủ công'}
                              </p>
                            </div>
                          </div>
                        </button>

                        {otherName && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setIsEnteringOther(true);
                            }}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-white shadow-sm transition-all border border-transparent hover:border-indigo-100 z-10"
                            title="Sửa tên"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                      <div>
                        <label className="block text-xs md:text-sm font-bold text-slate-700 mb-1.5 md:mb-2">Họ và tên</label>
                        <input
                          autoFocus
                          type="text"
                          placeholder="Nhập tên của bạn..."
                          value={otherName}
                          onChange={(e) => setOtherName(e.target.value)}
                          className="w-full px-4 py-2.5 md:py-3 rounded-xl border-2 border-slate-100 focus:border-indigo-500 focus:outline-none transition-colors font-medium text-sm md:text-base"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && otherName.trim()) {
                              setSelectedStaff('other');
                            }
                          }}
                        />
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={() => setIsEnteringOther(false)}
                          className="flex-1 px-4 py-2.5 md:py-3 rounded-xl border-2 border-slate-100 font-bold text-slate-500 hover:bg-slate-50 transition-all text-sm md:text-base"
                        >
                          Quay lại
                        </button>
                        <button
                          disabled={!otherName.trim()}
                          onClick={() => setSelectedStaff('other')}
                          className="flex-1 px-4 py-2.5 md:py-3 rounded-xl bg-indigo-600 font-bold text-white hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all disabled:opacity-50 text-sm md:text-base"
                        >
                          Bắt đầu
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="bg-slate-50 p-4 text-center">
                  <p className="text-xs text-slate-400 font-medium">Butter Bake Stock Management</p>
                </div>
              </div>
            </div>
          ) : displayProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500">
              <Package className="w-16 h-16 mb-4 text-slate-300" />
              <p className="text-lg">No products found matching "{searchQuery}"</p>
            </div>
            ) : (
              <div className="space-y-8 pb-8">
                {Object.entries(groupedProducts).map(([type, groupProducts]) => (
                  <div 
                    key={type} 
                    id={`type-${type.replace(/\s+/g, '-').toLowerCase()}`}
                    className="animate-in fade-in slide-in-from-bottom-4 duration-500 pt-4 -mt-4" 
                  >
                    <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                      <div className="h-4 sm:h-6 w-1 bg-indigo-600 rounded-full"></div>
                      <h2 className="text-sm sm:text-base font-bold text-slate-800">{type}</h2>
                      <span className="bg-slate-100 text-slate-500 text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full uppercase tracking-wider">
                        {groupProducts.length} items
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                      {groupProducts.map((product) => {
                        // Use product.code for quantities
                        const made = productionQuantities[product.code] || 0;
                        const sold = soldQuantities[product.name] || 0;
                        const remaining = made - sold;
                        const isNegative = remaining < 0;

                        return (
                          <div 
                            key={product.id}
                            className="group relative bg-white rounded-xl p-3 shadow-sm hover:shadow-md transition-all duration-300 border border-slate-100 flex flex-col"
                          >
                            {/* Header */}
                            <div className="flex justify-between items-start mb-4">
                              <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-slate-800 text-sm line-clamp-2 pr-2 group-hover:text-indigo-600 transition-colors">
                                  {product.name}
                                </h3>
                                {sold > 0 && (
                                  <span className="inline-flex items-center text-xs font-semibold text-orange-600 bg-orange-50 px-2 py-1 rounded-full mt-1">
                                    <TrendingUp className="w-3 h-3 mr-1" />
                                    Sold: {sold}
                                  </span>
                                )}
                              </div>
                              <div className={`flex flex-col items-end ${isNegative ? 'text-red-500' : 'text-emerald-600'}`}>
                                <span className="text-xl font-black tabular-nums tracking-tight">
                                  {remaining}
                                </span>
                                <span className="text-[10px] font-bold uppercase tracking-wider opacity-60 hidden sm:inline">Remaining</span>
                              </div>
                            </div>

                            {/* Controls */}
                            <div className="mt-auto flex items-center justify-between bg-slate-50 rounded-lg p-1 ring-1 ring-slate-200">
                              <button
                                onClick={() => handleQuantityChange(product, -1)}
                                className="p-2 rounded-md bg-white text-slate-600 shadow-sm hover:text-red-600 hover:bg-red-50 active:scale-90 transition-all duration-200"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              
                              <div className="flex flex-col items-center w-full px-1">
                                <span className="text-[9px] text-slate-400 font-bold uppercase leading-tight">Made</span>
                                <input
                                  type="number"
                                  value={made}
                                  onChange={(e) => {
                                    const val = parseInt(e.target.value) || 0;
                                    setProductionQuantities(prev => ({
                                      ...prev,
                                      [product.code]: Math.max(0, val)
                                    }));
                                  }}
                                  className="w-full bg-transparent text-center font-bold text-slate-700 text-base tabular-nums leading-none focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                              </div>

                              <button
                                onClick={() => handleQuantityChange(product, 1)}
                                className="p-2 rounded-md bg-white text-slate-600 shadow-sm hover:text-emerald-600 hover:bg-emerald-50 active:scale-90 transition-all duration-200"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {/* Progress Bar Visual */}
                            {made > 0 && (
                              <div className="mt-3 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full transition-all duration-500 ${
                                    isNegative ? 'bg-red-500' : 'bg-gradient-to-r from-indigo-500 to-purple-500'
                                  }`}
                                  style={{ width: `${Math.min((sold / made) * 100, 100)}%` }}
                                ></div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
        </div>
      </div>

      {/* Floating Bottom Summary Footer */}
      {selectedStaff && (
        <div className={`fixed bottom-6 inset-x-4 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-2xl bg-white/80 backdrop-blur-xl border border-slate-200 p-4 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] z-50 transition-all duration-300 transform ${
          showFooter ? 'translate-y-0 opacity-100' : 'translate-y-32 opacity-0'
        }`}>
          <div className="flex justify-around items-center">
            <div className="hidden md:block text-center group cursor-default">
              <span className="block text-[10px] uppercase font-bold text-slate-400 mb-0.5 group-hover:text-indigo-500 transition-colors">Total Made</span>
              <span className="text-xl font-black text-slate-800 leading-none">{totals.totalMade}</span>
            </div>
            
            <div className="hidden md:block h-8 w-px bg-slate-200"></div>
            
            <div className="hidden md:block text-center group cursor-default">
              <span className="block text-[10px] uppercase font-bold text-slate-400 mb-0.5 group-hover:text-orange-500 transition-colors">Total Sold</span>
              <span className="text-xl font-black text-orange-600 leading-none">{totals.totalSold}</span>
            </div>
            
            <div className="hidden md:block h-8 w-px bg-slate-200"></div>
            
            <div className="hidden md:block text-center group cursor-default">
              <span className="block text-[10px] uppercase font-bold text-slate-400 mb-0.5 group-hover:text-emerald-500 transition-colors">Remaining</span>
              <span className={`text-xl font-black leading-none ${totals.remaining < 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                {totals.remaining}
              </span>
            </div>

            <div className={`flex items-center gap-2 w-full md:w-auto transition-all duration-300 md:pl-4 md:border-l md:border-slate-200 md:ml-2`}>
              {!hasChanges ? (
                <button
                  onClick={handleCopy}
                  className={`flex-1 md:flex-none px-6 py-2.5 md:py-2 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 text-sm ${
                    isCopied 
                      ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                      : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-100'
                  }`}
                >
                  {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {isCopied ? 'Copied list!' : 'Get list'}
                </button>
              ) : (
                <div className="flex gap-2 w-full">
                  <button
                    onClick={handleReset}
                    className="flex-1 md:flex-none bg-slate-100 text-slate-500 hover:bg-slate-200 px-4 py-2.5 md:py-2 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 text-sm"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Reset
                  </button>
                  <button
                    onClick={handleUpdate}
                    disabled={isUpdating}
                    className="flex-[2] md:flex-none bg-orange-600 hover:bg-orange-700 text-white px-8 py-2.5 md:py-2 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-orange-100 active:scale-95 transition-all disabled:opacity-50 text-sm"
                  >
                    {isUpdating ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4 font-black" />
                    )}
                    Update
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* History Drawer (Right Side) */}
      {showHistory && (
        <div className="fixed inset-0 z-[110] flex justify-end bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setShowHistory(false)}>
          <div 
            className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col animate-slide-in-right"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-lg shadow-indigo-100">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Lịch sử cập nhật</h3>
                  <p className="text-xs text-slate-500 font-medium">Lịch sử thay đổi số liệu kho</p>
                </div>
              </div>
              <button 
                onClick={() => setShowHistory(false)}
                className="p-2 hover:bg-slate-50 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-5 space-y-8 scroll-smooth">
              {isLoadingHistory ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                  <p className="text-sm font-medium text-slate-500">Đang tải lịch sử...</p>
                </div>
              ) : historyData.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
                  <Clock className="w-12 h-12 opacity-20" />
                  <p className="font-medium">Chưa có lịch sử cập nhật nào</p>
                </div>
              ) : (
                Object.entries(groupedHistory).map(([date, reports]) => (
                  <div key={date} className="space-y-4">
                    <div className="sticky top-0 z-20 -mx-4 px-4 py-2 bg-white/95 backdrop-blur-md border-b border-slate-50">
                      <h4 className="text-[11px] font-black text-indigo-600 uppercase tracking-[0.2em]">{date}</h4>
                    </div>
                    
                    <div className="space-y-4">
                      {reports.map((report) => (
                        <div key={report.id} className="bg-slate-50 rounded-2xl p-4 border border-slate-100/50 shadow-sm transition-transform active:scale-[0.98]">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="bg-white p-2 rounded-lg border border-slate-100 shadow-sm">
                                <User className="w-4 h-4 text-indigo-600" />
                              </div>
                              <div>
                                <p className="font-bold text-slate-800 text-sm">{report.staffName}</p>
                                <p className="text-[10px] text-slate-400 flex items-center gap-1 uppercase tracking-wider font-bold">
                                  <Clock className="w-2.5 h-2.5" />
                                  {new Date(report.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Status</p>
                              <p className="text-xs font-black text-emerald-600">SUCCESS</p>
                            </div>
                          </div>

                          <div className="space-y-2">
                            {Object.entries(report.changes || {}).map(([code, change]) => (
                              <div key={code} className="flex items-center justify-between text-xs bg-white py-2 px-3 rounded-xl border border-slate-50 shadow-sm">
                                <span className="font-bold text-slate-600 truncate max-w-[120px]">{change.name}</span>
                                <div className="flex items-center gap-2 md:gap-3 font-mono shrink-0">
                                  <span className="text-slate-400">{change.from}</span>
                                  <ArrowRight className="w-3 h-3 text-indigo-400" />
                                  <span className={`font-black ${change.diff > 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                                    {change.to}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100">
              <button 
                onClick={() => setShowHistory(false)}
                className="w-full py-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-white hover:border-slate-300 transition-all shadow-sm"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSS Animation Keyframes */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(-5%); animation-timing-function: cubic-bezier(0.8,0,1,1); }
          50% { transform: none; animation-timing-function: cubic-bezier(0,0,0.2,1); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 3s infinite;
        }
        .pb-safe {
          padding-bottom: env(safe-area-inset-bottom, 20px);
        }
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0.5; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-in-right {
          animation: slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}} />
    </div>
  );
};

export default StaffCakeCount;
