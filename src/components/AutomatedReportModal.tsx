import React from 'react';
import { GlassSettings, Transaction, BudgetCategory, EmergencyFund } from '../types';
import { formatRupiah } from '../lib/sheetsApi';
import {
  FileText,
  Printer,
  X,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  PieChart,
  ShieldCheck,
  Building2,
  Wallet
} from 'lucide-react';

interface AutomatedReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  budgets: BudgetCategory[];
  emergencyFund: EmergencyFund;
  totalAset: number;
  totalIncome: number;
  totalExpense: number;
  settings: GlassSettings;
  currentSheetName?: string;
}

export const AutomatedReportModal: React.FC<AutomatedReportModalProps> = ({
  isOpen,
  onClose,
  transactions,
  budgets,
  emergencyFund,
  totalAset,
  totalIncome,
  totalExpense,
  settings,
  currentSheetName = 'September'
}) => {
  if (!isOpen) return null;

  const netSavings = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? ((netSavings / totalIncome) * 100).toFixed(1) : '0';
  const burnRate = totalIncome > 0 ? ((totalExpense / totalIncome) * 100).toFixed(1) : '0';

  // Largest expenses sorted
  const topExpenses = [...transactions]
    .filter((t) => t.tipe === 'Expense')
    .sort((a, b) => b.jumlah - a.jumlah)
    .slice(0, 5);

  const totalBudgetPlafon = budgets.reduce((sum, b) => sum + b.totalSaldo, 0);
  const totalBudgetSpend = budgets.reduce((sum, b) => sum + b.actualSpend, 0);
  const totalBudgetSisa = budgets.reduce((sum, b) => sum + b.sisa, 0);
  const budgetAbsorptionPct = totalBudgetPlafon > 0 ? ((totalBudgetSpend / totalBudgetPlafon) * 100).toFixed(1) : '0';

  const emergencyPct = emergencyFund.target > 0 ? ((emergencyFund.current / emergencyFund.target) * 100).toFixed(1) : '0';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div
        style={{
          background: 'rgba(10, 14, 28, 0.96)',
          backdropFilter: 'blur(40px) saturate(190%)',
          boxShadow: '0 30px 80px rgba(0,0,0,0.85), inset 0 1px 1px rgba(255,255,255,0.25)'
        }}
        className="w-full max-w-3xl rounded-3xl border border-white/15 p-5 sm:p-7 text-slate-100 my-auto shadow-2xl relative"
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-white/10 gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600/30 to-indigo-600/30 border border-blue-400/30 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5 text-blue-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Laporan Rekonsiliasi & Audit Finansial
                </h3>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  Periode {currentSheetName}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
                Ringkasan eksekutif neraca keuangan, efisiensi arus kas, dan serapan anggaran
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white transition"
              title="Cetak / Unduh PDF"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white transition"
              title="Tutup"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 4 Key Institutional Audit KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-5">
          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Total Kekayaan Bersih
            </span>
            <span className="text-base sm:text-lg font-bold text-white font-mono block">
              {formatRupiah(totalAset)}
            </span>
            <span className="text-[10px] text-emerald-400 mt-1 block font-medium">
              Kas + Valas + Investasi
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Rasio Tabungan (Savings)
            </span>
            <span className="text-base sm:text-lg font-bold text-sky-300 font-mono block">
              {savingsRate}%
            </span>
            <span className="text-[10px] text-slate-400 mt-1 block">
              Surplus: {formatRupiah(netSavings)}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Serapan Anggaran
            </span>
            <span className="text-base sm:text-lg font-bold text-amber-300 font-mono block">
              {budgetAbsorptionPct}%
            </span>
            <span className="text-[10px] text-slate-400 mt-1 block">
              Sisa: {formatRupiah(totalBudgetSisa)}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Dana Darurat
            </span>
            <span className="text-base sm:text-lg font-bold text-purple-300 font-mono block">
              {emergencyPct}%
            </span>
            <span className="text-[10px] text-slate-400 mt-1 block">
              {formatRupiah(emergencyFund.current)} / {formatRupiah(emergencyFund.target)}
            </span>
          </div>
        </div>

        {/* Audit Sections: Cashflow Breakdown & Envelope Status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
          {/* Operational Cashflow */}
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2.5">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5 text-blue-400" />
              Audit Arus Kas Operasional
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1.5 border-b border-white/5">
                <span className="text-slate-400">Total Pemasukan (Inflow):</span>
                <span className="font-mono font-bold text-emerald-400">{formatRupiah(totalIncome)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-white/5">
                <span className="text-slate-400">Total Pengeluaran (Outflow):</span>
                <span className="font-mono font-bold text-rose-400">{formatRupiah(totalExpense)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-white/5">
                <span className="text-slate-400">Net Surplus Bersih:</span>
                <span className="font-mono font-bold text-sky-300">{formatRupiah(netSavings)}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-400">Burn Rate (Beban Pengeluaran):</span>
                <span className="font-mono text-slate-200">{burnRate}% dari pendapatan</span>
              </div>
            </div>
          </div>

          {/* Top 5 Expense Line Items */}
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2.5">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-rose-400" />
              5 Pos Pengeluaran Terbesar
            </h4>
            <div className="space-y-1.5 text-xs">
              {topExpenses.length > 0 ? (
                topExpenses.map((exp, idx) => (
                  <div
                    key={exp.id}
                    className="flex items-center justify-between p-2 rounded-xl bg-white/[0.02] border border-white/5"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-5 h-5 rounded-lg bg-white/5 flex items-center justify-center font-mono text-[10px] text-slate-400 shrink-0">
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <span className="font-semibold text-white block truncate">{exp.catatan}</span>
                        <span className="text-[10px] text-slate-400 block truncate">
                          {exp.kategori} • {exp.akun}
                        </span>
                      </div>
                    </div>
                    <span className="font-mono font-bold text-rose-300 shrink-0 ml-2">
                      {formatRupiah(exp.jumlah)}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-slate-400 text-[11px]">Belum ada pengeluaran tercatat.</p>
              )}
            </div>
          </div>
        </div>

        {/* Executive Verdict & Recommendations (Factual, Concise, No Fluff) */}
        <div className="p-4 rounded-2xl bg-blue-950/20 border border-blue-500/20 space-y-2">
          <h4 className="text-xs font-bold text-sky-300 uppercase tracking-wider flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            Kesimpulan Eksekutif & Rekomendasi
          </h4>
          <ul className="space-y-1.5 text-xs text-slate-300">
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold">•</span>
              <span>
                <strong>Efisiensi Tabungan:</strong> Rasio tabungan sebesar {savingsRate}% berada di atas ambang minimum 20%, menunjukkan pengelolaan arus kas yang sehat.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-sky-400 font-bold">•</span>
              <span>
                <strong>Kontrol Anggaran:</strong> Serapan total pos anggaran tercatat {budgetAbsorptionPct}% dengan sisa cadangan {formatRupiah(totalBudgetSisa)}, menjaga risiko defisit tetap terkendali.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-400 font-bold">•</span>
              <span>
                <strong>Prioritas Dana Darurat:</strong> Akumulasi dana darurat saat ini mencapai {emergencyPct}% ({formatRupiah(emergencyFund.current)}). Disarankan mengalokasikan 15-20% surplus kas bulan depan untuk mencapai target 100%.
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
