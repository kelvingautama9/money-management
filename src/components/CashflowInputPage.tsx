import React, { useState } from 'react';
import { GlassContainer } from './GlassContainer';
import { GlassButton } from './GlassButton';
import {
  Transaction,
  GlassSettings,
  TransactionType
} from '../types';
import {
  AVAILABLE_CATEGORIES,
  AVAILABLE_ACCOUNTS
} from '../data/initialData';
import { formatRupiah } from '../lib/sheetsApi';
import { triggerHaptic } from '../lib/haptics';
import {
  PlusCircle,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowRightLeft,
  CheckCircle2,
  Calendar,
  Wallet,
  Sparkles,
  Zap,
  Film,
  Compass,
  Heart,
  ShoppingBag,
  DollarSign,
  Coffee,
  HelpCircle,
  Layers,
  Send,
  RefreshCw,
  Clock
} from 'lucide-react';

interface CashflowInputPageProps {
  settings: GlassSettings;
  onAddTransaction: (tx: Omit<Transaction, 'id'>, autoSync: boolean) => Promise<void>;
  transactions: Transaction[];
  isSyncing?: boolean;
  isGoogleConnected: boolean;
  onNavigateToJournal: () => void;
  currentSheetName?: string;
  onSelectMonth?: (month: string) => void;
  availableSheets?: string[];
}

