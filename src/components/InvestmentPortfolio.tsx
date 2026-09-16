import React, { useState } from 'react';
import { GlassContainer } from './GlassContainer';
import { GlassSettings, InvestmentAsset, InvestmentHistory } from '../types';
import { formatRupiah } from '../lib/sheetsApi';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Coins, DollarSign, LineChart, Award } from 'lucide-react';

interface InvestmentPortfolioProps {
  assets: InvestmentAsset[];
  history: InvestmentHistory[];
  settings: GlassSettings;
  totalProfit2026?: number;
}

export const InvestmentPortfolio: React.FC<InvestmentPortfolioProps> = ({
  assets,
  history,
  settings,
  totalProfit2026 = 1148790
}) => {
  const [activeTab, setActiveTab] = useState<'trend' | 'allocation'>('trend');

  const totalCurrentInvestment = assets.reduce((sum, a) => sum + a.nilaiAkhirBulan, 0);

  const pieData = assets.map((a) => ({
    name: a.nama,
    value: a.nilaiAkhirBulan,
    color: a.warna
  }));

  const chartData = history.map((h) => ({
    bulan: h.bulan,
    netWorth: h.totalNetWorth,
    profit: h.netProfitMoM,
    pnl: h.pnlPercent
  }));

  const getAssetIcon = (nama: string) => {
    if (nama.toLowerCase().includes('pluang')) return <TrendingUp className="w-4 h-4 text-sky-400" />;
    if (nama.toLowerCase().includes('valas')) return <DollarSign className="w-4 h-4 text-emerald-400" />;
    return <Coins className="w-4 h-4 text-amber-400" />;
  };

  return (
    <GlassContainer settings={settings} className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-sky-500/20 border border-sky-400/30 flex items-center justify-center">
              <LineChart className="w-4 h-4 text-sky-400" />
            </div>
            <h3 className="text-base font-bold text-white tracking-tight">
              Portofolio Multi-Aset & Rekap PnL
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Pertumbuhan Positif
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Diversifikasi aset pasar modal (Pluang), Valas USD, dan Aset Digital (USDT)
          </p>
        </div>

        {/* View Switcher */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/5 border border-white/10 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('trend')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
              activeTab === 'trend'
                ? 'bg-blue-500/30 text-white border border-blue-400/40 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Tren Net Worth
          </button>
          <button
            onClick={() => setActiveTab('allocation')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
              activeTab === 'allocation'
                ? 'bg-blue-500/30 text-white border border-blue-400/40 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Alokasi Aset
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 my-6">
        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5">
          <span className="text-[11px] text-slate-400 block mb-1">Total Net Worth Portofolio</span>
          <span className="text-xl font-bold text-white font-mono">{formatRupiah(totalCurrentInvestment)}</span>
          <span className="text-[10px] text-emerald-400 block mt-1">+Rp2.016.286 Top-up Pluang</span>
        </div>

        {assets.map((asset) => (
          <div key={asset.nama} className="p-4 rounded-2xl bg-white/[0.03] border border-white/5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] text-slate-400 truncate">{asset.nama}</span>
              {getAssetIcon(asset.nama)}
            </div>
            <span className="text-lg font-bold text-white font-mono block">
              {formatRupiah(asset.nilaiAkhirBulan)}
            </span>
            <div className="flex items-center justify-between mt-1 text-[10px]">
              <span className="text-slate-400">Porsi Aset:</span>
              <span className="font-semibold text-slate-200">
                {((asset.nilaiAkhirBulan / totalCurrentInvestment) * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Chart Section */}
      <div className="mt-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
        {activeTab === 'trend' ? (
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-medium text-slate-300">
                Pertumbuhan Nilai Investasi Bulanan (April – September 2026)
              </span>
              <div className="flex items-center gap-2 text-xs">
                <span className="flex items-center gap-1 text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                  <Award className="w-3.5 h-3.5" />
                  Total Realized Profit 2026: <strong>{formatRupiah(totalProfit2026)}</strong>
                </span>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="netWorthGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="bulan" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`}
                    domain={['dataMin - 1000000', 'dataMax + 1000000']}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload as any;
                        return (
                          <div className="p-3 rounded-xl bg-slate-900/90 border border-white/20 backdrop-blur-md text-xs shadow-xl">
                            <p className="font-bold text-white mb-1">{data.bulan}</p>
                            <p className="text-sky-300">Net Worth: {formatRupiah(data.netWorth)}</p>
                            <p className={data.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                              MoM Profit: {formatRupiah(data.profit)} ({data.pnl}%)
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="netWorth"
                    stroke="#38bdf8"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#netWorthGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row items-center justify-around gap-6 py-2">
            <div className="h-56 w-56 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="rgba(0,0,0,0.4)" strokeWidth={2} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10px] text-slate-400 uppercase font-medium">Portofolio</span>
                <span className="text-xs font-bold text-white font-mono">100%</span>
              </div>
            </div>

            {/* Legend breakdown */}
            <div className="space-y-3 w-full max-w-xs">
              {pieData.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-md" style={{ backgroundColor: item.color }} />
                    <span className="text-slate-300 font-medium">{item.name}</span>
                  </div>
                  <span className="font-mono text-slate-200">{formatRupiah(item.value)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </GlassContainer>
  );
};
