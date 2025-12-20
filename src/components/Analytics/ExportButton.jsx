import React, { useState } from 'react';
import { Download, Loader2, ChevronDown } from 'lucide-react';
import {
    exportProductionMetrics,
    exportProductComparison,
    exportTimeSlotAnalysis,
    exportAllAnalytics
} from '../../utils/exportAnalytics';

const ExportButton = ({
    productionMetrics,
    timeRange,
    disabled = false
}) => {
    const [isLoading, setIsLoading] = useState(false);
    const [showOptions, setShowOptions] = useState(false);

    const handleExport = async (type) => {
        setIsLoading(true);
        setShowOptions(false);

        try {
            const exportDate = new Date();

            switch (type) {
                case 'production':
                    exportProductionMetrics(productionMetrics, timeRange, exportDate);
                    break;
                case 'products':
                    exportProductComparison(productionMetrics?.productProduction, timeRange, exportDate);
                    break;
                case 'timeslots':
                    exportTimeSlotAnalysis(productionMetrics?.timeSlotDistribution, timeRange, exportDate);
                    break;
                case 'all':
                    exportAllAnalytics(productionMetrics, timeRange, exportDate);
                    break;
                default:
                    break;
            }
        } catch (error) {
            console.error('Export failed:', error);
        } finally {
            // Small delay to show loading state
            setTimeout(() => {
                setIsLoading(false);
            }, 500);
        }
    };

    return (
        <div className="relative">
            <button
                onClick={() => !isLoading && setShowOptions(!showOptions)}
                disabled={disabled || isLoading}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isLoading ? (
                    <Loader2 size={16} className="animate-spin" />
                ) : (
                    <Download size={16} />
                )}
                <span className="text-sm font-medium">
                    {isLoading ? 'Exporting...' : 'Export'}
                </span>
                {!isLoading && <ChevronDown size={14} />}
            </button>

            {showOptions && !isLoading && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => setShowOptions(false)}
                    />

                    {/* Dropdown */}
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
                        <div className="py-1">
                            <button
                                onClick={() => handleExport('production')}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                Production Metrics
                            </button>
                            <button
                                onClick={() => handleExport('products')}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                Product Comparison
                            </button>
                            <button
                                onClick={() => handleExport('timeslots')}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                Time Slot Analysis
                            </button>
                            <div className="border-t border-gray-100 my-1"></div>
                            <button
                                onClick={() => handleExport('all')}
                                className="w-full px-4 py-2 text-left text-sm font-medium text-blue-600 hover:bg-blue-50 transition-colors"
                            >
                                Export All Data
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default ExportButton;