import React, { useState } from 'react';
import { GlassSettings, ThemeMode } from '../types';
import { ActivePage } from './NavigationTabBar';
import { User } from 'firebase/auth';
import {
  X,
  LayoutDashboard,
  PlusCircle,
  PieChart,
  TrendingUp,
  Landmark,
  FileSpreadsheet,
  FileText,
  Sliders,
  RefreshCw,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  UploadCloud,
  LogOut,
  Layers,
  CheckCircle2,
  ExternalLink,
  Eye,
  EyeOff,
  FolderSync,
  Sun,
  Moon,
  Palette,
  MoonStar,
  Calculator
} from 'lucide-react';

interface GlassMenuPopupProps {
  isOpen: boolean;
  onClose: () => void;
  activePage: ActivePage;
  onSelectPage: (page: ActivePage) => void;
  settings: GlassSettings;
  txCount: number;
  onOpenReport: () => void;
  onOpenInspector: () => void;
  onOpenProjectManager?: () => void;
  onOpenCalculator?: () => void;
  onSelectTheme?: (theme: ThemeMode) => void;
  isGoogleConnected: boolean;
  user?: User | null;
  spreadsheetId?: string;
  sheetName?: string;
  isSyncing?: boolean;
  lastSynced?: Date | null;
  onLogin?: () => Promise<void>;
  onLogout?: () => Promise<void>;
  onUpdateSpreadsheetId?: (id: string) => void;
  onUpdateSheetName?: (name: string) => void;
  onSyncNow?: () => Promise<void>;
  onPushToSheet?: () => Promise<void>;
  showSyncBarOnDashboard?: boolean;
  onToggleSyncBarOnDashboard?: () => void;
}

