import React, { useState, useEffect } from 'react';
import {
    Users, Search, Trash2, Shield, User, Wallet,
    MoreVertical, Plus, Filter, Download, Mail,
    CheckCircle2, XCircle, Edit, Save, X
} from 'lucide-react';
import axios from 'axios';
import api from '@/utils/api';
import { cn } from '@/utils/cn';
import Button from '@/components/Button';
import { APP_CONFIG } from '@/config/constants';

interface UserData {
    id: string;
    email: string;
    full_name: string;
    role: 'customer' | 'admin';
    wallet_balance: number;
    created_at: string;
    is_blocked: boolean;
    status?: 'active' | 'suspended';
}

const AdminUsersPage: React.FC = () => {
    const [users, setUsers] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<UserData | null>(null);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const response = await api.get('/admin/users');
            const usersWithStatus = response.data.users.map((u: UserData) => ({
                ...u,
                status: u.is_blocked ? 'suspended' : 'active'
            }));
            setUsers(usersWithStatus);
        } catch (error) {
            console.error('Failed to fetch users', error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleBlock = async (id: string) => {
        try {
            const response = await api.post(`/admin/users/${id}/toggle-block`);
            const { is_blocked } = response.data;
            setUsers(users.map(u => u.id === id ? { ...u, is_blocked, status: is_blocked ? 'suspended' : 'active' } : u));
        } catch (error) {
            alert('Failed to toggle block status');
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to permanently delete this user?')) return;
        try {
            await api.delete(`/admin/users/${id}`);
            setUsers(users.filter(u => u.id !== id));
        } catch (error) {
            alert('Failed to delete user');
        }
    };

    const handleSaveUser = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const data = Object.fromEntries(formData.entries());

        // Convert balance to number
        data.wallet_balance = Number(data.wallet_balance) as any;

        try {
            if (editingUser) {
                // Update existing
                await api.put(`/admin/users/${editingUser.id}`, {
                    ...data,
                    is_blocked: editingUser.is_blocked
                });
            } else {
                // Create new
                await api.post('/admin/users', data);
            }
            setIsModalOpen(false);
            fetchUsers();
        } catch (error: any) {
            alert(error.response?.data?.message || 'Failed to save user');
        }
    };

    const filteredUsers = users.filter(u =>
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.full_name && u.full_name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">User Directory</h1>
                    <p className="text-slate-500 font-bold mt-1">Manage system administrators and customers.</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <button className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 font-bold text-sm hover:bg-slate-100 transition-all">
                        <Download className="w-4 h-4" />
                        <span>Export List</span>
                    </button>
                    <button
                        onClick={() => { setEditingUser(null); setIsModalOpen(true); }}
                        className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-blue-500 text-white font-black text-sm shadow-xl shadow-blue-500/20 hover:translate-y-[-2px] transition-all"
                    >
                        <Plus className="w-5 h-5" />
                        <span>Add New User</span>
                    </button>
                </div>
            </div>

            {/* Controls Bar */}
            <div className="bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5 p-4 rounded-[2rem] flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full group">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                    <input
                        type="text"
                        placeholder="Filter by name, email, or user ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-50/50 dark:bg-black/20 border border-transparent focus:border-primary/50 rounded-2xl py-4 pl-16 pr-6 outline-none transition-all font-bold text-sm"
                    />
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <button className="flex-1 md:flex-none p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 flex items-center justify-center gap-2 font-bold text-sm">
                        <Filter className="w-4 h-4" />
                        <span>Filters</span>
                    </button>
                    <button onClick={fetchUsers} className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 flex items-center justify-center group">
                        <Activity className={cn("w-5 h-5 text-slate-400 group-hover:text-primary transition-colors", loading && "animate-spin")} />
                    </button>
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-[3rem] overflow-hidden shadow-sm">
                <div className="overflow-x-auto overflow-y-hidden">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-white/[0.02] border-b border-slate-100 dark:border-white/5">
                                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Profile Information</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Access Role</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Wallet Assets</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Status</th>
                                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                            {loading ? (
                                [1, 2, 3, 4, 5].map(i => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={5} className="px-10 py-8"><div className="h-10 bg-slate-100 dark:bg-white/5 rounded-2xl w-full" /></td>
                                    </tr>
                                ))
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-10 py-32 text-center">
                                        <div className="flex flex-col items-center gap-4 opacity-20">
                                            <Users className="w-16 h-16" />
                                            <p className="text-xl font-black">No network users found</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredUsers.map((user) => (
                                <tr key={user.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.01] transition-colors group">
                                    <td className="px-10 py-6">
                                        <div className="flex items-center gap-5">
                                            <div className="w-14 h-14 rounded-2xl bg-slate-900 flex items-center justify-center text-white font-black text-xl shadow-xl shadow-black/10 shrink-0">
                                                {user.full_name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-black text-slate-900 dark:text-white text-lg leading-tight truncate">{user.full_name || 'Anonymous User'}</p>
                                                <div className="flex items-center gap-1.5 mt-1 text-slate-500 font-bold text-sm">
                                                    <Mail className="w-3.5 h-3.5" />
                                                    <span className="truncate">{user.email}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className={cn(
                                            "inline-flex items-center gap-2 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all",
                                            user.role === 'admin'
                                                ? "bg-purple-500/10 text-purple-600 border-purple-500/20"
                                                : "bg-blue-500/10 text-blue-600 border-blue-500/20"
                                        )}>
                                            {user.role === 'admin' ? <Shield className="w-3 h-3" /> : <User className="w-3 h-3" />}
                                            {user.role}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                                <Wallet className="w-4 h-4 text-blue-500" />
                                            </div>
                                            <span className="font-black text-slate-900 dark:text-white text-lg">₵{Number(user.wallet_balance).toFixed(2)}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className={cn(
                                            "flex items-center gap-2 font-black text-[10px] uppercase tracking-wider",
                                            user.status === 'suspended' ? "text-red-500" : "text-blue-500"
                                        )}>
                                            {user.status === 'suspended' ? <XCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                                            <span>{user.status}</span>
                                        </div>
                                    </td>
                                    <td className="px-10 py-6 text-right">
                                        <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                                            <button
                                                onClick={() => { setEditingUser(user); setIsModalOpen(true); }}
                                                className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 flex items-center justify-center text-slate-500 hover:text-primary transition-colors"
                                                title="Edit User"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleToggleBlock(user.id)}
                                                className={cn(
                                                    "w-10 h-10 rounded-xl border flex items-center justify-center transition-all",
                                                    user.is_blocked
                                                        ? "bg-blue-500/10 border-blue-500/20 text-blue-500 hover:bg-blue-500 hover:text-white"
                                                        : "bg-amber-500/10 border-amber-500/20 text-amber-500 hover:bg-amber-500 hover:text-white"
                                                )}
                                                title={user.is_blocked ? "Unblock User" : "Block User"}
                                            >
                                                <Shield className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(user.id)}
                                                className="w-10 h-10 rounded-xl bg-red-500/5 border border-red-500/10 flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-lg shadow-red-500/0 hover:shadow-red-500/20"
                                                title="Delete User"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* CRUD Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setIsModalOpen(false)} />
                    <div className="relative w-full max-w-xl bg-white dark:bg-[#0B0F19] rounded-[3rem] p-10 shadow-2xl animate-in zoom-in-95 duration-300 border border-slate-100 dark:border-white/5">
                        <header className="flex items-center justify-between mb-10">
                            <div>
                                <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                                    {editingUser ? 'Update Participant' : 'Board New Participant'}
                                </h2>
                                <p className="text-slate-500 font-bold mt-1 uppercase tracking-widest text-[10px]">Registry Form</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-3 rounded-2xl bg-slate-50 dark:bg-white/5 hover:bg-slate-100 transition-colors">
                                <X className="w-6 h-6 text-slate-400" />
                            </button>
                        </header>

                        <form onSubmit={handleSaveUser} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-500 ml-1 uppercase tracking-widest">Full Name</label>
                                    <input
                                        name="full_name"
                                        defaultValue={editingUser?.full_name}
                                        placeholder="John Doe"
                                        className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-transparent focus:border-primary/50 outline-none transition-all font-bold"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-500 ml-1 uppercase tracking-widest">Email Identity</label>
                                    <input
                                        name="email"
                                        type="email"
                                        defaultValue={editingUser?.email}
                                        placeholder="john@example.com"
                                        className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-transparent focus:border-primary/50 outline-none transition-all font-bold"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-500 ml-1 uppercase tracking-widest">Access Role</label>
                                    <select
                                        name="role"
                                        defaultValue={editingUser?.role || 'customer'}
                                        className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-transparent focus:border-primary/50 outline-none transition-all font-bold appearance-none text-slate-900 dark:text-white cursor-pointer"
                                        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1.5em 1.5em' }}
                                    >
                                        <option value="customer" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">{APP_CONFIG.ROLES.customer}</option>
                                        <option value="admin" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">{APP_CONFIG.ROLES.admin}</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-500 ml-1 uppercase tracking-widest">Wallet Credits</label>
                                    <input
                                        name="wallet_balance"
                                        type="number"
                                        step="0.01"
                                        defaultValue={editingUser?.wallet_balance || 0}
                                        className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-transparent focus:border-primary/50 outline-none transition-all font-bold"
                                        required
                                    />
                                </div>
                            </div>

                            {!editingUser && (
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-500 ml-1 uppercase tracking-widest">Initial Password</label>
                                    <input
                                        name="password"
                                        type="password"
                                        placeholder="Secure entry code"
                                        className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-transparent focus:border-primary/50 outline-none transition-all font-bold"
                                        required
                                    />
                                </div>
                            )}

                            <div className="flex justify-end pt-6">
                                <button
                                    type="submit"
                                    className="px-10 py-5 rounded-2xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-black/20 hover:translate-y-[-2px] transition-all flex items-center gap-3"
                                >
                                    <Save className="w-5 h-5" />
                                    <span>{editingUser ? 'Commit Changes' : 'Initialize Account'}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminUsersPage;

import { Activity } from 'lucide-react';

