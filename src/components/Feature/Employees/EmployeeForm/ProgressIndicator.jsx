import React from 'react';
import { CheckCircle2, Circle, AlertCircle } from 'lucide-react';

const ProgressIndicator = ({ sections, currentSection, onSectionClick, errors = {} }) => {
    // Calculate completion percentage
    const completedSections = sections.filter(section => section.isComplete).length;
    const totalSections = sections.length;
    const completionPercentage = totalSections > 0 ? Math.round((completedSections / totalSections) * 100) : 0;

    const getSectionStatus = (section) => {
        if (section.isComplete) return 'completed';
        if (section.hasErrors) return 'error';
        if (section.isRequired && !section.isComplete) return 'required';
        return 'incomplete';
    };

    const getSectionIcon = (status) => {
        switch (status) {
            case 'completed':
                return <CheckCircle2 size={20} className="text-green-500" />;
            case 'error':
                return <AlertCircle size={20} className="text-red-500" />;
            default:
                return <Circle size={20} className="text-gray-300" />;
        }
    };

    const getSectionColor = (status, isActive) => {
        if (isActive) return 'border-primary bg-primary/5';
        switch (status) {
            case 'completed':
                return 'border-green-500 bg-green-50 hover:bg-green-100';
            case 'error':
                return 'border-red-500 bg-red-50 hover:bg-red-100';
            case 'required':
                return 'border-orange-500 bg-orange-50 hover:bg-orange-100';
            default:
                return 'border-gray-200 hover:border-gray-300 hover:bg-gray-50';
        }
    };

    return (
        <div className="space-y-4">
            {/* Overall Progress */}
            <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Form Completion</span>
                    <span className="text-sm font-bold text-gray-900">{completionPercentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                        className="bg-gradient-to-r from-primary to-primary-light h-2 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${completionPercentage}%` }}
                    />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                    {completedSections} of {totalSections} sections completed
                </p>
            </div>

            {/* Section Navigation */}
            <nav className="space-y-2">
                {sections.map((section, index) => {
                    const status = getSectionStatus(section);
                    const isActive = section.id === currentSection;
                    const hasErrors = Object.keys(errors).some(key =>
                        key.startsWith(section.id) ||
                        (section.errorFields && section.errorFields.some(field => errors[field]))
                    );

                    return (
                        <button
                            key={section.id}
                            onClick={() => onSectionClick?.(section.id)}
                            className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                                getSectionColor(status, isActive)
                            } ${onSectionClick ? 'cursor-pointer' : 'cursor-default'}`}
                            disabled={!onSectionClick}
                        >
                            {/* Step Number */}
                            <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-white rounded-full border-2">
                                <span className={`text-sm font-medium ${
                                    status === 'completed' ? 'text-green-500' :
                                    status === 'error' ? 'text-red-500' :
                                    isActive ? 'text-primary' : 'text-gray-400'
                                }`}>
                                    {index + 1}
                                </span>
                            </div>

                            {/* Icon */}
                            <div className="flex-shrink-0">
                                {getSectionIcon(status)}
                            </div>

                            {/* Section Info */}
                            <div className="flex-1 text-left">
                                <h3 className={`font-medium text-sm ${
                                    isActive ? 'text-primary' :
                                    status === 'completed' ? 'text-green-700' :
                                    status === 'error' ? 'text-red-700' :
                                    'text-gray-700'
                                }`}>
                                    {section.label}
                                </h3>
                                {section.description && (
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        {section.description}
                                    </p>
                                )}
                                {hasErrors && (
                                    <p className="text-xs text-red-600 mt-0.5">
                                        Please fix errors to continue
                                    </p>
                                )}
                            </div>

                            {/* Required Badge */}
                            {section.isRequired && !section.isComplete && (
                                <span className="flex-shrink-0 px-2 py-1 text-xs font-medium text-orange-700 bg-orange-100 rounded">
                                    Required
                                </span>
                            )}
                        </button>
                    );
                })}
            </nav>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 text-xs text-gray-500 pt-2 border-t border-gray-200">
                <div className="flex items-center gap-1">
                    <CheckCircle2 size={14} className="text-green-500" />
                    <span>Completed</span>
                </div>
                <div className="flex items-center gap-1">
                    <AlertCircle size={14} className="text-red-500" />
                    <span>Has Errors</span>
                </div>
                <div className="flex items-center gap-1">
                    <Circle size={14} className="text-gray-300" />
                    <span>Incomplete</span>
                </div>
            </div>
        </div>
    );
};

export default ProgressIndicator;