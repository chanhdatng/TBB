import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

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
                {toasts.map(toast => (
                    <div
                        key={toast.id}
                        className={`
                            pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border animate-in slide-in-from-right-full duration-300
                            ${toast.type === 'success' ? 'bg-white border-green-100 text-green-800' :
                                toast.type === 'error' ? 'bg-white border-red-100 text-red-800' :
                                    toast.type === 'warning' ? 'bg-white border-yellow-100 text-yellow-800' :
                                        'bg-white border-blue-100 text-blue-800'}
                        `}
                    >
                        {toast.type === 'success' && <CheckCircle size={20} className="text-green-500" />}
                        {toast.type === 'error' && <AlertCircle size={20} className="text-red-500" />}
                        {toast.type === 'warning' && <AlertTriangle size={20} className="text-yellow-500" />}
                        {toast.type === 'info' && <Info size={20} className="text-blue-500" />}

                        <p className="text-sm font-medium">{toast.message}</p>

                        <button
                            onClick={() => removeToast(toast.id)}
                            className="ml-2 text-gray-400 hover:text-gray-600"
                        >
                            <X size={16} />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};

export default ToastProvider;
