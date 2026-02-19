import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from '@/pages/LandingPage';
import AuthPage from '@/pages/AuthPage';
import Dashboard from '@/pages/Dashboard';
import AdminPage from '@/pages/AdminPage';
import AdminUsersPage from '@/pages/admin/AdminUsersPage';
import AdminBundlesPage from '@/pages/admin/AdminBundlesPage';
import AdminAPIPage from '@/pages/admin/AdminAPIPage';
import AdminLogsPage from '@/pages/admin/AdminLogsPage';
import AdminActivityLogPage from '@/pages/admin/AdminActivityLogPage';
import AdminSettingsPage from '@/pages/admin/AdminSettingsPage';
import AdminOrdersPage from '@/pages/admin/AdminOrdersPage';
import AdminLogin from '@/pages/admin/AdminLogin';
import TermsPage from '@/pages/TermsPage';
import PrivacyPage from '@/pages/PrivacyPage';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import AdminLayout from '@/components/admin/AdminLayout';
import ProtectedRoute from '@/components/ProtectedRoute';

const AuthWrapper: React.FC<{ type: 'signin' | 'signup' }> = ({ type }) => {
    const [currentType, setCurrentType] = React.useState(type);
    const { isAuthenticated, user } = useAuth();

    if (isAuthenticated) {
        return <Navigate to={user?.role === 'admin' ? '/admin' : '/dashboard'} replace />;
    }

    return <AuthPage type={currentType} onToggle={() => setCurrentType(currentType === 'signin' ? 'signup' : 'signin')} />;
};

import Overview from '@/pages/dashboard/Overview';
import Wallet from '@/pages/dashboard/Wallet';
import Deposits from '@/pages/dashboard/Deposits';
import DataBundles from '@/pages/dashboard/DataBundles';
import Orders from '@/pages/dashboard/Orders';
import Transactions from '@/pages/dashboard/Transactions';
import Settings from '@/pages/dashboard/Settings';
import Profile from '@/pages/dashboard/Profile';
import Inboxes from '@/pages/dashboard/Inboxes';
import Notifications from '@/pages/dashboard/Notifications';
import AdminTransactionsPage from '@/pages/admin/AdminTransactionsPage';

const AppRoutes: React.FC = () => {
    return (
        <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<AuthWrapper type="signin" />} />
            <Route path="/register" element={<AuthWrapper type="signup" />} />
            <Route path="/dashboard" element={
                <ProtectedRoute>
                    <Dashboard />
                </ProtectedRoute>
            }>
                <Route index element={<Overview />} />
                <Route path="wallet" element={<Wallet />} />
                <Route path="deposits" element={<Deposits />} />
                <Route path="data-bundles" element={<DataBundles />} />
                <Route path="orders" element={<Orders />} />
                <Route path="transactions" element={<Transactions />} />
                <Route path="settings" element={<Settings />} />
                <Route path="profile" element={<Profile />} />
                <Route path="inbox" element={<Inboxes />} />
                <Route path="notifications" element={<Notifications />} />
            </Route>
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={
                <ProtectedRoute allowedRoles={['admin']}>
                    <AdminLayout />
                </ProtectedRoute>
            }>
                <Route index element={<AdminPage />} />
                <Route path="analytics" element={<div className="p-8"><h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">System Analytics</h1><p className="text-slate-500 font-bold mt-1">Deep-dive traffic and revenue metrics.</p></div>} />
                <Route path="users" element={<AdminUsersPage />} />
                <Route path="bundles" element={<AdminBundlesPage />} />
                <Route path="orders" element={<AdminOrdersPage />} />
                <Route path="transactions" element={<AdminTransactionsPage />} />
                <Route path="discounts" element={<div className="p-8"><h1 className="text-2xl font-bold text-slate-900 dark:text-white">Discounts</h1><p className="text-slate-500">Coupon and Reward Generation.</p></div>} />
                <Route path="networks" element={<div className="p-8"><h1 className="text-2xl font-bold text-slate-900 dark:text-white">Networks</h1><p className="text-slate-500">Provider Core Configuration.</p></div>} />
                <Route path="developer" element={<AdminAPIPage />} />
                <Route path="email" element={<div className="p-8"><h1 className="text-2xl font-bold text-slate-900 dark:text-white">Send Email</h1><p className="text-slate-500">Direct Communication Hub.</p></div>} />
                <Route path="settings" element={<AdminSettingsPage />} />
                <Route path="activity-log" element={<AdminActivityLogPage />} />
                <Route path="logs" element={<AdminLogsPage />} />
            </Route>
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            {/* Catch-all redirect to login */}
            <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
    );
};

const App: React.FC = () => {
    return (
        <Router>
            <AuthProvider>
                <AppRoutes />
            </AuthProvider>
        </Router>
    );
};

export default App;
