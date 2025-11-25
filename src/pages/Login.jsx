import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import loginBg from '../assets/login-bg.png';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const result = await login(username, password);
        if (result.success) {
            navigate('/');
        } else {
            setError(result.message);
        }
    };

    return (
        <div className="min-h-screen flex bg-bakery-bg">
            {/* Left Side - Form */}
            <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-8 lg:p-12">
                <div className="w-full max-w-md">
                    <div className="text-center mb-10">
                        <h2 className="text-4xl font-bold text-bakery-text mb-2">Welcome Back</h2>
                        <p className="text-gray-600">Enter your email and password to access your account</p>
                    </div>

                    {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-bakery-text text-sm font-bold mb-2" htmlFor="username">
                                Email
                            </label>
                            <input
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-bakery-accent focus:ring-2 focus:ring-bakery-accent/20 outline-none transition-all"
                                id="username"
                                type="text"
                                placeholder="Enter your email"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-bakery-text text-sm font-bold mb-2" htmlFor="password">
                                Password
                            </label>
                            <input
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-bakery-accent focus:ring-2 focus:ring-bakery-accent/20 outline-none transition-all"
                                id="password"
                                type="password"
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>

                        <div className="flex items-center justify-between text-sm">
                            <label className="flex items-center text-gray-600 cursor-pointer">
                                <input type="checkbox" className="mr-2 rounded text-bakery-accent focus:ring-bakery-accent" />
                                Remember me
                            </label>
                            <a href="#" className="text-bakery-text font-bold hover:underline">Forgot Password</a>
                        </div>

                        <button
                            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-4 rounded-lg transition-all transform hover:scale-[1.02] shadow-md"
                            type="submit"
                        >
                            Sign In
                        </button>

                        <div className="relative my-8">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-300"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-bakery-bg text-gray-500">Or login with</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <button type="button" className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                                <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="h-5 w-5 mr-2" alt="Google" />
                                <span className="text-gray-700 font-medium">Google</span>
                            </button>
                            <button type="button" className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                                <img src="https://www.svgrepo.com/show/511330/apple-173.svg" className="h-5 w-5 mr-2" alt="Apple" />
                                <span className="text-gray-700 font-medium">Apple</span>
                            </button>
                        </div>

                        <div className="text-center mt-6">
                            <p className="text-gray-600 text-sm">
                                Don't have account? <a href="#" className="text-bakery-text font-bold hover:underline">Register</a>
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
                    <h1 className="text-4xl font-bold mb-4 drop-shadow-lg">Try Our New Chocolate Almond Croissant!</h1>
                    <p className="text-lg drop-shadow-md opacity-90">Indulge in the perfect harmony of rich chocolate and toasted almonds, wrapped in our buttery, flaky croissant. A treat you won't forget!</p>

                    <div className="mt-8 flex space-x-2">
                        <div className="w-8 h-1 bg-white rounded-full"></div>
                        <div className="w-8 h-1 bg-white/50 rounded-full"></div>
                        <div className="w-8 h-1 bg-white/50 rounded-full"></div>
                    </div>
                </div>

                <div className="absolute bottom-10 right-10 z-20">
                    <button className="bg-white text-bakery-text px-6 py-3 rounded-full font-bold shadow-lg hover:bg-gray-100 transition-colors flex items-center">
                        Back to Home <span className="ml-2">→</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Login;
