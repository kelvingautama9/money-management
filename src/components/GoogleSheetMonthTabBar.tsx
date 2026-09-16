import React, { useState } from 'react';
import { GlassSettings } from '../types';
import { User } from 'firebase/auth';
import {
  Calendar,
  FileSpreadsheet,
  ChevronDown,
  X,
  Plus,
  RefreshCw,
  CheckCircle2,
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface GoogleSheetMonthTabBarProps {
  currentSheet: string;
  onSelectSheet: (sheetName: string) => void;
  availableSheets: string[];
  onAddNewSheet?: (newSheetName: string) => void;
  isGoogleConnected: boolean;
  user: User | null;
  isSyncing: boolean;
  onSyncCurrentSheet: () => void;
  settings: GlassSettings;
  txCountsByMonth?: Record<string, number>;
}

export const GoogleSheetMonthTabBar: React.FC<GoogleSheetMonthTabBarProps> = ({
  currentSheet,
  onSelectSheet,
  availableSheets,
  onAddNewSheet,
  isGoogleConnected,
  user,
  isSyncing,
  onSyncCurrentSheet,
  settings,
  txCountsByMonth = {}
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newSheetInput, setNewSheetInput] = useState('');

  const currentCount = txCountsByMonth[currentSheet] || txCountsByMonth[currentSheet.toUpperCase()] || 0;

  const handleSelect = (sheet: string) => {
    onSelectSheet(sheet);
    // Menghilang / kembali ke button kecil segera setelah dipilih
    setIsModalOpen(false);
  };

  const handleCreateNewSheet = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newSheetInput.trim().toUpperCase();
    if (!clean) return;

    if (onAddNewSheet) {
      onAddNewSheet(clean);
    } else {
      onSelectSheet(clean);
    }
    setNewSheetInput('');
    setIsAddingNew(false);
    setIsModalOpen(false);
  };

  const specular = (settings.specularIntensity || 85) / 100;

  return (
    <>
      {/* COMPACT SINGLE BUTTON (Tidak Menghalangi Layar Mobile/Tab) */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsModalOpen(true)}
            style={{
              background: 'rgba(15, 23, 42, 0.75)',
              backdropFilter: `blur(${Math.max(settings.blur, 16)}px) saturate(180%)`,
              WebkitBackdropFilter: `blur(${Math.max(settings.blur, 16)}px) saturate(180%)`,
              borderColor: 'rgba(255, 255, 255, 0.15)',
              boxShadow: '0 8px 24px -6px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
            }}
            className="group relative inline-flex items-center gap-2 sm:gap-2.5 px-3.5 sm:px-4 py-2 rounded-full border text-xs font-semibold text-slate-100 hover:text-white transition-all duration-200 active:scale-95 hover:border-blue-400/50 hover:bg-blue-950/40"
            title="Klik untuk memilih bulan rekapan Google Sheet"
          >
            {/* Sheet Icon with Active Pulse */}
            <span className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
              <Calendar className="w-3 h-3" />
            </span>

            <div className="flex items-center gap-1.5 text-left">
              <span className="text-slate-400 text-[11px] hidden sm:inline">Bulan Rekapan:</span>
              <strong className="font-extrabold text-sky-300 tracking-wide">
                {currentSheet}
              </strong>
            </div>

            {/* Transaction Count Badge */}
            {currentCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/25 text-blue-200 border border-blue-400/30 shrink-0">
                {currentCount} tx
              </span>
            )}

            {/* Dropdown Chevron indicator */}
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-transform duration-200 group-hover:translate-y-0.5" />
          </button>

          {/* Quick Refresh Button for Current Sheet */}
          <button
            onClick={onSyncCurrentSheet}
            disabled={isSyncing}
            className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 flex items-center justify-center text-slate-300 hover:text-sky-300 transition active:scale-90 disabled:opacity-50"
            title={`Sinkronkan data khusus lembar ${currentSheet}`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-sky-400' : ''}`} />
          </button>
        </div>

        {/* Status Mode Badge */}
        <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-slate-400">
          <span className={`w-2 h-2 rounded-full ${isGoogleConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
          <span>
            {isGoogleConnected ? `Tersinkron Tab ${currentSheet}` : 'Mode Lokal'}
          </span>
        </div>
      </div>

      {/* POPUP MODAL PILIHAN BULAN (Menghilang Otomatis Ketika Dipilih) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          {/* Frosted Dark Backdrop */}
          <div
            onClick={() => setIsModalOpen(false)}
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
          />

          {/* Dialog Container */}
          <div
            style={{
              background: 'rgba(11, 15, 29, 0.88)',
              backdropFilter: `blur(${Math.max(settings.blur, 28)}px) saturate(190%)`,
              WebkitBackdropFilter: `blur(${Math.max(settings.blur, 28)}px) saturate(190%)`,
              borderColor: `rgba(255, 255, 255, ${0.2 * specular})`,
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), inset 0 1px 1px rgba(255, 255, 255, 0.3)'
            }}
            className="relative z-10 w-full max-w-md rounded-3xl border p-5 sm:p-6 text-white shadow-2xl space-y-4 max-h-[85vh] flex flex-col"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-tight">
                    Pilih Bulan Rekapan Google Sheet
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Otomatis membaca, memuat, dan mengedit isi tab sheet
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 flex items-center justify-center text-slate-300 hover:text-white transition active:scale-95"
                title="Tutup"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* List of Month Sheets */}
            <div className="space-y-2 overflow-y-auto no-scrollbar flex-1 pr-1">
              <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 px-1">
                Tab Sheet Tersedia
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {availableSheets.map((sheet) => {
                  const isActive = sheet.toUpperCase() === currentSheet.toUpperCase();
                  const count = txCountsByMonth[sheet] || txCountsByMonth[sheet.toUpperCase()] || 0;

                  return (
                    <button
                      key={sheet}
                      onClick={() => handleSelect(sheet)}
                      className={`w-full flex items-center justify-between p-3 rounded-2xl border text-left transition-all duration-150 active:scale-95 ${
                        isActive
                          ? 'bg-gradient-to-r from-blue-600/70 to-indigo-600/70 border-blue-400 text-white shadow-lg shadow-blue-600/25 ring-1 ring-blue-400/50'
                          : 'bg-white/[0.04] hover:bg-white/[0.09] border-white/10 text-slate-200 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            isActive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
                          }`}
                        />
                        <div>
                          <p className="text-xs font-bold tracking-wide">{sheet}</p>
                          <p className="text-[10px] text-slate-300/80">
                            {count > 0 ? `${count} Transaksi` : '0 Transaksi'}
                          </p>
                        </div>
                      </div>

                      {isActive ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
                      ) : (
                        <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Form Tambah Sheet Baru */}
              {isAddingNew ? (
                <form onSubmit={handleCreateNewSheet} className="mt-3 p-3 rounded-2xl bg-white/[0.05] border border-white/15 space-y-2">
                  <label className="text-[11px] font-semibold text-slate-300 block">
                    Nama Tab Sheet Baru (Contoh: OKTOBER):
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="NAMA BULAN"
                      value={newSheetInput}
                      onChange={(e) => setNewSheetInput(e.target.value)}
                      className="flex-1 px-3 py-1.5 rounded-xl bg-black/40 border border-white/20 text-xs text-white uppercase focus:border-blue-400 outline-none"
                      autoFocus
                    />
                    <button
                      type="submit"
                      className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white shadow"
                    >
                      Buka
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAddingNew(false)}
                      className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-slate-300"
                    >
                      Batal
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  onClick={() => setIsAddingNew(true)}
                  className="w-full mt-2 py-2.5 px-3 rounded-2xl border border-dashed border-white/20 hover:border-blue-400/50 hover:bg-blue-500/10 text-xs font-semibold text-slate-300 hover:text-sky-300 transition flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Tab Sheet Baru</span>
                </button>
              )}
            </div>

            {/* Footer Action */}
            <div className="pt-3 border-t border-white/10 flex items-center justify-between shrink-0">
              <span className="text-[10px] text-slate-400">
                Pilih salah satu bulan untuk memuat data
              </span>
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-medium text-slate-300 hover:text-white transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
