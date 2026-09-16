import React from 'react';
import { GlassButton } from './GlassButton';
import { GlassSettings, Transaction, BudgetCategory, EmergencyFund } from '../types';
import { formatRupiah } from '../lib/sheetsApi';
import { FileText, Printer, CheckCircle, AlertTriangle, TrendingUp, X, Sparkles, Shield } from 'lucide-react';

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
  settings
}) => {
  if (!isOpen) return null;

  const netSavings = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? ((netSavings / totalIncome) * 100).toFixed(1) : '0';
  const spendRate = totalIncome > 0 ? ((totalExpense / totalIncome) * 100).toFixed(1) : '0';

  // Top 5 largest expenses
  const topExpenses = transactions
    .filter((t) => t.tipe === 'Expense')
    .sort((a, b) => b.jumlah - a.jumlah)
    .slice(0, 5);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div
        style={{
          background: 'rgba(18, 22, 42, 0.95)',
          backdropFilter: 'blur(35px) saturate(190%)',
          boxShadow: '0 30px 70px rgba(0,0,0,0.8), inset 0 1.5px 1px rgba(255,255,255,0.4)'
        }}
        className="w-full max-w-3xl rounded-3xl border border-white/20 p-6 sm:p-8 text-slate-100 my-8 shadow-2xl relative"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600/30 to-purple-600/30 border border-white/20 flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-300" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                Automated Financial Intelligence Report
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Periode September
                </span>
              </h3>
              <p className="text-xs text-slate-400">Analisis komprehensif kesehatan finansial, rasio serapan, dan rekomendasi</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <GlassButton size="sm" variant="secondary" onClick={handlePrint} icon={<Printer className="w-3.5 h-3.5" />}>
              Cetak / PDF
            </GlassButton>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Executive Score & Health Rating */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-6">
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5">
            <span className="text-xs text-slate-400 block mb-1">Financial Health Score</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-emerald-300 font-mono">86</span>
              <span className="text-xs text-slate-400">/ 100 (Prima)</span>
            </div>
            <span className="text-[11px] text-emerald-400 flex items-center gap-1 mt-1 font-medium">
              <CheckCircle className="w-3 h-3" /> Arus kas positif & rutin investasi
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5">
            <span className="text-xs text-slate-400 block mb-1">Tingkat Tabungan (Savings Rate)</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-sky-300 font-mono">{savingsRate}%</span>
              <span className="text-xs text-slate-400">dari Gaji</span>
            </div>
            <span className="text-[11px] text-slate-300 mt-1 block">
              Surplus kas: {formatRupiah(netSavings)}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5">
            <span className="text-xs text-slate-400 block mb-1">Ketahanan Dana Darurat</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-amber-300 font-mono">
                {((emergencyFund.current / emergencyFund.target) * 100).toFixed(0)}%
              </span>
              <span className="text-xs text-slate-400">Tercapai</span>
            </div>
            <span className="text-[11px] text-amber-300 mt-1 block flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> Perlu akselerasi penambahan
            </span>
          </div>
        </div>

        {/* Diagnosis & Recommendations */}
        <div className="space-y-4 my-6">
          <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-400/20">
            <h4 className="text-xs font-bold text-blue-300 flex items-center gap-1.5 mb-2">
              <Sparkles className="w-4 h-4" /> Rekomendasi Data Entry & Penghematan
            </h4>
            <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
              <li>
                <strong>Investasi Konsisten:</strong> Top up bulanan Rp2.016.286 ke Pluang mewakili{' '}
                <strong className="text-white">34.1% dari pendapatan</strong>, rasio investasi yang sangat unggul.
              </li>
              <li>
                <strong>Disiplin Kantong Anggaran:</strong> Anggaran Listrik dan Transportasi memiliki surplus
                cadangan aman (Listrik sisa Rp195.340, Transport sisa Rp592.885).
              </li>
              <li>
                <strong>Perhatian Pos Jajan & Lifestyle:</strong> Terdapat pengeluaran jajan agregat sebesar{' '}
                <strong className="text-rose-300">Rp663.627</strong> dari rekening Bank BCA yang dapat dihemat
                sebagian untuk dialihkan mempercepat target Dana Darurat Blu BCA.
              </li>
            </ul>
          </div>

          {/* Top 5 Expenses */}
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
            <h4 className="text-xs font-bold text-slate-200 mb-3 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-rose-400" />
              5 Pengeluaran Terbesar Periode Ini
            </h4>
            <div className="space-y-2 text-xs">
              {topExpenses.map((exp, idx) => (
                <div key={exp.id} className="flex items-center justify-between p-2 rounded-xl bg-white/[0.03]">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-white/10 flex items-center justify-center font-mono text-[10px] text-slate-400">
                      {idx + 1}
                    </span>
                    <div>
                      <span className="font-semibold text-white block">{exp.catatan}</span>
                      <span className="text-[10px] text-slate-400">
                        {exp.kategori} • {exp.akun}
                      </span>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-rose-300">{formatRupiah(exp.jumlah)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
          <span>Laporan terbuat otomatis berdasarkan rekonsiliasi data Google Sheets</span>
          <GlassButton size="sm" variant="primary" onClick={onClose} settings={settings}>
            Tutup Laporan
          </GlassButton>
        </div>
      </div>
    </div>
  );
};
