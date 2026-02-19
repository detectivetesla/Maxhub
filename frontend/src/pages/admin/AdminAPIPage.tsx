import React, { useState } from 'react';
import {
    Terminal, Key, Shield, Globe,
    Copy, RefreshCw, Save, Activity,
    Zap, Lock, ExternalLink
} from 'lucide-react';
import { cn } from '@/utils/cn';

const AdminAPIPage: React.FC = () => {
    const [apiKey, setApiKey] = useState('em_live_4f8e2c9a1b0d5e7f6g3h1j0k9l8m7n6o');
    const [isRefreshing, setIsRefreshing] = useState(false);

    const endpoints = [
        { method: 'GET', path: '/v1/bundles', desc: 'Retrieve all active data bundles', status: 'optimal' },
        { method: 'POST', path: '/v1/orders', desc: 'Place a new data bundle order', status: 'optimal' },
        { method: 'GET', path: '/v1/balance', desc: 'Check current wallet balance', status: 'optimal' },
        { method: 'POST', path: '/v1/verify', desc: 'Verify transaction status', status: 'stable' },
    ];

    const handleRefreshKey = () => {
        setIsRefreshing(true);
        setTimeout(() => {
            setApiKey('em_live_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15));
            setIsRefreshing(false);
        }, 1500);
    };

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <header>
                <div className="flex items-center gap-4 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                        <Terminal className="w-5 h-5 text-amber-600" />
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">API Infrastructure</h1>
                </div>
                <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] ml-14">Developer Interface Control</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main API Config */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Security credentials */}
                    <div className="bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-[3rem] p-10 space-y-8 shadow-sm">
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white">Master API Credentials</h2>
                            <p className="text-sm font-bold text-slate-500 mt-1">High-level access keys for system communication.</p>
                        </div>

                        <div className="space-y-6">
                            <div className="p-8 rounded-[2rem] bg-slate-900 dark:bg-black/40 border border-white/5 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-700">
                                    <Key className="w-32 h-32 text-white" />
                                </div>
                                <div className="relative z-10">
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="text-[10px] font-black text-amber-500 uppercase tracking-[0.3em]">Live Secret Key</span>
                                        <span className="text-[10px] font-black text-blue-500 px-2 py-0.5 rounded bg-blue-500/10 uppercase border border-blue-500/20">Authorized</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <code className="flex-1 bg-white/5 rounded-xl px-6 py-4 font-mono text-sm text-amber-100 border border-white/10 break-all">
                                            {isRefreshing ? '••••••••••••••••••••••••••••••••' : apiKey}
                                        </code>
                                        <div className="flex flex-col gap-2">
                                            <button
                                                onClick={() => navigator.clipboard.writeText(apiKey)}
                                                className="p-4 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-all active:scale-95"
                                            >
                                                <Copy className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={handleRefreshKey}
                                                className={cn(
                                                    "p-4 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-all active:scale-95",
                                                    isRefreshing && "animate-spin"
                                                )}
                                            >
                                                <RefreshCw className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 space-y-2">
                                <div className="flex items-center gap-2">
                                    <Globe className="w-4 h-4 text-blue-500" />
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Base API URL</span>
                                </div>
                                <p className="font-bold text-slate-900 dark:text-white text-sm truncate">maxhub</p>
                            </div>
                            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 space-y-2">
                                <div className="flex items-center gap-2">
                                    <Lock className="w-4 h-4 text-blue-500" />
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Auth Method</span>
                                </div>
                                <p className="font-bold text-slate-900 dark:text-white text-sm">Bearer Token Strategy</p>
                            </div>
                        </div>
                    </div>

                    {/* Endpoint Status */}
                    <div className="bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-[3rem] p-10 space-y-8 shadow-sm">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white">Active Gateways</h2>
                            <Activity className="w-5 h-5 text-slate-400" />
                        </div>

                        <div className="space-y-4">
                            {endpoints.map((ep) => (
                                <div key={ep.path} className="flex items-center justify-between p-6 rounded-2xl bg-slate-50 dark:bg-black/20 border border-slate-100 dark:border-white/5 group hover:border-primary/50 transition-all">
                                    <div className="flex items-center gap-4">
                                        <span className={cn(
                                            "px-3 py-1 rounded-lg text-[10px] font-black border",
                                            ep.method === 'GET' ? "bg-blue-500/10 text-blue-500 border-blue-500/20" : "bg-blue-500/10 text-blue-500 border-blue-500/20"
                                        )}>
                                            {ep.method}
                                        </span>
                                        <div>
                                            <code className="text-sm font-black text-slate-900 dark:text-white">{ep.path}</code>
                                            <p className="text-xs font-bold text-slate-500">{ep.desc}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "w-2 h-2 rounded-full",
                                            ep.status === 'optimal' ? "bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.5)]" : "bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.5)]"
                                        )} />
                                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider font-mono">{ep.status}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Sidebar for API Info */}
                <div className="space-y-8">
                    <div className="bg-slate-900 rounded-[3rem] p-10 text-white space-y-8 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
                            <Zap className="w-32 h-32" />
                        </div>
                        <div className="relative z-10">
                            <h3 className="text-2xl font-black mb-4">API Documentation</h3>
                            <p className="text-slate-400 font-bold text-sm leading-relaxed mb-8">
                                Fully integrated documentation for building custom integrations with your user system.
                            </p>
                            <button className="w-full py-5 rounded-2xl bg-white text-slate-900 font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-black/20 hover:translate-y-[-2px] transition-all flex items-center justify-center gap-3">
                                <ExternalLink className="w-4 h-4" />
                                <span>Open Portal Docs</span>
                            </button>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-[3rem] p-10 space-y-6">
                        <h3 className="text-lg font-black text-slate-900 dark:text-white">Usage Limits</h3>
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs font-black uppercase tracking-widest">
                                    <span className="text-slate-500">Rate Limiting</span>
                                    <span className="text-primary">850/1000 req/min</span>
                                </div>
                                <div className="h-2 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                                    <div className="h-full bg-primary w-[85%] rounded-full shadow-[0_0_12px_rgba(var(--primary),0.5)]" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs font-black uppercase tracking-widest">
                                    <span className="text-slate-500">Webhook Success</span>
                                    <span className="text-blue-500">99.2%</span>
                                </div>
                                <div className="h-2 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-500 w-[99%] rounded-full shadow-[0_0_12px_rgba(59,130,246,0.5)]" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminAPIPage;
