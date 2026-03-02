import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LogOut, BookOpen, Users, BarChart3, List, UserCheck, Menu, X } from 'lucide-react';
import api from '../api/axios';

const Navbar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [role, setRole] = useState(null);
    const [menuOpen, setMenuOpen] = useState(false);

    useEffect(() => {
        setRole(localStorage.getItem('userRole'));
        setMenuOpen(false); // Close menu on route change
    }, [location]);

    const handleLogout = async () => {
        try {
            await api.post('/users/logout');
            localStorage.removeItem('userRole');
            localStorage.removeItem('userName');
            localStorage.removeItem('user');
            navigate('/login');
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    const linkClass = "flex items-center gap-2 px-3 py-2.5 rounded-md text-sm font-semibold text-slate-700 hover:text-secondary hover:bg-white/50 transition-all";

    const getLinks = () => {
        if (role === 'admin') {
            return [
                { to: '/dashboard?tab=students', icon: <Users size={16} />, label: 'Students' },
                { to: '/dashboard?tab=mentors', icon: <Users size={16} />, label: 'Mentors' },
                { to: '/dashboard?tab=tracks', icon: <List size={16} />, label: 'Tracks' },
                { to: '/dashboard?tab=applications', icon: <UserCheck size={16} />, label: 'Applications' },
                { to: '/dashboard?tab=performance', icon: <BarChart3 size={16} />, label: 'Performance' },
            ];
        }
        if (role === 'learner') {
            return [
                { to: '/dashboard?tab=enrolled', icon: <BookOpen size={16} />, label: 'Enrolled' },
                { to: '/dashboard?tab=all', icon: <List size={16} />, label: 'All Tracks' },
                { to: '/dashboard?tab=performance', icon: <BarChart3 size={16} />, label: 'Performance' },
            ];
        }
        if (role === 'mentor') {
            return [
                { to: '/dashboard?tab=my-tracks', icon: <List size={16} />, label: 'My Tracks' },
                { to: '/dashboard?tab=new-track', icon: <BookOpen size={16} />, label: 'New Track' },
                { to: '/dashboard?tab=performance', icon: <BarChart3 size={16} />, label: 'Performance' },
            ];
        }
        return [];
    };

    const links = getLinks();

    return (
        <nav className="bg-primary shadow-sm sticky top-0 z-50 w-full">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-14">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2 text-slate-800 font-bold text-xl hover:opacity-80 transition-opacity shrink-0">
                        <BookOpen className="text-secondary" size={22} />
                        <span>SkillForge</span>
                    </Link>

                    {/* Desktop Nav */}
                    {role && (
                        <div className="hidden md:flex items-center gap-1">
                            {links.map(link => (
                                <Link key={link.to} to={link.to} className={linkClass}>
                                    {link.icon} {link.label}
                                </Link>
                            ))}
                            <button
                                onClick={handleLogout}
                                className="ml-2 flex items-center gap-2 px-4 py-2 bg-background hover:bg-tertiary text-slate-800 rounded-md shadow-sm transition-colors text-sm font-medium"
                            >
                                <LogOut size={16} />
                                Logout
                            </button>
                        </div>
                    )}

                    {/* Mobile Hamburger */}
                    {role && (
                        <button
                            onClick={() => setMenuOpen(prev => !prev)}
                            className="md:hidden p-2 rounded-md text-slate-700 hover:bg-white/40 transition-colors"
                            aria-label="Toggle menu"
                        >
                            {menuOpen ? <X size={22} /> : <Menu size={22} />}
                        </button>
                    )}
                </div>
            </div>

            {/* Mobile Dropdown Menu */}
            {menuOpen && role && (
                <div className="md:hidden border-t border-primary/30 bg-primary px-4 pb-4 pt-2 space-y-1">
                    {links.map(link => (
                        <Link
                            key={link.to}
                            to={link.to}
                            onClick={() => setMenuOpen(false)}
                            className="flex items-center gap-3 px-3 py-3 rounded-md text-sm font-semibold text-slate-700 hover:bg-white/40 transition-colors"
                        >
                            {link.icon} {link.label}
                        </Link>
                    ))}
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-3 rounded-md text-sm font-semibold text-slate-700 hover:bg-white/40 transition-colors"
                    >
                        <LogOut size={16} /> Logout
                    </button>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
