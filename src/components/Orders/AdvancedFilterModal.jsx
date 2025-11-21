import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, Clock, XCircle, Layers } from 'lucide-react';

const AdvancedFilterModal = ({ isOpen, onClose, onApply, availableCakeTypes, initialFilters, maxPriceLimit = 5000000, statusOptions = [] }) => {
    const [filters, setFilters] = useState(initialFilters);
    const [priceRange, setPriceRange] = useState([0, maxPriceLimit]);

    useEffect(() => {
        setFilters(initialFilters);
        if (initialFilters.minPrice || initialFilters.maxPrice) {
            setPriceRange([
                Number(initialFilters.minPrice) || 0,
                Number(initialFilters.maxPrice) || maxPriceLimit
            ]);
        } else {
            setPriceRange([0, maxPriceLimit]);
        }
    }, [initialFilters, maxPriceLimit, isOpen]);

    const handleStatusChange = (status) => {
        if (status === 'All') {
            setFilters(prev => ({ ...prev, status: [] }));
            return;
        }

        setFilters(prev => {
            const newStatus = prev.status.includes(status)
                ? prev.status.filter(s => s !== status)
                : [...prev.status, status];
            return { ...prev, status: newStatus };
        });
    };

    const handleCakeTypeChange = (type) => {
        setFilters(prev => {
            const newTypes = prev.cakeTypes.includes(type)
                ? prev.cakeTypes.filter(t => t !== type)
                : [...prev.cakeTypes, type];
            return { ...prev, cakeTypes: newTypes };
        });
    };

    const handlePriceChange = (e, index) => {
        const value = Number(e.target.value);
        const newRange = [...priceRange];
        newRange[index] = value;

        // Ensure min <= max
        if (index === 0 && value > newRange[1]) newRange[1] = value;
        if (index === 1 && value < newRange[0]) newRange[0] = value;

        setPriceRange(newRange);
    };

    const handleApply = () => {
        onApply({
            ...filters,
            minPrice: priceRange[0],
            maxPrice: priceRange[1]
        });
        onClose();
    };

    const handleReset = () => {
        setFilters({
            cakeTypes: [],
            status: [],
            minPrice: '',
            maxPrice: ''
        });
        setPriceRange([0, maxPriceLimit]);
    };

    if (!isOpen) return null;



    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity duration-300" onClick={onClose}>
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl animate-in fade-in zoom-in-95 duration-300 ease-out flex flex-col max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <div className="p-4 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
                    <h2 className="text-lg font-bold text-gray-900">Filter Orders</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-4 space-y-6">
                    {/* Status */}
                    <div>
                        <h3 className="text-sm font-bold text-gray-900 mb-3">Status</h3>
                        <div className="grid grid-cols-2 gap-3">
                            {statusOptions.map((option) => {
                                const isSelected = option.value === 'All'
                                    ? filters.status.length === 0
                                    : filters.status.includes(option.value);

                                return (
                                    <button
                                        key={option.value}
                                        onClick={() => handleStatusChange(option.value)}
                                        className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${isSelected
                                            ? `ring-2 ring-primary/50 border-primary bg-primary/5`
                                            : 'border-gray-100 hover:bg-gray-50 hover:border-gray-200'
                                            }`}
                                    >
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${option.bg} ${option.color}`}>
                                            <option.icon size={16} />
                                        </div>
                                        <span className={`text-sm font-medium ${isSelected ? 'text-primary' : 'text-gray-700'}`}>
                                            {option.label}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Cake Types */}
                    <div>
                        <h3 className="text-sm font-bold text-gray-900 mb-3">Cake Types</h3>
                        <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                            {availableCakeTypes.map(type => (
                                <label key={type} className="flex items-center gap-2 cursor-pointer group p-2 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors flex-shrink-0 ${filters.cakeTypes.includes(type)
                                        ? 'bg-primary border-primary'
                                        : 'border-gray-300 group-hover:border-primary'
                                        }`}>
                                        {filters.cakeTypes.includes(type) && <span className="text-white text-[10px]">✓</span>}
                                    </div>
                                    <input
                                        type="checkbox"
                                        className="hidden"
                                        checked={filters.cakeTypes.includes(type)}
                                        onChange={() => handleCakeTypeChange(type)}
                                    />
                                    <span className="text-xs text-gray-700 break-words leading-tight">{type}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Price Range */}
                    <div>
                        <h3 className="text-sm font-bold text-gray-900 mb-3">Price Range</h3>
                        <div className="px-2">
                            <div className="relative h-10 mb-4">
                                <input
                                    type="range"
                                    min="0"
                                    max={maxPriceLimit}
                                    step="10000"
                                    value={priceRange[0]}
                                    onChange={(e) => handlePriceChange(e, 0)}
                                    className="absolute w-full pointer-events-none appearance-none z-20 h-1 bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-md"
                                />
                                <input
                                    type="range"
                                    min="0"
                                    max={maxPriceLimit}
                                    step="10000"
                                    value={priceRange[1]}
                                    onChange={(e) => handlePriceChange(e, 1)}
                                    className="absolute w-full pointer-events-none appearance-none z-30 h-1 bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-md"
                                />
                                <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-200 rounded-full -translate-y-1/2 z-10"></div>
                                <div
                                    className="absolute top-1/2 h-1 bg-primary rounded-full -translate-y-1/2 z-10"
                                    style={{
                                        left: `${(priceRange[0] / maxPriceLimit) * 100}%`,
                                        right: `${100 - (priceRange[1] / maxPriceLimit) * 100}%`
                                    }}
                                ></div>
                            </div>
                            <div className="flex justify-between items-center text-sm font-medium text-gray-700">
                                <span>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(priceRange[0])}</span>
                                <span>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(priceRange[1])}</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="p-4 border-t border-gray-100 flex gap-3 sticky bottom-0 bg-white">
                    <button
                        onClick={handleReset}
                        className="flex-1 px-4 py-2 text-sm font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        Reset
                    </button>
                    <button
                        onClick={handleApply}
                        className="flex-1 px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-light rounded-lg transition-colors"
                    >
                        Apply Filters
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdvancedFilterModal;
