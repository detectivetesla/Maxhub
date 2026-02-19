import React, { useState, useEffect } from 'react';
import {
    Mail, Send, Users, Search,
    Clock, CheckCircle2, AlertCircle,
    Info, Trash2, Filter, Paperclip,
    Layout, History, MessageSquare, Plus,
    Loader2, Trash, Check
} from 'lucide-react';
import { cn } from '@/utils/cn';
import api from '@/utils/api';
import Button from '@/components/Button';

const AdminEmailPage: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [users, setUsers] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [history, setHistory] = useState<any[]>([]);

    // Form State
    const [formData, setFormData] = useState({
        recipientType: 'all', // all, specific, group
        recipientId: '',
        subject: '',
        message: '',
        priority: 'normal'
    });

    const fetchUsers = async () => {
        try {
            const response = await api.get('/admin/users');
            setUsers(response.data.users);
        } catch (error) {
            console.error('Failed to fetch users', error);
        }
    };

    const fetchHistory = async () => {
        try {
            const response = await api.get('/admin/logs?type=order'); // Temporary using logs until dedicated message log implemented
            setHistory(response.data.logs.slice(0, 10));
        } catch (error) {
            console.error('Failed to fetch history', error);
        }
    };

    useEffect(() => {
        fetchUsers();
        fetchHistory();
    }, []);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.subject || !formData.message) return;
        if (formData.recipientType === 'specific' && !formData.recipientId) return;

        setSending(true);
        try {
            await api.post('/admin/send-message', formData);
            alert('Message queued for delivery successfully!');
            setFormData({ ...formData, subject: '', message: '' });
            fetchHistory();
        } catch (error: any) {
            alert(error.response?.data?.message || 'Failed to send message');
        } finally {
            setSending(false);
        }
    };

    const filteredUsers = users.filter(u =>
        u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Email Hub</h1>
                    <p className="text-slate-500 font-bold mt-1 uppercase tracking-widest text-[10px] flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-pink-500 animate-pulse" />
                        Direct User Communication & Marketing
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5 font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all">
                        <Layout className="w-4 h-4" />
                        <span>Templates</span>
                    </button>
                    <button onClick={fetchHistory} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 hover:bg-slate-100 transition-all">
                        <History className="w-5 h-5 text-slate-400" />
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Composition Form */}
                <div className="lg:col-span-8 space-y-6">
                    <div className="bg-white dark:bg-white/5 rounded-[3rem] border border-slate-100 dark:border-white/5 shadow-xl shadow-slate-200/5 overflow-hidden">
                        <div className="p-8 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50 dark:bg-black/10">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-pink-500/10 flex items-center justify-center">
                                    <Send className="w-6 h-6 text-pink-500" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-slate-900 dark:text-white">Compose Message</h2>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Send to individual or group</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">SMTP Connected</span>
                            </div>
                        </div>

                        <form onSubmit={handleSend} className="p-10 space-y-8">
                            {/* Recipient Selection */}
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Recipient Strategy</label>
                                <div className="grid grid-cols-3 gap-4">
                                    {[
                                        { id: 'all', label: 'All Users', icon: Users, desc: 'Send to everyone' },
                                        { id: 'specific', label: 'Single User', icon: MessageSquare, desc: 'Search individual' },
                                        { id: 'active', label: 'Active Only', icon: CheckCircle2, desc: 'Logged in recently' }
                                    ].map((type) => (
                                        <button
                                            key={type.id}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, recipientType: type.id })}
                                            className={cn(
                                                "p-6 rounded-[2rem] border-2 transition-all text-left flex flex-col gap-3 group relative overflow-hidden",
                                                formData.recipientType === type.id
                                                    ? "bg-slate-900 dark:bg-white border-slate-900 dark:border-white text-white dark:text-slate-900"
                                                    : "bg-white dark:bg-white/5 border-slate-100 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/20"
                                            )}
                                        >
                                            <type.icon className={cn("w-6 h-6", formData.recipientType === type.id ? "text-pink-400" : "text-slate-400")} />
                                            <div>
                                                <p className="font-black text-sm">{type.label}</p>
                                                <p className={cn("text-[9px] font-bold uppercase tracking-widest", formData.recipientType === type.id ? "text-white/60 dark:text-slate-400" : "text-slate-400")}>{type.desc}</p>
                                            </div>
                                            {formData.recipientType === type.id && (
                                                <Check className="absolute top-6 right-6 w-5 h-5 text-pink-500" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Specific User Search */}
                            {formData.recipientType === 'specific' && (
                                <div className="space-y-4 animate-in slide-in-from-top-4 duration-300">
                                    <div className="relative group">
                                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-pink-500 transition-colors" />
                                        <input
                                            type="text"
                                            placeholder="Search user by name or email..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-full bg-slate-50 dark:bg-black/20 border-none rounded-2xl py-4 pl-14 pr-6 outline-none font-bold text-sm focus:ring-2 ring-pink-500/20 transition-all"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto custom-scrollbar p-2">
                                        {filteredUsers.slice(0, 10).map(u => (
                                            <button
                                                key={u.id}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, recipientId: u.id })}
                                                className={cn(
                                                    "px-4 py-3 rounded-xl border text-left flex items-center justify-between transition-all group",
                                                    formData.recipientId === u.id
                                                        ? "bg-pink-500 text-white border-pink-500"
                                                        : "bg-white dark:bg-white/5 border-slate-100 dark:border-white/5 hover:border-pink-200"
                                                )}
                                            >
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-black">{u.full_name}</span>
                                                    <span className={cn("text-[10px] font-bold", formData.recipientId === u.id ? "text-white/80" : "text-slate-400")}>{u.email}</span>
                                                </div>
                                                {formData.recipientId === u.id && <Check className="w-4 h-4" />}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Subject & Message */}
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Email Subject</label>
                                    <input
                                        type="text"
                                        placeholder="Updates regarding your account settlement..."
                                        value={formData.subject}
                                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                        className="w-full bg-slate-50 dark:bg-black/20 border-none rounded-2xl py-5 px-8 outline-none font-black text-lg focus:ring-2 ring-pink-500/20 transition-all placeholder:text-slate-300 dark:placeholder:text-white/10"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2 flex justify-between">
                                        <span>Message Body</span>
                                        <span>Use Markdown for formatting</span>
                                    </label>
                                    <textarea
                                        rows={10}
                                        placeholder="Hello customer, we just updated our systems..."
                                        value={formData.message}
                                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                        className="w-full bg-slate-50 dark:bg-black/20 border-none rounded-[2rem] py-8 px-8 outline-none font-bold text-base focus:ring-2 ring-pink-500/20 transition-all resize-none custom-scrollbar"
                                    />
                                </div>
                            </div>

                            {/* Priority and Actions */}
                            <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-6 border-t border-slate-100 dark:border-white/5">
                                <div className="flex items-center gap-4">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Priority:</span>
                                    {['normal', 'urgent'].map(p => (
                                        <button
                                            key={p}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, priority: p })}
                                            className={cn(
                                                "px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all",
                                                formData.priority === p
                                                    ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white shadow-lg shadow-black/10"
                                                    : "bg-slate-50 dark:bg-white/5 text-slate-400 border-transparent hover:bg-slate-100"
                                            )}
                                        >
                                            {p}
                                        </button>
                                    ))}
                                </div>
                                <div className="flex items-center gap-4 w-full md:w-auto">
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, subject: '', message: '' })}
                                        className="flex-1 md:flex-none px-8 py-5 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 font-black text-xs uppercase tracking-widest text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all"
                                    >
                                        Discard
                                    </button>
                                    <Button
                                        type="submit"
                                        disabled={sending || !formData.subject || !formData.message}
                                        className="flex-1 md:flex-none px-12 py-5 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 shadow-2xl shadow-slate-900/20 disabled:opacity-50 hover:scale-105 active:scale-95 transition-all"
                                    >
                                        {sending ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                <span>Queueing...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Send className="w-4 h-4" />
                                                <span>Send Blast</span>
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Info Sidebar */}
                <div className="lg:col-span-4 space-y-8">
                    {/* Activity Feed */}
                    <div className="bg-white dark:bg-white/5 rounded-[3rem] border border-slate-100 dark:border-white/5 p-8 space-y-8 shadow-sm">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Recent Blasts</h3>
                            <button className="text-[10px] font-black text-pink-500 uppercase tracking-widest hover:underline">View All</button>
                        </div>
                        <div className="space-y-6">
                            {history.length === 0 ? (
                                <div className="py-12 text-center space-y-3">
                                    <div className="w-16 h-16 bg-slate-50 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto">
                                        <MessageSquare className="w-8 h-8 text-slate-200" />
                                    </div>
                                    <p className="text-xs font-bold text-slate-400">No message history yet.</p>
                                </div>
                            ) : history.map((log, i) => (
                                <div key={i} className="flex gap-4 group cursor-pointer">
                                    <div className="mt-1 w-2 h-2 rounded-full bg-pink-500 shrink-0" />
                                    <div className="space-y-1">
                                        <p className="text-xs font-black text-slate-900 dark:text-white line-clamp-1 group-hover:text-pink-500 transition-colors">
                                            {log.action}
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[9px] font-bold text-slate-400 uppercase">{new Date(log.created_at).toLocaleDateString()}</span>
                                            <span className="w-1 h-1 rounded-full bg-slate-200" />
                                            <span className="text-[9px] font-bold text-slate-400 uppercase">{log.user_name || 'System'}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Quick Tips */}
                    <div className="bg-slate-900 dark:bg-white p-10 rounded-[3rem] space-y-6 shadow-2xl shadow-indigo-500/10 text-white dark:text-slate-900">
                        <div className="w-12 h-12 rounded-2xl bg-white/10 dark:bg-slate-900/5 flex items-center justify-center">
                            <Info className="w-6 h-6 text-pink-400" />
                        </div>
                        <div>
                            <h4 className="text-lg font-black tracking-tight">Email Strategy</h4>
                            <p className="text-xs font-bold opacity-60 mt-2 leading-relaxed">
                                Messages sent here will deliver instantly to the user's dashboard inbox and trigger an SMTP email relay if configured.
                            </p>
                        </div>
                        <div className="space-y-4 pt-4 text-xs font-bold opacity-80 uppercase tracking-widest">
                            <div className="flex items-center gap-3">
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                <span>Markdown Support</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                <span>Bulk Sending</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                <span>Global Tags</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminEmailPage;
