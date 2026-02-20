import React from 'react';
import { Settings, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const MaintenancePage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-[#0B0F19] text-white flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[128px]" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[128px]" />
            </div>

            <div className="relative z-10 max-w-lg w-full">
                <div className="w-24 h-24 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-primary/20 animate-pulse">
                    <Settings className="w-12 h-12 text-primary" />
                </div>

                <h1 className="text-4xl sm:text-5xl font-black mb-4 tracking-tight">
                    Under Maintenance
                </h1>

                <p className="text-lg text-slate-400 font-medium mb-10 leading-relaxed">
                    We're currently upgrading our systems to serve you better.
                    Please check back in a few minutes.
                </p>

                <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm mb-10">
                    <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest mb-2">Expected Completion</h3>
                    <p className="text-xl font-black text-white">Soon™</p>
                </div>

                <button
                    onClick={() => window.location.reload()}
                    className="flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold transition-all active:scale-95 shadow-xl shadow-primary/20 mx-auto"
                >
                    <RefreshCw className="w-5 h-5" />
                    <span>Try Again</span>
                </button>


            </div>
        </div>
    );
};

export default MaintenancePage;
