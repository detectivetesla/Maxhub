import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
    LayoutDashboard,
    Wallet,
    Zap,
    ShoppingBag,
    ArrowLeftRight,
    Download,
    Settings,
    LogOut,
    Plus,
    Cloud,
    Sun,
    Moon,
    MoreVertical
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';

interface SidebarProps {
    className?: string;
    onClose?: () => void;
    isCollapsed?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ className, onClose, isCollapsed }) => {
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();

    const menuItems: { icon: any, label: string, path: string, color: string, bgColor: string, badge?: string, end?: boolean }[] = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard', end: true, color: 'text-emerald-600 dark:text-emerald-500', bgColor: 'bg-emerald-500/20' },
        { icon: Wallet, label: 'Wallet', path: '/dashboard/wallet', color: 'text-orange-600 dark:text-orange-500', bgColor: 'bg-orange-500/20' },
        { icon: Download, label: 'Deposits', path: '/dashboard/deposits', color: 'text-blue-600 dark:text-blue-500', bgColor: 'bg-blue-500/20' },
        { icon: Zap, label: 'Data Bundles', path: '/dashboard/data-bundles', color: 'text-primary', bgColor: 'bg-primary/20' },
        { icon: ShoppingBag, label: 'Orders', path: '/dashboard/orders', badge: '3', color: 'text-purple-600 dark:text-purple-500', bgColor: 'bg-purple-500/20' },
        { icon: ArrowLeftRight, label: 'Transactions', path: '/dashboard/transactions', color: 'text-amber-600 dark:text-amber-500', bgColor: 'bg-amber-500/20' },
    ];

    return (
        <aside className={cn(
            "flex flex-col h-full bg-white dark:bg-[#0B0F19] transition-all duration-300 ease-in-out border-r lg:border border-slate-200 dark:border-white/10",
            className
        )}>
            {/* Top Section: Logo & Action */}
            <div className={cn("p-6 pb-2", isCollapsed && "px-4")}>
                <Link to="/dashboard" className={cn(
                    "flex items-center gap-3 mb-6 group px-2",
                    isCollapsed && "justify-center px-0 mb-6"
                )}>
                    <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30 transition-transform group-hover:scale-110 shrink-0">
                        <Zap className="text-white w-6 h-6 fill-white" />
                    </div>
                    {!isCollapsed && (
                        <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-white truncate">DataSwap.</span>
                    )}
                </Link>


            </div>

            {/* Middle Section: Nav Items */}
            <nav className="flex-1 space-y-2 px-6 min-h-0">
                {menuItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        end={item.end}
                        onClick={onClose}
                        title={isCollapsed ? item.label : undefined}
                        className={({ isActive }) => cn(
                            "flex items-center px-4 py-3 rounded-2xl transition-all duration-300 group relative",
                            isCollapsed ? "justify-center px-0 w-11 h-11 mx-auto rounded-xl" : "justify-between",
                            isActive
                                ? "bg-primary/10 text-primary font-black shadow-sm"
                                : "text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-white/5"
                        )}
                    >
                        <div className={cn("flex items-center gap-4", isCollapsed && "gap-0")}>
                            <div className={cn(
                                "w-8 h-8 rounded-xl flex items-center justify-center transition-all group-hover:scale-110",
                                item.bgColor
                            )}>
                                <item.icon className={cn("w-4 h-4 shrink-0", item.color)} />
                            </div>
                            {!isCollapsed && <span className="text-[15px] truncate font-bold">{item.label}</span>}
                        </div>
                        {item.badge && !isCollapsed && (
                            <span className="px-2 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold">
                                {item.badge}
                            </span>
                        )}
                        {item.badge && isCollapsed && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 flex items-center justify-center rounded-full bg-red-500 text-white text-[8px] font-bold">
                                {item.badge}
                            </span>
                        )}
                    </NavLink>
                ))}
            </nav>

            {/* Bottom Section */}
            <div className={cn("mt-auto p-6 space-y-4 pt-12", isCollapsed && "px-4 space-y-4 pt-12")}>
                {/* User Profile */}
                <div className={cn(
                    "flex items-center justify-between group cursor-pointer rounded-2xl bg-slate-50 dark:bg-white/5 border border-transparent hover:border-primary/10 transition-all mb-4",
                    isCollapsed ? "flex-col p-2 gap-4 bg-transparent border-none" : "p-3"
                )}>
                    <div className={cn("flex items-center gap-3 min-w-0", isCollapsed && "flex-col")}>
                        <div className="w-12 h-12 rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center justify-center text-primary font-bold overflow-hidden shrink-0">
                            <img src={`https://ui-avatars.com/api/?name=${user?.fullName || 'User'}&background=random`} alt="Avatar" className="w-full h-full object-cover" />
                        </div>
                        {!isCollapsed && (
                            <div className="flex flex-col min-w-0">
                                <span className="text-sm font-black text-slate-900 dark:text-white truncate">
                                    {user?.fullName || 'User Name'}
                                </span>
                                <span className="text-[10px] text-primary truncate font-black uppercase tracking-widest">
                                    {user?.role || 'Customer'}
                                </span>
                            </div>
                        )}
                    </div>
                    <button
                        onClick={toggleTheme}
                        className={cn(
                            "p-3 text-slate-400 hover:text-primary transition-colors bg-white dark:bg-white/5 rounded-2xl shadow-sm",
                            isCollapsed && "p-2.5"
                        )}
                    >
                        {theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                    </button>
                </div>

                <button
                    onClick={logout}
                    title={isCollapsed ? "Logout" : undefined}
                    className={cn(
                        "flex items-center rounded-2xl text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all font-bold group",
                        isCollapsed ? "justify-center w-11 h-11 mx-auto rounded-xl" : "w-full gap-3 px-5 py-3"
                    )}
                >
                    <LogOut className={cn("w-5 h-5 transition-transform group-hover:-translate-x-1", isCollapsed && "group-hover:-translate-x-0 group-hover:scale-110")} />
                    {!isCollapsed && <span>Logout</span>}
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
