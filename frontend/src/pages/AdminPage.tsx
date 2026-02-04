import React, { useState, useEffect } from 'react';
import {
    Users, Database, Activity,
    Zap, BarChart3, TrendingUp,
    ShieldCheck, LayoutGrid, Eye, Flag,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import api from '@/utils/api';
import { cn } from '@/utils/cn';
import { useAuth } from '@/context/AuthContext';

const AdminPage: React.FC = () => {
    const { user } = useAuth();
    const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
    const [statsData, setStatsData] = useState({
        totalUsers: 0,
        todayOrders: 0,
        todayRevenue: 0,
        lifetimeRevenue: 0
    });
    const [recentOrders, setRecentOrders] = useState<any[]>([]);
    const [newUsers, setNewUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAdminData = async () => {
            try {
                const [statsRes, dataRes] = await Promise.all([
                    api.get('/admin/stats'),
                    api.get('/admin/recent-data')
                ]);

                setStatsData(statsRes.data);
                setRecentOrders(dataRes.data.recentOrders);
                setNewUsers(dataRes.data.newUsers);
            } catch (error) {
                console.error('Failed to fetch admin data', error);
            } finally {
                setLoading(false);
            }
        };

        fetchAdminData();
    }, []);

    const stats = [
        { label: 'TOTAL USERS', value: statsData.totalUsers.toString(), icon: Users, color: 'text-purple-600', bg: 'bg-purple-600', border: 'border-purple-400/50', path: '/admin/users' },
        { label: "TODAY'S ORDERS", value: statsData.todayOrders.toString(), icon: Database, color: 'text-orange-600', bg: 'bg-orange-500', border: 'border-orange-400/50', path: '/admin/orders' },
        { label: "TODAY'S REVENUE", value: `GH₵ ${statsData.todayRevenue.toLocaleString()}`, icon: BarChart3, color: 'text-amber-600', bg: 'bg-amber-500', border: 'border-amber-300/50', path: '/admin/analytics' },
        { label: 'LIFETIME REVENUE', value: `GH₵ ${statsData.lifetimeRevenue.toLocaleString()}`, icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-600', border: 'border-blue-400/50', isPrimary: true, path: '/admin/analytics' },
    ];

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Welcome Hero Section */}
            <div className="bg-blue-600 border border-white/5 rounded-[1.5rem] sm:rounded-[2rem] p-6 sm:p-8 md:p-12 relative overflow-hidden group shadow-2xl shadow-blue-500/20">
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-1000">
                    <LayoutGrid className="w-32 sm:w-64 h-32 sm:h-64 text-white" />
                </div>
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
                    <div>
                        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white tracking-tight mb-3 sm:mb-4">
                            Welcome back, {user?.fullName?.split(' ')[0] || 'Admin'}!
                        </h1>
                        <p className="text-slate-200 font-bold max-w-xl text-sm sm:text-base md:text-lg leading-relaxed">
                            Your platform analytics and system controls are ready. Here's a summary of today's performance.
                        </p>
                    </div>
                    <button className="px-6 sm:px-8 py-3 sm:py-4 rounded-2xl border border-white/10 text-white font-black text-xs sm:text-sm hover:bg-white hover:text-slate-900 transition-all shadow-2xl shrink-0">
                        View Analytics
                    </button>
                </div>
            </div>

            {/* System Status Banner */}
            <div className="bg-[#0B0F19] border border-white/5 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
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
                            isMaintenanceMode ? "bg-blue-500" : "bg-slate-700"
                        )}
                    >
                        <div className={cn(
                            "absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 shadow-sm",
                            isMaintenanceMode ? "left-7" : "left-1"
                        )} />
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {stats.map((stat) => (
                    <Link
                        key={stat.label}
                        to={stat.path}
                        className={cn(
                            "p-6 rounded-[2rem] border-2 relative overflow-hidden transition-all group cursor-pointer",
                            stat.bg, stat.border,
                            "hover:scale-105 hover:shadow-2xl hover:brightness-110",
                            "shadow-lg"
                        )}
                    >
                        {loading ? (
                            <div className="animate-pulse space-y-4">
                                <div className="h-4 w-1/2 bg-white/20 rounded" />
                                <div className="h-8 w-3/4 bg-white/30 rounded" />
                            </div>
                        ) : (
                            <div className="flex items-center gap-3 sm:gap-4 relative z-10">
                                <div className={cn("p-2 sm:p-3 rounded-lg sm:rounded-xl bg-white border border-white/20 shadow-lg group-hover:scale-110 transition-transform flex items-center justify-center shrink-0")}>
                                    <stat.icon className={cn("w-4 h-4 sm:w-5 sm:h-5", stat.color)} />
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <h3 className="text-lg sm:text-2xl font-black text-white truncate">{stat.value}</h3>
                                    <p className="text-[9px] sm:text-[10px] font-black text-white/90 uppercase tracking-widest leading-none mt-1 truncate">{stat.label}</p>
                                </div>
                            </div>
                        )}
                        {stat.isPrimary && (
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform duration-500">
                                <TrendingUp className="w-16 h-16 text-white" />
                            </div>
                        )}
                    </Link>
                ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Recent Orders Table */}
                <div className="xl:col-span-2 bg-[#0B0F19] border border-white/5 rounded-[1.5rem] sm:rounded-[2rem] p-4 sm:p-6 md:p-8 overflow-hidden">
                    <div className="flex items-center justify-between mb-6 sm:mb-8">
                        <h2 className="text-lg sm:text-2xl font-black text-white">Recent Orders</h2>
                        <Link to="/admin/orders" className="px-3 sm:px-4 py-2 rounded-lg bg-blue-500 text-white font-black text-xs hover:scale-105 active:scale-95 transition-all">
                            See all →
                        </Link>
                    </div>

                    <div className="overflow-x-auto -mx-1">
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
                                {loading ? (
                                    [1, 2, 3].map(i => <tr key={i}><td colSpan={4} className="py-4 animate-pulse"><div className="h-8 bg-white/5 rounded w-full" /></td></tr>)
                                ) : recentOrders.length === 0 ? (
                                    <tr><td colSpan={4} className="py-8 text-center text-slate-500 font-bold">No recent orders.</td></tr>
                                ) : recentOrders.map((order) => (
                                    <tr key={order.id} className="group hover:bg-white/[0.02] transition-colors">
                                        <td className="py-4 text-xs font-bold text-slate-400 uppercase">#{order.id.slice(0, 8)}</td>
                                        <td className="py-4 text-xs font-black text-white">{order.user_name}</td>
                                        <td className="py-4">
                                            <span className={cn(
                                                "px-2 py-1 rounded-md text-[10px] font-black uppercase",
                                                order.network === 'MTN' ? "bg-yellow-400 text-slate-900" :
                                                    order.network === 'Telecel' ? "bg-red-500 text-white" :
                                                        "bg-blue-500 text-white"
                                            )}>
                                                {order.network}
                                            </span>
                                        </td>
                                        <td className="py-4">
                                            <span className={cn(
                                                "px-3 py-1.5 rounded-full text-[10px] font-black",
                                                order.status === 'success' ? "bg-blue-500/10 text-blue-500" : "bg-red-500/10 text-red-600"
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
                <div className="bg-[#0B0F19] border border-white/5 rounded-[1.5rem] sm:rounded-[2rem] p-4 sm:p-6 md:p-8 overflow-hidden">
                    <div className="flex items-center justify-between mb-6 sm:mb-8">
                        <h2 className="text-lg sm:text-2xl font-black text-white">New Users</h2>
                        <Link to="/admin/users" className="px-3 sm:px-4 py-2 rounded-lg bg-blue-500 text-white font-black text-xs hover:scale-105 active:scale-95 transition-all">
                            See all →
                        </Link>
                    </div>

                    <div className="space-y-6">
                        {loading ? (
                            [1, 2, 3, 4, 5].map(i => <div key={i} className="h-12 bg-white/5 rounded-xl animate-pulse" />)
                        ) : newUsers.length === 0 ? (
                            <p className="text-center text-slate-500 font-bold">No new users.</p>
                        ) : newUsers.map((u) => (
                            <div key={u.email} className="flex items-center justify-between group">
                                <div className="flex items-center gap-4">
                                    <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-white font-black text-xs bg-slate-800")}>
                                        {u.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className="text-sm font-black text-white truncate">{u.full_name}</h4>
                                        <p className="text-[10px] font-bold text-slate-500 truncate">{u.email}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button className="p-2 rounded-lg bg-white/5 text-slate-400 hover:text-white transition-colors">
                                        <Eye className="w-4 h-4" />
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

