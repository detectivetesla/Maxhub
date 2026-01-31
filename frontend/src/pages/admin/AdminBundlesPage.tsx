import React, { useState, useEffect } from 'react';
import {
    Database, Plus, Search, Trash2, Edit3, Zap,
    Power, CheckCircle2, XCircle, Save, X, Filter,
    Briefcase, Globe, Activity
} from 'lucide-react';
import axios from 'axios';
import api from '@/utils/api';
import { cn } from '@/utils/cn';
import { APP_CONFIG } from '@/config/constants';

interface Bundle {
    id: string;
    network: string;
    name: string;
    data_amount: string;
    price_ghc: number;
    agent_price_ghc: number;
    validity_days: number;
    is_active: boolean;
}

const AdminBundlesPage: React.FC = () => {
    const [bundles, setBundles] = useState<Bundle[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [networkFilter, setNetworkFilter] = useState('All');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBundle, setEditingBundle] = useState<Bundle | null>(null);

    useEffect(() => {
        fetchBundles();
    }, []);

    const fetchBundles = async () => {
        setLoading(true);
        try {
            const response = await api.get('/admin/bundles');
            setBundles(response.data.bundles);
        } catch (error) {
            console.error('Failed to fetch bundles', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this bundle?')) return;
        try {
            await api.delete(`/admin/bundles/${id}`);
            setBundles(bundles.filter(b => b.id !== id));
        } catch (error) {
            alert('Failed to delete bundle');
        }
    };

    const toggleStatus = async (id: string) => {
        try {
            const response = await api.post(`/admin/bundles/${id}/toggle`, {});
            setBundles(bundles.map(b => b.id === id ? { ...b, is_active: response.data.is_active } : b));
        } catch (error) {
            alert('Failed to toggle status');
        }
    };

    const handleSaveBundle = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const data = Object.fromEntries(formData.entries());

        try {
            if (editingBundle) {
                await api.put(`/admin/bundles/${editingBundle.id}`, data);
            } else {
                await api.post('/admin/bundles', data);
            }
            setIsModalOpen(false);
            fetchBundles();
        } catch (error) {
            alert('Failed to save bundle');
        }
    };

    const filteredBundles = bundles.filter(b => {
        const matchesSearch = b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            b.network.toLowerCase().includes(searchTerm.toLowerCase()) ||
            b.data_amount.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesNetwork = networkFilter === 'All' || b.network === networkFilter;
        return matchesSearch && matchesNetwork;
    });

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Data Inventory</h1>
                    <p className="text-slate-500 font-bold mt-1">Configure network packages and price points.</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <button className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5 font-bold text-sm hover:bg-slate-50 transition-all">
                        <Activity className="w-4 h-4 text-emerald-500" />
                        <span>{bundles.filter(b => b.is_active).length} Active Bundles</span>
                    </button>
                    <button
                        onClick={() => { setEditingBundle(null); setIsModalOpen(true); }}
                        className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-sm shadow-xl shadow-slate-900/20 hover:scale-105 active:scale-95 transition-all"
                    >
                        <Plus className="w-5 h-5" />
                        <span>Create Bundle</span>
                    </button>
                </div>
            </div>

            {/* Controls Bar */}
            <div className="bg-white/80 dark:bg-white/5 border border-slate-100 dark:border-white/5 p-4 rounded-[2rem] flex flex-col md:flex-row gap-4 items-center shadow-sm backdrop-blur-xl">
                <div className="relative flex-1 w-full group">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-slate-900 dark:group-focus-within:text-white transition-colors" />
                    <input
                        type="text"
                        placeholder="Search by network, name, or size..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-black/20 border border-transparent focus:border-slate-200 dark:focus:border-white/10 rounded-2xl py-4 pl-16 pr-6 outline-none transition-all font-bold text-sm"
                    />
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto p-1 bg-slate-100 dark:bg-black/20 rounded-2xl">
                    {['All', 'MTN', 'Telecel', 'AT'].map((net) => (
                        <button
                            key={net}
                            onClick={() => setNetworkFilter(net)}
                            className={cn(
                                "px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                                networkFilter === net
                                    ? "bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-sm"
                                    : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                            )}
                        >
                            {net}
                        </button>
                    ))}
                </div>
            </div>

            {/* Bundles Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                {loading ? (
                    [1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="h-64 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-[2.5rem] animate-pulse" />
                    ))
                ) : filteredBundles.length === 0 ? (
                    <div className="col-span-full py-32 flex flex-col items-center gap-4 opacity-20">
                        <Database className="w-16 h-16" />
                        <p className="text-xl font-black font-mono">STOCK_EMPTY</p>
                    </div>
                ) : filteredBundles.map((bundle) => (
                    <div key={bundle.id} className={cn(
                        "bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-[2.5rem] p-8 space-y-6 transition-all duration-500 relative group overflow-hidden",
                        !bundle.is_active && "opacity-60 grayscale-[0.8]"
                    )}>
                        <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-10 group-hover:rotate-12 transition-all duration-700">
                            <Zap className="w-32 h-32" />
                        </div>

                        <div className="flex items-start justify-between relative z-10">
                            <div className={cn(
                                "p-3 rounded-2xl shrink-0 shadow-sm",
                                bundle.network === 'MTN' ? "bg-yellow-400/10 text-yellow-600 border border-yellow-400/20" :
                                    bundle.network === 'Telecel' ? "bg-red-500/10 text-red-600 border border-red-500/20" :
                                        "bg-blue-500/10 text-blue-600 border border-blue-500/20"
                            )}>
                                <span className="text-xs font-black uppercase tracking-widest">{bundle.network}</span>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => { setEditingBundle(bundle); setIsModalOpen(true); }}
                                    className="w-11 h-11 rounded-xl bg-slate-50 dark:bg-black/20 border border-slate-100 dark:border-white/5 flex items-center justify-center text-slate-500 hover:text-emerald-500 transition-all hover:scale-110 shadow-sm"
                                >
                                    <Edit3 className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => handleDelete(bundle.id)}
                                    className="w-11 h-11 rounded-xl bg-red-500/5 border border-red-500/10 flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white transition-all hover:scale-110 shadow-sm shadow-red-500/0 hover:shadow-red-500/20"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{bundle.network}</span>
                                {bundle.is_active ?
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> :
                                    <XCircle className="w-3.5 h-3.5 text-red-500" />
                                }
                            </div>
                            <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">{bundle.data_amount}</h3>
                            <p className="text-sm font-bold text-slate-500 mb-6 truncate">{bundle.network} Data Plan</p>

                            <div className="flex items-center justify-between gap-4">
                                <div className="space-y-1">
                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Price</div>
                                    <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">₵{Number(bundle.price_ghc).toFixed(2)}</div>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-2 text-slate-500 font-bold text-xs">
                                    <Globe className="w-3.5 h-3.5" />
                                    <span>{bundle.validity_days} Days Validity</span>
                                </div>
                                <button
                                    onClick={() => toggleStatus(bundle.id)}
                                    className={cn(
                                        "w-10 h-10 rounded-xl border flex items-center justify-center transition-all duration-300",
                                        bundle.is_active
                                            ? "border-red-500/10 text-red-500 hover:bg-red-500 hover:text-white"
                                            : "border-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white"
                                    )}
                                >
                                    <Power className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Bundle Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setIsModalOpen(false)} />
                    <div className="relative w-full max-w-xl bg-white dark:bg-[#0B0F19] rounded-[3rem] p-10 shadow-2xl animate-in zoom-in-95 duration-300 border border-slate-100 dark:border-white/5">
                        <header className="flex items-center justify-between mb-10">
                            <div>
                                <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                                    {editingBundle ? 'Modify Bundle' : 'New Bundle Config'}
                                </h2>
                                <p className="text-slate-500 font-bold mt-1 uppercase tracking-widest text-[10px]">Inventory Specifications</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-3 rounded-2xl bg-slate-50 dark:bg-white/5 hover:bg-slate-100 transition-colors text-slate-400">
                                <X className="w-6 h-6" />
                            </button>
                        </header>

                        <form onSubmit={handleSaveBundle} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-500 ml-1 uppercase tracking-widest">Network</label>
                                    <select
                                        name="network"
                                        defaultValue={editingBundle?.network || 'MTN'}
                                        className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-transparent focus:border-emerald-500/50 outline-none transition-all font-bold appearance-none"
                                    >
                                        <option value="MTN">MTN Network</option>
                                        <option value="Telecel">Telecel Ghana</option>
                                        <option value="AT">AT Network</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-500 ml-1 uppercase tracking-widest">Data Amount</label>
                                    <select
                                        name="data_amount"
                                        defaultValue={editingBundle?.data_amount || '1GB'}
                                        className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-transparent focus:border-slate-900 dark:focus:border-white/20 outline-none transition-all font-bold appearance-none"
                                    >
                                        {['500MB', '1GB', '2GB', '3GB', '5GB', '10GB', '20GB', '50GB', '100GB'].map(size => (
                                            <option key={size} value={size}>{size}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-500 ml-1 uppercase tracking-widest">Customer Price (GH₵)</label>
                                    <input
                                        name="price_ghc"
                                        type="number"
                                        step="0.01"
                                        defaultValue={editingBundle?.price_ghc || 0}
                                        placeholder="5.00"
                                        className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-transparent focus:border-slate-900 dark:focus:border-white/20 outline-none transition-all font-bold"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-500 ml-1 uppercase tracking-widest">Validity (Days)</label>
                                    <input
                                        name="validity_days"
                                        type="number"
                                        defaultValue={editingBundle?.validity_days || 30}
                                        placeholder="30"
                                        className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-transparent focus:border-slate-900 dark:focus:border-white/20 outline-none transition-all font-bold"
                                        required
                                    />
                                </div>
                                <input type="hidden" name="name" value={editingBundle?.name || 'Standard Plan'} />
                            </div>

                            <button
                                type="submit"
                                className="w-full py-5 rounded-2xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-black/20 hover:translate-y-[-2px] transition-all flex items-center justify-center gap-3"
                            >
                                <Save className="w-5 h-5" />
                                <span>{editingBundle ? 'Commit Specifications' : 'Initialize Package'}</span>
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminBundlesPage;

