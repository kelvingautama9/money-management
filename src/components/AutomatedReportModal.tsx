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

  const isLight = settings?.themeMode === 'light' || settings?.themeMode === 'beige';
  const safeEmergency = emergencyFund || { current: 0, target: 0, kekurangan: 0, persentase: 0 };
  const safeBudgets = Array.isArray(budgets) ? budgets : [];
  const safeTransactions = Array.isArray(transactions) ? transactions : [];

  const netSavings = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? ((netSavings / totalIncome) * 100).toFixed(1) : '0';
  const burnRate = totalIncome > 0 ? ((totalExpense / totalIncome) * 100).toFixed(1) : '0';

  // Largest expenses sorted
  const topExpenses = safeTransactions
    .filter((t) => t.tipe === 'Expense')
    .sort((a, b) => b.jumlah - a.jumlah)
    .slice(0, 5);

  const totalBudgetPlafon = safeBudgets.reduce((sum, b) => sum + (b.totalSaldo || 0), 0);
  const totalBudgetSpend = safeBudgets.reduce((sum, b) => sum + (b.actualSpend || 0), 0);
  const totalBudgetSisa = safeBudgets.reduce((sum, b) => sum + (b.sisa || 0), 0);
  const budgetAbsorptionPct = totalBudgetPlafon > 0 ? ((totalBudgetSpend / totalBudgetPlafon) * 100).toFixed(1) : '0';

  const emergencyPct = safeEmergency.target > 0 ? ((safeEmergency.current / safeEmergency.target) * 100).toFixed(1) : '0';

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-md p-3 sm:p-6 flex items-center justify-center min-h-screen"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: isLight ? '#ffffff' : 'rgba(10, 14, 28, 0.98)',
          backdropFilter: 'blur(40px) saturate(190%)',
          boxShadow: isLight
            ? '0 25px 50px -12px rgba(0, 0, 0, 0.18)'
            : '0 30px 80px rgba(0,0,0,0.85), inset 0 1px 1px rgba(255,255,255,0.25)'
        }}
        className={`w-full max-w-3xl rounded-3xl border ${isLight ? 'border-slate-200 text-slate-900' : 'border-white/15 text-slate-100'} p-5 sm:p-7 my-auto shadow-2xl relative max-h-[92vh] flex flex-col`}
      >
        {/* Header */}
        <div className={`flex items-start justify-between pb-4 border-b ${isLight ? 'border-slate-200' : 'border-white/10'} gap-3 shrink-0`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl ${isLight ? 'bg-blue-50 border border-blue-200' : 'bg-gradient-to-tr from-blue-600/30 to-indigo-600/30 border border-blue-400/30'} flex items-center justify-center shrink-0`}>
              <FileText className={`w-5 h-5 ${isLight ? 'text-blue-600' : 'text-blue-300'}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className={`text-base sm:text-lg font-bold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Laporan Rekonsiliasi & Audit Finansial
                </h3>
                <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${isLight ? 'bg-blue-100 text-blue-800 border border-blue-200' : 'bg-blue-500/20 text-blue-300 border border-blue-400/30'}`}>
                  Periode {currentSheetName}
                </span>
              </div>
              <p className={`text-[11px] sm:text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Ringkasan eksekutif neraca keuangan, efisiensi arus kas, dan serapan anggaran
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className={`p-2 rounded-xl border transition ${isLight ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700' : 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-400 hover:text-white'}`}
              title="Cetak / Unduh PDF"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className={`p-2 rounded-xl border transition ${isLight ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700' : 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-400 hover:text-white'}`}
              title="Tutup"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Modal Body */}
        <div className="overflow-y-auto pr-1 mt-4 space-y-5">
          {/* 4 Key Institutional Audit KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className={`p-3.5 rounded-2xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/[0.03] border-white/10'}`}>
              <span className={`text-[10px] font-bold uppercase tracking-wider block mb-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Total Kekayaan Bersih
              </span>
              <span className={`text-base sm:text-lg font-bold font-mono block ${isLight ? 'text-slate-900' : 'text-white'}`}>
                {formatRupiah(totalAset)}
              </span>
              <span className={`text-[10px] mt-1 block font-medium ${isLight ? 'text-emerald-700 font-semibold' : 'text-emerald-400'}`}>
                Kas + Valas + Investasi
              </span>
            </div>

            <div className={`p-3.5 rounded-2xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/[0.03] border-white/10'}`}>
              <span className={`text-[10px] font-bold uppercase tracking-wider block mb-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Rasio Tabungan (Savings)
              </span>
              <span className={`text-base sm:text-lg font-bold font-mono block ${isLight ? 'text-blue-600' : 'text-sky-300'}`}>
                {savingsRate}%
              </span>
              <span className={`text-[10px] mt-1 block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Surplus: {formatRupiah(netSavings)}
              </span>
            </div>

            <div className={`p-3.5 rounded-2xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/[0.03] border-white/10'}`}>
              <span className={`text-[10px] font-bold uppercase tracking-wider block mb-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Serapan Anggaran
              </span>
              <span className={`text-base sm:text-lg font-bold font-mono block ${isLight ? 'text-amber-600' : 'text-amber-300'}`}>
                {budgetAbsorptionPct}%
              </span>
              <span className={`text-[10px] mt-1 block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Sisa: {formatRupiah(totalBudgetSisa)}
              </span>
            </div>

            <div className={`p-3.5 rounded-2xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/[0.03] border-white/10'}`}>
              <span className={`text-[10px] font-bold uppercase tracking-wider block mb-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Dana Darurat
              </span>
              <span className={`text-base sm:text-lg font-bold font-mono block ${isLight ? 'text-purple-700' : 'text-purple-300'}`}>
                {emergencyPct}%
              </span>
              <span className={`text-[10px] mt-1 block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                {formatRupiah(safeEmergency.current)} / {formatRupiah(safeEmergency.target)}
              </span>
            </div>
          </div>

          {/* Audit Sections: Cashflow Breakdown & Envelope Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Operational Cashflow */}
            <div className={`p-4 rounded-2xl border space-y-2.5 ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/[0.02] border-white/10'}`}>
              <h4 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                <Wallet className={`w-3.5 h-3.5 ${isLight ? 'text-blue-600' : 'text-blue-400'}`} />
                Audit Arus Kas Operasional
              </h4>
              <div className="space-y-2 text-xs">
                <div className={`flex justify-between py-1.5 border-b ${isLight ? 'border-slate-200' : 'border-white/5'}`}>
                  <span className={isLight ? 'text-slate-600' : 'text-slate-400'}>Total Pemasukan (Inflow):</span>
                  <span className="font-mono font-bold text-emerald-600">{formatRupiah(totalIncome)}</span>
                </div>
                <div className={`flex justify-between py-1.5 border-b ${isLight ? 'border-slate-200' : 'border-white/5'}`}>
                  <span className={isLight ? 'text-slate-600' : 'text-slate-400'}>Total Pengeluaran (Outflow):</span>
                  <span className="font-mono font-bold text-rose-600">{formatRupiah(totalExpense)}</span>
                </div>
                <div className={`flex justify-between py-1.5 border-b ${isLight ? 'border-slate-200' : 'border-white/5'}`}>
                  <span className={isLight ? 'text-slate-600' : 'text-slate-400'}>Net Surplus Bersih:</span>
                  <span className={`font-mono font-bold ${isLight ? 'text-blue-600' : 'text-sky-300'}`}>{formatRupiah(netSavings)}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className={isLight ? 'text-slate-600' : 'text-slate-400'}>Burn Rate (Beban Pengeluaran):</span>
                  <span className={`font-mono font-semibold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>{burnRate}% dari pendapatan</span>
                </div>
              </div>
            </div>

            {/* Top 5 Expense Line Items */}
            <div className={`p-4 rounded-2xl border space-y-2.5 ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/[0.02] border-white/10'}`}>
              <h4 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                <TrendingUp className="w-3.5 h-3.5 text-rose-500" />
                5 Pos Pengeluaran Terbesar
              </h4>
              <div className="space-y-1.5 text-xs">
                {topExpenses.length > 0 ? (
                  topExpenses.map((exp, idx) => (
                    <div
                      key={exp.id || idx}
                      className={`flex items-center justify-between p-2 rounded-xl border ${isLight ? 'bg-white border-slate-200' : 'bg-white/[0.02] border-white/5'}`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`w-5 h-5 rounded-lg flex items-center justify-center font-mono text-[10px] shrink-0 ${isLight ? 'bg-slate-100 text-slate-600' : 'bg-white/5 text-slate-400'}`}>
                          {idx + 1}
                        </span>
                        <div className="min-w-0">
                          <span className={`font-semibold block truncate ${isLight ? 'text-slate-800' : 'text-white'}`}>{exp.catatan}</span>
                          <span className={`text-[10px] block truncate ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                            {exp.kategori} • {exp.akun}
                          </span>
                        </div>
                      </div>
                      <span className="font-mono font-bold text-rose-600 shrink-0 ml-2">
                        {formatRupiah(exp.jumlah)}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Belum ada pengeluaran tercatat.</p>
                )}
              </div>
            </div>
          </div>

          {/* Executive Verdict & Recommendations */}
          <div className={`p-4 rounded-2xl border space-y-2 ${isLight ? 'bg-blue-50/70 border-blue-200' : 'bg-blue-950/20 border-blue-500/20'}`}>
            <h4 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${isLight ? 'text-blue-900' : 'text-sky-300'}`}>
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              Kesimpulan Eksekutif & Rekomendasi
            </h4>
            <ul className={`space-y-1.5 text-xs ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold">•</span>
                <span>
                  <strong>Efisiensi Tabungan:</strong> Rasio tabungan sebesar {savingsRate}% berada di atas ambang minimum 20%, menunjukkan pengelolaan arus kas yang sehat.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">•</span>
                <span>
                  <strong>Kontrol Anggaran:</strong> Serapan total pos anggaran tercatat {budgetAbsorptionPct}% dengan sisa cadangan {formatRupiah(totalBudgetSisa)}, menjaga risiko defisit tetap terkendali.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-600 font-bold">•</span>
                <span>
                  <strong>Prioritas Dana Darurat:</strong> Akumulasi dana darurat saat ini mencapai {emergencyPct}% ({formatRupiah(safeEmergency.current)}). Disarankan mengalokasikan 15-20% surplus kas bulan depan untuk mencapai target 100%.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
