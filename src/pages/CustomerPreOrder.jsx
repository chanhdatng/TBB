import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { useToast } from '../contexts/ToastContext';
import { ref, push } from 'firebase/database';
import { database } from '../firebase';
import { ShoppingCart, Loader2, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import ProductCatalog from '../components/PreOrder/ProductCatalog';
import ProductQuickSelect from '../components/PreOrder/ProductQuickSelect';
import OrderSummary from '../components/PreOrder/OrderSummary';
import CustomerInfoForm from '../components/PreOrder/CustomerInfoForm';
import {
  generateObjectId,
  toCFAbsoluteTime,
  calculateCartTotal,
  getTodayDate
} from '../utils/preOrderHelpers';

const CustomerPreOrder = () => {
  const navigate = useNavigate();
  const { products, loading } = useData();
  const { showToast } = useToast();

  // Cart state
  const [cart, setCart] = useState([]);
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);

  // Customer form state
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: '',
    address: '',
    socialLink: '',
    deliveryDate: '',
    deliveryTimeSlot: ''
  });

  // UI state
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  // Detect mobile/desktop
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Restore cart from localStorage
  useEffect(() => {
    const savedCart = localStorage.getItem('preorder_cart');
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) {
        console.error('Failed to restore cart:', e);
      }
    }
  }, []);

  // Save cart to localStorage
  useEffect(() => {
    if (cart.length > 0) {
      localStorage.setItem('preorder_cart', JSON.stringify(cart));
    } else {
      localStorage.removeItem('preorder_cart');
    }
  }, [cart]);

  // Cart operations
  const addToCart = (product) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.productId === product.id);

      if (existingItem) {
        // Increment quantity
        return prevCart.map(item =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        // Add new item
        return [
          ...prevCart,
          {
            productId: product.id,
            name: product.name,
            price: product.price,
            quantity: 1
          }
        ];
      }
    });

    showToast(`${product.name} added to cart`, 'success');
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity < 1) return;

    setCart(prevCart =>
      prevCart.map(item =>
        item.productId === productId
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  };

  const removeFromCart = (productId) => {
    setCart(prevCart => prevCart.filter(item => item.productId !== productId));
    showToast('Item removed from cart', 'info');
  };

  // Form validation
  const validateForm = () => {
    const newErrors = {};

    if (!customerInfo.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!customerInfo.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }

    if (!customerInfo.address.trim()) {
      newErrors.address = 'Delivery address is required';
    }

    if (!customerInfo.deliveryDate) {
      newErrors.deliveryDate = 'Delivery date is required';
    } else if (customerInfo.deliveryDate < getTodayDate()) {
      newErrors.deliveryDate = 'Delivery date cannot be in the past';
    }

    if (!customerInfo.deliveryTimeSlot) {
      newErrors.deliveryTimeSlot = 'Please select a delivery time slot';
    }

    if (cart.length === 0) {
      newErrors.cart = 'Please add at least one item to your cart';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit pre-order
  const handleSubmit = async () => {
    if (!validateForm()) {
      showToast('Please fill in all required fields', 'error');
      // Scroll to first error
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare order data
      const preOrderData = {
        customer: {
          name: customerInfo.name.trim(),
          phone: customerInfo.phone.trim(),
          address: customerInfo.address.trim(),
          socialLink: customerInfo.socialLink.trim(),
          note: ''
        },
        cakes: cart.map(item => ({
          id: generateObjectId(),
          name: item.name,
          price: item.price,
          amount: item.quantity
        })),
        deliveryDate: customerInfo.deliveryDate,
        deliveryTime: customerInfo.deliveryTimeSlot,
        createDate: toCFAbsoluteTime(new Date()),
        state: 'pending',
        status: 'pending',
        shipFee: 0,
        discount: 0,
        otherFee: 0,
        total: calculateCartTotal(cart)
      };

      // Submit to Firebase
      const preOrdersRef = ref(database, 'preorders');
      const newOrderRef = await push(preOrdersRef, preOrderData);

      // Clear form and cart
      setCart([]);
      setCustomerInfo({
        name: '',
        phone: '',
        address: '',
        socialLink: '',
        deliveryDate: '',
        deliveryTimeSlot: ''
      });

      // Navigate to confirmation
      navigate(`/order-confirmation/${newOrderRef.key}`);
    } catch (error) {
      console.error('Failed to submit pre-order:', error);
      showToast('Failed to submit order. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-bakery-bg via-white to-primary/5">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="relative w-24 h-24 mx-auto mb-6">
            <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary-dark rounded-full opacity-20 animate-ping"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary-dark rounded-full flex items-center justify-center">
              <Loader2 className="w-12 h-12 animate-spin text-white" />
            </div>
          </div>
          <h3 className="text-xl font-serif font-bold text-bakery-text mb-2">Loading Our Delicious Products</h3>
          <p className="text-gray-600">Please wait a moment...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-bakery-bg via-white to-bakery-bg pb-24 lg:pb-8">
      {/* Header with Gradient */}
      <header className="bg-white/80 backdrop-blur-md shadow-md sticky top-0 z-30 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-dark rounded-xl flex items-center justify-center shadow-lg">
              <ShoppingCart className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl md:text-2xl font-serif font-bold bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">
              The Butter Bake
            </h1>
          </div>
          <button
            onClick={() => navigate('/landing')}
            className="text-sm font-medium text-gray-600 hover:text-primary transition-colors flex items-center gap-1 bg-gray-100 hover:bg-primary/10 px-4 py-2 rounded-full"
          >
            ← Back to Home
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="inline-block bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 px-6 py-2 rounded-full mb-4">
            <p className="text-sm font-semibold text-primary uppercase tracking-wide">Pre-Order Now</p>
          </div>
          <h2 className="text-3xl md:text-5xl font-serif font-bold text-bakery-text mb-4">
            Fresh Baked Goodness
            <span className="block text-2xl md:text-3xl text-primary mt-2">Delivered to Your Door</span>
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg">
            Choose from our handcrafted selection and we'll bring the bakery to you
          </p>
        </motion.div>

        {/* Error Alert */}
        {errors.cart && (
          <div className="max-w-2xl mx-auto mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <p className="text-red-800 text-sm">{errors.cart}</p>
          </div>
        )}

        {/* Layout: Desktop - 2 columns, Mobile - Single column */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Products & Form */}
          <div className="lg:col-span-2 space-y-8">
            {/* Quick Select */}
            <ProductQuickSelect products={products} onAddToCart={addToCart} />

            {/* Product Catalog */}
            <ProductCatalog products={products} onAddToCart={addToCart} />

            {/* Customer Form */}
            <CustomerInfoForm
              customerInfo={customerInfo}
              setCustomerInfo={setCustomerInfo}
              errors={errors}
            />
          </div>

          {/* Right Column: Order Summary (Desktop only) */}
          {!isMobile && (
            <div className="lg:col-span-1">
              <OrderSummary
                cart={cart}
                onUpdateQuantity={updateQuantity}
                onRemoveItem={removeFromCart}
                isMobile={false}
              />
            </div>
          )}
        </div>

        {/* Submit Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="max-w-3xl mx-auto mt-12"
        >
          <motion.button
            onClick={handleSubmit}
            disabled={isSubmitting || cart.length === 0}
            whileHover={{ scale: isSubmitting || cart.length === 0 ? 1 : 1.02 }}
            whileTap={{ scale: isSubmitting || cart.length === 0 ? 1 : 0.98 }}
            className={`w-full py-5 rounded-2xl text-lg font-bold transition-all shadow-2xl ${
              isSubmitting || cart.length === 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-primary to-primary-dark text-white hover:shadow-3xl shadow-primary/40'
            }`}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-3">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span>Submitting Your Order...</span>
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                <span>Submit Pre-Order</span>
              </span>
            )}
          </motion.button>

          {cart.length === 0 && (
            <p className="text-center text-sm text-gray-500 mt-3">
              Add items to your cart to place an order
            </p>
          )}
        </motion.div>
      </div>

      {/* Mobile: Floating Cart Button */}
      {isMobile && (
        <>
          <motion.button
            onClick={() => setIsMobileCartOpen(true)}
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="fixed bottom-6 right-6 bg-gradient-to-r from-primary to-primary-dark text-white p-5 rounded-full shadow-2xl hover:shadow-3xl transition-all z-30"
          >
            <ShoppingCart size={24} />
            {cart.length > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold min-w-[28px] h-7 rounded-full flex items-center justify-center px-2 shadow-lg"
              >
                {cart.reduce((sum, item) => sum + item.quantity, 0)}
              </motion.span>
            )}
          </motion.button>

          {/* Mobile Cart Modal */}
          <OrderSummary
            cart={cart}
            onUpdateQuantity={updateQuantity}
            onRemoveItem={removeFromCart}
            isMobile={true}
            isOpen={isMobileCartOpen}
            onClose={() => setIsMobileCartOpen(false)}
          />
        </>
      )}
    </div>
  );
};

export default CustomerPreOrder;
