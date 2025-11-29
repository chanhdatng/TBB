import React, { useMemo } from 'react';
import { Sun, Sunset, Moon, Package, Clock, Copy } from 'lucide-react';
import { copyToClipboard } from '../../utils/clipboard';
import { useToast } from '../../contexts/ToastContext';

const ShiftSummaryCards = ({ orders }) => {
    const { showToast } = useToast();

    const summary = useMemo(() => {
        const shifts = {
            morning: { count: 0, cakes: {}, label: 'Morning', time: 'Before 12:00', icon: Sun, color: 'text-orange-500', bg: 'bg-orange-50' },
            afternoon: { count: 0, cakes: {}, label: 'Afternoon', time: '12:00 - 18:00', icon: Sunset, color: 'text-amber-500', bg: 'bg-amber-50' },
            evening: { count: 0, cakes: {}, label: 'Evening', time: 'After 18:00', icon: Moon, color: 'text-indigo-500', bg: 'bg-indigo-50' }
        };

        orders.forEach(order => {
            const timeString = order.timeline?.received?.time;
            if (!timeString) return;
            
            // Parse time (HH:mm)
            const [hours] = timeString.split(':').map(Number);
            let shiftKey = 'evening';
            
            if (hours < 12) shiftKey = 'morning';
            else if (hours < 18) shiftKey = 'afternoon';

            shifts[shiftKey].count++;

            // Aggregate cakes
            if (order.items) {
                order.items.forEach(item => {
                    const name = item.name || 'Unknown';
                    shifts[shiftKey].cakes[name] = (shifts[shiftKey].cakes[name] || 0) + (Number(item.amount) || 0);
                });
            }
        });

        return Object.values(shifts);
    }, [orders]);

    const handleCopyShiftCakes = async (shift) => {
        if (Object.keys(shift.cakes).length === 0) {
            showToast('No cakes to copy for this shift', 'info');
            return;
        }

        const lines = [`${shift.label} Shift Cakes:`];
        Object.entries(shift.cakes).forEach(([cake, quantity]) => {
            lines.push(`- ${cake}: ${quantity}`);
        });
        
        const text = lines.join('\n');
        const success = await copyToClipboard(text);
        
        if (success) {
            showToast(`Copied ${shift.label} cakes to clipboard!`, 'success');
        } else {
            showToast('Failed to copy to clipboard', 'error');
        }
    };

    return (
        <div className="grid grid-cols-3 gap-2 md:gap-4 mb-6">
            {summary.map((shift) => (
                <div key={shift.label} className="bg-white p-2 sm:p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow group">
                    <div className="flex items-center justify-between mb-2 sm:mb-3">
                        <div className="flex items-center gap-2 sm:gap-3">
                            <div 
                                onClick={() => handleCopyShiftCakes(shift)}
                                className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full ${shift.bg} flex items-center justify-center ${shift.color} cursor-pointer hover:scale-110 active:scale-95 transition-transform relative`}
                                title="Click to copy cake list"
                            >
                                <shift.icon size={16} className="sm:w-5 sm:h-5" />
                                <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Copy size={10} className="text-gray-400" />
                                </div>
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 hidden sm:block">{shift.label}</h3>
                                <p className="text-xs text-gray-500 flex items-center gap-1">
                                    <Clock size={10} /> <span className="hidden sm:inline">{shift.time}</span>
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="text-lg sm:text-2xl font-bold text-gray-900">{shift.count}</span>
                            <p className="text-xs text-gray-500 hidden sm:block">Orders</p>
                        </div>
                    </div>

                    <div className="border-t border-gray-100 pt-2 sm:pt-3 mt-2">
                        <p className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-1">
                            <Package size={12} /> <span className="hidden sm:inline">Cake Breakdown</span>
                        </p>
                        {Object.keys(shift.cakes).length > 0 ? (
                            <div className="space-y-1 max-h-32 overflow-y-auto pr-1 custom-scrollbar">
                                {Object.entries(shift.cakes).map(([cake, quantity]) => (
                                    <div key={cake} className="flex justify-between text-xs sm:text-sm">
                                        <span className="text-gray-600 truncate pr-2 flex-1 min-w-0" title={cake}>{cake}</span>
                                        <span className="font-medium text-gray-900 bg-gray-50 px-1.5 rounded text-xs flex items-center flex-shrink-0">x{quantity}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-xs text-gray-400 italic text-center py-2">No cakes ordered</p>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ShiftSummaryCards;

