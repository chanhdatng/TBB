import React from 'react';
import { ShoppingCart, Plus, Minus, Trash2, X, Package, Sparkles } from 'lucide-react';
import { formatCurrency, calculateCartTotal } from '../../utils/preOrderHelpers';
import { motion, AnimatePresence } from 'framer-motion';

const OrderSummary = ({ cart, onUpdateQuantity, onRemoveItem, isMobile, isOpen, onClose }) => {
  const subtotal = calculateCartTotal(cart);
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const CartContent = () => (
    <div className="h-full flex flex-col">
      {/* Header with Gradient */}
      <div className="relative mb-5">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/10 rounded-2xl -z-10" />
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-dark rounded-xl flex items-center justify-center shadow-lg shadow-primary/30">
              <ShoppingCart className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-serif font-bold text-gray-900">
                Your Cart
              </h3>
              {cart.length > 0 && (
                <p className="text-xs text-gray-500">
                  {cart.length} {cart.length === 1 ? 'item' : 'items'} • {itemCount} total
                </p>
              )}
            </div>
          </div>
          {isMobile && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/80 rounded-full transition-colors"
            >
              <X size={20} className="text-gray-500" />
            </button>
          )}
        </div>
      </div>

      {/* Cart Items */}
      <div className="flex-1 overflow-y-auto mb-4 custom-scrollbar pr-2">
        {cart.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16"
          >
            <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
              <Package className="w-10 h-10 text-gray-300" />
            </div>
            <h4 className="font-serif font-semibold text-gray-700 mb-1">Cart is Empty</h4>
            <p className="text-sm text-gray-400">Add delicious items to get started</p>
          </motion.div>
        ) : (
          <AnimatePresence mode="popLayout">
            {cart.map((item) => (
              <motion.div
                key={item.productId}
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: -100, scale: 0.9 }}
                layout
                className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-4 mb-3 border-2 border-gray-100 hover:border-primary/20 transition-all shadow-sm hover:shadow-md group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 mr-2">
                    <h4 className="font-semibold text-gray-900 text-sm leading-tight mb-2">
                      {item.name}
                    </h4>
                    <div className="inline-block bg-primary/10 px-2 py-1 rounded-lg">
                      <p className="text-primary font-bold text-sm">
                        {formatCurrency(item.price)}
                      </p>
                    </div>
                  </div>

                  {/* Remove Button */}
                  <motion.button
                    onClick={() => onRemoveItem(item.productId)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Remove item"
                  >
                    <Trash2 size={16} />
                  </motion.button>
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 bg-white rounded-xl border-2 border-gray-200 p-1 shadow-sm">
                    <motion.button
                      onClick={() => onUpdateQuantity(item.productId, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                      whileHover={{ scale: item.quantity <= 1 ? 1 : 1.1 }}
                      whileTap={{ scale: item.quantity <= 1 ? 1 : 0.9 }}
                      className={`p-2 rounded-lg transition-all ${
                        item.quantity <= 1
                          ? 'text-gray-300 cursor-not-allowed'
                          : 'text-primary hover:bg-primary/10'
                      }`}
                    >
                      <Minus size={14} strokeWidth={2.5} />
                    </motion.button>

                    <span className="font-bold text-gray-900 min-w-[32px] text-center">
                      {item.quantity}
                    </span>

                    <motion.button
                      onClick={() => onUpdateQuantity(item.productId, item.quantity + 1)}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-all"
                    >
                      <Plus size={14} strokeWidth={2.5} />
                    </motion.button>
                  </div>

                  {/* Item Total */}
                  <div className="text-right">
                    <p className="text-xs text-gray-500 mb-0.5">Total</p>
                    <span className="font-bold text-gray-900 text-lg">
                      {formatCurrency(item.price * item.quantity)}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Subtotal */}
      {cart.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-t-2 border-gray-100 pt-4 space-y-3"
        >
          {/* Subtotal Row */}
          <div className="flex items-center justify-between px-2">
            <span className="text-gray-600 font-medium">Subtotal</span>
            <span className="text-xl font-bold text-gray-900">
              {formatCurrency(subtotal)}
            </span>
          </div>

          {/* Total Display */}
          <div className="bg-gradient-to-br from-primary to-primary-dark rounded-2xl p-4 text-white shadow-lg shadow-primary/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                <span className="font-semibold">Order Total</span>
              </div>
              <span className="text-2xl font-bold">
                {formatCurrency(subtotal)}
              </span>
            </div>
          </div>

          {/* Info Note */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-100 rounded-xl p-3">
            <p className="text-xs text-blue-800 text-center font-medium">
              ✨ Final price will be confirmed by our team
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );

  // Mobile: Render as modal
  if (isMobile) {
    return (
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-black/50 z-40"
            />

            {/* Modal */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl z-50 max-h-[80vh] p-6"
            >
              <CartContent />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    );
  }

  // Desktop: Render as sticky sidebar
  return (
    <>
      <div className="bg-white rounded-3xl shadow-xl p-6 sticky top-24 max-h-[calc(100vh-120px)] border-2 border-gray-100">
        <CartContent />
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }
      `}</style>
    </>
  );
};

export default OrderSummary;
