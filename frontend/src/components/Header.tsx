import { useNavigate } from 'react-router-dom';
import { Search, Bell, Settings, Mail, User, Command, PanelLeft, Menu, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/utils/cn';

interface HeaderProps {
    isCollapsed: boolean;
    onToggleCollapse: () => void;
    isSidebarOpen: boolean;
    onToggleMobileMenu: () => void;
}

const Header: React.FC<HeaderProps> = ({
    isCollapsed,
    onToggleCollapse,
    isSidebarOpen,
    onToggleMobileMenu
}) => {
    const { user } = useAuth();
    const navigate = useNavigate();

    return (
        <header className="w-full flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4 py-2 sm:py-4 px-1 sm:px-2 mb-4 md:mb-6">
            {/* Left Section: Toggles & Search */}
            <div className="flex items-center gap-4 flex-1">
                {/* Toggle Buttons Moved into Header */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={onToggleCollapse}
                        className="hidden lg:flex p-2.5 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-colors text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-white/10 shadow-sm"
                        title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                    >
                        <PanelLeft className={cn("w-5 h-5 transition-transform duration-300", isCollapsed && "rotate-180")} />
                    </button>

                    <button
                        onClick={onToggleMobileMenu}
                        className="lg:hidden p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-colors text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-white/10 shadow-sm"
                    >
                        {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                </div>

                {/* Search Bar */}
                <div className="relative flex-1 max-w-md group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                    <input
                        type="text"
                        placeholder="Search for anything..."
                        className="w-full pl-12 pr-12 py-3 rounded-2xl bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 shadow-sm dark:shadow-none focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm font-medium"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-1 px-1.5 py-1 rounded-lg bg-slate-50 dark:bg-white/10 border border-slate-200 dark:border-white/10">
                        <Command className="w-3 h-3 text-slate-400" />
                        <span className="text-[10px] font-bold text-slate-400">K</span>
                    </div>
                </div>
            </div>

            {/* Action Icons & Profile */}
            <div className="flex items-center gap-2 sm:gap-4 ml-auto w-full md:w-auto justify-end">
                {/* Messages */}
                <button
                    className="p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-indigo-100 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 shadow-sm hover:shadow-md hover:bg-indigo-200 dark:hover:bg-indigo-500/20 hover:translate-y-[-1px] transition-all relative group"
                    title="Messages"
                >
                    <Mail className="w-4 h-4 sm:w-5 h-5 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform" />
                    <span className="absolute top-2 sm:top-2.5 right-2 sm:right-2.5 w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full bg-indigo-600 border-2 border-white dark:border-[#0B0F19]" />
                </button>

                {/* Notifications */}
                <button
                    className="p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-orange-100 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/20 shadow-sm hover:shadow-md hover:bg-orange-200 dark:hover:bg-orange-500/20 hover:translate-y-[-1px] transition-all relative group"
                    title="Notifications"
                >
                    <Bell className="w-4 h-4 sm:w-5 h-5 text-orange-600 dark:text-orange-400 group-hover:scale-110 transition-transform" />
                    <span className="absolute top-2 sm:top-2.5 right-2 sm:right-2.5 w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full bg-red-600 border-2 border-white dark:border-[#0B0F19]" />
                </button>

                {/* Settings */}
                <button
                    className="p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-violet-100 dark:bg-violet-500/10 border border-violet-200 dark:border-violet-500/20 shadow-sm hover:shadow-md hover:bg-violet-200 dark:hover:bg-violet-500/20 hover:translate-y-[-1px] transition-all group"
                    title="Settings"
                >
                    <Settings className="w-4 h-4 sm:w-5 h-5 text-violet-600 dark:text-violet-400 group-hover:rotate-45 transition-transform" />
                </button>

                {/* Vertical Divider */}
                <div className="h-8 w-[1px] bg-slate-200 dark:bg-white/10 mx-1 hidden sm:block" />

                {/* User Profile */}
                <div
                    onClick={() => navigate('/dashboard/settings')}
                    className="flex items-center gap-2 sm:gap-3 pl-1 sm:pl-2 group cursor-pointer"
                >
                    <div className="flex flex-col items-end hidden xs:flex">
                        <span className="text-[10px] font-black text-primary uppercase tracking-tighter leading-none mb-0.5">{user?.role || 'Customer'}</span>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{user?.fullName?.split(' ')[0]}</span>
                    </div>
                    <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-slate-900 border-2 border-white dark:border-white/10 shadow-lg overflow-hidden shrink-0 group-hover:scale-105 transition-all active:scale-95">
                        <img
                            src={`https://ui-avatars.com/api/?name=${user?.fullName || 'User'}&background=random`}
                            alt="Avatar"
                            className="w-full h-full object-cover"
                        />
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
