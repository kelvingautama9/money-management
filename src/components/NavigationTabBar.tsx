import React, { useRef } from 'react';
import { GlassSettings } from '../types';
import { triggerHaptic } from '../lib/haptics';
import {
  LayoutDashboard,
  PlusCircle,
  PieChart,
  TrendingUp,
  Landmark,
  FileSpreadsheet,
  Menu,
  FolderSync
} from 'lucide-react';

export type ActivePage = 'summary' | 'cashflow' | 'budgeting' | 'portfolio' | 'accounts' | 'journal';

interface NavigationTabBarProps {
  activePage: ActivePage;
  onSelectPage: (page: ActivePage) => void;
  settings: GlassSettings;
  txCount?: number;
  onOpenMenu?: () => void;
  onOpenProjectManager?: () => void;
}

export const NavigationTabBar: React.FC<NavigationTabBarProps> = ({
  activePage,
  onSelectPage,
  txCount = 0,
  onOpenMenu,
  onOpenProjectManager
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const tabs = [
    {
      id: 'summary' as ActivePage,
      label: 'Summary',
      icon: <LayoutDashboard className="w-4 h-4" />,
      badge: null
    },
    {
      id: 'cashflow' as ActivePage,
      label: 'Input Cashflow',
      icon: <PlusCircle className="w-4 h-4 text-emerald-400" />,
      badge: 'Sync'
    },
    {
      id: 'budgeting' as ActivePage,
      label: 'Budgeting',
      icon: <PieChart className="w-4 h-4 text-amber-400" />,
      badge: null
    },
    {
      id: 'portfolio' as ActivePage,
      label: 'Portofolio',
      icon: <TrendingUp className="w-4 h-4 text-sky-400" />,
      badge: null
    },
    {
      id: 'accounts' as ActivePage,
      label: 'Rekening',
      icon: <Landmark className="w-4 h-4 text-purple-400" />,
      badge: null
    },
    {
      id: 'journal' as ActivePage,
      label: 'Jurnal',
      icon: <FileSpreadsheet className="w-4 h-4 text-blue-400" />,
      badge: txCount > 0 ? `${txCount}` : null
    }
  ];

  return (
    <nav
      style={{
        background: 'rgba(12, 16, 32, 0.72)',
        backdropFilter: 'blur(24px) saturate(180%)',
        WebkitBackdropFilter: 'blur(24px) saturate(180%)',
        boxShadow:
          '0 15px 35px -5px rgba(0, 0, 0, 0.5), inset 0 1px 1px rgba(255, 255, 255, 0.2), inset 0 -1px 1px rgba(0,0,0,0.3)'
      }}
      className="sticky top-3 z-30 w-full rounded-2xl sm:rounded-full border border-white/10 p-1.5 shadow-2xl transition-all"
    >
      <div className="flex items-center justify-between gap-1 overflow-hidden">
        {/* Direct swipeable tab list - no scrollbar */}
        <div
          ref={containerRef}
          className="flex items-center gap-1 overflow-x-auto no-scrollbar flex-1 py-0.5 pr-2"
          style={{
            scrollSnapType: 'x mandatory',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          {tabs.map((tab) => {
            const isActive = activePage === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  triggerHaptic('selection');
                  onSelectPage(tab.id);
                }}
                className={`relative flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 shrink-0 ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600/70 to-indigo-600/70 text-white border border-white/30 shadow-md shadow-blue-600/20'
                    : 'text-slate-300 hover:text-white hover:bg-white/[0.06] border border-transparent'
                }`}
              >
                <span className="shrink-0">{tab.icon}</span>
                <span className="tracking-tight">{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${
                      isActive
                        ? 'bg-white/25 text-white'
                        : 'bg-white/10 text-slate-400'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Project Sheets Modal Trigger */}
        {onOpenProjectManager && (
          <button
            onClick={() => {
              triggerHaptic('medium');
              onOpenProjectManager();
            }}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-full bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-400/30 text-indigo-200 text-xs font-semibold transition shrink-0 active:scale-95"
            title="Ganti / Sinkronkan Project Google Sheet"
          >
            <FolderSync className="w-3.5 h-3.5 text-indigo-300 shrink-0" />
            <span className="hidden md:inline">Project Sheet</span>
          </button>
        )}

        {/* Dedicated Popup Glass Menu Trigger */}
        {onOpenMenu && (
          <button
            onClick={() => {
              triggerHaptic('medium');
              onOpenMenu();
            }}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-full bg-white/10 hover:bg-white/15 border border-white/15 text-white text-xs font-semibold transition shrink-0 active:scale-95"
            title="Buka Menu & Navigasi Lengkap"
          >
            <Menu className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <span className="hidden sm:inline">Menu</span>
          </button>
        )}
      </div>
    </nav>
  );
};
