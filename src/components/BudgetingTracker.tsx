import React from 'react';
import { GlassContainer } from './GlassContainer';
import { GlassSettings, BudgetCategory } from '../types';
import { formatRupiah } from '../lib/sheetsApi';
import { Zap, Film, Compass, Heart, CheckCircle2, AlertCircle } from 'lucide-react';

interface BudgetingTrackerProps {
  budgets: BudgetCategory[];
  settings: GlassSettings;
  onQuickSpend?: (budgetId: string) => void;
}

export const BudgetingTracker: React.FC<BudgetingTrackerProps> = ({
  budgets,
  settings
}) => {
  const getIcon = (nama: string) => {
    if (nama.toLowerCase().includes('listrik')) return <Zap className="w-5 h-5 text-amber-400" />;
    if (nama.toLowerCase().includes('entertainment')) return <Film className="w-5 h-5 text-purple-400" />;
    if (nama.toLowerCase().includes('transport')) return <Compass className="w-5 h-5 text-cyan-400" />;
    if (nama.toLowerCase().includes('dating')) return <Heart className="w-5 h-5 text-pink-400" />;
    return <Zap className="w-5 h-5 text-blue-400" />;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            Kontrol Budgeting & Sinking Funds
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-white/10 text-slate-300 border border-white/10">
              Envelope System
            </span>
          </h3>
          <p className="text-xs text-slate-400">
            Monitoring saldo bergulir, top-up bulanan, dan realisasi belanja per kantong
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {budgets.map((b) => {
          const spendPercent = b.totalSaldo > 0 ? Math.min(100, Math.round((b.actualSpend / b.totalSaldo) * 100)) : 0;
          const isDepleted = b.sisa <= 0;
          const isWarning = spendPercent >= 80 && !isDepleted;

          return (
            <GlassContainer key={b.id} settings={settings} className="p-5 flex flex-col justify-between">
              <div>
                {/* Header Icon + Name */}
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shadow-inner">
                    {getIcon(b.nama)}
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                      isDepleted
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                        : isWarning
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    }`}
                  >
                    {isDepleted ? 'Terserap 100%' : `${spendPercent}% Terpakai`}
                  </span>
                </div>

                <h4 className="text-sm font-semibold text-white tracking-tight leading-snug">
                  {b.nama}
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Akun: <span className="text-slate-300 font-medium">{b.akunTerkait}</span>
                </p>

                {/* Progress Bar */}
                <div className="my-4">
                  <div className="flex justify-between text-[11px] mb-1 font-medium">
                    <span className="text-slate-400">Actual Spend</span>
                    <span className="text-slate-200">{formatRupiah(b.actualSpend)}</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden relative">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isDepleted
                          ? 'bg-rose-500'
                          : isWarning
                          ? 'bg-gradient-to-r from-amber-400 to-rose-400'
                          : 'bg-gradient-to-r from-blue-400 to-indigo-400'
                      }`}
                      style={{ width: `${spendPercent}%` }}
                    />
                  </div>
                </div>

                {/* Breakdown details */}
                <div className="space-y-1.5 pt-2 border-t border-white/10 text-[11px]">
                  <div className="flex justify-between text-slate-400">
                    <span>Saldo Awal (Lalu):</span>
                    <span className="font-mono text-slate-300">{formatRupiah(b.saldoAwal)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Top-up Budget:</span>
                    <span className="font-mono text-slate-300">+{formatRupiah(b.budgeting)}</span>
                  </div>
                  <div className="flex justify-between text-slate-300 font-medium">
                    <span>Total Kuota Saldo:</span>
                    <span className="font-mono">{formatRupiah(b.totalSaldo)}</span>
                  </div>
                </div>
              </div>

              {/* Remaining footer badge */}
              <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
                <span className="text-[11px] font-medium text-slate-400">Sisa Anggaran:</span>
                <span
                  className={`text-xs font-bold font-mono ${
                    isDepleted ? 'text-rose-400' : 'text-emerald-400'
                  }`}
                >
                  {formatRupiah(b.sisa)}
                </span>
              </div>
            </GlassContainer>
          );
        })}
      </div>
    </div>
  );
};
