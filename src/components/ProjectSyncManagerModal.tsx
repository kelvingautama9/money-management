import React from 'react';
import { User } from 'firebase/auth';
import { GlassSettings } from '../types';
import { ProjectSyncManager } from './ProjectSyncManager';
import { X, FolderSync, ShieldCheck } from 'lucide-react';

interface ProjectSyncManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  spreadsheetId: string;
  sheetName: string;
  onSaveProjectConfig: (spreadsheetId: string, sheetName: string, detectedSheets?: string[]) => void;
  onLogin: () => Promise<void>;
  onSyncNow: (targetId?: string, targetSheet?: string) => Promise<void>;
  isSyncing: boolean;
  settings: GlassSettings;
}

export const ProjectSyncManagerModal: React.FC<ProjectSyncManagerModalProps> = ({
  isOpen,
  onClose,
  user,
  spreadsheetId,
  sheetName,
  onSaveProjectConfig,
  onLogin,
  onSyncNow,
  isSyncing,
  settings
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      style={{
        backgroundColor: 'rgba(5, 8, 16, 0.75)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-2xl rounded-3xl border overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]"
        style={{
          background: 'rgba(17, 24, 39, 0.88)',
          backdropFilter: `blur(${Math.max(settings.blur, 24)}px) saturate(180%)`,
          WebkitBackdropFilter: `blur(${Math.max(settings.blur, 24)}px) saturate(180%)`,
          borderColor: 'rgba(255, 255, 255, 0.16)',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.8), inset 0 1px 1px rgba(255, 255, 255, 0.2)'
        }}
      >
        {/* Modal Top Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-white/10 shrink-0 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow">
              <FolderSync className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  Sinkronisasi Project Google Sheet
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Multi-Account / Project
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Pilih file dari Drive, input link manual, atau buat spreadsheet baru dengan template siap pakai tanpa coding.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 flex items-center justify-center text-slate-300 hover:text-white transition active:scale-90 shrink-0"
            title="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content Scroll Area */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 custom-scrollbar">
          <ProjectSyncManager
            user={user}
            currentSpreadsheetId={spreadsheetId}
            currentSheetName={sheetName}
            onSaveProjectConfig={onSaveProjectConfig}
            onLogin={onLogin}
            onSyncNow={onSyncNow}
            isSyncing={isSyncing}
            settings={settings}
            onClose={onClose}
          />
        </div>

        {/* Modal Footer Note */}
        <div className="p-3.5 bg-black/40 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400 shrink-0 px-5">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Format Template Standar (Bulan, Kategori, Akun, Tipe, Jumlah, Catatan)
          </span>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-xs transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
