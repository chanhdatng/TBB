import React, { useState } from 'react';
import { X, Lock } from 'lucide-react';

const PasswordModal = ({ isOpen, onClose, onSuccess }) => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        
        // Get password from environment variable instead of hardcoding
        const correctPassword = import.meta.env.VITE_REVENUE_PASSWORD;
        
        if (!correctPassword) {
            console.error('VITE_REVENUE_PASSWORD not configured in .env');
            setError('Configuration error. Please contact admin.');
            return;
        }
        
        if (password === correctPassword) {
            onSuccess();
            onClose();
            setPassword('');
            setError('');
        } else {
            setError('Incorrect password');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <Lock className="w-5 h-5 text-primary" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">Security Check</h3>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Enter Password to Reveal Revenue
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value);
                                    setError('');
                                }}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                placeholder="••••••••"
                                autoFocus
                            />
                            {error && (
                                <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                                    {error}
                                </p>
                            )}
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 text-sm font-bold text-white bg-primary hover:bg-primary-light rounded-lg transition-colors shadow-lg shadow-primary/30"
                            >
                                Unlock
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default PasswordModal;
