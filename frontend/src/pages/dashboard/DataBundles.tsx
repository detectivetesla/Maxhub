import React, { useState } from 'react';
import { ArrowLeft, Wallet, Grid3x3, List, CheckCircle2, Loader2, XCircle } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/utils/cn';
import Button from '@/components/Button';

type Network = 'MTN' | 'Telecel' | 'AirtelTigo';
type PurchaseMode = 'normal' | 'grid';
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
    const [mode, setMode] = useState<PurchaseMode>('grid');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [paymentMethod, _] = useState<'wallet'>('wallet');
    const [allBundles, setAllBundles] = useState<Bundle[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    React.useEffect(() => {
        const fetchBundles = async () => {
            try {
                const response = await axios.get('http://localhost:5000/admin/bundles');
                // Map API price_ghc to price field
                const formattedBundles = response.data.bundles.map((b: any) => ({
                    ...b,
                    price: Number(b.price_ghc),
                    data: b.data_amount,
                    validity: '30 Days' // Default validity
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
            discount: 'Up to 25% off',
            logo: '/logos/mtn.png',
        },
        Telecel: {
            color: 'bg-[#E60000]',
            borderColor: 'border-[#E60000]',
            textColor: 'text-[#E60000]',
            hoverBg: 'hover:bg-[#E60000]/5',
            focusRing: 'focus:ring-[#E60000]/20',
            discount: 'Up to 20% off',
            logo: '/logos/telecel.png',
        },
        AirtelTigo: {
            color: 'bg-[#003876]',
            borderColor: 'border-[#003876]',
            textColor: 'text-[#003876]',
            hoverBg: 'hover:bg-[#003876]/5',
            focusRing: 'focus:ring-[#003876]/20',
            discount: 'Up to 30% off',
            logo: '/logos/airteltigo.png',
        },
    };

    const handleNetworkSelect = (network: Network) => {
        setSelectedNetwork(network);
        setCurrentStep(2);
    };

    const handleBundleSelect = (bundle: Bundle) => {
        setSelectedBundle(bundle);
        setCurrentStep(3);
    };

    const handlePayment = async () => {
        if (!selectedBundle || !phoneNumber) return;

        setProcessing(true);
        setMessage(null);

        try {
            const token = localStorage.getItem('token');
            const response = await axios.post('http://localhost:5000/dashboard/purchase', {
                bundleId: selectedBundle.id,
                phone: phoneNumber
            }, {
                headers: { Authorization: `Bearer ${token}` }
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
        setMessage(null);
    };

    // Step Indicator Component
    const StepIndicator = () => (
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
                                    ? 'bg-primary text-white shadow-lg shadow-primary/30'
                                    : currentStep > step.num
                                        ? 'bg-primary/20 text-primary'
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
                                currentStep > step.num ? 'bg-primary' : 'bg-slate-200 dark:bg-white/10'
                            )}
                        />
                    )}
                </React.Fragment>
            ))}
        </div>
    );

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

        return (
            <div className="space-y-6">
                {/* Header with Network Info and Wallet */}
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-3 sm:gap-4">
                        <button
                            onClick={() => setCurrentStep(1)}
                            className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4 sm:w-5 h-5" />
                        </button>
                        <div className="flex items-center gap-2 sm:gap-3">
                            <div className={cn('w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center', config.color)}>
                                <img src={config.logo} alt={selectedNetwork} className="w-6 h-6 sm:w-8 sm:h-8 object-contain" />
                            </div>
                            <div>
                                <h2 className="text-lg sm:text-xl font-black text-black dark:text-white">
                                    {selectedNetwork} Offer
                                </h2>
                                <p className="text-[10px] sm:text-sm text-slate-600 dark:text-slate-400 font-medium">
                                    Choose a bundle to continue
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-5 py-2 sm:py-3 rounded-xl sm:rounded-2xl bg-primary/10 border border-primary/20">
                        <Wallet className="w-4 h-4 sm:w-5 h-5 text-primary" />
                        <div className="text-left">
                            <p className="text-[10px] sm:text-xs font-bold text-slate-600 dark:text-slate-400">Balance</p>
                            <p className="text-sm sm:text-lg font-black text-primary">
                                GH₵ {user?.walletBalance?.toFixed(2) || '0.00'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Mode Toggle */}
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <h3 className="text-lg font-black text-black dark:text-white">
                        Select {selectedNetwork} Offer
                    </h3>
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-600 dark:text-slate-400 mr-2">Mode:</span>
                        <div className="flex gap-2 p-1 rounded-xl bg-slate-100 dark:bg-white/5">
                            <button
                                onClick={() => setMode('normal')}
                                className={cn(
                                    'px-4 py-2 rounded-lg text-sm font-black transition-all flex items-center gap-2',
                                    mode === 'normal'
                                        ? 'bg-white dark:bg-white/10 text-black dark:text-white shadow-md'
                                        : 'text-slate-600 dark:text-slate-400 hover:text-black dark:hover:text-white'
                                )}
                            >
                                <List className="w-4 h-4" />
                                <span className="hidden sm:inline">Normal</span>
                            </button>
                            <button
                                onClick={() => setMode('grid')}
                                className={cn(
                                    'px-4 py-2 rounded-lg text-sm font-black transition-all flex items-center gap-2',
                                    mode === 'grid'
                                        ? 'bg-white dark:bg-white/10 text-black dark:text-white shadow-md'
                                        : 'text-slate-600 dark:text-slate-400 hover:text-black dark:hover:text-white'
                                )}
                            >
                                <Grid3x3 className="w-4 h-4" />
                                <span className="hidden sm:inline">Grid</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Bundles Grid */}
                <div className={cn(
                    'grid gap-3 sm:gap-4',
                    mode === 'grid'
                        ? 'grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
                        : 'grid-cols-1 max-w-4xl'
                )}>
                    {loading ? (
                        [1, 2, 3, 4].map(i => (
                            <div key={i} className="h-32 rounded-2xl bg-slate-100 dark:bg-white/5 animate-pulse" />
                        ))
                    ) : bundles.length === 0 ? (
                        <div className="col-span-full py-12 text-center opacity-40 font-black">
                            NO OFFERS AVAILABLE
                        </div>
                    ) : bundles.map((bundle) => (
                        <button
                            key={bundle.id}
                            onClick={() => handleBundleSelect(bundle)}
                            className={cn(
                                'relative p-6 rounded-2xl bg-white dark:bg-white/[0.02] border-2 transition-all text-left group',
                                'hover:scale-[1.02] hover:shadow-xl active:scale-[0.98]',
                                'border-slate-200 dark:border-white/10',
                                config.hoverBg
                            )}
                        >
                            {bundle.popular && (
                                <div className="absolute -top-2 -right-2 px-3 py-1 rounded-full bg-primary text-white text-xs font-black shadow-lg">
                                    POPULAR
                                </div>
                            )}
                            <div className={cn('inline-flex px-3 py-1 rounded-lg mb-3 text-xs font-black', config.color, 'text-black')}>
                                {selectedNetwork}
                            </div>
                            <div className="space-y-2">
                                <h4 className="text-2xl font-black text-black dark:text-white">{bundle.data}</h4>
                                <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">{bundle.validity}</p>
                                <div className="flex items-baseline gap-2">
                                    <span className={cn('text-xl font-black', config.textColor)}>
                                        GH₵ {bundle.price.toFixed(2)}
                                    </span>
                                    {bundle.discount && (
                                        <span className="text-xs text-slate-500 line-through">
                                            GH₵ {(bundle.price + bundle.discount).toFixed(2)}
                                        </span>
                                    )}
                                </div>
                                {bundle.discount && (
                                    <p className="text-xs font-bold text-primary">
                                        ✓ Save GH₵ {bundle.discount.toFixed(2)}
                                    </p>
                                )}
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        );
    };

    // Payment View (Step 3)
    const PaymentView = () => {
        if (!selectedBundle || !selectedNetwork) return null;
        const config = networkConfig[selectedNetwork];

        return (
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setCurrentStep(2)}
                        disabled={processing}
                        className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors disabled:opacity-50"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h2 className="text-2xl font-black text-black dark:text-white">Complete Purchase</h2>
                </div>

                {message && (
                    <div className={cn(
                        "p-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2",
                        message.type === 'success' ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" : "bg-red-500/10 text-red-600 border border-red-500/20"
                    )}>
                        {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                        <p className="font-bold text-sm">{message.text}</p>
                    </div>
                )}

                {/* Bundle Summary */}
                <div className="p-6 rounded-2xl bg-white dark:bg-white/[0.02] border-2 border-slate-200 dark:border-white/10">
                    <h3 className="text-sm font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-4">
                        Bundle Summary
                    </h3>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', config.color)}>
                                <img src={config.logo} alt={selectedNetwork} className="w-8 h-8 object-contain" />
                            </div>
                            <div>
                                <p className="font-black text-black dark:text-white">{selectedNetwork} {selectedBundle.data}</p>
                                <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">{selectedBundle.validity}</p>
                            </div>
                        </div>
                        <p className={cn('text-2xl font-black', config.textColor)}>
                            GH₵ {selectedBundle.price.toFixed(2)}
                        </p>
                    </div>
                </div>

                {/* Recipient Phone Number */}
                <div className="p-6 rounded-2xl bg-white dark:bg-white/[0.02] border-2 border-slate-200 dark:border-white/10 space-y-4">
                    <h3 className="text-sm font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                        Recipient Information
                    </h3>
                    <div>
                        <label className="text-sm font-bold text-black dark:text-white block mb-2">
                            Phone Number
                        </label>
                        <input
                            type="tel"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            placeholder="024 123 4567"
                            disabled={processing}
                            className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all text-black dark:text-white disabled:opacity-50"
                        />
                    </div>
                </div>

                {/* Payment Method */}
                <div className="p-6 rounded-2xl bg-white dark:bg-white/[0.02] border-2 border-slate-200 dark:border-white/10 space-y-4">
                    <h3 className="text-sm font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                        Payment Method
                    </h3>
                    <div className="space-y-3">
                        <div className="w-full p-4 rounded-xl border-2 border-primary bg-primary/5 transition-all text-left">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Wallet className="w-5 h-5 text-primary" />
                                    <div>
                                        <p className="font-black text-black dark:text-white">Wallet Balance</p>
                                        <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                                            Balance: GH₵ {user?.walletBalance?.toFixed(2) || '0.00'}
                                        </p>
                                    </div>
                                </div>
                                <CheckCircle2 className="w-5 h-5 text-primary" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Purchase Button */}
                <Button
                    onClick={handlePayment}
                    disabled={!phoneNumber || processing}
                    className="w-full py-4 text-lg font-black rounded-2xl flex items-center justify-center gap-2"
                >
                    {processing ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>Processing...</span>
                        </>
                    ) : (
                        <span>Complete Purchase - GH₵ {selectedBundle.price.toFixed(2)}</span>
                    )}
                </Button>

                <p className="text-center text-sm text-slate-500 dark:text-slate-400 font-medium">
                    By completing this purchase, you agree to our terms and conditions
                </p>
            </div>
        );
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <StepIndicator />

            {currentStep === 1 && <NetworkSelection />}
            {currentStep === 2 && <BundleSelection />}
            {currentStep === 3 && <PaymentView />}
        </div>
    );
};

export default DataBundles;
