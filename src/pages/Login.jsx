import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import loginBg from '../assets/login-bg.png';
import { Loader2, AlertTriangle, Clock } from 'lucide-react';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isRateLimited, setIsRateLimited] = useState(false);
    const [retryCountdown, setRetryCountdown] = useState(0);
    const { login, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    // Redirect if already authenticated
    useEffect(() => {
        if (isAuthenticated) {
            navigate('/admin');
        }
    }, [isAuthenticated, navigate]);

    // Countdown timer for rate limiting
    useEffect(() => {
        if (retryCountdown > 0) {
            const timer = setTimeout(() => {
                setRetryCountdown(prev => prev - 1);
            }, 1000);
            return () => clearTimeout(timer);
        } else if (isRateLimited && retryCountdown === 0) {
            setIsRateLimited(false);
            setError('');
        }
    }, [retryCountdown, isRateLimited]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (isRateLimited) {
            return;
        }
        
        setError('');
        setIsLoading(true);
        
        const result = await login(username, password);
        
        setIsLoading(false);
        
        if (result.success) {
            navigate('/admin');
        } else {
            // Check if rate limited
            if (result.retryAfter) {
                setIsRateLimited(true);
                setRetryCountdown(result.retryAfter);
            }
            setError(result.message);
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="min-h-screen flex bg-bakery-bg">
            {/* Left Side - Form */}
            <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-8 lg:p-12">
                <div className="w-full max-w-md">
                    <div className="text-center mb-10">
                        <h2 className="text-4xl font-bold text-bakery-text mb-2">Welcome Back</h2>
                        <p className="text-gray-600">Enter your credentials to access admin dashboard</p>
                    </div>

                    {/* Rate Limit Warning */}
                    {isRateLimited && (
                        <div className="bg-amber-50 border border-amber-300 text-amber-800 px-4 py-4 rounded-lg mb-4 flex items-start gap-3">
                            <Clock className="w-5 h-5 mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="font-semibold">Too many login attempts</p>
                                <p className="text-sm mt-1">
                                    Please wait <span className="font-mono font-bold">{formatTime(retryCountdown)}</span> before trying again.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Error Message */}
                    {error && !isRateLimited && (
                        <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-lg mb-4 flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-bakery-text text-sm font-bold mb-2" htmlFor="username">
                                Username
                            </label>
                            <input
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-bakery-accent focus:ring-2 focus:ring-bakery-accent/20 outline-none transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                                id="username"
                                type="text"
                                placeholder="Enter your username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                disabled={isLoading || isRateLimited}
                                autoComplete="username"
                            />
                        </div>
                        <div>
                            <label className="block text-bakery-text text-sm font-bold mb-2" htmlFor="password">
                                Password
                            </label>
                            <input
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-bakery-accent focus:ring-2 focus:ring-bakery-accent/20 outline-none transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                                id="password"
                                type="password"
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={isLoading || isRateLimited}
                                autoComplete="current-password"
                            />
                        </div>

                        <div className="flex items-center justify-between text-sm">
                            <label className="flex items-center text-gray-600 cursor-pointer">
                                <input type="checkbox" className="mr-2 rounded text-bakery-accent focus:ring-bakery-accent" />
                                Remember me
                            </label>
                        </div>

                        <button
                            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-4 rounded-lg transition-all transform hover:scale-[1.02] shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                            type="submit"
                            disabled={isLoading || isRateLimited}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Signing In...
                                </>
                            ) : isRateLimited ? (
                                <>
                                    <Clock className="w-5 h-5" />
                                    Wait {formatTime(retryCountdown)}
                                </>
                            ) : (
                                'Sign In'
                            )}
                        </button>

                        {/* Security Notice */}
                        <div className="text-center mt-4">
                            <p className="text-xs text-gray-500">
                                🔒 Protected by rate limiting and JWT authentication
                            </p>
                        </div>
                    </form>
                </div>
            </div>

            {/* Right Side - Image */}
            <div className="hidden lg:block lg:w-1/2 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent z-10"></div>
                <img
                    src={loginBg}
                    alt="Bakery Background"
                    className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute bottom-10 left-10 z-20 text-white max-w-md">
                    <h1 className="text-4xl font-bold mb-4 drop-shadow-lg">The Butter Bake Admin</h1>
                    <p className="text-lg drop-shadow-md opacity-90">Manage your orders, customers, and products with our secure admin dashboard.</p>

                    <div className="mt-8 flex space-x-2">
                        <div className="w-8 h-1 bg-white rounded-full"></div>
                        <div className="w-8 h-1 bg-white/50 rounded-full"></div>
                        <div className="w-8 h-1 bg-white/50 rounded-full"></div>
                    </div>
                </div>

                <div className="absolute bottom-10 right-10 z-20">
                    <a 
                        href="/"
                        className="bg-white text-bakery-text px-6 py-3 rounded-full font-bold shadow-lg hover:bg-gray-100 transition-colors flex items-center"
                    >
                        Back to Home <span className="ml-2">→</span>
                    </a>
                </div>
            </div>
        </div>
    );
};

export default Login;
