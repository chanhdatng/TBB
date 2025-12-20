import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Plus, Zap } from 'lucide-react';
import { formatCurrency } from '../../utils/preOrderHelpers';
import { motion, AnimatePresence } from 'framer-motion';

const ProductQuickSelect = ({ products, onAddToCart }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter products based on search term
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.type && product.type.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSelectProduct = (product) => {
    onAddToCart(product);
    setSearchTerm('');
    setIsOpen(false);
  };

  return (
    <div className="relative mb-8" ref={dropdownRef}>
      <div className="max-w-3xl mx-auto">
        {/* Label with Icon */}
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg flex items-center justify-center">
            <Zap className="w-4 h-4 text-primary" />
          </div>
          <label className="text-sm font-semibold text-gray-700">
            Quick Add Product
          </label>
        </div>

        {/* Search Input with Enhanced Design */}
        <div
          className="relative bg-gradient-to-br from-white to-gray-50 rounded-2xl border-2 border-gray-200 focus-within:border-primary focus-within:shadow-lg focus-within:shadow-primary/10 transition-all cursor-pointer group overflow-hidden"
          onClick={() => setIsOpen(true)}
        >
          {/* Animated gradient background on focus */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 opacity-0 group-focus-within:opacity-100 transition-opacity" />

          <div className="relative flex items-center px-5 py-4">
            <Search className="w-5 h-5 text-gray-400 mr-3 group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              placeholder="Search by name or category..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setIsOpen(true);
              }}
              className="flex-1 outline-none text-gray-700 placeholder-gray-400 bg-transparent font-medium"
              onFocus={() => setIsOpen(true)}
            />
            <motion.div
              animate={{ rotate: isOpen ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <ChevronDown className="w-5 h-5 text-gray-400" />
            </motion.div>
          </div>

          {/* Dropdown List with Animation */}
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="absolute z-20 w-full mt-2 bg-white border-2 border-gray-200 rounded-2xl shadow-2xl max-h-96 overflow-hidden"
              >
                {filteredProducts.length === 0 ? (
                  <div className="px-4 py-12 text-center text-gray-500">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Search className="w-8 h-8 text-gray-300" />
                    </div>
                    <p className="font-medium text-gray-600">No products found</p>
                    <p className="text-sm text-gray-400 mt-1">Try a different search term</p>
                  </div>
                ) : (
                  <div className="max-h-96 overflow-y-auto custom-scrollbar">
                    <ul className="py-2">
                      {filteredProducts.map((product, index) => (
                        <motion.li
                          key={product.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.03 }}
                        >
                          <button
                            onClick={() => handleSelectProduct(product)}
                            disabled={product.stock !== undefined && product.stock <= 0}
                            className={`w-full flex items-center justify-between px-5 py-4 transition-all group/item ${
                              product.stock !== undefined && product.stock <= 0
                                ? 'opacity-50 cursor-not-allowed'
                                : 'hover:bg-gradient-to-r hover:from-primary/5 hover:to-transparent active:bg-primary/10'
                            }`}
                          >
                            <div className="flex-1 text-left">
                              <p className="font-semibold text-gray-900 group-hover/item:text-primary transition-colors">
                                {product.name}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                {product.type && (
                                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                                    {product.type}
                                  </span>
                                )}
                                {product.stock !== undefined && product.stock <= 0 && (
                                  <span className="text-xs text-red-500 bg-red-50 px-2 py-0.5 rounded-full font-medium">
                                    Out of stock
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-3 ml-4">
                              <span className="font-bold text-primary text-lg">
                                {formatCurrency(product.price)}
                              </span>
                              {product.stock === undefined || product.stock > 0 ? (
                                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center group-hover/item:bg-primary group-hover/item:scale-110 transition-all">
                                  <Plus className="w-4 h-4 text-primary group-hover/item:text-white" />
                                </div>
                              ) : null}
                            </div>
                          </button>
                        </motion.li>
                      ))}
                    </ul>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <p className="mt-3 text-xs text-gray-500 flex items-center gap-1.5">
          <span className="inline-block w-1.5 h-1.5 bg-primary rounded-full"></span>
          Type to search or click to browse all available products
        </p>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #0F5132;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #0B3D26;
        }
      `}</style>
    </div>
  );
};

export default ProductQuickSelect;