export const GlassMenuPopup: React.FC<GlassMenuPopupProps> = ({
  isOpen,
  onClose,
  activePage,
  onSelectPage,
  settings,
  txCount,
  onOpenReport,
  onOpenInspector,
  onOpenProjectManager,
  onOpenCalculator,
  onSelectTheme,
  isGoogleConnected,
  user,
  spreadsheetId = '',
  sheetName = 'Sheet1',
  isSyncing = false,
  lastSynced,
  onLogin,
  onLogout,
  onUpdateSpreadsheetId,
  onUpdateSheetName,
  onSyncNow,
  onPushToSheet,
  showSyncBarOnDashboard = false,
  onToggleSyncBarOnDashboard
}) => {
  const [showConfig, setShowConfig] = useState(false);
  const [tempId, setTempId] = useState(spreadsheetId);
  const [tempSheetName, setTempSheetName] = useState(sheetName);

  if (!isOpen) return null;

  const handleSaveConfig = () => {
    onUpdateSpreadsheetId?.(tempId);
    onUpdateSheetName?.(tempSheetName);
    setShowConfig(false);
  };

  const mainMenus = [
    {
      id: 'summary' as ActivePage,
      title: 'Executive Summary',
      description: 'Dashboard Net Worth, arus kas bulanan & ringkasan aset',
      icon: <LayoutDashboard className="w-5 h-5 text-blue-400" />,
      badge: 'Utama',
      gradient: 'from-blue-600/20 to-indigo-600/20'
    },
    {
      id: 'cashflow' as ActivePage,
      title: 'Input Cashflow',
      description: 'Pencatatan Pemasukan & Pengeluaran auto-sync Google Sheets',
      icon: <PlusCircle className="w-5 h-5 text-emerald-400" />,
      badge: 'Auto-Sync',
      gradient: 'from-emerald-600/20 to-teal-600/20'
    },
    {
      id: 'budgeting' as ActivePage,
      title: 'Budgeting Envelopes',
      description: '4 Kantong Anggaran: Listrik, Transport, Dating, Entertainment',
      icon: <PieChart className="w-5 h-5 text-amber-400" />,
      badge: '4 Pos',
      gradient: 'from-amber-600/20 to-orange-600/20'
    },
    {
      id: 'portfolio' as ActivePage,
      title: 'Portofolio & Investasi',
      description: 'Pluang, Valas BCA, Binance USDT & Progres Dana Darurat',
      icon: <TrendingUp className="w-5 h-5 text-sky-400" />,
      badge: '+2.1% MoM',
      gradient: 'from-sky-600/20 to-cyan-600/20'
    },
    {
      id: 'accounts' as ActivePage,
      title: 'Saldo by Rekening',
      description: 'Pantau saldo 9 akun rekening & Transfer Antar Bank',
      icon: <Landmark className="w-5 h-5 text-purple-400" />,
      badge: '9 Akun',
      gradient: 'from-purple-600/20 to-pink-600/20'
    },
    {
      id: 'journal' as ActivePage,
      title: 'Jurnal & Rekap Data',
      description: 'Tabel lengkap mutasi spreadsheet, filter, edit & ekspor',
      icon: <FileSpreadsheet className="w-5 h-5 text-blue-400" />,
      badge: txCount > 0 ? `${txCount} Baris` : undefined,
      gradient: 'from-indigo-600/20 to-blue-600/20'
    }
  ];

  const handleSelect = (page: ActivePage) => {
    onSelectPage(page);
    onClose();
  };

  const opacityDecimal = (settings.translucency || 65) / 100;
  const darkTintDecimal = (settings.darkTint || 45) / 100;
  const specular = (settings.specularIntensity || 85) / 100;
  const bgColor = `rgba(${Math.round(10 * (1 - darkTintDecimal))}, ${Math.round(14 * (1 - darkTintDecimal))}, ${Math.round(26 * (1 - darkTintDecimal))}, ${Math.min(0.85, opacityDecimal + 0.15)})`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
      {/* Semi-transparent Frosted Dark Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/65 backdrop-blur-md transition-opacity"
      />

      {/* Semi-Transparent Liquid Glass Popup Container */}
      <div
        style={{
          backgroundColor: bgColor,
          backdropFilter: `blur(${Math.max(28, settings.blur)}px) saturate(190%)`,
          WebkitBackdropFilter: `blur(${Math.max(28, settings.blur)}px) saturate(190%)`,
          borderColor: `rgba(255, 255, 255, ${0.18 * specular})`,
          boxShadow: `
            0 30px 60px -15px rgba(0, 0, 0, 0.8),
            inset 0 1.5px 1px rgba(255, 255, 255, ${0.45 * specular}),
            inset 0 -1px 2px rgba(0, 0, 0, 0.6)
          `
        }}
        className="relative z-10 w-full max-w-2xl rounded-3xl border overflow-hidden p-5 sm:p-6 text-white max-h-[90vh] flex flex-col no-scrollbar"
      >
        {/* Top Rim Specular Glare */}
        <div
          className="absolute top-0 inset-x-6 h-[1.5px] pointer-events-none"
          style={{
            background: `linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, ${0.8 * specular}) 50%, transparent 100%)`
          }}
        />

        {/* Header bar */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-500/30 to-indigo-500/30 border border-white/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-blue-300" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Menu & Navigasi Cepat
              </h3>
              <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isGoogleConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                  }`}
                />
                <span>
                  {isGoogleConnected
                    ? 'Google Sheets Terkoneksi'
                    : 'Penyimpanan Lokal Aktif'}
                </span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 flex items-center justify-center text-slate-300 hover:text-white transition active:scale-95"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable / Swipeable Menu Grid */}
        <div className="py-4 overflow-y-auto no-scrollbar space-y-4 flex-1">
          {/* GOOGLE SHEETS LIVE SYNC ENGINE PANEL INSIDE MENU */}
          <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-white tracking-tight">
                      Google Sheets Live Sync Engine
                    </h4>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${
                        user
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                      }`}
                    >
                      {user ? 'Online Terhubung' : 'Mode Lokal'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {user ? (
                      <span>
                        Akun: <strong className="text-slate-200">{user.email}</strong>
                        {lastSynced && ` • Sync: ${lastSynced.toLocaleTimeString('id-ID')}`}
                      </span>
                    ) : (
                      'Hubungkan akun Google untuk sinkronisasi dua arah real-time'
                    )}
                  </p>
                </div>
              </div>

              {/* Login or Action buttons */}
              <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                {!user ? (
                  <div className="flex flex-wrap items-center gap-1.5">
                    {onOpenProjectManager && (
                      <button
                        onClick={() => {
                          onClose();
                          onOpenProjectManager();
                        }}
                        className="px-3 py-1.5 rounded-full bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-400/40 text-xs font-semibold text-indigo-200 flex items-center gap-1.5 transition active:scale-95"
                        title="Atur & Ganti Project Google Sheet"
                      >
                        <FolderSync className="w-3.5 h-3.5" />
                        <span>Project Sheet</span>
                      </button>
                    )}
                    <button
                      onClick={() => onLogin?.()}
                      disabled={isSyncing}
                      className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs shadow-md active:scale-95 transition disabled:opacity-50"
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 48 48">
                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                      </svg>
                      Sign in with Google
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => onSyncNow?.()}
                      disabled={isSyncing}
                      className="px-2.5 py-1.5 rounded-xl bg-blue-600/30 hover:bg-blue-600/50 border border-blue-400/40 text-xs font-semibold text-blue-200 flex items-center gap-1 transition active:scale-95 disabled:opacity-50"
                      title="Tarik data terkini dari Sheets"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                      <span>{isSyncing ? 'Sinkron...' : 'Tarik'}</span>
                    </button>

                    <button
                      onClick={() => onPushToSheet?.()}
                      disabled={isSyncing}
                      className="px-2.5 py-1.5 rounded-xl bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-400/40 text-xs font-semibold text-emerald-200 flex items-center gap-1 transition active:scale-95 disabled:opacity-50"
                      title="Kirim mutasi lokal ke Google Sheets"
                    >
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>Kirim</span>
                    </button>

                    {onOpenProjectManager && (
                      <button
                        onClick={() => {
                          onClose();
                          onOpenProjectManager();
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-400/40 text-xs font-semibold text-indigo-200 flex items-center gap-1 transition active:scale-95"
                        title="Buka Pengaturan & Ganti Project Google Sheet"
                      >
                        <FolderSync className="w-3.5 h-3.5" />
                        <span>Project</span>
                      </button>
                    )}

                    <button
                      onClick={() => setShowConfig(!showConfig)}
                      className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-medium text-slate-300 transition"
                      title="Atur ID & Tab Spreadsheet Cepat"
                    >
                      <Layers className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => onLogout?.()}
                      className="px-2.5 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 text-xs font-medium text-rose-300 transition"
                      title="Keluar dari akun Google"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Config drawer inside menu */}
            {showConfig && (
              <div className="mt-3 pt-3 border-t border-white/10 space-y-2 animate-in fade-in duration-200">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="sm:col-span-2">
                    <label className="text-[10px] text-slate-300 font-semibold block mb-1">
                      Link URL atau ID Google Spreadsheet:
                    </label>
                    <input
                      type="text"
                      placeholder="https://docs.google.com/spreadsheets/d/.../edit"
                      value={tempId}
                      onChange={(e) => setTempId(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-xl text-xs bg-black/40 border border-white/20 text-white font-mono focus:border-blue-400 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-300 font-semibold block mb-1">
                      Nama Tab Sheet:
                    </label>
                    <input
                      type="text"
                      placeholder="Sheet1"
                      value={tempSheetName}
                      onChange={(e) => setTempSheetName(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-xl text-xs bg-black/40 border border-white/20 text-white focus:border-blue-400 outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] text-slate-400">
                    ID Sheet aktif disimpan ke sistem browser
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setShowConfig(false)}
                      className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] text-slate-300"
                    >
                      Batal
                    </button>
                    <button
                      onClick={handleSaveConfig}
                      className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-[11px] font-bold text-white shadow"
                    >
                      Simpan
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Dashboard Display Switch Toggle */}
            {onToggleSyncBarOnDashboard && (
              <div className="mt-2.5 pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1.5">
                  {showSyncBarOnDashboard ? (
                    <Eye className="w-3.5 h-3.5 text-blue-400" />
                  ) : (
                    <EyeOff className="w-3.5 h-3.5 text-slate-500" />
                  )}
                  Tampilkan bar ini di atas Dashboard:
                </span>
                <button
                  onClick={onToggleSyncBarOnDashboard}
                  className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border transition ${
                    showSyncBarOnDashboard
                      ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                      : 'bg-white/5 text-slate-400 border-white/10 hover:text-white'
                  }`}
                >
                  {showSyncBarOnDashboard ? 'Ditampilkan' : 'Disembunyikan (Ringkas)'}
                </button>
              </div>
            )}
          </div>

          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block px-1">
            Pilih Halaman
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {mainMenus.map((menu) => {
              const isActive = activePage === menu.id;
              return (
                <button
                  key={menu.id}
                  onClick={() => handleSelect(menu.id)}
                  style={{
                    backgroundColor: isActive
                      ? 'rgba(59, 130, 246, 0.25)'
                      : 'rgba(255, 255, 255, 0.04)',
                    backdropFilter: 'blur(16px)',
                    borderColor: isActive
                      ? 'rgba(96, 165, 250, 0.4)'
                      : 'rgba(255, 255, 255, 0.08)'
                  }}
                  className="group flex items-start gap-3 p-3.5 rounded-2xl border text-left transition-all duration-200 hover:bg-white/[0.09] hover:border-white/20 active:scale-[0.98]"
                >
                  <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    {menu.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span
                        className={`text-sm font-bold truncate ${
                          isActive ? 'text-blue-300' : 'text-white'
                        }`}
                      >
                        {menu.title}
                      </span>
                      {menu.badge && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/10 text-slate-300 shrink-0">
                          {menu.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-1">
                      {menu.description}
                    </p>
                  </div>
                  <ChevronRight
                    className={`w-4 h-4 shrink-0 mt-2 transition-transform ${
                      isActive
                        ? 'text-blue-400 translate-x-0.5'
                        : 'text-slate-500 group-hover:text-slate-300 group-hover:translate-x-0.5'
                    }`}
                  />
                </button>
              );
            })}
          </div>

          {/* Quick Utility Tools */}
          <div className="pt-3 border-t border-white/10 mt-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block px-1 mb-2">
              Utilitas & Laporan
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {onOpenProjectManager && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenProjectManager();
                  }}
                  className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.09] border border-white/10 text-left transition active:scale-[0.98]"
                >
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
                    <FolderSync className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-white">Project Sheets</h5>
                    <p className="text-[10px] text-slate-400">Ganti akun & file spreadsheet</p>
                  </div>
                </button>
              )}

              {onOpenCalculator && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenCalculator();
                  }}
                  className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.09] border border-white/10 text-left transition active:scale-[0.98]"
                >
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                    <Calculator className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-white">Kalkulator Pensiun</h5>
                    <p className="text-[10px] text-slate-400">Simulasi target & smart saran</p>
                  </div>
                </button>
              )}

              <button
                onClick={() => {
                  onClose();
                  onOpenReport();
                }}
                className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.09] border border-white/10 text-left transition active:scale-[0.98]"
              >
                <div className="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-white">Laporan Otomatis</h5>
                  <p className="text-[10px] text-slate-400">Analisis keuangan & cetak rekap</p>
                </div>
              </button>

              <button
                onClick={() => {
                  onClose();
                  onOpenInspector();
                }}
                className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.09] border border-white/10 text-left transition active:scale-[0.98]"
              >
                <div className="w-8 h-8 rounded-xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-white">Kustomisasi Kaca</h5>
                  <p className="text-[10px] text-slate-400">Atur blur & efek transparansi</p>
                </div>
              </button>
            </div>
          </div>

          {/* THEME SELECTION PALETTE INSIDE MENU */}
          {onSelectTheme && (
            <div className="pt-3 border-t border-white/10 mt-3">
              <div className="flex items-center justify-between px-1 mb-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-blue-400" />
                  Pilihan Tema Tampilan (Baru)
                </span>
                <span className="text-[10px] text-slate-400">
                  Aktif: <strong className="text-blue-300 capitalize">{settings.themeMode || 'Dark'}</strong>
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'dark' as ThemeMode, name: 'Dark Glass', icon: <Moon className="w-4 h-4 text-sky-400" />, desc: 'Obsidian Neon' },
                  { id: 'light' as ThemeMode, name: 'Light Apple', icon: <Sun className="w-4 h-4 text-amber-500" />, desc: 'Clean White' },
                  { id: 'beige' as ThemeMode, name: 'Warm Beige', icon: <Palette className="w-4 h-4 text-amber-700" />, desc: 'Paper Aesthetic' },
                  { id: 'midnight' as ThemeMode, name: 'Midnight OLED', icon: <MoonStar className="w-4 h-4 text-purple-400" />, desc: 'Pure Black' },
                ].map((th) => {
                  const isActive = (settings.themeMode || 'dark') === th.id;
                  return (
                    <button
                      key={th.id}
                      onClick={() => onSelectTheme(th.id)}
                      className={`p-2.5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                        isActive
                          ? 'bg-blue-600/30 border-blue-400/80 ring-1 ring-blue-400 text-white shadow-md'
                          : 'bg-white/[0.04] hover:bg-white/[0.08] border-white/10 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center">
                          {th.icon}
                        </div>
                        {isActive && (
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_6px_#38bdf8]" />
                        )}
                      </div>
                      <div>
                        <span className="text-xs font-bold block leading-tight">{th.name}</span>
                        <span className="text-[9px] text-slate-400 block mt-0.5">{th.desc}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400 shrink-0">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Kelvin Gautama • Google Sheets Engine
          </span>
          <button
            onClick={onClose}
            className="text-blue-400 hover:text-blue-300 font-medium"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
