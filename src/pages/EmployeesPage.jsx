import React, { useState, useMemo, useLayoutEffect } from 'react';
import { useEmployees } from '../contexts/EmployeeContext';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Download,
  Calendar,
  Mail,
  Phone,
  MapPin,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Eye,
  Edit,
  Trash2,
  Shield,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  AlertTriangle,
  RefreshCw,
  Building,
  User,
  Crown,
  ChefHat,
  ShoppingBag,
  Truck,
  Plus,
  Sparkles
} from 'lucide-react';
import QuickAddModal from '../components/Feature/Employees/QuickAddModal';

// Import employee components (will be created in separate files)
const EmployeeList = () => {
  const {
    employees,
    loading,
    error,
    refreshEmployees
  } = useEmployees();

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [showQuickAddModal, setShowQuickAddModal] = useState(false);
  const [showFullAddModal, setShowFullAddModal] = useState(false);
  const itemsPerPage = 10;

  // Get role icon
  const getRoleIcon = (role) => {
    switch(role) {
      case 'admin': return <Crown className="w-4 h-4 text-purple-600" />;
      case 'manager': return <Building className="w-4 h-4 text-blue-600" />;
      case 'baker': return <ChefHat className="w-4 h-4 text-orange-600" />;
      case 'sales': return <ShoppingBag className="w-4 h-4 text-green-600" />;
      case 'delivery': return <Truck className="w-4 h-4 text-yellow-600" />;
      default: return <User className="w-4 h-4 text-gray-600" />;
    }
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch(status) {
      case 'Active': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'On Leave': return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'Terminated': return <XCircle className="w-4 h-4 text-red-600" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectedEmployees.length === employees.length) {
      setSelectedEmployees([]);
      setShowBulkActions(false);
    } else {
      setSelectedEmployees(employees.map(emp => emp.id));
      setShowBulkActions(true);
    }
  };

  // Handle select employee
  const handleSelectEmployee = (employeeId) => {
    const newSelection = selectedEmployees.includes(employeeId)
      ? selectedEmployees.filter(id => id !== employeeId)
      : [...selectedEmployees, employeeId];

    setSelectedEmployees(newSelection);
    setShowBulkActions(newSelection.length > 0);
  };

  // Filter employees
  const filteredEmployees = useMemo(() => {
    let filtered = employees;

    if (searchTerm) {
      filtered = filtered.filter(emp =>
        emp.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.employeeId?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (roleFilter) {
      filtered = filtered.filter(emp => emp.role === roleFilter);
    }

    if (statusFilter) {
      filtered = filtered.filter(emp => emp.status === statusFilter);
    }

    return filtered;
  }, [employees, searchTerm, roleFilter, statusFilter]);

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Pagination
  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
  const paginatedEmployees = filteredEmployees.slice(
    currentPage * itemsPerPage,
    (currentPage + 1) * itemsPerPage
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle size={24} className="text-red-600" />
          <h3 className="text-lg font-semibold text-red-900">
            Error loading employees
          </h3>
        </div>
        <p className="text-red-700 mb-4">{error}</p>
        <button
          onClick={refreshEmployees}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          <RefreshCw size={16} />
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Employee Management</h1>
            <p className="text-gray-600 mt-1">Manage your bakery staff and their roles</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                const csv = [
                  ['ID', 'Name', 'Email', 'Phone', 'Role', 'Status', 'Join Date'],
                  ...filteredEmployees.map(emp => [
                    emp.employeeId || '',
                    `${emp.firstName || ''} ${emp.lastName || ''}`,
                    emp.email || '',
                    emp.phone || '',
                    emp.role || '',
                    emp.status || '',
                    formatDate(emp.createdAt || '')
                  ])
                ].map(row => row.join(',')).join('\n');

                const blob = new Blob([csv], { type: 'text/csv' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                const today = new Date();
                a.download = `employees_${today.toISOString().split('T')[0]}.csv`;
                a.click();
              }}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Download size={18} />
              Export
            </button>
            <button
              onClick={() => setShowFullAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <UserPlus size={18} />
              Full Details
            </button>
            <button
              onClick={() => setShowQuickAddModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-light transition-colors shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <Sparkles size={20} />
              Quick Add
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-medium">Total Employees</p>
                <p className="text-2xl font-bold text-blue-900">{employees.length}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          <div className="bg-green-50 rounded-lg p-4 border border-green-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 text-sm font-medium">Active</p>
                <p className="text-2xl font-bold text-green-900">
                  {employees.filter(e => e.status === 'Active').length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-600 text-sm font-medium">On Leave</p>
                <p className="text-2xl font-bold text-yellow-900">
                  {employees.filter(e => e.status === 'On Leave').length}
                </p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-600 text-sm font-medium">New This Month</p>
                <p className="text-2xl font-bold text-purple-900">
                  {employees.filter(e => {
                    const joinDate = new Date(e.joinDate);
                    const thisMonth = new Date();
                    return joinDate.getMonth() === thisMonth.getMonth() &&
                           joinDate.getFullYear() === thisMonth.getFullYear();
                  }).length}
                </p>
              </div>
              <UserPlus className="w-8 h-8 text-purple-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by name, email, phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">All Roles</option>
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="baker">Baker</option>
              <option value="sales">Sales</option>
              <option value="delivery">Delivery</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">All Status</option>
              <option value="Active">Active</option>
              <option value="On Leave">On Leave</option>
              <option value="Terminated">Terminated</option>
            </select>
          </div>
        </div>

        {/* Bulk Actions */}
        {showBulkActions && (
          <div className="flex items-center justify-between mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-700">
              {selectedEmployees.length} employee{selectedEmployees.length > 1 ? 's' : ''} selected
            </p>
            <div className="flex gap-2">
              <button className="px-3 py-1.5 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors">
                Bulk Delete
              </button>
              <button className="px-3 py-1.5 text-sm text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Employees Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedEmployees.length === employees.length && employees.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Join Date
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedEmployees.map((employee) => (
                <tr key={employee.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedEmployees.includes(employee.id)}
                      onChange={() => handleSelectEmployee(employee.id)}
                      className="rounded border-gray-300 text-primary focus:ring-primary"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={employee.avatar || `https://ui-avatars.com/api/?name=${employee.firstName || ''} ${employee.lastName || ''}&background=0F5132&color=fff`}
                        alt={`${employee.firstName || ''} ${employee.lastName || ''}`}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div>
                        <p className="font-medium text-gray-900">
                          {employee.firstName && employee.lastName
                            ? `${employee.firstName} ${employee.lastName}`
                            : employee.firstName || employee.lastName || 'Unknown'
                          }
                        </p>
                        <p className="text-sm text-gray-500">ID: {employee.employeeId || 'N/A'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {getRoleIcon(employee.role)}
                      <span className="text-sm font-medium text-gray-900 capitalize">{employee.role}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Mail className="w-3 h-3" />
                        {employee.email}
                      </div>
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Phone className="w-3 h-3" />
                        {employee.phone}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(employee.status)}
                      <span className={`text-sm font-medium capitalize ${
                        employee.status === 'Active' ? 'text-green-700' :
                        employee.status === 'On Leave' ? 'text-yellow-700' :
                        'text-red-700'
                      }`}>
                        {employee.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {formatDate(employee.joinDate)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <button className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                        <Eye size={16} />
                      </button>
                      <button className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                        <Edit size={16} />
                      </button>
                      <button className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-700">
              Showing {currentPage * itemsPerPage + 1} to{' '}
              {Math.min((currentPage + 1) * itemsPerPage, filteredEmployees.length)} of{' '}
              {filteredEmployees.length} results
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 0}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={18} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i)}
                  className={`px-3 py-1 rounded-lg transition-colors ${
                    currentPage === i
                      ? 'bg-primary text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages - 1}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Quick Add Button (Mobile) */}
      <button
        onClick={() => setShowQuickAddModal(true)}
        className="lg:hidden fixed bottom-6 right-6 w-14 h-14 bg-primary text-white rounded-full shadow-lg hover:bg-primary-light transition-all hover:shadow-xl flex items-center justify-center z-40"
      >
        <Plus size={24} />
      </button>

      {/* Quick Add Modal */}
      <QuickAddModal
        isOpen={showQuickAddModal}
        onClose={() => setShowQuickAddModal(false)}
        onSuccess={() => {
          setShowQuickAddModal(false);
          refreshEmployees();
        }}
      />
    </div>
  );
};

const EmployeesPage = () => {
  useLayoutEffect(() => {
    document.title = 'Employee Management - TheButterBake Admin';
    return () => {
      document.title = 'TheButterBake Admin';
    };
  }, []);

  return <EmployeeList />;
};

export default EmployeesPage;