import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, Database, User, LogOut } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useAuth } from '@/context/AuthContext';
import { APP_CONFIG } from '@/config/constants';

const Navbar: React.FC = () => {
    const { user, isAuthenticated, logout } = useAuth();
    const [isOpen, setIsOpen] = React.useState(false);
    const navigate = useNavigate();
    const ADMIN_PATH = import.meta.env.VITE_ADMIN_PATH || '/admin';

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/10 px-6 py-4">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                    <Database className="text-primary w-8 h-8 fill-primary" />
                    <span className="text-xl font-bold tracking-tight">{APP_CONFIG.SYSTEM_NAME}</span>
                </Link>

                {/* Desktop Menu */}
                <div className="hidden md:flex items-center gap-8">
                    {isAuthenticated ? (
                        <>
                            <Link to="/dashboard" className="hover:text-primary transition-colors">Dashboard</Link>
                            {user?.role === 'admin' && (
                                <Link to={ADMIN_PATH} className="hover:text-primary transition-colors">Admin</Link>
                            )}
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-red-400"
                            >
                                <LogOut className="w-4 h-4" />
                                <span>Logout</span>
                            </button>
                        </>
                    ) : (
                        <div className="flex items-center gap-4">
                            <Link to="/login" className="px-5 py-2 hover:text-primary transition-colors font-medium">Login</Link>
                            <Link to="/register" className="px-5 py-2 bg-primary rounded-xl font-semibold hover:bg-primary-dark transition-colors text-white">Sign Up</Link>
                        </div>
                    )}
                </div>

                {/* Mobile Toggle */}
                <button className="md:hidden" onClick={() => setIsOpen(!isOpen)}>
                    {isOpen ? <X /> : <Menu />}
                </button>
            </div>

            {/* Mobile Menu */}
            {isOpen && (
                <div className="md:hidden absolute top-full left-0 right-0 glass border-b border-white/10 p-6 space-y-4 animate-in fade-in slide-in-from-top-4">
                    {isAuthenticated ? (
                        <>
                            <Link to="/dashboard" className="block hover:text-primary" onClick={() => setIsOpen(false)}>Dashboard</Link>
                            {user?.role === 'admin' && (
                                <Link to={ADMIN_PATH} className="block hover:text-primary" onClick={() => setIsOpen(false)}>Admin</Link>
                            )}
                            <button
                                onClick={handleLogout}
                                className="w-full py-3 border border-white/10 rounded-xl font-semibold text-red-400"
                            >
                                Logout
                            </button>
                        </>
                    ) : (
                        <>
                            <Link to="/login" className="block w-full py-3 text-center border border-white/10 rounded-xl font-semibold" onClick={() => setIsOpen(false)}>Login</Link>
                            <Link to="/register" className="block w-full py-3 text-center bg-primary rounded-xl font-semibold text-white" onClick={() => setIsOpen(false)}>Sign Up</Link>
                        </>
                    )}
                </div>
            )}
        </nav>
    );
};

export default Navbar;
