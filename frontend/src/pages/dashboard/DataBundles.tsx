import React, { useState, useEffect } from 'react';
import { ArrowLeft, Wallet, Grid3x3, List, CheckCircle2, Loader2, XCircle, Zap, Users, Info, Calendar, ChevronRight } from 'lucide-react';
import axios from 'axios';
import api from '@/utils/api';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/utils/cn';
import Button from '@/components/Button';

type Network = 'MTN' | 'Telecel' | 'AirtelTigo';
type PurchaseMode = 'normal' | 'grid';
type OrderTab = 'single' | 'bulk';
type Step = 1 | 2 | 3;

interface Bundle {
    id: string;
    network: Network;
    name: string;
    data: string;
    price: number;
    validity: string;
    discount?: number;
    popular?: boolean;
    is_active?: boolean;
}

const DataBundles: React.FC = () => {
    const { user } = useAuth();
    const [currentStep, setCurrentStep] = useState<Step>(1);
    const [selectedNetwork, setSelectedNetwork] = useState<Network | null>(null);
    const [selectedBundle, setSelectedBundle] = useState<Bundle | null>(null);
    const [mode, setMode] = useState<PurchaseMode>('normal');
    const [activeTab, setActiveTab] = useState<OrderTab>('single');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [bulkNumbers, setBulkNumbers] = useState('');
    const [isRecurring, setIsRecurring] = useState(false);
    const [paymentMethod, _] = useState<'wallet'>('wallet');
    const [allBundles, setAllBundles] = useState<Bundle[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        const fetchBundles = async () => {
            try {
                const response = await api.get('/admin/bundles');
                // Map API price_ghc to price field
                const formattedBundles = response.data.bundles.map((b: any) => ({
                    ...b,
                    price: Number(b.price_ghc),
                    data: b.data_amount,
                    validity: b.validity_days ? `${b.validity_days} Days` : '30 Days'
                }));
                setAllBundles(formattedBundles);
            } catch (error) {
                console.error('Failed to fetch bundles:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchBundles();
    }, []);

    const getBundlesForNetwork = (network: Network): Bundle[] => {
        return allBundles.filter(b => b.network === network && b.is_active !== false);
    };

    const networkConfig = {
        MTN: {
            color: 'bg-[#FFCC00]',
            borderColor: 'border-[#FFCC00]',
            textColor: 'text-[#FFCC00]',
            hoverBg: 'hover:bg-[#FFCC00]/5',
            focusRing: 'focus:ring-[#FFCC00]/20',
            buttonColor: 'bg-[#FFCC00] hover:bg-[#E6B800] text-black',
            accentColor: 'text-amber-600',
            badgeBg: 'bg-amber-100 text-amber-900',
            discount: 'Up to 25% off',
            logo: '/logos/mtn.png',
        },
        Telecel: {
            color: 'bg-[#E60000]',
            borderColor: 'border-[#E60000]',
            textColor: 'text-[#E60000]',
            hoverBg: 'hover:bg-[#E60000]/5',
            focusRing: 'focus:ring-[#E60000]/20',
            buttonColor: 'bg-[#E60000] hover:bg-[#CC0000] text-white',
            accentColor: 'text-red-600',
            badgeBg: 'bg-red-100 text-red-900',
            discount: 'Up to 20% off',
            logo: '/logos/telecel.png',
        },
        AirtelTigo: {
            color: 'bg-[#003876]',
            borderColor: 'border-[#003876]',
            textColor: 'text-[#003876]',
            hoverBg: 'hover:bg-[#003876]/5',
            focusRing: 'focus:ring-[#003876]/20',
            buttonColor: 'bg-[#003876] hover:bg-[#002D5F] text-white',
            accentColor: 'text-blue-600',
            badgeBg: 'bg-blue-100 text-blue-900',
            discount: 'Up to 30% off',
            logo: '/logos/airteltigo.png',
        },
    };

    const handleNetworkSelect = (network: Network) => {
        setSelectedNetwork(network);
        const netBundles = getBundlesForNetwork(network);
        if (netBundles.length > 0) {
            setSelectedBundle(netBundles[0]);
        }
        setCurrentStep(2);
    };

    const handleBundleSelect = (bundle: Bundle) => {
        setSelectedBundle(bundle);
        if (mode === 'grid') {
            setCurrentStep(3);
        }
    };

    const handlePayment = async () => {
        if (!selectedBundle || (activeTab === 'single' ? !phoneNumber : !bulkNumbers)) return;

        setProcessing(true);
        setMessage(null);

        try {
            const response = await api.post('/dashboard/purchase', {
                bundleId: selectedBundle.id,
                phone: activeTab === 'single' ? phoneNumber : bulkNumbers
            });

            setMessage({ type: 'success', text: response.data.message });
            setTimeout(() => {
                resetFlow();
            }, 3000);
        } catch (error: any) {
            setMessage({
                type: 'error',
                text: error.response?.data?.message || 'Payment failed. Please try again.'
            });
        } finally {
            setProcessing(false);
        }
    };

    const resetFlow = () => {
        setCurrentStep(1);
        setSelectedNetwork(null);
        setSelectedBundle(null);
        setPhoneNumber('');
        setBulkNumbers('');
        setIsRecurring(false);
        setMessage(null);
    };

    // Step Indicator Component
    const StepIndicator = () => {
        const config = selectedNetwork ? networkConfig[selectedNetwork] : null;
        const activeColor = config ? config.color : 'bg-primary';
        const activeText = config ? config.textColor : 'text-primary';
        const activeShadow = config ? (selectedNetwork === 'MTN' ? 'shadow-yellow-400/30' : selectedNetwork === 'Telecel' ? 'shadow-red-500/30' : 'shadow-blue-600/30') : 'shadow-primary/30';

        return (
            <div className="flex items-center justify-center gap-4 mb-8">
                {[
                    { num: 1, label: 'Network' },
                    { num: 2, label: 'Bundle' },
                    { num: 3, label: 'Pay' },
                ].map((step, idx) => (
                    <React.Fragment key={step.num}>
                        <div className="flex items-center gap-3">
                            <div
                                className={cn(
                                    'w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-black text-xs sm:text-sm transition-all',
                                    currentStep === step.num
                                        ? cn(activeColor, 'text-white shadow-lg', activeShadow)
                                        : currentStep > step.num
                                            ? cn(activeColor, 'bg-opacity-20', activeText)
                                            : 'bg-slate-100 dark:bg-white/5 text-slate-400'
                                )}
                            >
                                {currentStep > step.num ? (
                                    <CheckCircle2 className="w-4 h-4 sm:w-5 h-5" />
                                ) : (
                                    step.num
                                )}
                            </div>
                            <span
                                className={cn(
                                    'text-sm font-black transition-colors hidden sm:inline',
                                    currentStep === step.num
                                        ? 'text-black dark:text-white'
                                        : 'text-slate-400'
                                )}
                            >
                                {step.label}
                            </span>
                        </div>
                        {idx < 2 && (
                            <div
                                className={cn(
                                    'w-12 h-[2px] transition-colors',
                                    currentStep > step.num ? (config ? activeColor : 'bg-primary') : 'bg-slate-200 dark:bg-white/10'
                                )}
                            />
                        )}
                    </React.Fragment>
                ))}
            </div>
        );
    };

    // Network Selection View (Step 1)
    const NetworkSelection = () => (
        <div className="space-y-8">
            <div className="text-center space-y-2 sm:space-y-3">
                <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-primary/10 text-primary text-[10px] sm:text-xs font-black uppercase tracking-wider">
                    <Grid3x3 className="w-3.5 h-3.5 sm:w-4 h-4" />
                    <span>Buy Data</span>
                </div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-black dark:text-white">
                    Choose Network & Bundle
                </h1>
                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 font-medium">
                    Save up to 30% vs direct purchase
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 max-w-6xl mx-auto">
                {(Object.keys(networkConfig) as Network[]).map((network) => {
                    const config = networkConfig[network];
                    return (
                        <button
                            key={network}
                            onClick={() => handleNetworkSelect(network)}
                            className={cn(
                                'relative p-6 sm:p-8 rounded-2xl sm:rounded-3xl bg-white dark:bg-white/[0.02] border-2 transition-all group',
                                'hover:scale-[1.02] hover:shadow-2xl active:scale-[0.98]',
                                config.borderColor,
                                config.hoverBg
                            )}
                        >
                            <div className="flex flex-col items-center gap-3 sm:gap-4">
                                <div className={cn('w-16 h-16 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl flex items-center justify-center', config.color)}>
                                    <img src={config.logo} alt={network} className="w-10 h-10 sm:w-14 sm:h-14 object-contain" />
                                </div>
                                <div className="text-center">
                                    <h3 className="text-lg sm:text-xl font-black text-black dark:text-white mb-1">
                                        {network}
                                    </h3>
                                    <p className={cn('text-xs sm:text-sm font-bold', config.textColor)}>
                                        {config.discount}
                                    </p>
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );

    // Bundle Selection View (Step 2)
    const BundleSelection = () => {
        if (!selectedNetwork) return null;
        const config = networkConfig[selectedNetwork];
        const bundles = getBundlesForNetwork(selectedNetwork);

        const NormalModeView = () => (
            <div className="flex flex-col lg:flex-row gap-8 lg:max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
                {/* Main Content */}
                <div className="flex-1 space-y-10">
                    {/* Custom Header & Wallet Pill */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-5">
                            <div className={cn("w-20 h-20 rounded-[1.5rem] flex items-center justify-center shadow-2xl transition-all hover:scale-105", config.color)}>
                                <img src={config.logo} alt={selectedNetwork} className="w-12 h-12 object-contain" />
                            </div>
                            <div>
                                <h2 className="text-4xl font-black text-black dark:text-white tracking-tighter">{selectedNetwork} Data Bundle</h2>
                                <p className="text-base text-slate-500 font-bold">Purchase {selectedNetwork} data bundles for single or multiple recipients</p>
                            </div>
                        </div>
                        <div className="px-8 py-3.5 rounded-full bg-emerald-500 text-white font-black text-sm shadow-xl shadow-emerald-500/20 w-fit">
                            Wallet: GH₵ {user?.walletBalance?.toFixed(2) || '0.00'}
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-black text-black dark:text-white tracking-tight">Select {selectedNetwork} Offer</h3>
                            <button onClick={() => setCurrentStep(1)} className="text-xs font-black text-slate-400 hover:text-black dark:hover:text-white flex items-center gap-1 transition-all">
                                <ArrowLeft className="w-3 h-3" /> Change Network
                            </button>
                        </div>

                        {/* Featured Category Card */}
                        <div className={cn("inline-block p-1 rounded-[2.8rem] bg-gradient-to-br transition-all", config.color.replace('bg-', 'from-') + '/20', "to-transparent")}>
                            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 border-2 border-white dark:border-white/5 shadow-2xl relative overflow-hidden group min-w-[320px] sm:min-w-[450px]">
                                <div className={cn("absolute top-8 right-8 px-5 py-2 rounded-full text-white text-[10px] font-black shadow-lg tracking-widest uppercase", config.color, config.color === 'bg-[#FFCC00]' ? 'text-black' : 'text-white')}>
                                    Selected
                                </div>
                                <div className="flex items-start sm:items-center gap-8">
                                    <div className={cn("w-20 h-20 rounded-3xl flex items-center justify-center bg-slate-50 dark:bg-white/5 shrink-0 shadow-inner")}>
                                        <img src={config.logo} alt={selectedNetwork} className="w-10 h-10 opacity-30 grayscale" />
                                    </div>
                                    <div className="space-y-2 text-left">
                                        <h4 className="text-2xl font-black text-black dark:text-white tracking-tight">Master Beneficiary Data Bundle</h4>
                                        <p className="text-sm text-slate-500 font-bold max-w-[250px] leading-relaxed">The UP2U data bundle from the {selectedNetwork} Group Share pool.</p>
                                        <div className="flex items-center gap-5 pt-4">
                                            <span className="flex items-center gap-2 text-[10px] font-black text-slate-400"><Calendar className="w-3.5 h-3.5 stroke-[3px]" /> 30-90 Days</span>
                                            <span className="flex items-center gap-2 text-[10px] font-black text-slate-400"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 stroke-[3px]" /> Active</span>
                                            <span className="flex items-center gap-2 text-[10px] font-black text-slate-400"><List className="w-3.5 h-3.5 stroke-[3px]" /> {bundles.length} Packages</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                            <div className="flex items-center gap-3">
                                <span className="text-sm font-black text-black dark:text-white uppercase tracking-widest opacity-30">Mode</span>
                                <div className="flex p-1.5 gap-2 bg-slate-100 dark:bg-white/5 rounded-2xl">
                                    <button
                                        onClick={() => setMode('normal')}
                                        className={cn("px-6 py-2 rounded-xl text-xs font-black transition-all", mode === 'normal' ? cn(config.color, config.color === 'bg-[#FFCC00]' ? 'text-black' : 'text-white', "shadow-lg") : "text-slate-400 hover:text-slate-600")}
                                    >
                                        Normal
                                    </button>
                                    <button
                                        onClick={() => setMode('grid')}
                                        className={cn("px-6 py-2 rounded-xl text-xs font-black transition-all", mode === 'grid' ? cn(config.color, config.color === 'bg-[#FFCC00]' ? 'text-black' : 'text-white', "shadow-lg") : "text-slate-400 hover:text-slate-600")}
                                    >
                                        Grid
                                    </button>
                                </div>
                            </div>
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{bundles.length} package(s) available</div>
                        </div>

                        {/* Order Form Tabs */}
                        <div className="space-y-6">
                            <div className="relative">
                                <div className="flex gap-12 border-b border-slate-100 dark:border-white/5">
                                    {['single', 'bulk'].map((tab) => (
                                        <button
                                            key={tab}
                                            onClick={() => setActiveTab(tab as OrderTab)}
                                            className={cn(
                                                "pb-4 text-sm font-black uppercase tracking-[0.2em] transition-all relative",
                                                activeTab === tab ? "text-black dark:text-white" : "text-slate-400 hover:text-slate-600"
                                            )}
                                        >
                                            {tab} Order
                                            {activeTab === tab && (
                                                <div className={cn("absolute bottom-0 left-0 right-0 h-1 rounded-full", config.color)} />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="p-10 rounded-[3rem] bg-white dark:bg-white/[0.02] border-2 border-slate-100 dark:border-white/5 shadow-2xl space-y-10">
                                <div className="flex items-center gap-4">
                                    <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", config.color, "bg-opacity-20")}>
                                        {activeTab === 'single' ? <Zap className={cn("w-6 h-6", config.textColor)} /> : <Users className={cn("w-6 h-6", config.textColor)} />}
                                    </div>
                                    <h4 className="text-2xl font-black text-black dark:text-white tracking-tight capitalize">{activeTab} Order</h4>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 text-left">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Recipient Phone Number</label>
                                        {activeTab === 'single' ? (
                                            <input
                                                type="tel"
                                                value={phoneNumber}
                                                onChange={(e) => setPhoneNumber(e.target.value)}
                                                placeholder="024 123 4567"
                                                className="w-full px-8 py-5 rounded-2xl bg-slate-50 dark:bg-black/20 border-2 border-transparent focus:border-slate-200 dark:focus:border-white/20 outline-none transition-all font-black text-lg"
                                            />
                                        ) : (
                                            <textarea
                                                value={bulkNumbers}
                                                onChange={(e) => setBulkNumbers(e.target.value)}
                                                placeholder="0241234567&#10;0551234567"
                                                rows={3}
                                                className="w-full px-8 py-5 rounded-2xl bg-slate-50 dark:bg-black/20 border-2 border-transparent focus:border-slate-200 dark:focus:border-white/20 outline-none transition-all font-black text-lg resize-none"
                                            />
                                        )}
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Package</label>
                                        <div className="relative group">
                                            <select
                                                value={selectedBundle?.id}
                                                onChange={(e) => setSelectedBundle(bundles.find(b => b.id === e.target.value) || null)}
                                                className="w-full px-8 py-5 rounded-2xl bg-slate-50 dark:bg-black/20 border-2 border-transparent focus:border-slate-200 dark:focus:border-white/20 outline-none transition-all font-black text-lg appearance-none cursor-pointer"
                                            >
                                                {bundles.map(b => (
                                                    <option key={b.id} value={b.id}>{b.data} Plan - GH₵ {b.price.toFixed(2)}</option>
                                                ))}
                                            </select>
                                            <ChevronRight className="absolute right-6 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400 rotate-90 pointer-events-none transition-transform group-hover:translate-x-1" />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 ml-1 group cursor-pointer w-fit" onClick={() => setIsRecurring(!isRecurring)}>
                                    <div className={cn(
                                        "w-7 h-7 rounded-lg border-2 transition-all flex items-center justify-center",
                                        isRecurring ? cn(config.color, config.borderColor) : "border-slate-200 dark:border-white/10"
                                    )}>
                                        {isRecurring && <CheckCircle2 className={cn("w-5 h-5", config.color === 'bg-[#FFCC00]' ? 'text-black' : 'text-white')} />}
                                    </div>
                                    <label className="text-sm font-black text-slate-500 group-hover:text-black dark:group-hover:text-white transition-colors cursor-pointer flex items-center gap-2">
                                        <Calendar className="w-4 h-4" /> Make this a recurring order
                                    </label>
                                </div>

                                <button
                                    onClick={handlePayment}
                                    disabled={processing || !selectedBundle || (activeTab === 'single' ? !phoneNumber : !bulkNumbers)}
                                    className={cn(
                                        "w-full py-6 rounded-[2rem] font-black text-white shadow-2xl transition-all flex items-center justify-center gap-3 text-lg uppercase tracking-widest",
                                        config.color, config.color === 'bg-[#FFCC00]' ? 'text-black' : 'text-white',
                                        "hover:shadow-2xl hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
                                    )}
                                >
                                    {processing ? <Loader2 className="w-6 h-6 animate-spin" /> : <span>Place Order</span>}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar - Recurring Orders */}
                <div className="hidden lg:block w-96 space-y-6">
                    <div className="p-10 rounded-[3rem] bg-white dark:bg-white/[0.02] border-2 border-slate-100 dark:border-white/5 shadow-2xl relative overflow-hidden">
                        <div className="flex items-center justify-between mb-10">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                                    <Calendar className="w-7 h-7 text-blue-500" />
                                </div>
                                <h4 className="text-xl font-black text-black dark:text-white tracking-tight">Recurring Orders</h4>
                            </div>
                            <span className="px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-600 text-[10px] font-black">0 active</span>
                        </div>
                        <div className="text-center py-12 px-6">
                            <div className="w-24 h-24 rounded-full bg-slate-50 dark:bg-white/5 flex items-center justify-center mx-auto mb-8 shadow-inner">
                                <Zap className="w-12 h-12 text-slate-300" />
                            </div>
                            <h5 className="text-2xl font-black text-black dark:text-white mb-4">No recurring orders yet</h5>
                            <p className="text-sm text-slate-500 font-bold leading-relaxed">
                                Set up recurring orders to automate your {selectedNetwork} data purchases and never run out of data again.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );

        const GridModeView = () => (
            <div className="space-y-6 animate-in fade-in zoom-in duration-500">
                {/* Existing Grid Mode Header */}
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-3 sm:gap-4">
                        <button onClick={() => setCurrentStep(1)} className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors">
                            <ArrowLeft className="w-4 h-4 sm:w-5 h-5" />
                        </button>
                        <div className="flex items-center gap-2 sm:gap-3">
                            <div className={cn('w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg', config.color)}>
                                <img src={config.logo} alt={selectedNetwork} className="w-6 h-6 sm:w-8 sm:h-8 object-contain" />
                            </div>
                            <div>
                                <h2 className="text-lg sm:text-xl font-black text-black dark:text-white">{selectedNetwork} Offer</h2>
                                <p className="text-[10px] sm:text-sm text-slate-600 dark:text-slate-400 font-medium">Choose a bundle to continue</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex p-1 gap-1.5 bg-slate-100 dark:bg-white/5 rounded-xl">
                            <button onClick={() => setMode('normal')} className="px-4 py-2 rounded-lg text-xs font-black transition-all text-slate-400 hover:text-slate-600">Normal</button>
                            <button onClick={() => setMode('grid')} className={cn("px-4 py-2 rounded-lg text-xs font-black transition-all", config.color, config.color === 'bg-[#FFCC00]' ? 'text-black' : 'text-white', "shadow-md")}>Grid</button>
                        </div>
                        <div className={cn("flex items-center gap-2 sm:gap-3 px-3 sm:px-5 py-2 sm:py-3 rounded-xl sm:rounded-2xl border transition-all", config.color, "bg-opacity-10", config.borderColor, "border-opacity-30")}>
                            <Wallet className={cn("w-4 h-4 sm:w-5 h-5", config.textColor)} />
                            <p className={cn("text-sm sm:text-lg font-black", config.textColor)}>GH₵ {user?.walletBalance?.toFixed(2) || '0.00'}</p>
                        </div>
                    </div>
                </div>

                <div className={cn('grid gap-3 sm:gap-6', 'grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4')}>
                    {loading ? (
                        [1, 2, 3, 4].map(i => <div key={i} className="h-48 rounded-3xl bg-slate-100 dark:bg-white/5 animate-pulse" />)
                    ) : bundles.length === 0 ? (
                        <div className="col-span-full py-12 text-center opacity-40 font-black">NO OFFERS AVAILABLE</div>
                    ) : bundles.map((bundle) => (
                        <div key={bundle.id} className={cn('relative p-6 rounded-[2rem] bg-white dark:bg-white/[0.02] border-2 transition-all text-left group flex flex-col', 'hover:shadow-2xl active:scale-[0.98]', 'border-slate-200 dark:border-white/10', config.borderColor, "border-opacity-0 hover:border-opacity-100")}>
                            {bundle.popular && <div className={cn("absolute -top-3 -right-2 px-4 py-1.5 rounded-full text-white text-[10px] font-black shadow-lg", selectedNetwork === 'MTN' ? 'bg-amber-500' : config.color)}>POPULAR</div>}
                            <div className="flex-1 space-y-4">
                                <div>
                                    <div className={cn('inline-flex px-3 py-1 rounded-lg mb-3 text-[10px] font-black tracking-widest uppercase', config.badgeBg)}>{selectedNetwork}</div>
                                    <h4 className="text-3xl font-black text-black dark:text-white tracking-tighter">{bundle.data}</h4>
                                    <p className="text-sm text-slate-500 font-bold">{bundle.validity}</p>
                                </div>
                                <div className="space-y-1">
                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Price</div>
                                    <div className="flex items-baseline gap-2">
                                        <span className={cn('text-2xl font-black', config.textColor)}>GH₵ {bundle.price.toFixed(2)}</span>
                                        {bundle.discount && <span className="text-sm text-slate-400 line-through font-bold">GH₵ {(bundle.price + bundle.discount).toFixed(2)}</span>}
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => handleBundleSelect(bundle)} className={cn("mt-6 w-full py-3.5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-lg shadow-black/5", config.buttonColor, "hover:scale-[1.02] active:scale-[0.98]")}>Select Plan</button>
                        </div>
                    ))}
                </div>
            </div>
        );

        return mode === 'normal' ? <NormalModeView /> : <GridModeView />;
    };

    // Payment View (Step 3) - Only used in Grid Mode
    const PaymentView = () => {
        if (!selectedBundle || !selectedNetwork) return null;
        const config = networkConfig[selectedNetwork];

        return (
            <div className="max-w-xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="p-8 sm:p-12 rounded-[3rem] bg-white dark:bg-white/[0.02] border-2 border-slate-100 dark:border-white/5 shadow-2xl relative overflow-hidden">
                    <div className={cn("absolute top-0 left-0 right-0 h-2", config.color)} />

                    <div className="flex flex-col items-center text-center gap-6">
                        <div className={cn("w-20 h-20 rounded-3xl flex items-center justify-center shadow-2xl", config.color)}>
                            <img src={config.logo} alt={selectedNetwork} className="w-12 h-12 object-contain" />
                        </div>
                        <div>
                            <h3 className="text-3xl font-black text-black dark:text-white tracking-tight">Confirm Purchase</h3>
                            <p className="text-slate-500 font-bold mt-1">Review your order details below</p>
                        </div>
                    </div>

                    <div className="mt-10 p-8 rounded-3xl bg-slate-50 dark:bg-black/20 border-2 border-slate-100 dark:border-white/5 space-y-6">
                        <div className="flex justify-between items-center group">
                            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Network</span>
                            <span className={cn("text-sm font-black transition-colors", config.textColor)}>{selectedNetwork} Network</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Data Amount</span>
                            <span className="text-lg font-black text-black dark:text-white">{selectedBundle.data}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Validity</span>
                            <span className="text-sm font-black text-slate-600 dark:text-slate-300">{selectedBundle.validity}</span>
                        </div>
                        <div className="pt-6 border-t border-slate-200 dark:border-white/5 flex justify-between items-center">
                            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Total Price</span>
                            <span className={cn("text-3xl font-black", config.textColor)}>GH₵ {selectedBundle.price.toFixed(2)}</span>
                        </div>
                    </div>

                    <div className="mt-10 space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Recipient Phone Number</label>
                            <div className="relative">
                                <input
                                    type="tel"
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                    placeholder="Enter recipient number"
                                    className="w-full px-8 py-5 rounded-2xl bg-slate-50 dark:bg-black/20 border-2 border-transparent focus:border-slate-200 dark:focus:border-white/20 outline-none transition-all font-black text-lg"
                                />
                                <div className={cn("absolute right-6 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center bg-opacity-10", config.color)}>
                                    <Zap className={cn("w-4 h-4", config.textColor)} />
                                </div>
                            </div>
                        </div>

                        <div className="flex p-4 rounded-2xl bg-blue-500/5 border-2 border-blue-500/10 gap-4">
                            <Info className="w-6 h-6 text-blue-500 shrink-0" />
                            <p className="text-xs text-blue-700 dark:text-blue-300 font-bold leading-relaxed">
                                Please double check the number. Data purchases are processed instantly and usually cannot be reversed.
                            </p>
                        </div>

                        <button
                            onClick={handlePayment}
                            disabled={processing || !phoneNumber}
                            className={cn(
                                "w-full py-6 rounded-3xl font-black text-white shadow-2xl transition-all flex items-center justify-center gap-3 text-lg uppercase tracking-[0.2em]",
                                config.color, config.color === 'bg-[#FFCC00]' ? 'text-black' : 'text-white',
                                "hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                            )}
                        >
                            {processing ? <Loader2 className="w-6 h-6 animate-spin" /> : <span>Complete Purchase</span>}
                        </button>

                        <button
                            onClick={() => setCurrentStep(2)}
                            className="w-full py-4 rounded-2xl text-slate-400 hover:text-slate-600 font-black text-xs uppercase tracking-widest transition-all"
                        >
                            Go Back
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen pb-20 pt-4 sm:pt-8 bg-slate-50 dark:bg-black">
            <div className="container mx-auto px-4 max-w-7xl">
                {/* Dashboard Navigation */}
                <div className="flex items-center justify-between mb-12">
                    <button
                        onClick={resetFlow}
                        className="flex items-center gap-3 text-slate-500 hover:text-black dark:hover:text-white transition-all group"
                    >
                        <div className="w-10 h-10 rounded-xl bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 flex items-center justify-center group-hover:bg-slate-50">
                            <ArrowLeft className="w-5 h-5" />
                        </div>
                        <span className="font-black text-xs uppercase tracking-widest">Back to Dashboard</span>
                    </button>
                    <div className="hidden lg:block">
                        <StepIndicator />
                    </div>
                </div>

                {/* Status Messages */}
                {message && (
                    <div className={cn(
                        "max-w-xl mx-auto mb-8 p-6 rounded-3xl border-2 flex items-center gap-4 animate-in zoom-in slide-in-from-top-4 duration-500",
                        message.type === 'success' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600" : "bg-red-500/10 border-red-500/20 text-red-600"
                    )}>
                        {message.type === 'success' ? <CheckCircle2 className="w-8 h-8 shrink-0" /> : <XCircle className="w-8 h-8 shrink-0" />}
                        <p className="font-black tracking-tight">{message.text}</p>
                    </div>
                )}

                {/* Main Views */}
                {currentStep === 1 && <NetworkSelection />}
                {currentStep === 2 && <BundleSelection />}
                {currentStep === 3 && <PaymentView />}
            </div>
        </div>
    );
};

export default DataBundles;
