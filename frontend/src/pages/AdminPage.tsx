import React, { useState } from 'react';
import {
    Users, Database, Activity, AlertCircle,
    Zap, ChevronRight, BarChart3, TrendingUp,
    Clock, ShieldCheck, Server, Settings,
    Plus, ShoppingBag, Mail, ArrowRight,
    Search, LayoutGrid, Eye, Flag,
    Shield
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/utils/cn';
import { useAuth } from '@/context/AuthContext';

const AdminPage: React.FC = () => {
    const { user } = useAuth();
    const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);

    const stats = [
        { label: 'TOTAL USERS', value: '60', icon: Users, color: 'text-purple-500', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
        { label: "TODAY'S ORDERS", value: '0', icon: Database, color: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
        { label: "TODAY'S REVENUE", value: 'GH₵ 0', icon: BarChart3, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
        { label: 'LIFETIME REVENUE', value: 'GH₵ 522', icon: TrendingUp, color: 'text-[#2ECC71]', bg: 'bg-[#2ECC71]/10', border: 'border-[#2ECC71]/20', isPrimary: true },
    ];

    const quickActions = [
        { label: 'ADD NEW USER', desc: 'Create user accounts', icon: Plus, path: '/admin/users#add' },
        { label: 'VIEW ORDERS', desc: 'Track and manage orders', icon: Database, path: '/admin/orders' },
        { label: 'MANAGE AGENTS', desc: 'View resellers & agents', icon: Users, path: '/admin/agents' },
        { label: 'SEND EMAIL', desc: 'Email users & agents', icon: Mail, path: '/admin/email' },
    ];

    const recentOrders = [
        { id: '#ORD-96A', user: 'Solomon Ntiamoah', network: 'MTN', status: 'Completed', color: 'bg-yellow-400 text-slate-900' },
        { id: '#ORD-834', user: 'Martin Nomotsu', network: 'MTN', status: 'Completed', color: 'bg-yellow-400 text-slate-900' },
        { id: '#ORD-0A5', user: 'Nicholas EA', network: 'MTN', status: 'Completed', color: 'bg-yellow-400 text-slate-900' },
        { id: '#ORD-B8F', user: 'Nicholas EA', network: 'MTN', status: 'Failed', color: 'bg-yellow-400 text-slate-900' },
        { id: '#ORD-017', user: 'Nicholas EA', network: 'MTN', status: 'Failed', color: 'bg-yellow-400 text-slate-900' },
    ];

    const newUsers = [
        { name: 'Caleb Adzokatse', email: 'adzokatsekaleb@gmail.com', initials: 'CA', color: 'bg-pink-500' },
        { name: 'edward amponsah', email: 'amponsahkay3@gmail.com', initials: 'EA', color: 'bg-purple-600' },
        { name: 'Edward Amponsah Baah', email: 'amponsahbaaho@gmail.com', initials: 'EA', color: 'bg-blue-600' },
        { name: 'Nadeem Mohammed', email: 'nadeemtraoure2005@gmail.com', initials: 'NM', color: 'bg-pink-500' },
        { name: 'Nicholas EA', email: 'nickcwusi99@gmail.com', initials: 'NE', color: 'bg-purple-500' },
    ];

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Welcome Hero Section */}
            <div className="bg-[#0B0F19] border border-white/5 rounded-[2rem] p-8 sm:p-12 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-1000">
                    <LayoutGrid className="w-64 h-64 text-white" />
                </div>
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-4">
                            Welcome back, {user?.fullName?.split(' ')[0] || 'Test User'}!
                        </h1>
                        <p className="text-slate-400 font-bold max-w-xl text-lg leading-relaxed">
                            Your platform analytics and system controls are ready. Here's a summary of today's performance.
                        </p>
                    </div>
                    <button className="px-8 py-4 rounded-2xl border border-white/10 text-white font-black text-sm hover:bg-white hover:text-slate-900 transition-all shadow-2xl">
                        View Analytics
                    </button>
                </div>
            </div>

            {/* System Status Banner */}
            <div className="bg-[#0B0F19] border border-white/5 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[#2ECC71]/10 border border-[#2ECC71]/20 flex items-center justify-center text-[#2ECC71]">
                        <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-white font-black text-sm">System Status: Online</h3>
                        <p className="text-slate-500 text-xs font-bold">The platform is live and accessible to everyone.</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Maintenance Mode</span>
                    <button
                        onClick={() => setIsMaintenanceMode(!isMaintenanceMode)}
                        className={cn(
                            "w-12 h-6 rounded-full relative transition-all duration-300",
                            isMaintenanceMode ? "bg-[#2ECC71]" : "bg-slate-700"
                        )}
                    >
                        <div className={cn(
                            "absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 shadow-sm",
                            isMaintenanceMode ? "left-7" : "left-1"
                        )} />
                    </button>
                </div>
            </div>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {quickActions.map((action) => (
                    <Link
                        key={action.label}
                        to={action.path}
                        className="bg-[#0B0F19] border border-white/5 p-8 rounded-[2rem] hover:border-[#2ECC71]/30 transition-all group flex flex-col items-center text-center gap-4 shadow-sm"
                    >
                        <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                            <action.icon className="w-6 h-6" />
                        </div>
                        <div>
                            <h4 className="text-white font-black text-xs uppercase tracking-widest">{action.label}</h4>
                            <p className="text-slate-500 text-[10px] font-bold mt-1">{action.desc}</p>
                        </div>
                    </Link>
                ))}
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat) => (
                    <div key={stat.label} className={cn(
                        "p-8 rounded-[2rem] border relative overflow-hidden transition-all group",
                        stat.isPrimary ? "bg-[#0B0F19] border-[#2ECC71]/20" : "bg-[#0B0F19] border-white/5"
                    )}>
                        <div className="flex items-center gap-4 mb-4">
                            <div className={cn("p-3 rounded-xl border", stat.bg, stat.border)}>
                                <stat.icon className={cn("w-5 h-5", stat.color)} />
                            </div>
                            <div className="flex flex-col">
                                <h3 className="text-2xl font-black text-white">{stat.value}</h3>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mt-1">{stat.label}</p>
                            </div>
                        </div>
                        {stat.isPrimary && (
                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-125 transition-transform duration-500">
                                <TrendingUp className="w-16 h-16 text-[#2ECC71]" />
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Recent Orders Table */}
                <div className="xl:col-span-2 bg-[#0B0F19] border border-white/5 rounded-[2rem] p-8 overflow-hidden">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-2xl font-black text-white">Recent Orders</h2>
                        <Link to="/admin/orders" className="px-4 py-2 rounded-lg bg-[#2ECC71] text-white font-black text-xs hover:scale-105 active:scale-95 transition-all">
                            See all →
                        </Link>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-white/5">
                                    <th className="pb-4">ORDER ID</th>
                                    <th className="pb-4">USER</th>
                                    <th className="pb-4">NETWORK</th>
                                    <th className="pb-4">STATUS</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {recentOrders.map((order) => (
                                    <tr key={order.id} className="group hover:bg-white/[0.02] transition-colors">
                                        <td className="py-4 text-xs font-bold text-slate-400">{order.id}</td>
                                        <td className="py-4 text-xs font-black text-white">{order.user}</td>
                                        <td className="py-4">
                                            <span className={cn("px-2 py-1 rounded-md text-[10px] font-black uppercase", order.color)}>
                                                {order.network}
                                            </span>
                                        </td>
                                        <td className="py-4">
                                            <span className={cn(
                                                "px-3 py-1.5 rounded-full text-[10px] font-black",
                                                order.status === 'Completed' ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
                                            )}>
                                                {order.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* New Users List */}
                <div className="bg-[#0B0F19] border border-white/5 rounded-[2rem] p-8 overflow-hidden">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-2xl font-black text-white">New Users</h2>
                        <Link to="/admin/users" className="px-4 py-2 rounded-lg bg-[#2ECC71] text-white font-black text-xs hover:scale-105 active:scale-95 transition-all">
                            See all →
                        </Link>
                    </div>

                    <div className="space-y-6">
                        {newUsers.map((user) => (
                            <div key={user.email} className="flex items-center justify-between group">
                                <div className="flex items-center gap-4">
                                    <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-white font-black text-xs", user.color)}>
                                        {user.initials}
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className="text-sm font-black text-white truncate">{user.name}</h4>
                                        <p className="text-[10px] font-bold text-slate-500 truncate">{user.email}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button className="p-2 rounded-lg bg-white/5 text-slate-400 hover:text-white transition-colors">
                                        <Eye className="w-4 h-4" />
                                    </button>
                                    <button className="p-2 rounded-lg bg-white/5 text-slate-400 hover:text-white transition-colors">
                                        <Flag className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminPage;

