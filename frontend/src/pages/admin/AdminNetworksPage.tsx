import React, { useState, useEffect } from 'react';
import {
    Globe, Shield, Zap, Activity,
    RefreshCw, AlertCircle, CheckCircle2,
    Database, Server, Wallet, Info,
    ArrowRight, Settings2, Signal
} from 'lucide-react';
import { cn } from '@/utils/cn';
import api from '@/utils/api';
import Button from '@/components/Button';

const AdminNetworksPage: React.FC = () => {
    const [networks, setNetworks] = useState<any[]>([]);
    const [providerHealth, setProviderHealth] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [networksRes, healthRes] = await Promise.all([
                api.get('/admin/networks'),
                api.get('/admin/provider-health')
            ]);
            setNetworks(networksRes.data.networks);
            setProviderHealth(healthRes.data);
        } catch (error) {
            console.error('Failed to fetch network data', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSync = async () => {
        setSyncing(true);
        try {
            await api.post('/admin/sync-offers');
            await fetchData();
            // Show toast or notification here
        } catch (error) {
            console.error('Sync failed', error);
        } finally {
            setSyncing(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const networkThemes: Record<string, any> = {
        MTN: { color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
        Telecel: { color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20' },
        AirtelTigo: { color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
    };

    if (loading && !providerHealth) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Network Command Center</h1>
                    <p className="text-slate-500 font-bold mt-1 uppercase tracking-widest text-[10px] flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                        Provider Infrastructure & Connectivity
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        onClick={handleSync}
                        disabled={syncing}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl flex items-center gap-2 font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-blue-500/25"
                    >
                        <RefreshCw className={cn("w-4 h-4", syncing && "animate-spin")} />
                        {syncing ? 'Synchronizing...' : 'Sync Provider Offers'}
                    </Button>
                </div>
            </header>

            {/* Provider Health Card */}
            <div className="bg-white dark:bg-white/5 p-8 rounded-[3rem] border border-slate-100 dark:border-white/5 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8">
                    <div className={cn(
                        "px-4 py-2 rounded-full flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all",
                        providerHealth?.status === 'online' ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
                    )}>
                        <Activity className="w-3 h-3" />
                        {providerHealth?.status}
                    </div>
                </div>

                <div className="flex flex-col md:flex-row md:items-center gap-10">
                    <div className="flex items-center gap-6">
                        <div className="w-20 h-20 rounded-[2rem] bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                            <Server className="w-10 h-10 text-indigo-500" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-slate-900 dark:text-white">Portal-02 API</h3>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Primary Data Fulfillment Gateway</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-8 flex-1">
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Account Balance</p>
                            <div className="flex items-center gap-2 text-xl font-black text-slate-900 dark:text-white">
                                <Wallet className="w-5 h-5 text-blue-500" />
                                GH₵ {providerHealth?.balance?.toLocaleString()}
                            </div>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Latency</p>
                            <div className="flex items-center gap-2 text-xl font-black text-slate-900 dark:text-white">
                                <Zap className="w-5 h-5 text-amber-500" />
                                142ms
                            </div>
                        </div>
                        <div className="hidden md:block">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Uptime (24h)</p>
                            <div className="flex items-center gap-2 text-xl font-black text-emerald-500">
                                <CheckCircle2 className="w-5 h-5" />
                                99.9%
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Network Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {['MTN', 'Telecel', 'AirtelTigo'].map((net) => {
                    const data = networks.find(n => n.network === net) || { bundle_count: 0, active_count: 0 };
                    const theme = networkThemes[net] || { color: 'text-slate-500', bg: 'bg-slate-500/10', border: 'border-slate-500/20' };

                    return (
                        <div key={net} className="bg-white dark:bg-white/5 p-8 rounded-[3rem] border border-slate-100 dark:border-white/5 shadow-sm hover:shadow-xl transition-all group">
                            <div className="flex items-center justify-between mb-8">
                                <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center", theme.bg, theme.border, "border")}>
                                    <Signal className={cn("w-7 h-7", theme.color)} />
                                </div>
                                <div className="text-right">
                                    <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-1 justify-end">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        Active
                                    </span>
                                </div>
                            </div>

                            <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-1">{net}</h3>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Core Infrastructure</p>

                            <div className="grid grid-cols-2 gap-4 mt-8 pt-8 border-t border-slate-100 dark:border-white/5">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bundles</p>
                                    <p className="text-xl font-black text-slate-900 dark:text-white">{data.bundle_count}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</p>
                                    <p className="text-xl font-black text-emerald-500">100%</p>
                                </div>
                            </div>

                            <Button className="w-full mt-8 py-4 bg-slate-50 dark:bg-white/5 hover:bg-blue-500 hover:text-white text-slate-600 dark:text-slate-400 rounded-2xl flex items-center justify-center gap-2 font-black text-[10px] uppercase tracking-widest transition-all group/btn">
                                Configure Network
                                <ArrowRight className="w-3 h-3 group-hover/btn:translate-x-1 transition-transform" />
                            </Button>
                        </div>
                    );
                })}
            </div>

            {/* System Config Snippet */}
            <div className="bg-slate-900 rounded-[3rem] p-8 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 blur-[100px] rounded-full -mr-32 -mt-32" />
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
                            <Settings2 className="w-8 h-8 text-blue-400" />
                        </div>
                        <div>
                            <h4 className="text-xl font-black tracking-tight">System Global Parameters</h4>
                            <p className="text-blue-400/60 font-black text-[10px] uppercase tracking-widest">Advanced Infrastructure Control</p>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="px-5 py-3 bg-white/5 border border-white/10 rounded-2xl">
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Global Fee</p>
                            <p className="text-sm font-black">2.0%</p>
                        </div>
                        <div className="px-5 py-3 bg-white/5 border border-white/10 rounded-2xl">
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Auto-Sync</p>
                            <p className="text-sm font-black text-emerald-400">Enabled</p>
                        </div>
                        <div className="px-5 py-3 bg-white/5 border border-white/10 rounded-2xl">
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Callback URL</p>
                            <p className="text-sm font-black truncate max-w-[150px]">bytebeacon.online/api/webhooks/portal02</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminNetworksPage;
