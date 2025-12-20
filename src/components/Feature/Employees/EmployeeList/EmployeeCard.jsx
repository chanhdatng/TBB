import React from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Briefcase,
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  MoreVertical
} from 'lucide-react';
import { getInitials } from '../../../utils/helpers';

const EmployeeCard = ({
  employee,
  isSelected,
  onSelect,
  onViewDetails,
  onEdit,
  onDelete,
  onToggleStatus
}) => {
  const {
    id,
    firstName,
    lastName,
    email,
    phone,
    role,
    department,
    status,
    joinDate,
    address,
    avatar
  } = employee;

  const statusConfig = {
    active: {
      icon: CheckCircle,
      color: 'text-green-600',
      bg: 'bg-green-100',
      label: 'Active'
    },
    inactive: {
      icon: XCircle,
      color: 'text-red-600',
      bg: 'bg-red-100',
      label: 'Inactive'
    },
    on_leave: {
      icon: Clock,
      color: 'text-yellow-600',
      bg: 'bg-yellow-100',
      label: 'On Leave'
    }
  };

  const currentStatus = statusConfig[status] || statusConfig.active;
  const StatusIcon = currentStatus.icon;

  const roleColors = {
    admin: 'bg-purple-100 text-purple-700',
    manager: 'bg-blue-100 text-blue-700',
    baker: 'bg-orange-100 text-orange-700',
    cashier: 'bg-green-100 text-green-700',
    decorator: 'bg-pink-100 text-pink-700',
    delivery: 'bg-indigo-100 text-indigo-700'
  };

  const getRoleColor = (role) => roleColors[role] || 'bg-gray-100 text-gray-700';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
      className={`bg-white rounded-xl border ${
        isSelected ? 'border-primary shadow-md' : 'border-gray-100 hover:border-gray-200'
      } overflow-hidden transition-all duration-200 hover:shadow-lg`}
    >
      {/* Card Header with Checkbox */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-start gap-3">
          {/* Checkbox */}
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onSelect(id)}
            className="mt-1 w-5 h-5 text-primary border-gray-300 rounded focus:ring-primary focus:ring-2 cursor-pointer"
          />

          {/* Avatar */}
          <div className="relative">
            {avatar ? (
              <img
                src={avatar}
                alt={`${firstName} ${lastName}`}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-white font-semibold">
                {getInitials(`${firstName} ${lastName}`)}
              </div>
            )}
            <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${currentStatus.bg}`}>
              <StatusIcon size={12} className={currentStatus.color} />
            </div>
          </div>

          {/* Basic Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-gray-900 truncate">
                  {firstName} {lastName}
                </h3>
                <p className="text-sm text-gray-500 truncate">{email}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(role)}`}>
                  <Briefcase size={12} />
                  {role}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    // Show dropdown menu
                  }}
                  className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
                >
                  <MoreVertical size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4 space-y-3">
        {/* Department and Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin size={16} />
            <span>{department}</span>
          </div>
          <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${currentStatus.bg} ${currentStatus.color}`}>
            <StatusIcon size={12} />
            {currentStatus.label}
          </div>
        </div>

        {/* Contact Info */}
        <div className="space-y-2">
          {phone && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Phone size={16} className="text-gray-400" />
              <span>{phone}</span>
            </div>
          )}
          {address && (
            <div className="flex items-start gap-2 text-sm text-gray-600">
              <MapPin size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
              <span className="line-clamp-1">{address}</span>
            </div>
          )}
          {joinDate && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar size={16} className="text-gray-400" />
              <span>Joined {new Date(joinDate).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <button
            onClick={() => onViewDetails(employee)}
            className="flex-1 px-3 py-2 bg-primary text-white rounded-lg font-medium text-sm hover:bg-primary-light transition-colors"
          >
            View Details
          </button>
          <button
            onClick={() => onEdit(employee)}
            className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium text-sm hover:bg-gray-200 transition-colors"
          >
            Edit
          </button>
          <button
            onClick={() => onToggleStatus(employee)}
            className={`px-3 py-2 rounded-lg font-medium text-sm transition-colors ${
              status === 'active'
                ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                : 'bg-green-100 text-green-700 hover:bg-green-200'
            }`}
          >
            {status === 'active' ? 'Deactivate' : 'Activate'}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default EmployeeCard;