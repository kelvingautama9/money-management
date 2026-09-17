import React, { useState, useRef } from 'react';
import { GlassContainer } from './GlassContainer';
import { GlassSettings, BudgetCategory, AccountBalance, Transaction, InvestmentAsset, InvestmentHistory } from '../types';
import { formatRupiah } from '../lib/sheetsApi';
import { triggerHaptic } from '../lib/haptics';
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Eye,
  EyeOff,
  PlusCircle,
  ArrowLeftRight,
  PieChart,
  RefreshCw,
  ChevronRight,
  CreditCard,
  Building2,
  Sparkles,
  Zap,
  Coffee,
  Heart,
  Car,
  TrendingUp,
  LineChart,
  FileSpreadsheet
} from 'lucide-react';

interface ExecutiveSummaryProps {
  totalAset: number;
  cashStandbyDanaDarurat: number;
  totalInvestment: number;
  totalPemasukan: number;
  totalPengeluaran: number;
  sisaSaldoIncome: number;
  settings: GlassSettings;
  budgets?: BudgetCategory[];
  accounts?: AccountBalance[];
  transactions?: Transaction[];
  assets?: InvestmentAsset[];
  history?: InvestmentHistory[];
  onNavigate?: (page: 'summary' | 'cashflow' | 'budgeting' | 'portfolio' | 'accounts' | 'journal') => void;
  onSyncGoogleSheets?: () => void;
  onOpenProjectManager?: () => void;
  isSyncing?: boolean;
  currentMonthSheet?: string;
  availableSheets?: string[];
  onSelectMonthSheet?: (name: string) => void;
}

