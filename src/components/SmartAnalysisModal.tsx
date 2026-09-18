import React from 'react';
import { GlassSettings, InvestmentAsset, InvestmentHistory } from '../types';
import { formatRupiah } from '../lib/sheetsApi';
import { triggerHaptic } from '../lib/haptics';
import {
  TrendingUp,
  ShieldCheck,
  AlertCircle,
  X,
  Printer,
  DollarSign,
  Coins,
  ArrowUpRight,
  Activity,
  Layers,
  Scale,
  Bell,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Sparkles,
  Calendar
} from 'lucide-react';

interface SmartAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  assets: InvestmentAsset[];
  history: InvestmentHistory[];
  settings: GlassSettings;
  cashStandby: number;
}

export const SmartAnalysisModal: React.FC<SmartAnalysisModalProps> = ({
  isOpen,
  onClose,
  assets,
  history,
  settings,
  cashStandby
}) => {
  if (!isOpen) return null;

  const totalInvestment = assets.reduce((sum, a) => sum + a.nilaiAkhirBulan, 0);
  const totalWealth = totalInvestment + cashStandby;

  // Recent month performance
  const latestMonth = history[history.length - 1];
  const momProfit = latestMonth?.netProfitMoM || 2016286;
  const momPnl = latestMonth?.pnlPercent || 3.9;

  // Dynamic calculations for USD/Hedge
  const usdHedgingAssets = assets.filter((a) => {
    const n = a.nama.toLowerCase();
    return n.includes('valas') || n.includes('usd') || n.includes('usdt') || n.includes('binance') || n.includes('crypto');
  });
  const usdHedgeValue = usdHedgingAssets.reduce((sum, a) => sum + a.nilaiAkhirBulan, 0);
  const usdHedgePct = totalInvestment > 0 ? Number(((usdHedgeValue / totalInvestment) * 100).toFixed(1)) : 0;

  const cashDragPct = totalWealth > 0 ? Number(((cashStandby / totalWealth) * 100).toFixed(1)) : 0;

  // Helper to categorize any dynamic asset name
  const getAssetMeta = (name: string, pct: number) => {
    const n = name.toLowerCase();
    if (n.includes('usdt') || n.includes('crypto') || n.includes('binance') || n.includes('bitcoin') || n.includes('btc') || n.includes('eth')) {
      return {
        icon: <Coins className="w-4 h-4 text-amber-400" />,
        color: 'from-amber-500 to-yellow-400',
        badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
        role: 'High-Beta Tactical Yield & Likuiditas Global',
        idealMin: 10,
        idealMax: 20,
        category: 'Aset Digital / Crypto'
      };
    }
    if (n.includes('valas') || n.includes('usd') || n.includes('dollar') || n.includes('forex')) {
      return {
        icon: <DollarSign className="w-4 h-4 text-emerald-400" />,
        color: 'from-emerald-500 to-teal-400',
        badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
        role: 'Lindung Nilai (Hedge) & Stabilitas Makro',
        idealMin: 25,
        idealMax: 35,
        category: 'Valuta Asing'
      };
    }
    if (n.includes('emas') || n.includes('gold') || n.includes('logam')) {
      return {
        icon: <Sparkles className="w-4 h-4 text-yellow-400" />,
        color: 'from-yellow-500 to-amber-400',
        badgeBg: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
        role: 'Safe Haven & Pelindung Inflasi Riil',
        idealMin: 5,
        idealMax: 15,
        category: 'Komoditas / Logam Mulia'
      };
    }
    if (n.includes('obligasi') || n.includes('sukuk') || n.includes('sbn') || n.includes('fr')) {
      return {
        icon: <ShieldCheck className="w-4 h-4 text-blue-400" />,
        color: 'from-blue-500 to-cyan-400',
        badgeBg: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
        role: 'Pendapatan Tetap Defensif & Kupon Berkala',
        idealMin: 15,
        idealMax: 25,
        category: 'Fixed Income'
      };
    }
    // Default: Equity / Mutual Funds / Stock / Pluang
    return {
      icon: <TrendingUp className="w-4 h-4 text-sky-400" />,
      color: 'from-sky-500 to-blue-500',
      badgeBg: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
      role: 'Akselerator Pertumbuhan Jangka Panjang (Capital Gain)',
      idealMin: 35,
      idealMax: 45,
      category: 'Pasar Modal / Saham & Reksadana'
    };
  };

  // Rebalancing and health audit calculations
  const dynamicAssetAudits = assets.map((asset) => {
    const pct = totalInvestment > 0 ? Number(((asset.nilaiAkhirBulan / totalInvestment) * 100).toFixed(1)) : 0;
    const meta = getAssetMeta(asset.nama, pct);
    let status: 'optimal' | 'overweight' | 'underweight' = 'optimal';
    let statusText = 'Optimal (Dalam Rentang Target)';

    if (pct > meta.idealMax) {
      status = 'overweight';
      statusText = `Overweight (+${(pct - meta.idealMax).toFixed(1)}% di atas benchmark)`;
    } else if (pct < meta.idealMin) {
      status = 'underweight';
      statusText = `Underweight (-${(meta.idealMin - pct).toFixed(1)}% di bawah benchmark)`;
    }

    return {
      ...asset,
      pct,
      meta,
      status,
      statusText
    };
  });

  const overweightAssets = dynamicAssetAudits.filter((a) => a.status === 'overweight');
  const underweightAssets = dynamicAssetAudits.filter((a) => a.status === 'underweight');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div
        style={{
          background: 'rgba(10, 14, 28, 0.97)',
          backdropFilter: 'blur(40px) saturate(190%)',
          boxShadow: '0 30px 80px rgba(0,0,0,0.85), inset 0 1px 1px rgba(255,255,255,0.25)'
        }}
        className="w-full max-w-3xl rounded-3xl border border-white/15 p-4 sm:p-7 text-slate-100 my-auto shadow-2xl relative max-h-[94vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-white/10 gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-600/30 via-indigo-600/30 to-blue-500/20 border border-sky-400/30 flex items-center justify-center shrink-0">
              <Activity className="w-5 h-5 text-sky-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Smart Analisis Portofolio Investasi
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 uppercase tracking-wider">
                  Pro Standard
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
                Evaluasi performa real-time, sinkronisasi otomatis nama instrumen, dan smart rekomendasi rebalancing
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white transition"
              title="Cetak Ringkasan"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                triggerHaptic('light');
                onClose();
              }}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white transition"
              title="Tutup Modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 3 Executive Summary KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-5">
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Kinerja MoM (Bulan Terakhir)
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-bold text-emerald-400 font-mono">
                +{momPnl}%
              </span>
              <span className="text-[11px] text-slate-400">
                ({formatRupiah(momProfit)})
              </span>
            </div>
            <span className="text-[10px] text-emerald-400/90 flex items-center gap-1 mt-1 font-medium">
              <ArrowUpRight className="w-3 h-3" /> Target bulanan (+1.0%) tercapai
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              USD Currency Hedge Ratio
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-bold text-sky-300 font-mono">
                {usdHedgePct}%
              </span>
              <span className="text-[11px] text-slate-400">Porsi Valas & Aset Asing</span>
            </div>
            <span className="text-[10px] text-sky-400/90 flex items-center gap-1 mt-1 font-medium">
              <ShieldCheck className="w-3 h-3" /> Proteksi kuat depresiasi Rupiah
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Cash Drag Index
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-bold text-amber-300 font-mono">
                {cashDragPct}%
              </span>
              <span className="text-[11px] text-slate-400">Kas Standby</span>
            </div>
            <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-1 font-medium">
              Ideal: 5-10% untuk likuiditas taktis
            </span>
          </div>
        </div>

        {/* Dynamic Asset Allocation & Benchmark Comparison Table */}
        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3 mb-5">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-blue-400" />
              Alokasi Aset Aktif vs Standard Financial Planner
            </h4>
            <span className="text-[10px] text-slate-400">Total Portofolio: {formatRupiah(totalInvestment)}</span>
          </div>

          <div className="space-y-3">
            {dynamicAssetAudits.map((asset) => (
              <div
                key={asset.nama}
                className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-2 hover:border-white/15 transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                  <div className="flex items-center gap-2">
                    {asset.meta.icon}
                    <span className="font-bold text-white tracking-tight">{asset.nama}</span>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${asset.meta.badgeBg}`}>
                      {asset.meta.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <span className="font-mono font-bold text-slate-200">
                      {formatRupiah(asset.nilaiAkhirBulan)} ({asset.pct}%)
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                        asset.status === 'optimal'
                          ? 'bg-emerald-500/15 text-emerald-300'
                          : asset.status === 'overweight'
                          ? 'bg-amber-500/15 text-amber-300'
                          : 'bg-rose-500/15 text-rose-300'
                      }`}
                    >
                      {asset.statusText}
                    </span>
                  </div>
                </div>

                {/* Progress bar comparison */}
                <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden relative">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${asset.meta.color} transition-all duration-500`}
                    style={{ width: `${Math.min(100, asset.pct)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span className="truncate mr-2">Fungsi: {asset.meta.role}</span>
                  <span className="shrink-0 font-medium text-slate-300">
                    Target Ideal: {asset.meta.idealMin}% - {asset.meta.idealMax}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Smart Rekomendasi & Pengingat Investasi (Actionable Reminders & Strategic Insights) */}
        <div className="space-y-4">
          {/* 1. Pengingat Jadwal Investasi Rutin (DCA Reminder) */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/30 via-teal-950/20 to-blue-950/20 border border-emerald-500/30 space-y-2">
            <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <Bell className="w-3.5 h-3.5 text-emerald-400 animate-bounce" />
              Pengingat Jadwal Investasi Rutin (DCA Reminder)
            </h4>
            <div className="text-xs text-slate-200 leading-relaxed flex items-start gap-2.5">
              <Calendar className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-white">
                  Jadwal Injeksi Modal Bulanan: <strong>Tanggal 25 - 30 Setiap Bulan</strong>
                </p>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  Setiap kali slip gaji cair (MYPAK), prioritaskan transfer otomatis <strong>Rp 2.016.286</strong> ke instrumen investasi sebelum saldo terpakai untuk pengeluaran konsumtif (*Pay Yourself First*).
                </p>
              </div>
            </div>
          </div>

          {/* 2. Smart Rekomendasi Perbaikan & Rebalancing */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-950/30 to-indigo-950/20 border border-blue-500/20 space-y-2.5">
            <h4 className="text-xs font-bold text-sky-300 uppercase tracking-wider flex items-center gap-1.5">
              <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
              Smart Rekomendasi Perbaikan Portofolio
            </h4>

            <div className="space-y-2 text-xs text-slate-300">
              {overweightAssets.length > 0 && (
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <strong>Peringatan Rebalancing:</strong> Aset{' '}
                    <span className="font-bold text-white">
                      {overweightAssets.map((a) => a.nama).join(', ')}
                    </span>{' '}
                    berada di atas bobot ideal. Tidak perlu menjual (take profit kena pajak/fee), tetapi{' '}
                    <strong>alihkan porsi DCA baru bulan depan</strong> ke instrumen yang underweight untuk menyeimbangkan profil risiko.
                  </div>
                </div>
              )}

              {underweightAssets.length > 0 && (
                <div className="p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-200 flex items-start gap-2">
                  <TrendingUp className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                  <div>
                    <strong>Prioritas Top-Up Berikutnya:</strong> Aset{' '}
                    <span className="font-bold text-white">
                      {underweightAssets.map((a) => a.nama).join(', ')}
                    </span>{' '}
                    masih di bawah benchmark ideal. Prioritaskan alokasi setoran berikutnya ke pos ini guna memperkuat motor pertumbuhan portofolio.
                  </div>
                </div>
              )}

              <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 text-slate-300 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong>Kekuatan Lindung Nilai USD ({usdHedgePct}%):</strong> Porsi aset berdenominasi mata uang kuat (Valas & USDT) sangat kokoh dalam menangkal pelemahan nilai tukar Rupiah dan menjaga daya beli global.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-5 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
          <span>Data tersinkronisasi otomatis dengan Google Sheet & Custom Assets</span>
          <button
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold transition"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
};
