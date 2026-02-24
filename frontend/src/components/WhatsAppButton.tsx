import React from 'react';
import { MessageCircle } from 'lucide-react';

const WhatsAppButton: React.FC = () => {
    const WHATSAPP_LINK = "https://chat.whatsapp.com/G1yTdqb7yVdANpIj6vS9mT";

    return (
        <div className="fixed bottom-8 right-8 z-[9999]">
            <a
                href={WHATSAPP_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="relative block transform transition-transform hover:scale-110 active:scale-95 animate-bounce-subtle"
            >
                {/* Glow Effect */}
                <div className="absolute inset-0 bg-emerald-500 rounded-full blur-xl opacity-40 animate-pulse" />

                {/* Button */}
                <div className="relative bg-emerald-500 text-white p-4 rounded-full shadow-2xl hover:shadow-emerald-500/50 transition-shadow duration-300 group">
                    <MessageCircle className="w-8 h-8 fill-current" />

                    {/* Tooltip */}
                    <div className="absolute right-full mr-4 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg bg-slate-900/90 text-white text-xs font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border border-white/10 backdrop-blur-sm">
                        Join Our Community
                    </div>
                </div>
            </a>

            <style>{`
                @keyframes bounce-subtle {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
                }
                .animate-bounce-subtle {
                    animation: bounce-subtle 3s ease-into-out infinite;
                }
            `}</style>
        </div>
    );
};

export default WhatsAppButton;
