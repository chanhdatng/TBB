import React from 'react';
import { User, Phone, MapPin, Instagram, Calendar, Clock, Info } from 'lucide-react';
import { TIME_SLOTS, getTodayDate, isTimeSlotAvailable } from '../../utils/preOrderHelpers';
import { motion } from 'framer-motion';

const CustomerInfoForm = ({ customerInfo, setCustomerInfo, errors }) => {
  const handleChange = (field, value) => {
    setCustomerInfo(prev => ({ ...prev, [field]: value }));
  };

  const today = getTodayDate();

  return (
    <div className="bg-gradient-to-br from-white to-gray-50 rounded-3xl shadow-xl p-6 md:p-8 border-2 border-gray-100">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary-dark rounded-2xl flex items-center justify-center shadow-lg shadow-primary/30">
          <User className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-2xl md:text-3xl font-serif font-bold text-bakery-text">
            Delivery Information
          </h3>
          <p className="text-sm text-gray-500">Please fill in your details</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Name */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <span>Full Name</span>
            <span className="text-red-500">*</span>
          </label>
          <div className="relative group">
            <div className={`absolute left-4 top-1/2 transform -translate-y-1/2 transition-colors ${
              errors.name ? 'text-red-400' : 'text-gray-400 group-focus-within:text-primary'
            }`}>
              <User size={20} />
            </div>
            <input
              type="text"
              value={customerInfo.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Enter your full name"
              className={`w-full pl-12 pr-4 py-4 border-2 rounded-xl font-medium focus:outline-none transition-all ${
                errors.name
                  ? 'border-red-300 bg-red-50/30 focus:border-red-500 focus:ring-4 focus:ring-red-100'
                  : 'border-gray-200 bg-white focus:border-primary focus:ring-4 focus:ring-primary/10'
              }`}
            />
          </div>
          {errors.name && (
            <motion.p
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="mt-2 text-sm text-red-600 flex items-center gap-1"
            >
              <Info size={14} />
              {errors.name}
            </motion.p>
          )}
        </motion.div>

        {/* Phone */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <span>Phone Number</span>
            <span className="text-red-500">*</span>
          </label>
          <div className="relative group">
            <div className={`absolute left-4 top-1/2 transform -translate-y-1/2 transition-colors ${
              errors.phone ? 'text-red-400' : 'text-gray-400 group-focus-within:text-primary'
            }`}>
              <Phone size={20} />
            </div>
            <input
              type="tel"
              value={customerInfo.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              placeholder="0901234567"
              className={`w-full pl-12 pr-4 py-4 border-2 rounded-xl font-medium focus:outline-none transition-all ${
                errors.phone
                  ? 'border-red-300 bg-red-50/30 focus:border-red-500 focus:ring-4 focus:ring-red-100'
                  : 'border-gray-200 bg-white focus:border-primary focus:ring-4 focus:ring-primary/10'
              }`}
            />
          </div>
          {errors.phone && (
            <motion.p
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="mt-2 text-sm text-red-600 flex items-center gap-1"
            >
              <Info size={14} />
              {errors.phone}
            </motion.p>
          )}
        </motion.div>

        {/* Address */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <span>Delivery Address</span>
            <span className="text-red-500">*</span>
          </label>
          <div className="relative group">
            <div className={`absolute left-4 top-4 transition-colors ${
              errors.address ? 'text-red-400' : 'text-gray-400 group-focus-within:text-primary'
            }`}>
              <MapPin size={20} />
            </div>
            <textarea
              value={customerInfo.address}
              onChange={(e) => handleChange('address', e.target.value)}
              placeholder="Enter your full delivery address"
              rows={3}
              className={`w-full pl-12 pr-4 py-4 border-2 rounded-xl font-medium focus:outline-none transition-all resize-none ${
                errors.address
                  ? 'border-red-300 bg-red-50/30 focus:border-red-500 focus:ring-4 focus:ring-red-100'
                  : 'border-gray-200 bg-white focus:border-primary focus:ring-4 focus:ring-primary/10'
              }`}
            />
          </div>
          {errors.address && (
            <motion.p
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="mt-2 text-sm text-red-600 flex items-center gap-1"
            >
              <Info size={14} />
              {errors.address}
            </motion.p>
          )}
        </motion.div>

        {/* Social Link (Optional) */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <span>Social Media Link</span>
            <span className="text-xs text-gray-400 font-normal">(Optional)</span>
          </label>
          <div className="relative group">
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors">
              <Instagram size={20} />
            </div>
            <input
              type="text"
              value={customerInfo.socialLink}
              onChange={(e) => handleChange('socialLink', e.target.value)}
              placeholder="Instagram or Facebook profile URL"
              className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl font-medium bg-white focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
            />
          </div>
        </motion.div>

        {/* Delivery Date */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <span>Delivery Date</span>
            <span className="text-red-500">*</span>
          </label>
          <div className="relative group">
            <div className={`absolute left-4 top-1/2 transform -translate-y-1/2 transition-colors ${
              errors.deliveryDate ? 'text-red-400' : 'text-gray-400 group-focus-within:text-primary'
            }`}>
              <Calendar size={20} />
            </div>
            <input
              type="date"
              value={customerInfo.deliveryDate}
              onChange={(e) => handleChange('deliveryDate', e.target.value)}
              min={today}
              className={`w-full pl-12 pr-4 py-4 border-2 rounded-xl font-medium focus:outline-none transition-all ${
                errors.deliveryDate
                  ? 'border-red-300 bg-red-50/30 focus:border-red-500 focus:ring-4 focus:ring-red-100'
                  : 'border-gray-200 bg-white focus:border-primary focus:ring-4 focus:ring-primary/10'
              }`}
            />
          </div>
          {errors.deliveryDate && (
            <motion.p
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="mt-2 text-sm text-red-600 flex items-center gap-1"
            >
              <Info size={14} />
              {errors.deliveryDate}
            </motion.p>
          )}
        </motion.div>

        {/* Time Slot */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <span>Delivery Time Slot</span>
            <span className="text-red-500">*</span>
          </label>
          <div className="flex flex-wrap gap-3">
            {TIME_SLOTS.map((slot) => {
              const isAvailable = isTimeSlotAvailable(slot, customerInfo.deliveryDate);
              const isSelected = customerInfo.deliveryTimeSlot === slot;

              return (
                <motion.button
                  key={slot}
                  type="button"
                  onClick={() => isAvailable && handleChange('deliveryTimeSlot', slot)}
                  disabled={!isAvailable}
                  whileHover={{ scale: isAvailable ? 1.05 : 1 }}
                  whileTap={{ scale: isAvailable ? 0.95 : 1 }}
                  className={`px-5 py-3 text-sm font-semibold rounded-xl border-2 transition-all shadow-sm ${
                    isSelected
                      ? 'bg-gradient-to-r from-primary to-primary-dark text-white border-primary shadow-lg shadow-primary/30'
                      : isAvailable
                      ? 'bg-white text-gray-700 border-gray-200 hover:border-primary/50 hover:shadow-md'
                      : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-60'
                  }`}
                >
                  <Clock size={14} className="inline mr-2" />
                  {slot}
                </motion.button>
              );
            })}
          </div>
          {errors.deliveryTimeSlot && (
            <motion.p
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="mt-3 text-sm text-red-600 flex items-center gap-1"
            >
              <Info size={14} />
              {errors.deliveryTimeSlot}
            </motion.p>
          )}
          {customerInfo.deliveryDate === today && (
            <p className="mt-3 text-xs text-gray-500 flex items-center gap-1.5 bg-gray-50 p-2 rounded-lg">
              <span className="inline-block w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
              Past time slots are disabled for today's deliveries
            </p>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default CustomerInfoForm;
