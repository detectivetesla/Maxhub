import React from 'react';
import { Bell, Search, Command, Shield, Sun, Moon, Menu, Mail, ArrowRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';

interface AdminHeaderProps {
    onMenuClick?: () => void;
}

const AdminHeader: React.FC<AdminHeaderProps> = ({ onMenuClick }) => {
    const { user } = useAuth();
    const { theme, toggleTheme } = useTheme();

    return (
        <header className="h-20 lg:h-24 px-4 sm:px-8 flex items-center justify-between bg-white/80 dark:bg-[#0B0F19]/80 backdrop-blur-md sticky top-0 z-40 border-b border-slate-100 dark:border-white/5 gap-4">
            <div className="flex items-center gap-3">
                <button
                    onClick={onMenuClick}
                    className="p-3 rounded-xl bg-[#2ECC71] text-white shadow-lg shadow-[#2ECC71]/30 hover:scale-105 active:scale-95 transition-all"
                >
                    <Menu className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-3 px-4 py-2 bg-slate-100 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10 shrink-0">
                    <div className="w-8 h-8 rounded-lg bg-[#2ECC71] flex items-center justify-center text-white font-black text-xs">
                        TU
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xs font-black text-slate-900 dark:text-white leading-none">Welcome! {user?.fullName || 'Test User'}</span>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mt-1">Security is a process, not a product.</span>
                    </div>
                </div>
            </div>

            <div className="flex-1 max-w-xl hidden xl:block">
                <div className="flex justify-center">
                    <div className="px-6 py-2 rounded-full bg-[#2ECC71]/10 border border-[#2ECC71]/20 text-[#2ECC71] font-black text-xs">
                        {user?.email || 'test@mail.com'}
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-3 sm:gap-4 ml-auto">
                <div className="flex items-center gap-2">
                    <button className="relative p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors group">
                        <Mail className="w-5 h-5 text-slate-500 group-hover:scale-110 transition-transform" />
                        <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#2ECC71] border-2 border-white dark:border-[#0B0F19]" />
                    </button>

                    <button className="relative p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors group">
                        <Bell className="w-5 h-5 text-slate-500 group-hover:scale-110 transition-transform" />
                        <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#2ECC71] border-2 border-white dark:border-[#0B0F19]" />
                    </button>

                    <button
                        onClick={toggleTheme}
                        className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 transition-all group"
                    >
                        {theme === 'light' ? <Moon className="w-5 h-5 text-slate-500" /> : <Sun className="w-5 h-5 text-slate-400" />}
                    </button>
                </div>

                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-[#2ECC71] flex items-center justify-center text-white ring-4 ring-slate-100 dark:ring-white/5 shadow-xl shrink-0 font-black">
                    TU
                </div>
            </div>
        </header>
    );
};

export default AdminHeader;
