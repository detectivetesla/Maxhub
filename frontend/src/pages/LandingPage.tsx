import React from 'react';
import Navbar from '@/components/Navbar';
import Button from '@/components/Button';
import NetworkCard from '@/components/NetworkCard';
import BundleModal from '@/components/BundleModal';
import { Database, Shield, Rocket } from 'lucide-react';
import { APP_CONFIG } from '@/config/constants';

const LandingPage: React.FC = () => {
    const [selectedNetwork, setSelectedNetwork] = React.useState<string | null>(null);

    const networks = [
        { name: 'MTN', color: 'yellow' as const, logo: '' },
        { name: 'Telecel', color: 'red' as const, logo: '' },
        { name: 'AT', color: 'blue' as const, logo: '' },
    ];

    return (
        <div className="min-h-screen">
            <Navbar />

            {/* Hero Section */}
            <section className="pt-32 pb-20 px-6 max-w-7xl mx-auto text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6">
                    <img src="/src/assets/images/logo.png" alt="Logo" className="w-4 h-4 object-contain brightness-110" />
                    <span>Secure & Fast Data Delivery</span>
                </div>

                <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8">
                    {APP_CONFIG.SYSTEM_SLOGAN.split('Cheap').map((part: string, i: number) => (
                        <React.Fragment key={i}>
                            {part}
                            {i === 0 && <span className="text-primary italic">Cheap</span>}
                        </React.Fragment>
                    ))}
                </h1>

                <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10">
                    {APP_CONFIG.SYSTEM_DESCRIPTION}
                </p>

                <div className="flex flex-wrap items-center justify-center gap-4">
                    <Button size="lg">Get Started Now</Button>
                    <Button variant="outline" size="lg">View All Bundles</Button>
                </div>
            </section>

            {/* Network Selection */}
            <section className="py-20 bg-white/5 border-y border-white/5">
                <div className="max-w-7xl mx-auto px-6 text-center">
                    <h2 className="text-4xl font-black mb-4">Choose Your Network</h2>
                    <p className="text-slate-500 font-medium mb-12">Select your network provider to see available bundles.</p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                        {networks.map((net) => (
                            <NetworkCard
                                key={net.name}
                                name={net.name}
                                color={net.color}
                                logo={net.logo}
                                isActive={selectedNetwork === net.name}
                                onClick={() => setSelectedNetwork(net.name)}
                            />
                        ))}
                    </div>
                </div>
            </section>

            {/* Bundle Modal */}
            {selectedNetwork && (
                <BundleModal
                    network={selectedNetwork}
                    isOpen={!!selectedNetwork}
                    onClose={() => setSelectedNetwork(null)}
                />
            )}

            {/* Features */}
            <section className="py-20 max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-12">
                <div className="space-y-4">
                    <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                        <Shield className="text-purple-500" />
                    </div>
                    <h3 className="text-xl font-bold">Secure Payments</h3>
                    <p className="text-slate-400">Powered by Paystack. Your transactions are safe and encrypted.</p>
                </div>
                <div className="space-y-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                        <Database className="text-blue-500" />
                    </div>
                    <h3 className="text-xl font-bold">Reliable Delivery</h3>
                    <p className="text-slate-400">Data reflects on your phone within seconds of purchase.</p>
                </div>
                <div className="space-y-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                        <Rocket className="text-blue-500" />
                    </div>
                    <h3 className="text-xl font-bold">Affordable Rates</h3>
                    <p className="text-slate-400">Get the best value for your money with our competitive pricing.</p>
                </div>
            </section>
        </div>
    );
};

export default LandingPage;
