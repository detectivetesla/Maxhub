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
import MaintenancePage from '@/pages/MaintenancePage';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import AdminLayout from '@/components/admin/AdminLayout';
import ProtectedRoute from '@/components/ProtectedRoute';

// Dashboard imports
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
import AdminEmailPage from '@/pages/admin/AdminEmailPage';
import AdminAnalyticsPage from '@/pages/admin/AdminAnalyticsPage';
import AdminNetworksPage from '@/pages/admin/AdminNetworksPage';
import WhatsAppButton from '@/components/WhatsAppButton';

const AuthWrapper: React.FC<{ type: 'signin' | 'signup' }> = ({ type }) => {
    const [currentType, setCurrentType] = React.useState(type);
    const { isAuthenticated, user } = useAuth();

    if (isAuthenticated) {
        const adminPath = import.meta.env.VITE_ADMIN_PATH || '/admin';
        return <Navigate to={user?.role === 'admin' ? adminPath : '/dashboard'} replace />;
    }

    return <AuthPage type={currentType} onToggle={() => setCurrentType(currentType === 'signin' ? 'signup' : 'signin')} />;
};

// Get admin path from env or default to /admin
const ADMIN_PATH = import.meta.env.VITE_ADMIN_PATH || '/admin';

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
            <Route path={`${ADMIN_PATH}/login`} element={<AdminLogin />} />
            <Route path={ADMIN_PATH} element={
                <ProtectedRoute allowedRoles={['admin']}>
                    <AdminLayout />
                </ProtectedRoute>
            }>
                <Route index element={<AdminPage />} />
                <Route path="analytics" element={<AdminAnalyticsPage />} />
                <Route path="users" element={<AdminUsersPage />} />
                <Route path="bundles" element={<AdminBundlesPage />} />
                <Route path="orders" element={<AdminOrdersPage />} />
                <Route path="transactions" element={<AdminTransactionsPage />} />
                <Route path="networks" element={<AdminNetworksPage />} />
                <Route path="developer" element={<AdminAPIPage />} />
                <Route path="email" element={<AdminEmailPage />} />
                <Route path="settings" element={<AdminSettingsPage />} />
                <Route path="activity-log" element={<AdminActivityLogPage />} />
                <Route path="logs" element={<AdminLogsPage />} />
            </Route>
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/maintenance" element={<MaintenancePage />} />
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
                <WhatsAppButton />
            </AuthProvider>
        </Router>
    );
};

export default App;