export const CashflowInputPage: React.FC<CashflowInputPageProps> = ({
  settings,
  onAddTransaction,
  transactions,
  isSyncing = false,
  isGoogleConnected,
  onNavigateToJournal,
  currentSheetName = 'September',
  onSelectMonth,
  availableSheets = []
}) => {
  // Form state
  const [selectedType, setSelectedType] = useState<TransactionType>('Expense');
  const [selectedCategory, setSelectedCategory] = useState<string>('Jajan');
  const [selectedAccount, setSelectedAccount] = useState<string>('Bank BCA');
  const [bulan, setBulan] = useState<string>(currentSheetName);
  const [nominal, setNominal] = useState<string>('');
  const [catatan, setCatatan] = useState<string>('');
  const [autoSyncToSheets, setAutoSyncToSheets] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Synchronize bulan state when currentSheetName changes
  React.useEffect(() => {
    if (currentSheetName) {
      setBulan(currentSheetName);
    }
  }, [currentSheetName]);

  // Quick Amount chips
  const quickAmounts = [10000, 25000, 50000, 100000, 250000, 500000, 1000000, 2000000];

  const handleAddQuickAmount = (val: number) => {
    triggerHaptic('light');
    const current = parseFloat(nominal.replace(/[^0-9.-]/g, '')) || 0;
    setNominal((current + val).toString());
  };

  const getCategoryIcon = (kat: string) => {
    switch (kat) {
      case 'Salary':
        return <DollarSign className="w-4 h-4 text-emerald-400" />;
      case 'Listrik':
        return <Zap className="w-4 h-4 text-amber-400" />;
      case 'Entertainment':
        return <Film className="w-4 h-4 text-purple-400" />;
      case 'Transport':
        return <Compass className="w-4 h-4 text-cyan-400" />;
      case 'Dating':
        return <Heart className="w-4 h-4 text-pink-400" />;
      case 'Jajan':
        return <Coffee className="w-4 h-4 text-rose-400" />;
      case 'Uang Bulanan':
        return <ShoppingBag className="w-4 h-4 text-blue-400" />;
      case 'Transfer Internal':
        return <ArrowRightLeft className="w-4 h-4 text-indigo-400" />;
      default:
        return <Wallet className="w-4 h-4 text-slate-400" />;
    }
  };

  // Smart auto account match when category changes
  const handleSelectCategory = (kat: string) => {
    triggerHaptic('selection');
    setSelectedCategory(kat);
    if (kat === 'Listrik') setSelectedAccount('Allo Bank');
    else if (kat === 'Transport') setSelectedAccount('Jago-Transport');
    else if (kat === 'Entertainment') setSelectedAccount('Jago-Entertainment');
    else if (kat === 'Dating') setSelectedAccount('Blu BCA - Date');
    else if (kat === 'Salary') {
      setSelectedAccount('Bank BCA');
      setSelectedType('Income');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(nominal.replace(/[^0-9.-]/g, ''));
    if (isNaN(amount) || amount <= 0) {
      triggerHaptic('warning');
      alert('Mohon masukkan nominal angka yang valid.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onAddTransaction(
        {
          bulan,
          kategori: selectedCategory,
          akun: selectedAccount,
          tipe: selectedType,
          jumlah: amount,
          catatan: catatan || `${selectedCategory} (${selectedAccount})`
        },
        autoSyncToSheets
      );

      triggerHaptic('success');
      setSuccessMessage(
        `Sukses merekam transaksi ${formatRupiah(amount)} ke pos "${selectedCategory}"! ${
          isGoogleConnected && autoSyncToSheets
            ? 'Otomatis tersinkron ke rekapan Google Sheet.'
            : ''
        }`
      );

      // Reset form fields
      setNominal('');
      setCatatan('');
      setTimeout(() => setSuccessMessage(null), 6000);
    } catch (err: any) {
      triggerHaptic('error');
      alert(`Gagal menyimpan: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 5 newest transactions
  const recentTransactions = transactions.slice(0, 5);

  const numericNominal = parseFloat(nominal.replace(/[^0-9.-]/g, '')) || 0;

  return (
    <div className="space-y-6">
      {/* Top Banner Alert */}
      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-between text-xs text-emerald-200 animate-in fade-in duration-300 shadow-xl">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="font-medium leading-relaxed">{successMessage}</span>
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-300 hover:text-white px-2 py-1 rounded-lg hover:bg-emerald-500/20"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Main Grid: Input Form on Left, Live Preview & Recent Stream on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Form: 8 cols */}
        <div className="lg:col-span-8">
          <GlassContainer settings={settings} className="p-6 sm:p-8 relative">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-white/10">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-md">
                    <PlusCircle className="w-4 h-4" />
                  </div>
                  <h2 className="text-xl font-black text-white tracking-tight">
                    Input Rekap Pengeluaran & Pemasukan
                  </h2>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Catat transaksi harian langsung ke pos kategori dan rekening sesuai struktur Google Sheet Anda
                </p>
              </div>

              {/* Status Sync Badge */}
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${
                    isGoogleConnected
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isGoogleConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                    }`}
                  />
                  {isGoogleConnected ? 'Sync Sheets Aktif' : 'Tersimpan Lokal'}
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-6">
              {/* 1. Transaction Type Toggle */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2">
                  1. Tipe Transaksi
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(
                    [
                      { id: 'Expense', label: 'Pengeluaran', icon: <ArrowDownLeft className="w-4 h-4 text-rose-400" /> },
                      { id: 'Income', label: 'Pemasukan', icon: <ArrowUpRight className="w-4 h-4 text-emerald-400" /> },
                      { id: 'Transfer Keluar', label: 'Transfer Keluar', icon: <ArrowRightLeft className="w-4 h-4 text-amber-400" /> },
                      { id: 'Transfer Masuk', label: 'Transfer Masuk', icon: <ArrowRightLeft className="w-4 h-4 text-sky-400" /> }
                    ] as const
                  ).map((item) => {
                    const isSelected = selectedType === item.id;
                    return (
                      <button
                        type="button"
                        key={item.id}
                        onClick={() => {
                          triggerHaptic('selection');
                          setSelectedType(item.id);
                        }}
                        className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all duration-200 border ${
                          isSelected
                            ? 'bg-white/15 text-white border-white/40 shadow-lg scale-[1.02]'
                            : 'bg-white/[0.03] text-slate-400 border-white/5 hover:bg-white/[0.08] hover:text-slate-200'
                        }`}
                      >
                        {item.icon}
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Category Selector */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
                    2. Masukkan ke Kategori Apa? (Sesuai Google Sheet)
                  </label>
                  <span className="text-[11px] text-sky-300 font-medium">
                    Terpilih: <strong>{selectedCategory}</strong>
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {AVAILABLE_CATEGORIES.map((kat) => {
                    const isSelected = selectedCategory === kat;
                    return (
                      <button
                        type="button"
                        key={kat}
                        onClick={() => handleSelectCategory(kat)}
                        className={`flex items-center gap-2 p-2.5 rounded-xl text-xs text-left transition-all border ${
                          isSelected
                            ? 'bg-blue-600/30 text-white border-blue-400/50 shadow-md scale-[1.02]'
                            : 'bg-white/[0.03] text-slate-300 border-white/5 hover:bg-white/[0.08]'
                        }`}
                      >
                        <div className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                          {getCategoryIcon(kat)}
                        </div>
                        <span className="truncate font-medium">{kat}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Account Selector */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
                    3. Dari / Ke Rekening Mana?
                  </label>
                  <span className="text-[11px] text-purple-300 font-medium">
                    Akun: <strong>{selectedAccount}</strong>
                  </span>
                </div>
                <select
                  value={selectedAccount}
                  onChange={(e) => setSelectedAccount(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl text-xs liquid-glass-input"
                >
                  {AVAILABLE_ACCOUNTS.map((acc) => (
                    <option key={acc} value={acc} className="bg-slate-900 text-white">
                      {acc}
                    </option>
                  ))}
                </select>
              </div>

              {/* 4. Nominal Input & Quick Chips */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2">
                  4. Nominal Transaksi (Rp)
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-3 text-slate-400 font-bold text-sm">Rp</div>
                  <input
                    type="number"
                    required
                    placeholder="0"
                    value={nominal}
                    onChange={(e) => setNominal(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 rounded-2xl text-lg sm:text-xl liquid-glass-input font-mono font-bold tracking-tight"
                  />
                  {numericNominal > 0 && (
                    <div className="absolute right-4 top-3.5 text-xs text-emerald-400 font-semibold">
                      {formatRupiah(numericNominal)}
                    </div>
                  )}
                </div>

                {/* Quick Add Chips */}
                <div className="flex flex-wrap gap-1.5 mt-2.5">
                  <span className="text-[11px] text-slate-400 self-center mr-1">Cepat:</span>
                  {quickAmounts.map((amt) => (
                    <button
                      type="button"
                      key={amt}
                      onClick={() => handleAddQuickAmount(amt)}
                      className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white text-[11px] font-mono border border-white/10 transition active:scale-95"
                    >
                      +{amt >= 1000000 ? `${amt / 1000000} Jt` : `${amt / 1000}K`}
                    </button>
                  ))}
                  {numericNominal > 0 && (
                    <button
                      type="button"
                      onClick={() => setNominal('')}
                      className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/25 text-rose-300 text-[11px] border border-rose-500/20 transition"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>

              {/* 5. Bulan & Catatan */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2">
                    5. Periode Bulan
                  </label>
                  <input
                    type="text"
                    required
                    value={bulan}
                    onChange={(e) => setBulan(e.target.value)}
                    placeholder="September"
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs liquid-glass-input"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2">
                    6. Catatan / Keterangan Spesifik
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Kopi Kenangan, Beli Bensin, Makan Malam..."
                    value={catatan}
                    onChange={(e) => setCatatan(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs liquid-glass-input"
                  />
                </div>
              </div>

              {/* Real-time Dynamic Impact Preview */}
              {numericNominal > 0 && (
                <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-400/30 text-xs text-blue-200">
                  <div className="flex items-center gap-2 font-bold text-blue-300 mb-1">
                    <Sparkles className="w-4 h-4" />
                    Simulasi Dampak Transaksi:
                  </div>
                  <p>
                    Transaksi ini akan{' '}
                    <strong className="text-white">
                      {selectedType === 'Expense' || selectedType === 'Transfer Keluar'
                        ? 'mengurangi saldo'
                        : 'menambah saldo'}
                    </strong>{' '}
                    pada rekening <strong className="text-emerald-300">{selectedAccount}</strong> sebesar{' '}
                    <strong className="text-white">{formatRupiah(numericNominal)}</strong>, dan dicatat pada pos{' '}
                    <strong className="text-sky-300">"{selectedCategory}"</strong>.
                  </p>
                </div>
              )}

              {/* Auto Sync Toggle & Submit Button */}
              <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                <label className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-300 select-none">
                  <input
                    type="checkbox"
                    checked={autoSyncToSheets}
                    onChange={(e) => setAutoSyncToSheets(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-500 focus:ring-0 cursor-pointer accent-blue-500"
                  />
                  <span>Otomatis sinkronkan dan tambahkan ke baris Google Sheet</span>
                </label>

                <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                  <GlassButton
                    type="submit"
                    variant="primary"
                    size="md"
                    disabled={isSubmitting || numericNominal <= 0}
                    settings={settings}
                    icon={
                      isSubmitting ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )
                    }
                  >
                    {isSubmitting ? 'Menyinkronkan...' : 'Simpan & Rekap Transaksi'}
                  </GlassButton>
                </div>
              </div>
            </form>
          </GlassContainer>
        </div>

        {/* Right Stream: 4 cols */}
        <div className="lg:col-span-4 space-y-5">
          {/* Quick Context Card */}
          <GlassContainer settings={settings} className="p-5">
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-sky-400" />
              Aliran Transaksi Terbaru
            </h3>

            <div className="space-y-2.5">
              {recentTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="p-3 rounded-xl bg-white/[0.03] border border-white/5 hover:border-white/15 transition flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                      {getCategoryIcon(tx.kategori)}
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-semibold text-white block truncate">
                        {tx.catatan || tx.kategori}
                      </span>
                      <span className="text-[10px] text-slate-400 block truncate">
                        {tx.kategori} • {tx.akun}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`text-xs font-mono font-bold shrink-0 ml-2 ${
                      tx.tipe === 'Income'
                        ? 'text-emerald-400'
                        : tx.tipe === 'Expense'
                        ? 'text-rose-400'
                        : 'text-slate-300'
                    }`}
                  >
                    {tx.tipe === 'Expense' ? '-' : '+'}
                    {formatRupiah(tx.jumlah)}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-white/10">
              <button
                onClick={onNavigateToJournal}
                className="w-full py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-semibold transition flex items-center justify-center gap-1.5"
              >
                <span>Lihat Jurnal Selengkapnya</span>
                <ArrowRightLeft className="w-3.5 h-3.5" />
              </button>
            </div>
          </GlassContainer>

          {/* Quick Guide Card */}
          <GlassContainer settings={settings} className="p-5">
            <h4 className="text-xs font-bold text-white flex items-center gap-2 mb-2">
              <HelpCircle className="w-4 h-4 text-blue-400" />
              Panduan Kategori Spreadsheet
            </h4>
            <div className="text-[11px] text-slate-300 space-y-2 leading-relaxed">
              <p>
                • <strong>Listrik, Transport, Entertainment, Dating</strong> otomatis terhubung dengan kantong
                budgeting bulanan.
              </p>
              <p>
                • <strong>Uang Bulanan</strong> masuk ke saldo BCA untuk kebutuhan rutin dapur/rumah tangga.
              </p>
              <p>
                • <strong>Jajan</strong> dialokasikan untuk jajan kuliner santai dan e-commerce.
              </p>
            </div>
          </GlassContainer>
        </div>
      </div>
    </div>
  );
};
