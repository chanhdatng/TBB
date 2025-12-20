import React, { useState } from 'react';
import { Search, Filter, ChevronDown, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const EmployeeSearch = ({
  searchTerm,
  setSearchTerm,
  filters,
  setFilters,
  sortBy,
  setSortBy,
  departments = [],
  roles = []
}) => {
  const [showFilters, setShowFilters] = useState(false);

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: prev[filterType].includes(value)
        ? prev[filterType].filter(item => item !== value)
        : [...prev[filterType], value]
    }));
  };

  const clearFilters = () => {
    setFilters({
      role: [],
      status: [],
      department: []
    });
  };

  const hasActiveFilters = Object.values(filters).some(arr => arr.length > 0);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search
          size={20}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          type="text"
          placeholder="Search by name, email, or department..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
        />
      </div>

      {/* Filter and Sort Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Filter Toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
            hasActiveFilters
              ? 'bg-primary text-white shadow-md'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Filter size={18} />
          Filters
          {hasActiveFilters && (
            <span className="ml-1 px-2 py-0.5 bg-white/20 rounded-full text-xs">
              {Object.values(filters).reduce((acc, arr) => acc + arr.length, 0)}
            </span>
          )}
          <ChevronDown
            size={16}
            className={`transition-transform ${showFilters ? 'rotate-180' : ''}`}
          />
        </button>

        {/* Sort Dropdown */}
        <div className="relative">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="appearance-none bg-gray-100 hover:bg-gray-200 border-0 rounded-lg px-4 py-2 pr-10 font-medium text-gray-700 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="name">Sort by Name</option>
            <option value="department">Sort by Department</option>
            <option value="role">Sort by Role</option>
            <option value="joinDate">Sort by Join Date</option>
            <option value="status">Sort by Status</option>
          </select>
          <ChevronDown
            size={16}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
          />
        </div>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg font-medium transition-all ml-auto"
          >
            <X size={18} />
            Clear All
          </button>
        )}
      </div>

      {/* Expandable Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="pt-4 border-t border-gray-100 space-y-4">
              {/* Status Filters */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Status</h3>
                <div className="flex flex-wrap gap-2">
                  {['active', 'inactive', 'on_leave'].map(status => (
                    <button
                      key={status}
                      onClick={() => handleFilterChange('status', status)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        filters.status.includes(status)
                          ? 'bg-primary text-white shadow-sm'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {status === 'on_leave' ? 'On Leave' : status.charAt(0).toUpperCase() + status.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Role Filters */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Role</h3>
                <div className="flex flex-wrap gap-2">
                  {roles.map(role => (
                    <button
                      key={role}
                      onClick={() => handleFilterChange('role', role)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        filters.role.includes(role)
                          ? 'bg-primary text-white shadow-sm'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Department Filters */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Department</h3>
                <div className="flex flex-wrap gap-2">
                  {departments.map(dept => (
                    <button
                      key={dept}
                      onClick={() => handleFilterChange('department', dept)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        filters.department.includes(dept)
                          ? 'bg-primary text-white shadow-sm'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {dept}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EmployeeSearch;