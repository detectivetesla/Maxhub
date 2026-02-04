import React, { useState, useEffect } from 'react';
import {
    Users, Database, Activity,
    Zap, BarChart3, TrendingUp,
    ShieldCheck, LayoutGrid, Eye
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import api from '@/utils/api';
import { cn } from '@/utils/cn';
import { useAuth } from '@/context/AuthContext';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';
import { supabase } from '@/utils/supabase';

const AdminPage: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
    const [statsData, setStatsData] = useState<any>({
        totalUsers: 0,
        todayOrders: 0,
        todayRevenue: 0,
        lifetimeRevenue: 0,
        pendingOrders: 0,
        dailyRevenue: [],
        networkDistribution: [],
        recentFunding: []
    });
    const [recentOrders, setRecentOrders] = useState<any[]>([]);
    const [newUsers, setNewUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

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

    useEffect(() => {
        fetchAdminData();

        // Supabase Realtime Listener for Admin
        let channel: any = null;
        if (supabase) {
            channel = supabase
                .channel('admin-live-updates')
                .on(
                    'postgres_changes',
                    { event: '*', schema: 'public', table: 'transactions' },
                    () => fetchAdminData()
                )
                .on(
                    'postgres_changes',
                    { event: '*', schema: 'public', table: 'users' },
                    () => fetchAdminData()
                )
                .subscribe();
        }

        return () => {
            if (channel) supabase?.removeChannel(channel);
        };
    }, []);

    const stats = [
        { label: 'TOTAL USERS', value: statsData.totalUsers.toString(), icon: Users, color: 'text-purple-600', bg: 'bg-purple-600', border: 'border-purple-400/50', path: '/admin/users' },
        { label: "TODAY'S ORDERS", value: statsData.todayOrders.toString(), icon: Database, color: 'text-orange-600', bg: 'bg-orange-500', border: 'border-orange-400/50', path: '/admin/orders' },
        { label: "TODAY'S REVENUE", value: `GH₵ ${statsData.todayRevenue.toLocaleString()}`, icon: BarChart3, color: 'text-amber-600', bg: 'bg-amber-500', border: 'border-amber-300/50', path: '/admin/analytics' },
        { label: 'PENDING ORDERS', value: statsData.pendingOrders.toString(), icon: Activity, color: 'text-blue-600', bg: 'bg-blue-600', border: 'border-blue-400/50', isPrimary: true, path: '/admin/orders' },
    ];

    const getNetworkColor = (network: string) => {
        const net = network?.toLowerCase() || '';
        if (net.includes('mtn')) return '#FFCC00';
        if (net.includes('telecel')) return '#E60000';
        if (net.includes('airtel') || net.includes('tigo') || net.includes('at')) return '#003876';
        return '#8B5CF6';
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Welcome Hero Section */}
            <div className="bg-blue-600 border border-white/5 rounded-[2.5rem] p-6 sm:p-8 md:p-12 relative overflow-hidden group shadow-2xl shadow-blue-500/20">
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-1000">
                    <LayoutGrid className="w-32 sm:w-64 h-32 sm:h-64 text-white" />
                </div>
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-[10px] font-black uppercase tracking-widest text-white backdrop-blur-md mb-4">
                            <ShieldCheck className="w-3 h-3" />
                            <span>System Administrator</span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white tracking-tight mb-3 sm:mb-4">
                            Welcome back, {user?.fullName?.split(' ')[0] || 'Admin'}!
                        </h1>
                        <p className="text-blue-100 font-bold max-w-xl text-sm sm:text-base md:text-lg leading-relaxed opacity-80">
                            Monitor transactions, manage users, and keep the platform running smoothly with real-time data.
                        </p>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat) => (
                    <Link
                        key={stat.label}
                        to={stat.path}
                        className={cn(
                            "p-6 rounded-[2rem] border-2 relative overflow-hidden transition-all group cursor-pointer",
                            stat.bg, stat.border,
                            "hover:scale-[1.02] hover:shadow-2xl brightness-100 hover:brightness-105 active:scale-[0.98]",
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
                                <div className={cn("p-2 sm:p-3 rounded-2xl bg-white border border-white/20 shadow-lg group-hover:scale-110 transition-transform flex items-center justify-center shrink-0")}>
                                    <stat.icon className={cn("w-5 h-5", stat.color)} />
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <h3 className="text-lg sm:text-2xl md:text-3xl font-black text-white leading-tight">{stat.value}</h3>
                                    <p className="text-[9px] sm:text-[10px] font-black text-white/90 uppercase tracking-widest leading-tight mt-1">{stat.label}</p>
                                </div>
                            </div>
                        )}
                    </Link>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Main Content Area */}
                <div className="lg:col-span-8 space-y-6">
                    {/* Revenue Chart */}
                    <div className="bg-[#0B0F19] border border-white/5 rounded-[2.5rem] p-6 sm:p-8 md:p-10 space-y-8">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-xl sm:text-2xl font-black text-white">Revenue Growth</h3>
                                <p className="text-xs sm:text-sm text-slate-500 font-bold">Sales performance over the last 7 days</p>
                            </div>
                            <div className="px-4 py-2 bg-blue-500/10 text-blue-500 rounded-xl border border-blue-500/20 text-[10px] font-black uppercase tracking-widest">
                                Live Data
                            </div>
                        </div>

                        <div className="h-80 w-full">
                            {statsData.dailyRevenue.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={statsData.dailyRevenue}>
                                        <defs>
                                            <linearGradient id="adminRevenue" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1E293B" />
                                        <XAxis
                                            dataKey="date"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fontSize: 10, fontWeight: 700, fill: '#64748B' }}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fontSize: 10, fontWeight: 700, fill: '#64748B' }}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: '#0F172A',
                                                border: '1px solid rgba(255,255,255,0.1)',
                                                borderRadius: '16px',
                                                fontSize: '12px',
                                                fontWeight: 'bold',
                                                color: '#fff'
                                            }}
                                            itemStyle={{ color: '#3B82F6' }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="revenue"
                                            stroke="#3B82F6"
                                            strokeWidth={4}
                                            fillOpacity={1}
                                            fill="url(#adminRevenue)"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center opacity-30">
                                    <BarChart3 className="w-16 h-16 text-slate-300 mb-4" />
                                    <span className="text-sm font-black uppercase tracking-widest">No revenue data yet</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Recent Orders */}
                    <div className="bg-[#0B0F19] border border-white/5 rounded-[2.5rem] p-6 sm:p-8 md:p-10">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-xl sm:text-2xl font-black text-white">Recent Orders</h2>
                            <Link to="/admin/orders" className="text-xs font-black text-blue-500 uppercase tracking-widest hover:underline">
                                Full History →
                            </Link>
                        </div>

                        <div className="overflow-x-auto custom-scrollbar">
                            <table className="w-full text-left min-w-[600px]">
                                <thead>
                                    <tr className="text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-white/5">
                                        <th className="pb-4">ORDER ID</th>
                                        <th className="pb-4">CUSTOMER</th>
                                        <th className="pb-4">NETWORK</th>
                                        <th className="pb-4 text-right">STATUS</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {loading ? (
                                        [1, 2, 3].map(i => <tr key={i}><td colSpan={4} className="py-4 animate-pulse"><div className="h-10 bg-white/5 rounded-xl w-full" /></td></tr>)
                                    ) : recentOrders.length === 0 ? (
                                        <tr><td colSpan={4} className="py-12 text-center text-slate-500 font-bold">No recent activity detected.</td></tr>
                                    ) : recentOrders.map((order: any) => (
                                        <tr key={order.id} className="group hover:bg-white/[0.02] transition-colors cursor-pointer" onClick={() => navigate('/admin/orders')}>
                                            <td className="py-4 text-[10px] font-mono font-bold text-slate-500 uppercase">#{order.id.slice(0, 8)}</td>
                                            <td className="py-4 font-black text-white text-sm">{order.user_name}</td>
                                            <td className="py-4">
                                                <span className={cn(
                                                    "px-2 py-1 rounded-md text-[10px] font-black uppercase",
                                                    order.network === 'MTN' ? "bg-[#FFCC00] text-slate-900" :
                                                        order.network === 'Telecel' ? "bg-[#E60000] text-white" :
                                                            "bg-[#003876] text-white"
                                                )}>
                                                    {order.network}
                                                </span>
                                            </td>
                                            <td className="py-4 text-right">
                                                <span className={cn(
                                                    "px-3 py-1.5 rounded-full text-[10px] font-black",
                                                    order.status === 'success' ? "bg-emerald-500/10 text-emerald-500" :
                                                        order.status === 'processing' ? "bg-blue-500/10 text-blue-500" :
                                                            "bg-red-500/10 text-red-500"
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
                </div>

                {/* Sidebar area */}
                <div className="lg:col-span-4 space-y-6">
                    {/* Network Analytics */}
                    <div className="bg-[#0B0F19] border border-white/5 rounded-[2.5rem] p-6 sm:p-8 space-y-8">
                        <h3 className="text-xl font-black text-white">Network Share</h3>

                        <div className="h-56 flex justify-center items-center relative">
                            {statsData.networkDistribution.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={statsData.networkDistribution}
                                            innerRadius={50}
                                            outerRadius={70}
                                            paddingAngle={10}
                                            dataKey="count"
                                        >
                                            {statsData.networkDistribution.map((entry: any, index: number) => (
                                                <Cell key={`cell-${index}`} fill={getNetworkColor(entry.name)} stroke="none" />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: '#0F172A',
                                                border: 'none',
                                                borderRadius: '12px',
                                                fontSize: '10px'
                                            }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <Zap className="w-12 h-12 text-slate-800" />
                            )}
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Share</span>
                                <span className="text-lg font-black text-white">100%</span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {statsData.networkDistribution.map((item: any, i: number) => (
                                <div key={i} className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-3 h-3 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)]" style={{ backgroundColor: getNetworkColor(item.name) }} />
                                        <span className="text-xs font-black text-white uppercase">{item.name}</span>
                                    </div>
                                    <span className="text-xs font-black text-slate-400">{item.count} orders</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* New Users */}
                    <div className="bg-[#0B0F19] border border-white/5 rounded-[2.5rem] p-6 sm:p-8">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-xl font-black text-white">New Citizens</h2>
                        </div>

                        <div className="space-y-6">
                            {loading ? (
                                [1, 2, 3].map(i => <div key={i} className="h-12 bg-white/5 rounded-2xl animate-pulse" />)
                            ) : newUsers.map((u: any) => (
                                <div key={u.email} className="flex items-center justify-between group">
                                    <div className="flex items-center gap-4 min-w-0">
                                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-blue-500/10 border border-blue-500/20 text-blue-500 shadow-xl group-hover:scale-110 transition-transform shrink-0">
                                            <Users className="w-5 h-5" />
                                        </div>
                                        <div className="min-w-0">
                                            <h4 className="text-sm font-black text-white truncate">{u.full_name}</h4>
                                            <p className="text-[10px] font-bold text-slate-500 truncate uppercase tracking-tighter">{u.email}</p>
                                        </div>
                                    </div>
                                    <button className="p-2 rounded-xl bg-white/5 text-slate-400 opacity-0 group-hover:opacity-100 transition-all hover:bg-blue-500 hover:text-white">
                                        <Eye className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Recent Funding */}
                    <div className="bg-[#0B0F19] border border-white/5 rounded-[2.5rem] p-6 sm:p-8 mt-6">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-xl font-black text-white">Recent Funding</h2>
                        </div>

                        <div className="space-y-6">
                            {loading ? (
                                [1, 2, 3].map(i => <div key={i} className="h-12 bg-white/5 rounded-2xl animate-pulse" />)
                            ) : statsData.recentFunding?.length === 0 ? (
                                <p className="text-center text-slate-500 font-bold py-4 text-xs">No recent deposits.</p>
                            ) : statsData.recentFunding?.map((f: any) => (
                                <div key={f.id} className="flex items-center justify-between group">
                                    <div className="flex items-center gap-4 min-w-0">
                                        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 shrink-0">
                                            <TrendingUp className="w-4 h-4" />
                                        </div>
                                        <div className="min-w-0">
                                            <h4 className="text-sm font-black text-white truncate">{f.user_name}</h4>
                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                                                {new Date(f.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="text-sm font-black text-white">GH₵{f.amount}</p>
                                        <p className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">SUCCESS</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminPage;

