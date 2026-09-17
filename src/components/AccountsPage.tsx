import React, { useState } from 'react';
import { GlassContainer } from './GlassContainer';
import { GlassButton } from './GlassButton';
import { GlassSettings, AccountBalance, Transaction } from '../types';
import { AVAILABLE_ACCOUNTS } from '../data/initialData';
import { formatRupiah } from '../lib/sheetsApi';
import {
  Landmark,
  CreditCard,
  Banknote,
  ShieldCheck,
  ArrowRightLeft,
  PieChart,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  Plus
} from 'lucide-react';

interface AccountsPageProps {
  accounts: AccountBalance[];
  settings: GlassSettings;
  onTransfer: (fromAccount: string, toAccount: string, amount: number, note: string) => Promise<void>;
  transactions: Transaction[];
}

export const AccountsPage: React.FC<AccountsPageProps> = ({
  accounts,
  settings,
  onTransfer,
  transactions
}) => {
  const [fromAcc, setFromAcc] = useState('Bank BCA');
  const [toAcc, setToAcc] = useState('Jago-Transport');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [transferSuccess, setTransferSuccess] = useState<string | null>(null);

  const totalLiquidCash = accounts
    .filter((a) => a.nama !== 'Investasi')
    .reduce((sum, a) => sum + a.totalSaldo, 0);

  const totalAllAssets = accounts.reduce((sum, a) => sum + a.totalSaldo, 0);

  const handleExecuteTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = parseFloat(amount.replace(/[^0-9.-]/g, ''));
    if (isNaN(numericAmount) || numericAmount <= 0) {
      alert('Masukkan nominal transfer yang valid.');
      return;
    }
    if (fromAcc === toAcc) {
      alert('Rekening sumber dan rekening tujuan tidak boleh sama.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onTransfer(fromAcc, toAcc, numericAmount, note || `Transfer internal dari ${fromAcc} ke ${toAcc}`);
      setTransferSuccess(`Berhasil memindahkan ${formatRupiah(numericAmount)} dari ${fromAcc} ke ${toAcc}!`);
      setAmount('');
      setNote('');
      setTimeout(() => setTransferSuccess(null), 5000);
    } catch (err: any) {
      alert(`Gagal transfer: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getAccountIcon = (nama: string) => {
    if (nama.toLowerCase().includes('cash')) return <Banknote className="w-5 h-5 text-emerald-400" />;
    if (nama.toLowerCase().includes('savings') || nama.toLowerCase().includes('darurat'))
      return <ShieldCheck className="w-5 h-5 text-amber-400" />;
    if (nama.toLowerCase().includes('jago') || nama.toLowerCase().includes('blu') || nama.toLowerCase().includes('allo'))
      return <CreditCard className="w-5 h-5 text-purple-400" />;
    return <Landmark className="w-5 h-5 text-blue-400" />;
  };

  return (
    <div className="space-y-6">
      {/* Top Banner KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <GlassContainer settings={settings} className="p-5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
            Total Kas Likuid Siap Pakai
          </span>
          <h3 className="text-2xl sm:text-3xl font-black text-white font-mono">{formatRupiah(totalLiquidCash)}</h3>
          <p className="text-xs text-emerald-400 mt-1">Rekening Bank, Kantong Budget, & E-Wallet</p>
        </GlassContainer>

        <GlassContainer settings={settings} className="p-5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
            Total Kekayaan Seluruh Rekening
          </span>
          <h3 className="text-2xl sm:text-3xl font-black text-sky-300 font-mono">{formatRupiah(totalAllAssets)}</h3>
          <p className="text-xs text-slate-400 mt-1">Termasuk Saldo Portofolio Investasi</p>
        </GlassContainer>

        <GlassContainer settings={settings} className="p-5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
            Jumlah Kantong & Rekening Terdaftar
          </span>
          <h3 className="text-2xl sm:text-3xl font-black text-purple-300 font-mono">{accounts.length} Akun</h3>
          <p className="text-xs text-slate-400 mt-1">Tersinkronisasi dengan Google Sheet</p>
        </GlassContainer>
      </div>

      {/* Grid of Accounts & Balances */}
      <div>
        <h3 className="text-lg font-bold text-white tracking-tight mb-3 flex items-center gap-2">
          Daftar Saldo Per Rekening & Kantong Finansial
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((acc) => {
            const isInvestasi = acc.nama.toLowerCase().includes('investasi');
            const percentOfLiquid = totalLiquidCash > 0 ? ((acc.totalSaldo / totalLiquidCash) * 100).toFixed(1) : '0';

            return (
              <GlassContainer key={acc.nama} settings={settings} className="p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                      {getAccountIcon(acc.nama)}
                    </div>
                    {acc.spendBulanIniPercent !== undefined && acc.spendBulanIniPercent > 0 && (
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        {acc.spendBulanIniPercent}% Spend
                      </span>
                    )}
                  </div>

                  <h4 className="text-base font-bold text-white tracking-tight">{acc.nama}</h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {isInvestasi ? 'Aset Investasi Multi-Platform' : 'Kantong Transaksional / Tabungan'}
                  </p>

                  <div className="mt-4 pt-3 border-t border-white/10">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs text-slate-400">Saldo Tersedia:</span>
                      {acc.totalSaldo < 0 && (
                        <span className="text-[10px] font-bold text-rose-400 bg-rose-500/20 px-2 py-0.5 rounded-full border border-rose-500/30">
                          Minus / Defisit
                        </span>
                      )}
                    </div>
                    <span className={`text-xl font-bold font-mono block ${acc.totalSaldo < 0 ? 'text-rose-400' : 'text-white'}`}>
                      {formatRupiah(acc.totalSaldo)}
                    </span>
                  </div>
                </div>

                {!isInvestasi && (
                  <div className="mt-4 pt-2.5 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
                    <span>Porsi Kas Likuid:</span>
                    <span className="font-semibold text-slate-300">{percentOfLiquid}%</span>
                  </div>
                )}
              </GlassContainer>
            );
          })}
        </div>
      </div>

      {/* Transfer Internal Form */}
      <GlassContainer settings={settings} className="p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <ArrowRightLeft className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Transfer & Alokasi Antar Rekening
              </h3>
              <p className="text-xs text-slate-400">
                Pindahkan saldo antar kantong (misal: BCA ke Jago Transport atau Pluang)
              </p>
            </div>
          </div>
        </div>

        {transferSuccess && (
          <div className="mb-5 p-3 rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-xs text-emerald-200 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{transferSuccess}</span>
          </div>
        )}

        <form onSubmit={handleExecuteTransfer} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-300 font-medium block mb-1">Dari Rekening Sumber</label>
              <select
                value={fromAcc}
                onChange={(e) => setFromAcc(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl text-xs liquid-glass-input"
              >
                {AVAILABLE_ACCOUNTS.map((a) => (
                  <option key={a} value={a} className="bg-slate-900">
                    {a}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-300 font-medium block mb-1">Ke Rekening Tujuan</label>
              <select
                value={toAcc}
                onChange={(e) => setToAcc(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl text-xs liquid-glass-input"
              >
                {AVAILABLE_ACCOUNTS.map((a) => (
                  <option key={a} value={a} className="bg-slate-900">
                    {a}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-300 font-medium block mb-1">Nominal Transfer (Rp)</label>
              <input
                type="number"
                required
                placeholder="Contoh: 200000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl text-xs liquid-glass-input font-mono font-semibold"
              />
            </div>

            <div>
              <label className="text-xs text-slate-300 font-medium block mb-1">Catatan Mutasi</label>
              <input
                type="text"
                placeholder="Contoh: Top up bensin bulanan"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl text-xs liquid-glass-input"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-white/10 flex justify-end">
            <GlassButton
              type="submit"
              variant="primary"
              size="md"
              disabled={isSubmitting}
              settings={settings}
              icon={<ArrowRightLeft className="w-4 h-4" />}
            >
              {isSubmitting ? 'Memproses Transfer...' : 'Eksekusi Transfer Rekening'}
            </GlassButton>
          </div>
        </form>
      </GlassContainer>
    </div>
  );
};
