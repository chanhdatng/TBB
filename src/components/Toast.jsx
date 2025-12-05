import React, { useState, useEffect } from 'react';
import { Check, AlertCircle } from 'lucide-react';
import '../styles/Toast.css';

const Toast = ({ message, type = 'success', duration = 3000, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Wait for fade-out animation
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div className={`toast toast-${type} ${isVisible ? 'visible' : 'hidden'}`}>
      <div className="toast-content">
        {type === 'success' && <Check size={20} />}
        {type === 'error' && <AlertCircle size={20} />}
        <span>{message}</span>
      </div>
    </div>
  );
};

export default Toast;
