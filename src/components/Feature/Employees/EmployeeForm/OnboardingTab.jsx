import React, { useState, useEffect } from 'react';
import {
    Calendar,
    Users,
    BookOpen,
    Target,
    Settings,
    Clock,
    CheckCircle,
    AlertCircle,
    UserPlus,
    Laptop,
    Coffee,
    Map
} from 'lucide-react';

const OnboardingTab = ({
    formData,
    onChange,
    errors,
    setErrors,
    touched,
    setTouched,
    disabled = false,
    availableEmployees = []
}) => {
    // Initialize onboarding data
    const onboardingData = formData.onboarding || {};

    // State for buddy employee search
    const [buddySearch, setBuddySearch] = useState('');
    const [showBuddyList, setShowBuddyList] = useState(false);

    // Onboarding preferences
    const preferences = [
        {
            id: 'remote_welcome',
            icon: <Laptop size={18} />,
            label: 'Remote Welcome Kit',
            description: 'Send equipment and welcome package to home address'
        },
        {
            id: 'in_person_training',
            icon: <BookOpen size={18} />,
            label: 'In-Person Training',
            description: 'Schedule face-to-face training sessions'
        },
        {
            id: 'team_introduction',
            icon: <Users size={18} />,
            label: 'Team Introduction Meeting',
            description: 'Schedule meeting with immediate team members'
        },
        {
            id: 'buddy_system',
            icon: <UserPlus size={18} />,
            label: 'Buddy System',
            description: 'Assign a buddy for first 30 days'
        },
        {
            id: 'it_setup',
            icon: <Settings size={18} />,
            label: 'IT Setup Assistance',
            description: 'Schedule IT orientation and account setup'
        },
        {
            id: 'office_tour',
            icon: <Map size={18} />,
            label: 'Office Tour',
            description: 'Physical tour of office and facilities'
        },
        {
            id: 'welcome_lunch',
            icon: <Coffee size={18} />,
            label: 'Welcome Lunch',
            description: 'Organize welcome lunch with team'
        },
        {
            id: 'goal_setting',
            icon: <Target size={18} />,
            label: '30-Day Goal Setting',
            description: 'Set initial goals and expectations'
        }
    ];

    // Handle input changes
    const handleInputChange = (field, value) => {
        const updatedOnboarding = { ...onboardingData, [field]: value };
        onChange('onboarding', updatedOnboarding);

        // Mark field as touched
        setTouched(prev => ({ ...prev, [field]: true }));

        // Clear error for this field if it exists
        if (errors[field]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    // Handle preference toggle
    const handlePreferenceToggle = (preferenceId) => {
        const currentPreferences = onboardingData.preferences || [];
        const updatedPreferences = currentPreferences.includes(preferenceId)
            ? currentPreferences.filter(id => id !== preferenceId)
            : [...currentPreferences, preferenceId];

        handleInputChange('preferences', updatedPreferences);
    };

    // Filter available employees for buddy assignment
    const filteredEmployees = availableEmployees.filter(employee =>
        !formData.id || employee.id !== formData.id // Exclude current employee
    ).filter(employee =>
        employee.name?.toLowerCase().includes(buddySearch.toLowerCase()) ||
        employee.position?.toLowerCase().includes(buddySearch.toLowerCase())
    );

    // Handle buddy selection
    const handleBuddySelect = (employeeId) => {
        const employee = availableEmployees.find(e => e.id === employeeId);
        if (employee) {
            handleInputChange('buddy', {
                id: employee.id,
                name: employee.name,
                position: employee.position,
                department: employee.department
            });
            setShowBuddyList(false);
            setBuddySearch('');
        }
    };

    // Clear buddy selection
    const clearBuddySelection = () => {
        handleInputChange('buddy', null);
    };

    // Get selected preferences
    const selectedPreferences = onboardingData.preferences || [];

    // Calculate onboarding duration
    const getDurationDisplay = (days) => {
        if (days <= 7) return '1 Week';
        if (days <= 14) return '2 Weeks';
        if (days <= 30) return '1 Month';
        return `${Math.round(days / 7)} Weeks`;
    };

    // Generate onboarding schedule based on preferences
    const generateSchedule = () => {
        const startDate = new Date(onboardingData.startDate || formData.hireDate);
        const duration = parseInt(onboardingData.duration) || 14;
        const schedule = [];

        // Day 1: Basic Orientation
        schedule.push({
            day: 1,
            title: 'First Day Orientation',
            items: ['Welcome and introductions', 'HR paperwork', 'IT account setup']
        });

        // Day 2-3: Team Integration
        if (selectedPreferences.includes('team_introduction')) {
            schedule.push({
                day: 2,
                title: 'Team Integration',
                items: ['Meet with immediate team', 'Project overview', 'Communication tools setup']
            });
        }

        // Day 4-5: Buddy System Start
        if (selectedPreferences.includes('buddy_system')) {
            schedule.push({
                day: 4,
                title: 'Buddy System Kick-off',
                items: ['Meet assigned buddy', 'Daily check-in schedule', 'Q&A session']
            });
        }

        // Week 2: Training Goals
        if (selectedPreferences.includes('goal_setting')) {
            schedule.push({
                day: 7,
                title: '30-Day Goal Setting',
                items: ['Define initial objectives', 'Set success metrics', 'Review timeline']
            });
        }

        return schedule;
    };

    const schedule = generateSchedule();

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Calendar size={20} />
                    Onboarding Configuration
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                    Customize the onboarding experience for the new employee
                </p>
            </div>

            {/* Onboarding Schedule */}
            <div className="space-y-4">
                <h4 className="font-semibold text-gray-900">Schedule Details</h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Onboarding Start Date
                        </label>
                        <div className="relative">
                            <Calendar size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="date"
                                value={onboardingData.startDate || formData.hireDate || ''}
                                onChange={(e) => handleInputChange('startDate', e.target.value)}
                                min={formData.hireDate}
                                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                                    errors.startDate ? 'border-red-300' : 'border-gray-200'
                                } ${disabled ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                                disabled={disabled}
                            />
                        </div>
                        {errors.startDate && (
                            <p className="mt-1 text-sm text-red-600">{errors.startDate}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Onboarding Duration
                        </label>
                        <select
                            value={onboardingData.duration || '14'}
                            onChange={(e) => handleInputChange('duration', e.target.value)}
                            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                                errors.duration ? 'border-red-300' : 'border-gray-200'
                            } ${disabled ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                            disabled={disabled}
                        >
                            <option value="7">1 Week</option>
                            <option value="14">2 Weeks</option>
                            <option value="21">3 Weeks</option>
                            <option value="30">1 Month</option>
                        </select>
                        {errors.duration && (
                            <p className="mt-1 text-sm text-red-600">{errors.duration}</p>
                        )}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Onboarding Location
                    </label>
                    <select
                        value={onboardingData.location || 'office'}
                        onChange={(e) => handleInputChange('location', e.target.value)}
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                            errors.location ? 'border-red-300' : 'border-gray-200'
                        } ${disabled ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                        disabled={disabled}
                    >
                        <option value="office">In-Office</option>
                        <option value="remote">Remote</option>
                        <option value="hybrid">Hybrid</option>
                    </select>
                </div>
            </div>

            {/* Buddy System */}
            <div className="space-y-4">
                <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                    <UserPlus size={18} />
                    Buddy System
                </h4>

                <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-3">
                        Assign a buddy to help the new employee navigate their first 30 days
                    </p>

                    {onboardingData.buddy ? (
                        <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200">
                            <div>
                                <p className="font-medium text-gray-900">{onboardingData.buddy.name}</p>
                                <p className="text-sm text-gray-600">
                                    {onboardingData.buddy.position} • {onboardingData.buddy.department}
                                </p>
                            </div>
                            {!disabled && (
                                <button
                                    type="button"
                                    onClick={clearBuddySelection}
                                    className="text-red-500 hover:text-red-700"
                                >
                                    Remove
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="relative">
                            <input
                                type="text"
                                value={buddySearch}
                                onChange={(e) => {
                                    setBuddySearch(e.target.value);
                                    setShowBuddyList(true);
                                }}
                                onFocus={() => setShowBuddyList(true)}
                                placeholder="Search for employee to assign as buddy..."
                                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                                    errors.buddy ? 'border-red-300' : 'border-gray-200'
                                } ${disabled ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                                disabled={disabled}
                            />

                            {showBuddyList && buddySearch && !disabled && (
                                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                    {filteredEmployees.length > 0 ? (
                                        filteredEmployees.map(employee => (
                                            <button
                                                key={employee.id}
                                                type="button"
                                                onClick={() => handleBuddySelect(employee.id)}
                                                className="w-full px-4 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
                                            >
                                                <p className="font-medium text-gray-900">{employee.name}</p>
                                                <p className="text-sm text-gray-600">
                                                    {employee.position} • {employee.department}
                                                </p>
                                            </button>
                                        ))
                                    ) : (
                                        <div className="px-4 py-2 text-sm text-gray-500">
                                            No employees found
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Onboarding Preferences */}
            <div className="space-y-4">
                <h4 className="font-semibold text-gray-900">Onboarding Preferences</h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {preferences.map(preference => (
                        <label
                            key={preference.id}
                            className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                                selectedPreferences.includes(preference.id)
                                    ? 'border-primary bg-primary/5'
                                    : 'border-gray-200 hover:bg-gray-50'
                            } ${disabled ? 'cursor-not-allowed opacity-75' : ''}`}
                        >
                            <input
                                type="checkbox"
                                checked={selectedPreferences.includes(preference.id)}
                                onChange={() => !disabled && handlePreferenceToggle(preference.id)}
                                className="mt-1 rounded text-primary focus:ring-primary"
                                disabled={disabled}
                            />
                            <div className="flex items-start gap-2">
                                <div className="text-primary mt-0.5">
                                    {preference.icon}
                                </div>
                                <div>
                                    <p className="font-medium text-gray-900">{preference.label}</p>
                                    <p className="text-sm text-gray-600">{preference.description}</p>
                                </div>
                            </div>
                        </label>
                    ))}
                </div>
            </div>

            {/* Special Requirements */}
            <div className="space-y-4">
                <h4 className="font-semibold text-gray-900">Special Requirements</h4>

                <textarea
                    value={onboardingData.specialRequirements || ''}
                    onChange={(e) => handleInputChange('specialRequirements', e.target.value)}
                    placeholder="Any special requirements or accommodations for onboarding..."
                    rows={3}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none ${
                        errors.specialRequirements ? 'border-red-300' : 'border-gray-200'
                    } ${disabled ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                    disabled={disabled}
                    maxLength={500}
                />
                <p className="text-sm text-gray-500 text-right">
                    {(onboardingData.specialRequirements || '').length}/500 characters
                </p>
            </div>

            {/* Generated Schedule Preview */}
            {selectedPreferences.length > 0 && (
                <div className="space-y-4">
                    <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                        <Clock size={18} />
                        Onboarding Schedule Preview
                    </h4>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="space-y-3">
                            {schedule.map((item, index) => (
                                <div key={index} className="flex gap-3">
                                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                                        {item.day}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium text-gray-900">{item.title}</p>
                                        <ul className="text-sm text-gray-600 mt-1 list-disc list-inside">
                                            {item.items.map((i, idx) => (
                                                <li key={idx}>{i}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Status Summary */}
            <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-900">Configuration Summary</h4>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        selectedPreferences.length >= 4
                            ? 'bg-green-100 text-green-800'
                            : selectedPreferences.length >= 2
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-red-100 text-red-800'
                    }`}>
                        {selectedPreferences.length >= 4 ? 'Complete' :
                         selectedPreferences.length >= 2 ? 'Partial' : 'Minimal'}
                    </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                        <span className="text-gray-600">Duration:</span>
                        <p className="font-medium">
                            {getDurationDisplay(parseInt(onboardingData.duration) || 14)}
                        </p>
                    </div>
                    <div>
                        <span className="text-gray-600">Location:</span>
                        <p className="font-medium capitalize">
                            {onboardingData.location || 'office'}
                        </p>
                    </div>
                    <div>
                        <span className="text-gray-600">Buddy:</span>
                        <p className="font-medium">
                            {onboardingData.buddy?.name || 'Not assigned'}
                        </p>
                    </div>
                    <div>
                        <span className="text-gray-600">Preferences:</span>
                        <p className="font-medium">{selectedPreferences.length} selected</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OnboardingTab;