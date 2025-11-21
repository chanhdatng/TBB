import React, { useRef, useEffect } from 'react';

const DateSelector = ({ selectedDate, onSelectDate, orderCounts = {} }) => {
    const scrollRef = useRef(null);

    // Generate dates: 14 days back and 14 days forward from today
    const dates = [];
    const today = new Date();
    for (let i = -14; i <= 14; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        dates.push(date);
    }

    const formatDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const isSelected = (date) => {
        return formatDate(date) === selectedDate;
    };

    const isWeekend = (date) => {
        const day = date.getDay();
        return day === 0 || day === 6; // 0 is Sunday, 6 is Saturday
    };

    // Scroll to selected date on mount
    useEffect(() => {
        if (scrollRef.current) {
            const selectedElement = scrollRef.current.querySelector('.selected-date');
            if (selectedElement) {
                selectedElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
            }
        }
    }, []);

    return (
        <div
            ref={scrollRef}
            className="w-full max-w-full overflow-x-auto pb-4 pt-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']"
        >
            <div className="flex gap-2 min-w-max px-1">
                <button
                    onClick={() => onSelectDate(null)}
                    className={`
                        flex flex-col items-center justify-center min-w-[64px] h-[84px] rounded-2xl border transition-all duration-200
                        ${!selectedDate
                            ? 'bg-primary text-white border-primary shadow-md scale-105'
                            : 'bg-white text-gray-500 border-gray-200 hover:border-primary/50 hover:bg-gray-50'
                        }
                    `}
                >
                    <span className="text-xs font-medium uppercase">Tất cả</span>
                </button>
                {dates.map((date) => {
                    const dateString = formatDate(date);
                    const selected = isSelected(date);
                    const weekend = isWeekend(date);
                    const count = orderCounts[dateString] || 0;

                    return (
                        <button
                            key={dateString}
                            onClick={() => onSelectDate(dateString)}
                            className={`
                group flex flex-col items-center justify-center w-[72px] h-[84px] rounded-2xl transition-all duration-200 relative flex-shrink-0
                ${selected ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-105 selected-date' : 'bg-white hover:bg-gray-50 border border-gray-100'}
              `}
                        >
                            <span className={`
                text-[10px] font-bold uppercase tracking-wider mb-0.5
                ${selected ? 'text-white/90' : weekend ? 'text-red-500' : 'text-gray-400'}
              `}>
                                {date.toLocaleDateString('en-US', { weekday: 'short' })}
                            </span>
                            <span className={`
                text-xl font-bold mb-1
                ${selected ? 'text-white' : 'text-gray-900'}
              `}>
                                {date.getDate()}
                            </span>

                            {/* Order Count Text */}
                            <span className={`
                                text-[10px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap
                                ${selected
                                    ? 'bg-white/20 text-white'
                                    : 'bg-gray-100 text-gray-600'
                                }
                            `}>
                                {count} đơn
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default DateSelector;
