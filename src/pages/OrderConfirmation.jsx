import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ref, onValue } from 'firebase/database';
import { database } from '../firebase';
import { CheckCircle, Clock } from 'lucide-react';

const OrderConfirmation = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) {
      navigate('/pre-order');
      return;
    }

    const orderRef = ref(database, `preorders/${orderId}`);
    const unsubscribe = onValue(orderRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setOrder(data);
      }
      setLoading(false);
    });

    // Clear cart from localStorage
    localStorage.removeItem('preorder_cart');

    return () => unsubscribe();
  }, [orderId, navigate]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bakery-bg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-bakery-text">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bakery-bg">
        <div className="text-center">
          <p className="text-lg text-gray-600 mb-4">Order not found</p>
          <Link to="/pre-order" className="text-primary hover:underline">
            Place a new order
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bakery-bg py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Success Header */}
        <div className="text-center mb-8">
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h1 className="text-3xl font-serif font-bold text-bakery-text mb-2">
            Order Submitted Successfully!
          </h1>
          <p className="text-gray-600">Order #{orderId.slice(-8).toUpperCase()}</p>
        </div>

        {/* Status Badge */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <Clock className="w-5 h-5 text-orange-500" />
          <span className="text-orange-600 font-medium">Pending Approval</span>
        </div>

        {/* Order Details Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-serif font-bold text-bakery-text mb-4">Order Details</h2>

          {/* Customer Info */}
          <div className="mb-6 pb-6 border-b">
            <h3 className="font-semibold text-gray-700 mb-2">Customer Information</h3>
            <p className="text-gray-600">Name: {order.customer?.name}</p>
            <p className="text-gray-600">Phone: {order.customer?.phone}</p>
            <p className="text-gray-600">Address: {order.customer?.address}</p>
            {order.customer?.socialLink && (
              <p className="text-gray-600">Social: {order.customer.socialLink}</p>
            )}
          </div>

          {/* Delivery Info */}
          <div className="mb-6 pb-6 border-b">
            <h3 className="font-semibold text-gray-700 mb-2">Delivery Details</h3>
            <p className="text-gray-600">Date: {order.deliveryDate}</p>
            <p className="text-gray-600">Time: {order.deliveryTime}</p>
          </div>

          {/* Items */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-700 mb-3">Items</h3>
            {order.cakes?.map((item, index) => (
              <div key={index} className="flex justify-between items-center py-2">
                <span className="text-gray-700">
                  {item.amount}x {item.name}
                </span>
                <span className="font-medium text-gray-900">
                  {formatCurrency(item.price * item.amount)}
                </span>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="pt-4 border-t">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-gray-900">Total</span>
              <span className="text-2xl font-bold text-primary">
                {formatCurrency(order.total)}
              </span>
            </div>
          </div>
        </div>

        {/* Info Message */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
          <p className="text-blue-800 text-center">
            We'll contact you soon to confirm your order!
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            to="/landing"
            className="flex-1 bg-white border-2 border-primary text-primary py-3 rounded-full text-center font-medium hover:bg-primary hover:text-white transition-all"
          >
            ← Back to Home
          </Link>
          <Link
            to="/pre-order"
            className="flex-1 bg-primary text-white py-3 rounded-full text-center font-medium hover:bg-primary-dark transition-all"
          >
            Submit Another Order
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation;