export const ExecutiveSummary: React.FC<ExecutiveSummaryProps> = ({
  totalAset,
  cashStandbyDanaDarurat,
  totalInvestment,
  totalPemasukan,
  totalPengeluaran,
  sisaSaldoIncome,
  settings,
  budgets = [],
  accounts = [],
  transactions = [],
  assets = [],
  history = [],
  onNavigate,
  onSyncGoogleSheets,
  onOpenProjectManager,
  isSyncing = false,
  currentMonthSheet = 'SEPTEMBER',
  availableSheets = [],
  onSelectMonthSheet
}) => {
  const [hideBalance, setHideBalance] = useState(false);
  const walletScrollRef = useRef<HTMLDivElement>(null);

  const spendRatio = totalPemasukan > 0 ? ((totalPengeluaran / totalPemasukan) * 100).toFixed(1) : '0';
  const saveRatio = totalPemasukan > 0 ? ((sisaSaldoIncome / totalPemasukan) * 100).toFixed(1) : '0';

  // Format balance with privacy mask
  const displayMoney = (amount: number) => {
    if (hideBalance) return '••••••••';
    return formatRupiah(amount);
  };

  // Quick category icon helper
  const getCategoryIcon = (kategori: string) => {
    const k = kategori.toLowerCase();
    if (k.includes('listrik')) return <Zap className="w-4 h-4 text-amber-400" />;
    if (k.includes('transport')) return <Car className="w-4 h-4 text-blue-400" />;
    if (k.includes('dating')) return <Heart className="w-4 h-4 text-pink-400" />;
    if (k.includes('jajan') || k.includes('makan')) return <Coffee className="w-4 h-4 text-orange-400" />;
    return <CreditCard className="w-4 h-4 text-emerald-400" />;
  };

  return (
    <div className="space-y-6">
      {/* HERO SECTION: Large Balance & Dual Frosted Cards (As in Image 3 & 4) */}
      <GlassContainer settings={settings} className="p-6 sm:p-8 relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          {/* Top Label & Eye Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Total Kekayaan Bersih (Net Worth)
              </span>
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] font-bold">
                <FileSpreadsheet className="w-3 h-3 text-blue-400" />
                <span>Rekapan:</span>
                <strong className="text-white uppercase tracking-wider">{currentMonthSheet}</strong>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Live Data
              </span>
            </div>
            <button
              onClick={() => {
                triggerHaptic('light');
                setHideBalance(!hideBalance);
              }}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white transition"
              title={hideBalance ? 'Tampilkan Saldo' : 'Sembunyikan Saldo'}
            >
              {hideBalance ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Big Hero Number */}
          <div className="mt-2 flex flex-wrap items-baseline gap-3">
            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              {displayMoney(totalAset)}
            </h1>
            <span className="text-xs font-bold text-emerald-400 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 inline-flex items-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5" />
              +Rp 1.148.790 MoM (+2.1%)
            </span>
          </div>

          <p className="text-xs text-slate-400 mt-1">
            Kas Cair & Dana Darurat: <strong className="text-slate-200">{displayMoney(cashStandbyDanaDarurat)}</strong> • Portofolio Investasi: <strong className="text-sky-300">{displayMoney(totalInvestment)}</strong>
          </p>

          {/* TRI-CARD ROW: INCOME, OUTCOME, & INVESTMENT PORTFOLIO CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            {/* 1. Income Card */}
            <div className="relative p-5 rounded-2xl bg-white/[0.04] border border-white/10 overflow-hidden group hover:border-emerald-500/30 transition-all">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                      <ArrowDownLeft className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-semibold text-slate-300">Income Bulanan</span>
                  </div>
                  <h3 className="text-2xl font-black text-white tracking-tight">
                    {displayMoney(totalPemasukan)}
                  </h3>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      ▲ 100% Gaji Diterima
                    </span>
                    <span className="text-[11px] text-slate-400 capitalize font-medium">{currentMonthSheet.toLowerCase()} 2026</span>
                  </div>
                </div>
              </div>

              {/* Glowing Mint Sparkline Wave */}
              <div className="mt-4 pt-2">
                <svg className="w-full h-12 overflow-visible" viewBox="0 0 200 40">
                  <defs>
                    <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10B981" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M 0 35 Q 30 30, 60 25 T 120 18 T 170 10 T 200 5 L 200 40 L 0 40 Z"
                    fill="url(#incomeGradient)"
                  />
                  <path
                    d="M 0 35 Q 30 30, 60 25 T 120 18 T 170 10 T 200 5"
                    fill="none"
                    stroke="#34D399"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>

            {/* 2. Spendings Card (Outcome) */}
            <div className="relative p-5 rounded-2xl bg-white/[0.04] border border-white/10 overflow-hidden group hover:border-rose-500/30 transition-all">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-6 h-6 rounded-full bg-rose-500/20 flex items-center justify-center text-rose-400">
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-semibold text-slate-300">Total Pengeluaran</span>
                  </div>
                  <h3 className="text-2xl font-black text-rose-300 tracking-tight">
                    {displayMoney(totalPengeluaran)}
                  </h3>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      {spendRatio}% Dari Anggaran
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Sisa: <strong className="text-emerald-300">{displayMoney(sisaSaldoIncome)}</strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* Glowing Coral/Orange Sparkline Wave */}
              <div className="mt-4 pt-2">
                <svg className="w-full h-12 overflow-visible" viewBox="0 0 200 40">
                  <defs>
                    <linearGradient id="spendGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#F43F5E" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#F43F5E" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M 0 35 Q 40 28, 70 32 T 130 20 T 170 14 T 200 8 L 200 40 L 0 40 Z"
                    fill="url(#spendGradient)"
                  />
                  <path
                    d="M 0 35 Q 40 28, 70 32 T 130 20 T 170 14 T 200 8"
                    fill="none"
                    stroke="#FB7185"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>

            {/* 3. Investment Growth & Chart Card */}
            <div
              onClick={() => onNavigate?.('portfolio')}
              className="relative p-5 rounded-2xl bg-white/[0.04] border border-white/10 overflow-hidden group hover:border-sky-500/40 transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-6 h-6 rounded-full bg-sky-500/20 flex items-center justify-center text-sky-400">
                      <TrendingUp className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-semibold text-slate-300">Portofolio Investasi</span>
                  </div>
                  <h3 className="text-2xl font-black text-sky-300 tracking-tight">
                    {displayMoney(totalInvestment)}
                  </h3>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30 flex items-center gap-1">
                      <LineChart className="w-3 h-3" />
                      +3.90% MoM
                    </span>
                    <span className="text-[11px] text-slate-400">Pluang • Valas • USDT</span>
                  </div>
                </div>
              </div>

              {/* Glowing Sky Blue Sparkline Wave for Investment Growth */}
              <div className="mt-4 pt-2">
                <svg className="w-full h-12 overflow-visible" viewBox="0 0 200 40">
                  <defs>
                    <linearGradient id="investGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0284C7" stopOpacity="0.45" />
                      <stop offset="100%" stopColor="#0284C7" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  {/* Data points reflecting growth: 48.5M -> 49.1M -> 50.0M -> 48.8M -> 51.7M -> 53.7M */}
                  <path
                    d="M 0 32 Q 35 29, 70 24 T 120 28 T 165 14 T 200 4 L 200 40 L 0 40 Z"
                    fill="url(#investGradient)"
                  />
                  <path
                    d="M 0 32 Q 35 29, 70 24 T 120 28 T 165 14 T 200 4"
                    fill="none"
                    stroke="#38BDF8"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </GlassContainer>

      {/* QUICK ACTIONS ROW (Image 4 Clean Interface Match) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => {
            triggerHaptic('selection');
            onNavigate?.('cashflow');
          }}
          className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.09] border border-white/10 transition-all text-left active:scale-[0.98]"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <PlusCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-white block leading-tight">Input Transaksi</span>
            <span className="text-[10px] text-slate-400">Auto-sync Sheet</span>
          </div>
        </button>

        <button
          onClick={() => {
            triggerHaptic('selection');
            onNavigate?.('accounts');
          }}
          className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.09] border border-white/10 transition-all text-left active:scale-[0.98]"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
            <ArrowLeftRight className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-white block leading-tight">Transfer Saldo</span>
            <span className="text-[10px] text-slate-400">Antar 9 Rekening</span>
          </div>
        </button>

        <button
          onClick={() => {
            triggerHaptic('selection');
            onNavigate?.('budgeting');
          }}
          className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.09] border border-white/10 transition-all text-left active:scale-[0.98]"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <PieChart className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-white block leading-tight">4 Pos Budget</span>
            <span className="text-[10px] text-slate-400">Kontrol Anggaran</span>
          </div>
        </button>

        <button
          onClick={() => {
            triggerHaptic('medium');
            onSyncGoogleSheets?.();
          }}
          disabled={isSyncing}
          className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.09] border border-white/10 transition-all text-left active:scale-[0.98] disabled:opacity-50"
        >
          <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0">
            <RefreshCw className={`w-5 h-5 ${isSyncing ? 'animate-spin' : ''}`} />
          </div>
          <div>
            <span className="text-xs font-bold text-white block leading-tight">Sync Sheets</span>
            <span className="text-[10px] text-slate-400">{isSyncing ? 'Proses...' : 'Tarik Data'}</span>
          </div>
        </button>
      </div>

      {/* PROJECT SHEET SELECTION & QUICK CONFIG BANNER */}
      {onOpenProjectManager && (
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-purple-950/40 border border-blue-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                Pengaturan Project Google Sheet
                <span className="text-[9px] font-semibold px-2 py-0.2 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  Ganti Akun / File
                </span>
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Ingin menghubungkan file spreadsheet lain atau akun Google berbeda? Cukup klik pilih project tanpa perlu edit coding.
              </p>
            </div>
          </div>

          <button
            onClick={onOpenProjectManager}
            className="px-3.5 py-1.5 rounded-xl bg-blue-600/30 hover:bg-blue-600/50 border border-blue-400/40 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95 shrink-0 shadow"
          >
            <span>Pilih Project & Panduan</span>
            <ChevronRight className="w-3.5 h-3.5 text-blue-300" />
          </button>
        </div>
      )}

      {/* "MY WALLETS" DIRECT SWIPE CARDS CAROUSEL (Image 4 Match: No Scrollbar, Direct Smooth Swipe) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-sky-400" />
            <h3 className="text-sm font-bold text-white tracking-tight">
              Dompet & Rekening Aktif
            </h3>
            <span className="text-[10px] font-semibold text-slate-400 px-2 py-0.5 rounded-full bg-white/5 border border-white/10">
              Geser untuk melihat semua
            </span>
          </div>

          <button
            onClick={() => onNavigate?.('accounts')}
            className="text-xs text-blue-400 hover:text-blue-300 font-medium inline-flex items-center gap-1"
          >
            Kelola Rekening
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Swipe Carousel with touch-pan-x, direct horizontal swipe */}
        <div
          ref={walletScrollRef}
          className="flex items-center gap-3 overflow-x-auto no-scrollbar py-1"
          style={{
            scrollSnapType: 'x mandatory',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          {accounts.map((acc, idx) => (
            <div
              key={acc.nama}
              style={{
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)'
              }}
              className="p-4 rounded-2xl border border-white/15 min-w-[220px] sm:min-w-[240px] shrink-0 scroll-snap-align-start hover:border-white/30 transition-all"
            >
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span className="font-semibold text-white tracking-tight flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-sky-400" />
                  {acc.nama}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-slate-300 font-mono">
                  #{idx + 1}
                </span>
              </div>

              <div className="mt-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">Saldo Terkini:</span>
                  {acc.totalSaldo < 0 && (
                    <span className="text-[10px] font-bold text-rose-400 bg-rose-500/20 px-1.5 py-0.5 rounded border border-rose-500/30">
                      Minus
                    </span>
                  )}
                </div>
                <span className={`text-base sm:text-lg font-black tracking-tight ${acc.totalSaldo < 0 ? 'text-rose-400' : 'text-white'}`}>
                  {displayMoney(acc.totalSaldo)}
                </span>
              </div>

              {acc.spendBulanIniPercent !== undefined && acc.spendBulanIniPercent > 0 && (
                <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between text-[10px]">
                  <span className="text-slate-400">Serapan:</span>
                  <span className="text-rose-300 font-bold">{acc.spendBulanIniPercent}%</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* TWO COLUMNS: BUDGETING GOALS & RECENT TRANSACTIONS (Images 3 & 4 Match) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Goals & Budget Envelopes Snapshot */}
        <GlassContainer settings={settings} className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                <PieChart className="w-4 h-4 text-amber-400" />
                Budgeting Envelopes (4 Kantong)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Total Plafon: <strong className="text-slate-200">{formatRupiah(2450000)}</strong>
              </p>
            </div>

            <button
              onClick={() => onNavigate?.('budgeting')}
              className="text-xs text-amber-400 hover:text-amber-300 font-medium inline-flex items-center gap-1"
            >
              Rincian
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3.5">
            {budgets.slice(0, 4).map((b) => {
              const pct = b.totalSaldo > 0 ? Math.min(100, Math.round((b.actualSpend / b.totalSaldo) * 100)) : 0;
              return (
                <div key={b.id} className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-white flex items-center gap-2">
                      {getCategoryIcon(b.nama)}
                      {b.nama}
                    </span>
                    <span className="text-slate-300 font-mono">
                      {formatRupiah(b.actualSpend)} / {formatRupiah(b.totalSaldo)}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden relative">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        pct > 90
                          ? 'bg-rose-500'
                          : pct > 60
                          ? 'bg-amber-400'
                          : 'bg-emerald-400'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Terpakai: {pct}%</span>
                    <span className="text-emerald-400 font-medium">Sisa: {formatRupiah(b.sisa)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </GlassContainer>

        {/* Right: Recent Transactions (Image 3 & 4 Match) */}
        <GlassContainer settings={settings} className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-400" />
                Aktivitas Transaksi Terkini
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Sinkron dengan Google Sheets
              </p>
            </div>

            <button
              onClick={() => onNavigate?.('journal')}
              className="text-xs text-blue-400 hover:text-blue-300 font-medium inline-flex items-center gap-1"
            >
              Lihat Jurnal
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {transactions.slice(0, 5).map((t) => {
              const isIncome = t.tipe === 'Income' || t.tipe === 'Transfer Masuk';
              return (
                <div
                  key={t.id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 transition"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                        isIncome
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                      }`}
                    >
                      {isIncome ? (
                        <ArrowDownLeft className="w-4 h-4" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block">
                        {t.kategori}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {t.catatan || t.akun} • <span className="text-slate-500">{t.akun}</span>
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`text-xs font-black tracking-tight ${
                        isIncome ? 'text-emerald-400' : 'text-slate-200'
                      }`}
                    >
                      {isIncome ? '+' : '-'} {formatRupiah(t.jumlah)}
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      {t.bulan || 'September'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </GlassContainer>
      </div>
    </div>
  );
};
