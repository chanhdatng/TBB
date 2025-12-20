import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Plus,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  Loader2,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import EmployeeCard from './EmployeeCard';
import EmployeeSearch from './EmployeeSearch';
import EmployeeBulkActions from './EmployeeBulkActions';

const EmployeeList = ({
  employees = [],
  loading = false,
  error = null,
  onAddEmployee,
  onEditEmployee,
  onViewEmployee,
  onRefresh,
  onActivateEmployee,
  onDeactivateEmployee,
  onDeleteEmployee,
  onChangeRole
}) => {
  // State management
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    role: [],
    status: [],
    department: []
  });
  const [sortBy, setSortBy] = useState('name');
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);

  // Extract unique departments and roles from employees
  const { departments, roles } = useMemo(() => {
    const depts = new Set();
    const roleList = new Set();

    employees.forEach(emp => {
      if (emp.department) depts.add(emp.department);
      if (emp.role) roleList.add(emp.role);
    });

    return {
      departments: Array.from(depts),
      roles: Array.from(roleList)
    };
  }, [employees]);

  // Filter and sort employees
  const filteredAndSortedEmployees = useMemo(() => {
    let filtered = [...employees];

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(emp =>
        emp.firstName?.toLowerCase().includes(searchLower) ||
        emp.lastName?.toLowerCase().includes(searchLower) ||
        emp.email?.toLowerCase().includes(searchLower) ||
        emp.department?.toLowerCase().includes(searchLower) ||
        emp.role?.toLowerCase().includes(searchLower)
      );
    }

    // Apply role filter
    if (filters.role.length > 0) {
      filtered = filtered.filter(emp => filters.role.includes(emp.role));
    }

    // Apply status filter
    if (filters.status.length > 0) {
      filtered = filtered.filter(emp => filters.status.includes(emp.status));
    }

    // Apply department filter
    if (filters.department.length > 0) {
      filtered = filtered.filter(emp => filters.department.includes(emp.department));
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
        case 'department':
          return (a.department || '').localeCompare(b.department || '');
        case 'role':
          return (a.role || '').localeCompare(b.role || '');
        case 'joinDate':
          return new Date(b.joinDate || 0) - new Date(a.joinDate || 0);
        case 'status':
          return (a.status || '').localeCompare(b.status || '');
        default:
          return 0;
      }
    });

    return filtered;
  }, [employees, searchTerm, filters, sortBy]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedEmployees.length / itemsPerPage);
  const paginatedEmployees = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedEmployees.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedEmployees, currentPage, itemsPerPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filters, sortBy]);

  // Handle bulk selection
  const handleSelectEmployee = (employeeId) => {
    setSelectedEmployees(prev => {
      if (prev.includes(employeeId)) {
        return prev.filter(id => id !== employeeId);
      } else {
        return [...prev, employeeId];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedEmployees.length === paginatedEmployees.length) {
      setSelectedEmployees([]);
    } else {
      setSelectedEmployees(paginatedEmployees.map(emp => emp.id));
    }
  };

  // Handle bulk actions
  const handleBulkActivate = (employeeIds) => {
    employeeIds.forEach(id => onActivateEmployee?.(id));
    setSelectedEmployees([]);
  };

  const handleBulkDeactivate = (employeeIds) => {
    employeeIds.forEach(id => onDeactivateEmployee?.(id));
    setSelectedEmployees([]);
  };

  const handleBulkRoleChange = (employeeIds, role) => {
    employeeIds.forEach(id => onChangeRole?.(id, role));
    setSelectedEmployees([]);
  };

  const handleBulkDelete = (employeeIds) => {
    employeeIds.forEach(id => onDeleteEmployee?.(id));
    setSelectedEmployees([]);
  };

  // Clear selection when navigating pages
  useEffect(() => {
    setSelectedEmployees([]);
  }, [currentPage]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Employee Management</h1>
          <p className="text-gray-500 mt-1">
            Manage your bakery staff and their roles
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button
            onClick={onAddEmployee}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-light transition-colors shadow-md"
          >
            <UserPlus size={18} />
            Add Employee
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <EmployeeSearch
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filters={filters}
        setFilters={setFilters}
        sortBy={sortBy}
        setSortBy={setSortBy}
        departments={departments}
        roles={roles}
      />

      {/* Bulk Actions */}
      <AnimatePresence>
        {selectedEmployees.length > 0 && (
          <EmployeeBulkActions
            selectedEmployees={selectedEmployees}
            onBulkActivate={handleBulkActivate}
            onBulkDeactivate={handleBulkDeactivate}
            onBulkRoleChange={handleBulkRoleChange}
            onBulkDelete={handleBulkDelete}
            onClearSelection={() => setSelectedEmployees([])}
          />
        )}
      </AnimatePresence>

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 size={48} className="text-primary animate-spin mb-4" />
          <p className="text-gray-600">Loading employees...</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-900">Error Loading Employees</h3>
              <p className="text-red-700 mt-1">{error}</p>
              <button
                onClick={onRefresh}
                className="mt-3 text-sm font-medium text-red-600 hover:text-red-700"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredAndSortedEmployees.length === 0 && (
        <div className="text-center py-12">
          <Users size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {searchTerm || Object.values(filters).some(arr => arr.length > 0)
              ? 'No employees found'
              : 'No employees yet'}
          </h3>
          <p className="text-gray-500 mb-6">
            {searchTerm || Object.values(filters).some(arr => arr.length > 0)
              ? 'Try adjusting your search or filters'
              : 'Add your first employee to get started'}
          </p>
          {!searchTerm && !Object.values(filters).some(arr => arr.length > 0) && (
            <button
              onClick={onAddEmployee}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary-light transition-colors"
            >
              <Plus size={20} />
              Add First Employee
            </button>
          )}
        </div>
      )}

      {/* Employee Grid */}
      {!loading && !error && filteredAndSortedEmployees.length > 0 && (
        <>
          {/* Results count and select all */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={selectedEmployees.length === paginatedEmployees.length && paginatedEmployees.length > 0}
                  onChange={handleSelectAll}
                  className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                />
                <span>
                  {selectedEmployees.length > 0
                    ? `${selectedEmployees.length} of ${paginatedEmployees.length} selected`
                    : `${filteredAndSortedEmployees.length} employee${filteredAndSortedEmployees.length !== 1 ? 's' : ''}`}
                </span>
              </label>
            </div>

            {/* Items per page */}
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value={6}>6 per page</option>
              <option value={12}>12 per page</option>
              <option value={24}>24 per page</option>
              <option value={48}>48 per page</option>
            </select>
          </div>

          {/* Grid */}
          <motion.div
            layout
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            <AnimatePresence mode="popLayout">
              {paginatedEmployees.map((employee) => (
                <EmployeeCard
                  key={employee.id}
                  employee={employee}
                  isSelected={selectedEmployees.includes(employee.id)}
                  onSelect={handleSelectEmployee}
                  onViewDetails={onViewEmployee}
                  onEdit={onEditEmployee}
                  onToggleStatus={(emp) => {
                    if (emp.status === 'active') {
                      onDeactivateEmployee?.(emp.id);
                    } else {
                      onActivateEmployee?.(emp.id);
                    }
                  }}
                />
              ))}
            </AnimatePresence>
          </motion.div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-6 border-t border-gray-100">
              <div className="text-sm text-gray-600">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to{' '}
                {Math.min(currentPage * itemsPerPage, filteredAndSortedEmployees.length)} of{' '}
                {filteredAndSortedEmployees.length} employees
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={16} />
                  Previous
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                          currentPage === pageNum
                            ? 'bg-primary text-white'
                            : 'text-gray-700 bg-white border border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default EmployeeList;