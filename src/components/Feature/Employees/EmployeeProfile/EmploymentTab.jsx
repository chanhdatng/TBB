import React from 'react';
import {
    Briefcase,
    Calendar,
    Clock,
    DollarSign,
    Award,
    TrendingUp,
    Users,
    Target,
    CheckCircle,
    AlertCircle,
    Activity,
    BarChart3,
    PieChart,
    Timer
} from 'lucide-react';

const EmploymentTab = ({ employee }) => {
    const formatDate = (dateString) => {
        if (!dateString) return 'Not specified';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const calculateDuration = (startDate, endDate = null) => {
        if (!startDate) return null;

        const start = new Date(startDate);
        const end = endDate ? new Date(endDate) : new Date();

        const years = end.getFullYear() - start.getFullYear();
        const months = end.getMonth() - start.getMonth();

        let totalYears = years;
        let totalMonths = months;

        if (totalMonths < 0) {
            totalYears--;
            totalMonths += 12;
        }

        if (totalYears > 0) {
            return totalMonths > 0 ? `${totalYears} years, ${totalMonths} months` : `${totalYears} years`;
        }
        return `${totalMonths} months`;
    };

    const getWorkScheduleDays = (schedule) => {
        if (!schedule) return [];
        return Object.entries(schedule)
            .filter(([day, data]) => !data.off)
            .map(([day, data]) => ({
                day: day.charAt(0).toUpperCase() + day.slice(1),
                start: data.start,
                end: data.end
            }));
    };

    // Mock statistics data (in real app, this would come from API)
    const employmentStats = {
        attendanceRate: 96.5,
        averageHoursPerWeek: 38,
        overtimeHours: 12,
        performanceScore: 4.3,
        completedTraining: 8,
        pendingTraining: 2,
        projectsCompleted: 24,
        customerSatisfaction: 4.7
    };

    const recentActivities = [
        { date: '2024-01-10', type: 'training', description: 'Completed Food Safety Certification' },
        { date: '2024-01-05', type: 'achievement', description: 'Employee of the Month - December 2023' },
        { date: '2023-12-20', type: 'review', description: 'Performance Review - Excellent Rating' },
        { date: '2023-12-01', type: 'promotion', description: 'Promoted to Senior Baker' },
        { date: '2023-11-15', type: 'training', description: 'Completed Advanced Decorating Course' }
    ];

    return (
        <div className="p-6 space-y-6">
            {/* Employment Overview */}
            <div className="bg-gradient-to-br from-primary/5 to-primary-light/5 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Briefcase className="text-primary" size={20} />
                    Employment Overview
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                        <p className="text-sm text-gray-500">Employee ID</p>
                        <p className="font-semibold text-gray-900">{employee.employeeId || 'Not assigned'}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Position</p>
                        <p className="font-semibold text-gray-900">{employee.position || 'Not assigned'}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Department</p>
                        <p className="font-semibold text-gray-900 capitalize">{employee.department || 'Not assigned'}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Employment Type</p>
                        <p className="font-semibold text-gray-900 capitalize">{employee.employmentType || 'Full-time'}</p>
                    </div>
                </div>
            </div>

            {/* Employment Dates */}
            <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Calendar className="text-primary" size={20} />
                    Employment Dates
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-start gap-3">
                        <Calendar size={18} className="text-gray-400 mt-0.5" />
                        <div>
                            <p className="text-sm text-gray-500">Hire Date</p>
                            <p className="font-medium text-gray-900">{formatDate(employee.hireDate)}</p>
                            {employee.hireDate && (
                                <p className="text-sm text-primary mt-1">
                                    {calculateDuration(employee.hireDate)} of service
                                </p>
                            )}
                        </div>
                    </div>
                    {employee.terminationDate && (
                        <div className="flex items-start gap-3">
                            <AlertCircle size={18} className="text-gray-400 mt-0.5" />
                            <div>
                                <p className="text-sm text-gray-500">Termination Date</p>
                                <p className="font-medium text-gray-900">{formatDate(employee.terminationDate)}</p>
                                {employee.hireDate && (
                                    <p className="text-sm text-gray-500 mt-1">
                                        Total duration: {calculateDuration(employee.hireDate, employee.terminationDate)}
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                    {employee.probationEndDate && (
                        <div className="flex items-start gap-3">
                            <Timer size={18} className="text-gray-400 mt-0.5" />
                            <div>
                                <p className="text-sm text-gray-500">Probation End Date</p>
                                <p className="font-medium text-gray-900">{formatDate(employee.probationEndDate)}</p>
                            </div>
                        </div>
                    )}
                    {employee.lastReviewDate && (
                        <div className="flex items-start gap-3">
                            <Activity size={18} className="text-gray-400 mt-0.5" />
                            <div>
                                <p className="text-sm text-gray-500">Last Review Date</p>
                                <p className="font-medium text-gray-900">{formatDate(employee.lastReviewDate)}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Compensation */}
            <div className="bg-green-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <DollarSign className="text-green-600" size={20} />
                    Compensation
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                        <p className="text-sm text-gray-500">Hourly Rate</p>
                        <p className="text-2xl font-bold text-gray-900">
                            {employee.salary ? `₫${parseInt(employee.salary).toLocaleString()}` : 'Not specified'}
                        </p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Overtime Rate</p>
                        <p className="text-2xl font-bold text-gray-900">
                            {employee.salary ? `₫${(parseInt(employee.salary) * 1.5).toLocaleString()}` : 'Not specified'}
                        </p>
                        <p className="text-xs text-gray-500">1.5x regular rate</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Pay Schedule</p>
                        <p className="font-semibold text-gray-900 capitalize">{employee.paySchedule || 'Bi-weekly'}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Payment Method</p>
                        <p className="font-semibold text-gray-900 capitalize">{employee.paymentMethod || 'Bank Transfer'}</p>
                    </div>
                </div>
            </div>

            {/* Work Schedule */}
            <div className="bg-blue-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Clock className="text-blue-600" size={20} />
                    Work Schedule
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <p className="text-sm font-medium text-gray-700 mb-3">Regular Schedule</p>
                        <div className="space-y-2">
                            {getWorkScheduleDays(employee.workSchedule).length > 0 ? (
                                getWorkScheduleDays(employee.workSchedule).map((day) => (
                                    <div key={day.day} className="flex items-center justify-between p-2 bg-white rounded-lg">
                                        <span className="font-medium text-gray-900">{day.day}</span>
                                        <span className="text-sm text-gray-600">
                                            {day.start} - {day.end}
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <p className="text-gray-500">No schedule configured</p>
                            )}
                        </div>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-700 mb-3">Schedule Details</p>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-500">Days per week</span>
                                <span className="font-medium">{getWorkScheduleDays(employee.workSchedule).length}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-500">Hours per day</span>
                                <span className="font-medium">8 hours</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-500">Total weekly hours</span>
                                <span className="font-medium">{getWorkScheduleDays(employee.workSchedule).length * 8}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-500">Flexible schedule</span>
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                    employee.flexibleSchedule ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                }`}>
                                    {employee.flexibleSchedule ? 'Yes' : 'No'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Performance Statistics */}
            <div className="bg-purple-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <BarChart3 className="text-purple-600" size={20} />
                    Performance Statistics
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                            <CheckCircle className="text-green-500" size={18} />
                            <span className="text-2xl font-bold text-gray-900">{employmentStats.attendanceRate}%</span>
                        </div>
                        <p className="text-sm text-gray-600">Attendance Rate</p>
                        <div className="mt-2 h-1 bg-gray-200 rounded-full">
                            <div
                                className="h-1 bg-green-500 rounded-full"
                                style={{ width: `${employmentStats.attendanceRate}%` }}
                            />
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                            <Clock className="text-blue-500" size={18} />
                            <span className="text-2xl font-bold text-gray-900">{employmentStats.averageHoursPerWeek}</span>
                        </div>
                        <p className="text-sm text-gray-600">Avg Hours/Week</p>
                        <p className="text-xs text-gray-500 mt-1">+{employmentStats.overtimeHours}h overtime</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                            <Award className="text-yellow-500" size={18} />
                            <span className="text-2xl font-bold text-gray-900">{employmentStats.performanceScore}/5</span>
                        </div>
                        <p className="text-sm text-gray-600">Performance Score</p>
                        <div className="flex gap-1 mt-2">
                            {[...Array(5)].map((_, i) => (
                                <div
                                    key={i}
                                    className={`w-4 h-4 rounded-full ${
                                        i < Math.floor(employmentStats.performanceScore)
                                            ? 'bg-yellow-500'
                                            : 'bg-gray-200'
                                    }`}
                                />
                            ))}
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                            <Target className="text-purple-500" size={18} />
                            <span className="text-2xl font-bold text-gray-900">{employmentStats.projectsCompleted}</span>
                        </div>
                        <p className="text-sm text-gray-600">Projects Completed</p>
                        <p className="text-xs text-gray-500 mt-1">This year</p>
                    </div>
                </div>
            </div>

            {/* Training & Development */}
            <div className="bg-indigo-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <TrendingUp className="text-indigo-600" size={20} />
                    Training & Development
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-medium text-gray-700">Completed Training</span>
                            <span className="bg-green-100 text-green-800 px-2 py-1 text-xs font-medium rounded-full">
                                {employmentStats.completedTraining} courses
                            </span>
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm">
                                <CheckCircle size={16} className="text-green-500" />
                                <span>Food Safety Certification</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <CheckCircle size={16} className="text-green-500" />
                                <span>Customer Service Excellence</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <CheckCircle size={16} className="text-green-500" />
                                <span>Advanced Baking Techniques</span>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-medium text-gray-700">Pending Training</span>
                            <span className="bg-yellow-100 text-yellow-800 px-2 py-1 text-xs font-medium rounded-full">
                                {employmentStats.pendingTraining} courses
                            </span>
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm">
                                <AlertCircle size={16} className="text-yellow-500" />
                                <span>Management Skills</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <AlertCircle size={16} className="text-yellow-500" />
                                <span>Inventory Management</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Activities */}
            <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Activity className="text-primary" size={20} />
                    Recent Activities
                </h3>
                <div className="space-y-3">
                    {recentActivities.map((activity, index) => (
                        <div key={index} className="flex items-start gap-3 p-3 bg-white rounded-lg">
                            <div className={`p-2 rounded-lg ${
                                activity.type === 'training' ? 'bg-blue-100' :
                                activity.type === 'achievement' ? 'bg-yellow-100' :
                                activity.type === 'review' ? 'bg-purple-100' :
                                'bg-green-100'
                            }`}>
                                {activity.type === 'training' && <TrendingUp size={16} className="text-blue-600" />}
                                {activity.type === 'achievement' && <Award size={16} className="text-yellow-600" />}
                                {activity.type === 'review' && <BarChart3 size={16} className="text-purple-600" />}
                                {activity.type === 'promotion' && <Briefcase size={16} className="text-green-600" />}
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                                <p className="text-xs text-gray-500 mt-1">{formatDate(activity.date)}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default EmploymentTab;