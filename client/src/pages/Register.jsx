import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { UserPlus } from 'lucide-react';

const Register = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await api.post('/users/register', formData);
            navigate('/login');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to register');
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
                    <p className="text-slate-500 mt-2 text-sm">Create your free account today</p>
                </div>

                <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 border border-primary/20">
                    {error && (
                        <div className="mb-4 p-3 bg-secondary/20 text-red-600 rounded-lg text-sm border border-secondary/50">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleRegister} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Name</label>
                            <input
                                type="text" name="name" value={formData.name} onChange={handleChange}
                                className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-base"
                                placeholder="John Doe" required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                            <input
                                type="email" name="email" value={formData.email} onChange={handleChange}
                                className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-base"
                                placeholder="john@example.com" required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
                            <input
                                type="password" name="password" value={formData.password} onChange={handleChange}
                                className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-base"
                                placeholder="••••••••" required
                            />
                        </div>

                        <p className="text-xs text-slate-400 bg-slate-50 border border-slate-100 rounded-lg p-3">
                            All new accounts are registered as <strong>Learners</strong>. You can apply to become a Mentor from your dashboard after registering.
                        </p>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center items-center gap-2 bg-secondary hover:bg-secondary/80 text-white font-semibold py-3 px-4 rounded-lg transition-all shadow-sm text-base mt-2"
                        >
                            {loading ? 'Creating...' : (
                                <>
                                    <UserPlus size={18} />
                                    Create Account
                                </>
                            )}
                        </button>
                    </form>

                    <p className="mt-6 text-center text-sm text-slate-600">
                        Already have an account?{' '}
                        <Link to="/login" className="text-secondary hover:text-red-500 font-semibold hover:underline">
                            Sign in here
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;
