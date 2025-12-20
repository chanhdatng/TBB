import React, { useState, useMemo } from 'react';
import { ShoppingCart, Plus, Sparkles } from 'lucide-react';
import { formatCurrency, getPlaceholderImage } from '../../utils/preOrderHelpers';
import { motion, AnimatePresence } from 'framer-motion';

const ProductCatalog = ({ products, onAddToCart }) => {
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Get unique categories
  const categories = useMemo(() => {
    const cats = ['All', ...new Set(products.map(p => p.type).filter(Boolean))];
    return cats;
  }, [products]);

  // Filter products by category
  const filteredProducts = useMemo(() => {
    if (selectedCategory === 'All') return products;
    return products.filter(p => p.type === selectedCategory);
  }, [products, selectedCategory]);

  const handleAddToCart = (product) => {
    onAddToCart(product);
  };

  return (
    <div className="mb-12">
      {/* Section Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-bakery-accent" />
          <h3 className="text-2xl md:text-3xl font-serif font-bold text-bakery-text">
            Our Delicious Products
          </h3>
          <Sparkles className="w-5 h-5 text-bakery-accent" />
        </div>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Handcrafted daily with love and premium ingredients
        </p>
      </div>

      {/* Category Filter */}
      <div className="mb-8 flex flex-wrap gap-3 justify-center">
        {categories.map((category) => (
          <motion.button
            key={category}
            onClick={() => setSelectedCategory(category)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all shadow-sm ${
              selectedCategory === category
                ? 'bg-gradient-to-r from-primary to-primary-dark text-white shadow-lg shadow-primary/30'
                : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-primary/40 hover:shadow-md'
            }`}
          >
            {category}
          </motion.button>
        ))}
      </div>

      {/* Product Grid */}
      {filteredProducts.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16 bg-white rounded-3xl shadow-md"
        >
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingCart className="w-12 h-12 text-gray-300" />
          </div>
          <h3 className="text-xl font-serif font-semibold text-gray-700 mb-2">
            No Products Found
          </h3>
          <p className="text-gray-500">Try selecting a different category</p>
        </motion.div>
      ) : (
        <motion.div
          layout
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6"
        >
          <AnimatePresence mode="popLayout">
            {filteredProducts.map((product, index) => (
              <motion.div
                key={product.id}
                layout
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: -20 }}
                transition={{ delay: index * 0.05 }}
                className="group"
              >
                <div className="bg-white rounded-3xl shadow-md hover:shadow-2xl transition-all duration-500 overflow-hidden border border-gray-100 h-full flex flex-col">
                  {/* Product Image Container */}
                  <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
                    <motion.img
                      src={product.image || getPlaceholderImage(product.type)}
                      alt={product.name}
                      className="w-full h-full object-cover"
                      whileHover={{ scale: 1.1 }}
                      transition={{ duration: 0.4 }}
                      onError={(e) => {
                        e.target.src = getPlaceholderImage(product.type);
                      }}
                    />

                    {/* Overlay Badge */}
                    {product.type && (
                      <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm px-3 py-1 rounded-full shadow-lg">
                        <p className="text-xs font-semibold text-primary">{product.type}</p>
                      </div>
                    )}

                    {/* Stock Badge */}
                    {product.stock !== undefined && product.stock <= 0 && (
                      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                        <span className="bg-red-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-xl">
                          Out of Stock
                        </span>
                      </div>
                    )}

                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>

                  {/* Product Info */}
                  <div className="p-4 md:p-5 flex-1 flex flex-col">
                    <h3 className="font-serif text-base md:text-lg font-bold text-bakery-text mb-2 line-clamp-2 flex-1">
                      {product.name}
                    </h3>

                    {/* Price with gradient background */}
                    <div className="mb-4">
                      <div className="inline-block bg-gradient-to-r from-primary/10 to-primary/5 px-3 py-1.5 rounded-lg">
                        <p className="text-primary font-bold text-xl md:text-2xl">
                          {formatCurrency(product.price)}
                        </p>
                      </div>
                    </div>

                    {/* Add to Cart Button */}
                    <motion.button
                      onClick={() => handleAddToCart(product)}
                      disabled={product.stock !== undefined && product.stock <= 0}
                      whileHover={{ scale: product.stock !== undefined && product.stock <= 0 ? 1 : 1.02 }}
                      whileTap={{ scale: product.stock !== undefined && product.stock <= 0 ? 1 : 0.98 }}
                      className={`w-full flex items-center justify-center gap-2 py-3 md:py-3.5 rounded-xl font-semibold text-sm transition-all ${
                        product.stock !== undefined && product.stock <= 0
                          ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          : 'bg-gradient-to-r from-primary to-primary-dark text-white shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40'
                      }`}
                    >
                      <Plus size={18} strokeWidth={2.5} />
                      <span>Add to Cart</span>
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
};

export default ProductCatalog;
