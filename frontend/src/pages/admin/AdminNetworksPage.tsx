import React, { useState, useEffect } from 'react';
import {
    Globe, Shield, Zap, Activity,
    RefreshCw, AlertCircle, CheckCircle2,
    Database, Server, Wallet, Info,
    ArrowRight, Settings2, Signal, Save
} from 'lucide-react';
import { cn } from '@/utils/cn';
import api from '@/utils/api';
import Button from '@/components/Button';

const AdminNetworksPage: React.FC = () => {
    const [networks, setNetworks] = useState<any[]>([]);
    const [providerHealth, setProviderHealth] = useState<any>(null);
    const [settings, setSettings] = useState<any>({});
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);

    // Modal State
    const [configModalOpen, setConfigModalOpen] = useState(false);
    const [selectedNetwork, setSelectedNetwork] = useState<string | null>(null);
    const [modalData, setModalData] = useState({
        maintenance_mode: false,
        is_active: true,
        label: ''
    });
    const [updating, setUpdating] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [networksRes, healthRes] = await Promise.all([
                api.get('/admin/networks'),
                api.get('/admin/provider-health')
            ]);
            setNetworks(networksRes.data.networks);
            setSettings(networksRes.data.settings || {});
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

    const openConfig = (network: string) => {
        const netData = networks.find(n => n.network === network) || { active_count: 0 };
        setSelectedNetwork(network);
        setModalData({
            maintenance_mode: settings[`${network.toLowerCase()}_maintenance_mode`] === 'true',
            is_active: netData.active_count > 0,
            label: settings[`${network.toLowerCase()}_label`] || `Core Infrastructure for ${network}`
        });
        setConfigModalOpen(true);
    };

    const handleUpdateSettings = async () => {
        if (!selectedNetwork) return;
        setUpdating(true);
        try {
            // Update network activation status if it changed
            const netData = networks.find(n => n.network === selectedNetwork);
            const currentIsActive = (netData?.active_count || 0) > 0;

            if (currentIsActive !== modalData.is_active) {
                await api.post('/admin/networks/toggle-status', {
                    network: selectedNetwork,
                    is_active: modalData.is_active
                });
            }

            // Update maintenance mode and labeling
            await api.post('/admin/networks/settings', {
                network: selectedNetwork,
                maintenance_mode: modalData.maintenance_mode,
                label: modalData.label
            });

            await fetchData();
            setConfigModalOpen(false);
        } catch (error) {
            console.error('Failed to update config', error);
        } finally {
            setUpdating(false);
        }
    };

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
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">API Health</p>
                            <div className="flex items-center gap-2 text-xl font-black text-slate-900 dark:text-white">
                                <Zap className="w-5 h-5 text-amber-500" />
                                {providerHealth?.status === 'online' ? 'Stable' : 'Unknown'}
                            </div>
                        </div>
                        <div className="hidden md:block">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Connection</p>
                            <div className="flex items-center gap-2 text-xl font-black text-emerald-500">
                                <CheckCircle2 className="w-5 h-5" />
                                Secure
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
                    const healthPercentage = data.bundle_count > 0 ? Math.round((data.active_count / data.bundle_count) * 100) : 0;

                    return (
                        <div key={net} className="bg-white dark:bg-white/5 p-8 rounded-[3rem] border border-slate-100 dark:border-white/5 shadow-sm hover:shadow-xl transition-all group">
                            <div className="flex items-center justify-between mb-8">
                                <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center", theme.bg, theme.border, "border")}>
                                    <Signal className={cn("w-7 h-7", theme.color)} />
                                </div>
                                <div className="text-right">
                                    <span className={cn(
                                        "text-[10px] font-black uppercase tracking-widest flex items-center gap-1 justify-end",
                                        healthPercentage > 0 ? "text-emerald-500" : "text-slate-400"
                                    )}>
                                        <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", healthPercentage > 0 ? "bg-emerald-500" : "bg-slate-400")} />
                                        {healthPercentage > 0 ? 'Active' : 'No Bundles'}
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
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ready</p>
                                    <p className={cn("text-xl font-black", healthPercentage === 0 ? "text-slate-400" : healthPercentage === 100 ? "text-emerald-500" : "text-amber-500")}>
                                        {healthPercentage}%
                                    </p>
                                </div>
                            </div>

                            <Button
                                onClick={() => openConfig(net)}
                                className="w-full mt-8 py-4 bg-slate-50 dark:bg-white/5 hover:bg-blue-500 hover:text-white text-slate-600 dark:text-slate-400 rounded-2xl flex items-center justify-center gap-2 font-black text-[10px] uppercase tracking-widest transition-all group/btn"
                            >
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
                            <p className="text-sm font-black">{(parseFloat(settings.transaction_fee_percentage || '0.02') * 100).toFixed(1)}%</p>
                        </div>
                        <div className="px-5 py-3 bg-white/5 border border-white/10 rounded-2xl">
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Auto-Sync</p>
                            <p className={cn("text-sm font-black", settings.auto_sync === 'true' ? "text-emerald-400" : "text-slate-400")}>
                                {settings.auto_sync === 'true' ? 'Enabled' : 'Disabled'}
                            </p>
                        </div>
                        <div className="px-5 py-3 bg-white/5 border border-white/10 rounded-2xl">
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Callback URL</p>
                            <p className="text-sm font-black truncate max-w-[150px]">Maxhub-nu.vercel.com/api/webhooks/portal02</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Configuration Modal */}
            {configModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div
                        className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-[3rem] border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-10 space-y-8">
                            <header className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Configure {selectedNetwork}</h3>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Infrastructure Control Panel</p>
                                </div>
                                <div className={cn(
                                    "w-14 h-14 rounded-2xl flex items-center justify-center bg-blue-500/10 border border-blue-500/20"
                                )}>
                                    <Settings2 className="w-7 h-7 text-blue-500" />
                                </div>
                            </header>

                            <div className="space-y-6">
                                {/* Maintenance Mode */}
                                <div className="flex items-center justify-between p-6 rounded-3xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
                                            <AlertCircle className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-slate-900 dark:text-white">Maintenance Mode</p>
                                            <p className="text-[10px] font-bold text-slate-500 uppercase">Blocks all purchases for this network</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setModalData({ ...modalData, maintenance_mode: !modalData.maintenance_mode })}
                                        className={cn(
                                            "w-12 h-6 rounded-full transition-all relative",
                                            modalData.maintenance_mode ? "bg-orange-500" : "bg-slate-200 dark:bg-white/10"
                                        )}
                                    >
                                        <div className={cn(
                                            "absolute top-1 w-4 h-4 rounded-full bg-white transition-all",
                                            modalData.maintenance_mode ? "right-1" : "left-1"
                                        )} />
                                    </button>
                                </div>

                                {/* Availability Toggle */}
                                <div className="flex items-center justify-between p-6 rounded-3xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                            <CheckCircle2 className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-slate-900 dark:text-white">Active Status</p>
                                            <p className="text-[10px] font-bold text-slate-500 uppercase">Enable/Disable all network bundles</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setModalData({ ...modalData, is_active: !modalData.is_active })}
                                        className={cn(
                                            "w-12 h-6 rounded-full transition-all relative",
                                            modalData.is_active ? "bg-emerald-500" : "bg-slate-200 dark:bg-white/10"
                                        )}
                                    >
                                        <div className={cn(
                                            "absolute top-1 w-4 h-4 rounded-full bg-white transition-all",
                                            modalData.is_active ? "right-1" : "left-1"
                                        )} />
                                    </button>
                                </div>

                                {/* Custom Label */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Network Label</label>
                                    <input
                                        type="text"
                                        value={modalData.label}
                                        onChange={(e) => setModalData({ ...modalData, label: e.target.value })}
                                        className="w-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:border-blue-500/50 transition-all"
                                        placeholder="Enter network status label..."
                                    />
                                </div>
                            </div>

                            <footer className="flex items-center gap-4 pt-4">
                                <Button
                                    onClick={() => setConfigModalOpen(false)}
                                    className="flex-1 py-4 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-slate-200 transition-all"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleUpdateSettings}
                                    disabled={updating}
                                    className="flex-[2] py-4 bg-blue-600 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2"
                                >
                                    {updating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    {updating ? 'Saving...' : 'Save Configuration'}
                                </Button>
                            </footer>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminNetworksPage;
