import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserCheck,
  UserX,
  Shield,
  MoreHorizontal,
  ChevronDown,
  AlertTriangle,
  Check
} from 'lucide-react';

const EmployeeBulkActions = ({
  selectedEmployees,
  onBulkActivate,
  onBulkDeactivate,
  onBulkRoleChange,
  onBulkDelete,
  onClearSelection
}) => {
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [showMoreActions, setShowMoreActions] = useState(false);

  const roles = ['admin', 'manager', 'baker', 'cashier', 'decorator', 'delivery'];

  const handleRoleChange = (role) => {
    onBulkRoleChange(selectedEmployees, role);
    setShowRoleDropdown(false);
  };

  if (selectedEmployees.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4"
    >
      <div className="flex items-center justify-between">
        {/* Selection Info */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Check className="w-5 h-5 text-primary" />
            <span className="font-medium text-gray-900">
              {selectedEmployees.length} employee{selectedEmployees.length > 1 ? 's' : ''} selected
            </span>
          </div>
          <button
            onClick={onClearSelection}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Clear selection
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Quick Actions */}
          <button
            onClick={() => onBulkActivate(selectedEmployees)}
            className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg font-medium text-sm hover:bg-green-200 transition-colors"
          >
            <UserCheck size={16} />
            Activate
          </button>

          <button
            onClick={() => onBulkDeactivate(selectedEmployees)}
            className="flex items-center gap-2 px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg font-medium text-sm hover:bg-yellow-200 transition-colors"
          >
            <UserX size={16} />
            Deactivate
          </button>

          {/* Role Change Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowRoleDropdown(!showRoleDropdown)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg font-medium text-sm hover:bg-blue-200 transition-colors"
            >
              <Shield size={16} />
              Change Role
              <ChevronDown
                size={16}
                className={`transition-transform ${showRoleDropdown ? 'rotate-180' : ''}`}
              />
            </button>

            <AnimatePresence>
              {showRoleDropdown && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  transition={{ duration: 0.1 }}
                  className="absolute top-full left-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 z-10 overflow-hidden"
                >
                  {roles.map(role => (
                    <button
                      key={role}
                      onClick={() => handleRoleChange(role)}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors capitalize"
                    >
                      {role}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* More Actions Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowMoreActions(!showMoreActions)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium text-sm hover:bg-gray-200 transition-colors"
            >
              <MoreHorizontal size={16} />
              More
              <ChevronDown
                size={16}
                className={`transition-transform ${showMoreActions ? 'rotate-180' : ''}`}
              />
            </button>

            <AnimatePresence>
              {showMoreActions && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  transition={{ duration: 0.1 }}
                  className="absolute top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 z-10 overflow-hidden"
                >
                  <button
                    onClick={() => {
                      // Export functionality
                      setShowMoreActions(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Export to CSV
                  </button>
                  <button
                    onClick={() => {
                      // Send email functionality
                      setShowMoreActions(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Send Email
                  </button>
                  <hr className="my-1 border-gray-100" />
                  <button
                    onClick={() => {
                      if (window.confirm(`Are you sure you want to delete ${selectedEmployees.length} employee(s)? This action cannot be undone.`)) {
                        onBulkDelete(selectedEmployees);
                      }
                      setShowMoreActions(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                  >
                    <AlertTriangle size={16} />
                    Delete Selected
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Warning for destructive actions */}
      {selectedEmployees.some(id => id === 'current-user-id') && (
        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center gap-2 text-yellow-800 text-sm">
            <AlertTriangle size={16} />
            <span>You have selected yourself. Some actions may affect your current session.</span>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default EmployeeBulkActions;