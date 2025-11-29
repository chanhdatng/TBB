import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { slideInFromRightVariants } from '../utils/animations';
import { useReducedMotion } from '../hooks/useAnimations';

const ToastContext = createContext();

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);
    const reducedMotion = useReducedMotion();

    const showToast = useCallback((message, type = 'success', duration = 3000) => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);

        setTimeout(() => {
            removeToast(id);
        }, duration);
    }, []);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
                <AnimatePresence mode="popLayout">
                    {toasts.map(toast => (
                        <motion.div
                            key={toast.id}
                            layout
                            variants={reducedMotion ? {} : slideInFromRightVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            whileHover={reducedMotion ? {} : { scale: 1.02, transition: { duration: 0.15 } }}
                            className={`
                                pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border
                                ${toast.type === 'success' ? 'bg-white border-green-100 text-green-800' :
                                    toast.type === 'error' ? 'bg-white border-red-100 text-red-800' :
                                        toast.type === 'warning' ? 'bg-white border-yellow-100 text-yellow-800' :
                                            'bg-white border-blue-100 text-blue-800'}
                            `}
                        >
                            <motion.div
                                initial={{ scale: 0, rotate: -180 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ delay: 0.1, type: "spring", stiffness: 400, damping: 20 }}
                            >
                                {toast.type === 'success' && <CheckCircle size={20} className="text-green-500" />}
                                {toast.type === 'error' && <AlertCircle size={20} className="text-red-500" />}
                                {toast.type === 'warning' && <AlertTriangle size={20} className="text-yellow-500" />}
                                {toast.type === 'info' && <Info size={20} className="text-blue-500" />}
                            </motion.div>

                            <motion.p
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.15, duration: 0.2 }}
                                className="text-sm font-medium"
                            >
                                {toast.message}
                            </motion.p>

                            <motion.button
                                onClick={() => removeToast(toast.id)}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                className="ml-2 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <X size={16} />
                            </motion.button>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
};

export default ToastProvider;
