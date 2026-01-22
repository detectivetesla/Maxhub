import React from 'react';
import { Outlet } from 'react-router-dom';
import { cn } from '@/utils/cn';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';

const AdminLayout: React.FC = () => {
    const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
    const [isCollapsed, setIsCollapsed] = React.useState(false);

    return (
        <div
            className="min-h-screen bg-white dark:bg-[#0B0F19] flex relative overflow-x-hidden"
            style={{
                backgroundImage: 'url("/images/admin/bg.jpg")',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundAttachment: 'fixed'
            }}
        >
            {/* Background Overlay */}
            <div className="absolute inset-0 bg-white/90 dark:bg-[#0B0F19]/90 backdrop-blur-sm pointer-events-none" />

            <div className="relative flex w-full">
                {/* Mobile Sidebar Overlay */}
                <div className={cn(
                    "fixed inset-0 z-[60] lg:hidden transition-opacity duration-300",
                    isSidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                )}>
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />
                </div>

                <AdminSidebar
                    isCollapsed={isCollapsed}
                    className={cn(
                        "lg:translate-x-0 transition-all duration-300",
                        isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
                        isCollapsed ? "lg:w-24" : "lg:w-72"
                    )}
                />

                <main className={cn(
                    "flex-1 flex flex-col min-w-0 relative z-10 transition-all duration-300",
                    isCollapsed ? "lg:ml-24" : "lg:ml-72"
                )}>
                    <AdminHeader
                        onMenuClick={() => {
                            if (window.innerWidth >= 1024) {
                                setIsCollapsed(!isCollapsed);
                            } else {
                                setIsSidebarOpen(!isSidebarOpen);
                            }
                        }}
                    />

                    <div className="p-4 sm:p-8 lg:p-10 overflow-y-auto">
                        <div className="max-w-[1600px] mx-auto w-full">
                            <Outlet />
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
