import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { LogIn } from 'lucide-react';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const isEmail = email.includes('@');
        const payload = isEmail ? { email, password } : { name: email, password };

        try {
            const response = await api.post('/users/login', payload);
            const userData = response.data.data.user;
            localStorage.setItem('userRole', userData.role);
            localStorage.setItem('userName', userData.name);
            localStorage.setItem('user', JSON.stringify(userData));
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to login');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col justify-center items-center px-4 py-12">
            <div className="w-full max-w-md">
                {/* Brand */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight">SkillForge</h1>
                    <p className="text-slate-500 mt-2 text-sm">Sign in to your account to continue</p>
                </div>

                <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 border border-primary/20">
                    {error && (
                        <div className="mb-4 p-3 bg-secondary/20 text-red-600 rounded-lg text-sm border border-secondary/50">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Name or Email</label>
                            <input
                                type="text"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-base"
                                placeholder="johndoe@example.com"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-base"
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center items-center gap-2 bg-primary hover:bg-primary/80 text-teal-900 font-semibold py-3 px-4 rounded-lg transition-all shadow-sm text-base mt-2"
                        >
                            {loading ? 'Signing in...' : (
                                <>
                                    <LogIn size={18} />
                                    Sign In
                                </>
                            )}
                        </button>
                    </form>

                    <p className="mt-6 text-center text-sm text-slate-600">
                        Don't have an account?{' '}
                        <Link to="/register" className="text-teal-700 hover:text-teal-900 font-semibold hover:underline">
                            Register here
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
