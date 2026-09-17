import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { User } from 'firebase/auth';
import {
  INITIAL_TRANSACTIONS,
  INITIAL_BUDGETS,
  INITIAL_INVESTMENT_ASSETS,
  INITIAL_INVESTMENT_HISTORY,
  DEFAULT_GLASS_SETTINGS
} from './data/initialData';
import {
  Transaction,
  BudgetCategory,
  AccountBalance,
  EmergencyFund,
  InvestmentAsset,
  InvestmentHistory,
  GlassSettings,
  SheetSummary
} from './types';
import {
  initAuth,
  googleSignIn,
  logout,
  getAccessToken,
  setCachedAccessToken
} from './lib/firebase';
import {
  extractSpreadsheetId,
  fetchSheetValues,
  appendRowToSheet,
  updateRowInSheet,
  clearRowInSheet,
  parseCurrencyToNumber,
  formatRupiah,
  getSpreadsheetSheetTitles,
  formatSheetRange,
  parseSheetGridData
} from './lib/sheetsApi';
import { triggerHaptic } from './lib/haptics';

// Components
import { NavigationTabBar, ActivePage } from './components/NavigationTabBar';
import { GoogleSheetMonthTabBar } from './components/GoogleSheetMonthTabBar';
import { CashflowInputPage } from './components/CashflowInputPage';
import { AccountsPage } from './components/AccountsPage';
import { ExecutiveSummary } from './components/ExecutiveSummary';
import { BudgetingTracker } from './components/BudgetingTracker';
import { EmergencyFundCard } from './components/EmergencyFundCard';
import { InvestmentPortfolio } from './components/InvestmentPortfolio';
import { AccountBalancesCard } from './components/AccountBalancesCard';
import { TransactionManager } from './components/TransactionManager';
import { GlassSettingsModal } from './components/GlassSettingsModal';
import { AutomatedReportModal } from './components/AutomatedReportModal';
import { GlassMenuPopup } from './components/GlassMenuPopup';
import { GlassButton } from './components/GlassButton';
import { ProjectSyncManagerModal } from './components/ProjectSyncManagerModal';
import {
  DEFAULT_MONTH_SHEETS,
  INITIAL_TRANSACTIONS_BY_MONTH,
  INITIAL_TRANSACTIONS_AGUSTUS,
  INITIAL_SUMMARY_BY_MONTH
} from './data/initialData';

// Icons
import {
  Sliders,
  FileText,
  Sparkles,
  ShieldCheck,
  PlusCircle,
  ArrowRight,
  TrendingUp,
  Layers,
  PieChart,
  RefreshCw,
  Menu
} from 'lucide-react';

export default function App() {
  // --- Glass UI State ---
  const [glassSettings, setGlassSettings] = useState<GlassSettings>(DEFAULT_GLASS_SETTINGS);
  const [isGlassModalOpen, setIsGlassModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isMenuPopupOpen, setIsMenuPopupOpen] = useState(false);
  const [isProjectManagerOpen, setIsProjectManagerOpen] = useState(false);

  // --- Multi-Page Navigation State ---
  const [activePage, setActivePage] = useState<ActivePage>('summary');

  // --- Auth & Google Sheets State ---
  const [user, setUser] = useState<User | null>(null);
  const [spreadsheetId, setSpreadsheetId] = useState<string>(() => {
    return localStorage.getItem('kelvin_financial_sheet_id') || '1x_SheetsID_KelvinGautama';
  });
  const [sheetName, setSheetName] = useState<string>(() => {
    return localStorage.getItem('kelvin_financial_sheet_name') || 'SEPTEMBER';
  });
  const [availableSheets, setAvailableSheets] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('kelvin_financial_available_sheets');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return DEFAULT_MONTH_SHEETS;
  });
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  // --- Data State ---
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const active = localStorage.getItem('kelvin_financial_sheet_name') || 'SEPTEMBER';
    try {
      const cached = localStorage.getItem(`kelvin_financial_txs_${active}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return (
      INITIAL_TRANSACTIONS_BY_MONTH[active] ||
      INITIAL_TRANSACTIONS_BY_MONTH[active.toUpperCase()] ||
      INITIAL_TRANSACTIONS
    );
  });
  const [assets, setAssets] = useState<InvestmentAsset[]>(INITIAL_INVESTMENT_ASSETS);
  const [history, setHistory] = useState<InvestmentHistory[]>(INITIAL_INVESTMENT_HISTORY);

  // Precalculated summary values from Google Sheets (columns H..N) or monthly defaults
  const [sheetSummaries, setSheetSummaries] = useState<Record<string, SheetSummary>>(() => {
    try {
      const saved = localStorage.getItem('kelvin_financial_sheet_summaries');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') return parsed;
      }
    } catch (e) {}
    return INITIAL_SUMMARY_BY_MONTH as unknown as Record<string, SheetSummary>;
  });

  const activeSummary = useMemo<SheetSummary | undefined>(() => {
    return (
      sheetSummaries[sheetName] ||
      sheetSummaries[sheetName.toUpperCase()] ||
      sheetSummaries[sheetName.toLowerCase()] ||
      (INITIAL_SUMMARY_BY_MONTH as any)[sheetName.toUpperCase()] ||
      (INITIAL_SUMMARY_BY_MONTH as any)[sheetName]
    );
  }, [sheetSummaries, sheetName]);

  // Initialize Firebase Auth listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (authenticatedUser, token) => {
        setUser(authenticatedUser);
        if (token) {
          setCachedAccessToken(token);
        }
      },
      () => {
        setUser(null);
        setCachedAccessToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  // Auto-detect real sheet tabs from connected Google Spreadsheet directly
  const handleRefreshSpreadsheetTabs = useCallback(async (customSpreadsheetId?: string) => {
    const token = await getAccessToken();
    const cleanId = extractSpreadsheetId(customSpreadsheetId || spreadsheetId);
    if (token && cleanId && !cleanId.startsWith('1x_SheetsID')) {
      try {
        setIsSyncing(true);
        const titles = await getSpreadsheetSheetTitles(cleanId, token);
        if (titles && titles.length > 0) {
          // Exactly use titles as named on the Google Sheet without forcing uppercase!
          // Remove non-existent tabs, only show real sheets from the project!
          setAvailableSheets(titles);
          try {
            localStorage.setItem('kelvin_financial_available_sheets', JSON.stringify(titles));
          } catch (e) {}

          // If current sheetName isn't in titles, check if there's a case-insensitive match or keep it
          const exactMatch = titles.find((t) => t === sheetName);
          if (!exactMatch) {
            const caseMatch = titles.find((t) => t.toLowerCase() === sheetName.toLowerCase());
            if (caseMatch) {
              setSheetName(caseMatch);
              localStorage.setItem('kelvin_financial_sheet_name', caseMatch);
            }
          }
          setSyncNotice(`Tab Google Sheet terdeteksi (${titles.length} tab): ${titles.join(', ')}`);
        }
      } catch (e: any) {
        console.warn('Tab sheets discovery error:', e);
      } finally {
        setIsSyncing(false);
      }
    }
  }, [spreadsheetId, sheetName]);

  useEffect(() => {
    if (user) {
      handleRefreshSpreadsheetTabs();
    }
  }, [user, handleRefreshSpreadsheetTabs]);

  // Update CSS variables whenever glassSettings changes
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--glass-blur', `${glassSettings.blur}px`);
    root.style.setProperty('--glass-opacity', `${glassSettings.translucency / 100}`);
    root.style.setProperty('--glass-dark-tint', `${glassSettings.darkTint / 100}`);
    root.style.setProperty('--glass-specular', `${glassSettings.specularIntensity / 100}`);
  }, [glassSettings]);

  // --- Financial Computations Engine ---
  // 1. Total Income
  const totalPemasukan = useMemo(() => {
    return transactions
      .filter((t) => t.tipe === 'Income')
      .reduce((sum, t) => sum + t.jumlah, 0);
  }, [transactions]);

  // 2. Total Direct Expenses (pengeluaran murni non-transfer)
  const totalPengeluaran = useMemo(() => {
    return transactions
      .filter((t) => t.tipe === 'Expense')
      .reduce((sum, t) => sum + t.jumlah, 0);
  }, [transactions]);

  // 3. Dynamic Budget Status Calculation
  const budgets: BudgetCategory[] = useMemo(() => {
    return INITIAL_BUDGETS.map((initBudget) => {
      let relevantSpend = 0;
      if (initBudget.nama.toLowerCase().includes('listrik')) {
        relevantSpend = transactions
          .filter((t) => t.kategori === 'Listrik' && t.tipe === 'Expense')
          .reduce((sum, t) => sum + t.jumlah, 0);
      } else if (initBudget.nama.toLowerCase().includes('entertainment')) {
        relevantSpend = transactions
          .filter((t) => t.kategori === 'Entertainment' && t.tipe === 'Expense')
          .reduce((sum, t) => sum + t.jumlah, 0);
      } else if (initBudget.nama.toLowerCase().includes('transport')) {
        relevantSpend = transactions
          .filter((t) => t.kategori === 'Transport' && t.tipe === 'Expense')
          .reduce((sum, t) => sum + t.jumlah, 0);
      } else if (initBudget.nama.toLowerCase().includes('dating')) {
        relevantSpend = transactions
          .filter((t) => t.kategori === 'Dating' && t.tipe === 'Expense')
          .reduce((sum, t) => sum + t.jumlah, 0);
      }

      const totalSaldo = initBudget.saldoAwal + initBudget.budgeting;
      const sisa = totalSaldo - relevantSpend;

      return {
        ...initBudget,
        actualSpend: relevantSpend,
        totalSaldo,
        sisa,
        keterangan: sisa > 0 ? `Sisa: ${formatRupiah(sisa)}` : 'Anggaran Terserap'
      };
    });
  }, [transactions]);

  // 4. Dynamic Account Balances (Calculated from transactions and Google Sheet summary)
  const accounts: AccountBalance[] = useMemo(() => {
    const accountNames = [
      'Bank BCA',
      'Seabank',
      'Blu BCA - Savings',
      'Investasi',
      'Allo Bank',
      'Jago-Transport',
      'Jago-Entertainment',
      'Blu BCA - Date',
      'Cash'
    ];

    const defaultBaseBalances: Record<string, number> = {
      'Bank BCA': 8870,
      'Seabank': 3808000,
      'Blu BCA - Savings': 436550,
      'Investasi': 53721362,
      'Allo Bank': 195340,
      'Jago-Transport': 592885,
      'Jago-Entertainment': 451751,
      'Blu BCA - Date': 0,
      'Cash': 0
    };

    return accountNames.map((accName) => {
      // 1. If spreadsheet has precalculated account balance in summary table (Columns H/I), use it
      if (
        activeSummary?.accountBalances &&
        typeof activeSummary.accountBalances[accName] === 'number'
      ) {
        const totalSaldo = activeSummary.accountBalances[accName];
        const accExpenses = transactions
          .filter((t) => t.akun.toLowerCase() === accName.toLowerCase() && t.tipe === 'Expense')
          .reduce((sum, t) => sum + t.jumlah, 0);
        const spendPercent =
          totalSaldo > 0 && accExpenses > 0
            ? Number(((accExpenses / (totalSaldo + accExpenses)) * 100).toFixed(1))
            : 0;
        return {
          nama: accName,
          totalSaldo,
          spendBulanIniPercent: spendPercent
        };
      }

      // 2. Otherwise calculate dynamically from month transactions
      const startingRow = transactions.find(
        (t) =>
          t.akun.toLowerCase() === accName.toLowerCase() &&
          (t.tipe === 'Saldo Bulan Lalu' || t.kategori.toLowerCase().includes('saldo awal'))
      );
      const startingBalance = startingRow ? startingRow.jumlah : 0;

      const accIncome = transactions
        .filter((t) => t.akun.toLowerCase() === accName.toLowerCase() && t.tipe === 'Income')
        .reduce((sum, t) => sum + t.jumlah, 0);

      const accTransfersIn = transactions
        .filter((t) => t.akun.toLowerCase() === accName.toLowerCase() && t.tipe === 'Transfer Masuk')
        .reduce((sum, t) => sum + t.jumlah, 0);

      const accTransfersOut = transactions
        .filter((t) => t.akun.toLowerCase() === accName.toLowerCase() && t.tipe === 'Transfer Keluar')
        .reduce((sum, t) => sum + t.jumlah, 0);

      const accExpenses = transactions
        .filter((t) => t.akun.toLowerCase() === accName.toLowerCase() && t.tipe === 'Expense')
        .reduce((sum, t) => sum + t.jumlah, 0);

      let totalSaldo = startingBalance + accIncome + accTransfersIn - accTransfersOut - accExpenses;

      // Fallback if no transactions recorded for this account in this month
      if (
        !startingRow &&
        accIncome === 0 &&
        accTransfersIn === 0 &&
        accTransfersOut === 0 &&
        accExpenses === 0
      ) {
        if (sheetName.toUpperCase() === 'SEPTEMBER') {
          totalSaldo = defaultBaseBalances[accName] ?? 0;
        } else if (accName === 'Investasi' && (activeSummary as any)?.totalInvestment) {
          totalSaldo = (activeSummary as any).totalInvestment;
        } else if (accName === 'Seabank') {
          totalSaldo = (activeSummary as any)?.cashStandby
            ? Math.round((activeSummary as any).cashStandby * 0.8)
            : 3000000;
        } else if (accName === 'Blu BCA - Savings') {
          totalSaldo = 350000;
        } else {
          totalSaldo = 0;
        }
      }

      const totalInflow = startingBalance + accIncome + accTransfersIn;
      const spendPercent =
        totalInflow > 0 && accExpenses > 0
          ? Number(((accExpenses / totalInflow) * 100).toFixed(1))
          : 0;

      return {
        nama: accName,
        totalSaldo: Math.max(0, totalSaldo),
        spendBulanIniPercent: spendPercent
      };
    });
  }, [transactions, activeSummary, sheetName]);

  // 5. Emergency Fund Metrics (derived from active month summary or accounts)
  const emergencyFund: EmergencyFund = useMemo(() => {
    if (activeSummary?.emergencyFund && activeSummary.emergencyFund.current) {
      const curr = activeSummary.emergencyFund.current;
      const tgt = activeSummary.emergencyFund.target || 12000000;
      return {
        current: curr,
        target: tgt,
        kekurangan: curr - tgt,
        persentase: Number(((curr / tgt) * 100).toFixed(1))
      };
    }
    const bluAcc = accounts.find((a) => a.nama.toLowerCase().includes('blu bca - savings'));
    const bluSavings = bluAcc ? bluAcc.totalSaldo : 436550;
    const target = 12000000;
    return {
      current: bluSavings,
      target,
      kekurangan: bluSavings - target,
      persentase: Number(((bluSavings / target) * 100).toFixed(1))
    };
  }, [activeSummary, accounts]);

  // 6. Aggregate Net Worth & Cash Standby (Synchronized across Summary and Accounts)
  // Total of all non-investment liquid accounts (Cash, Bank BCA, Seabank, Blu, Allo, Jago)
  const cashStandbyDanaDarurat = useMemo(() => {
    if (activeSummary?.cashStandbyDanaDarurat && activeSummary.cashStandbyDanaDarurat > 0) {
      return activeSummary.cashStandbyDanaDarurat;
    }
    if ((activeSummary as any)?.cashStandby && (activeSummary as any).cashStandby > 0) {
      return (activeSummary as any).cashStandby;
    }
    return accounts
      .filter((acc) => !acc.nama.toLowerCase().includes('investasi'))
      .reduce((sum, acc) => sum + acc.totalSaldo, 0);
  }, [accounts, activeSummary]);

  // Current investment portfolio value from active summary or account
  const totalInvestment = useMemo(() => {
    if (activeSummary?.totalInvestment && activeSummary.totalInvestment > 0) {
      return activeSummary.totalInvestment;
    }
    const investAcc = accounts.find((acc) => acc.nama.toLowerCase().includes('investasi'));
    if (investAcc && investAcc.totalSaldo > 0) {
      return investAcc.totalSaldo;
    }
    const fromAssets = assets.reduce((sum, a) => sum + a.nilaiAkhirBulan, 0);
    return fromAssets > 0 ? fromAssets : 53721362;
  }, [accounts, activeSummary, assets]);

  // Total Net Worth (Kekayaan Bersih): Sum of all accounts and investments, reacts directly to selected tab
  const totalAset = useMemo(() => {
    if (activeSummary?.totalAset && activeSummary.totalAset > 0) {
      return activeSummary.totalAset;
    }
    return cashStandbyDanaDarurat + totalInvestment;
  }, [activeSummary, cashStandbyDanaDarurat, totalInvestment]);

  const sisaSaldoIncome = totalPemasukan - totalPengeluaran;

  // Format active sheet name for header display (e.g. "Sept 2026" or exact sheetName)
  const formattedSheetMonth = useMemo(() => {
    if (!sheetName) return 'September 2026';
    // If sheetName already contains year digits (e.g. "Sept 2026"), avoid appending 2026 again
    if (/\d{4}/.test(sheetName)) {
      return sheetName;
    }
    return `${sheetName} 2026`;
  }, [sheetName]);

  // --- Handlers for Google Sheets Sync & Auth ---
  const handleGoogleLogin = async () => {
    try {
      setIsSyncing(true);
      setSyncNotice('Menghubungkan ke Google...');
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        setSyncNotice(`Tersambung sebagai ${res.user.email} dengan akses Google Sheets & Drive.`);
        triggerHaptic('success');
      }
    } catch (err: any) {
      console.error('Sign-in failure:', err);
      if (
        err?.code === 'auth/popup-closed-by-user' ||
        err?.code === 'auth/cancelled-popup-request'
      ) {
        return;
      }
      setSyncNotice(`Koneksi Google: ${err?.message || 'Silakan coba lagi'}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleGoogleLogout = async () => {
    await logout();
    setUser(null);
    setSyncNotice('Telah keluar dari akun Google.');
  };

  const handleSaveProjectConfig = (
    newSpreadsheetId: string,
    newSheetName: string,
    detectedSheets?: string[]
  ) => {
    setSpreadsheetId(newSpreadsheetId);
    setSheetName(newSheetName);
    try {
      localStorage.setItem('kelvin_financial_sheet_id', newSpreadsheetId);
      localStorage.setItem('kelvin_financial_sheet_name', newSheetName);
    } catch (e) {
      console.warn('Failed to save spreadsheet config to localStorage:', e);
    }

    if (detectedSheets && detectedSheets.length > 0) {
      setAvailableSheets(detectedSheets);
      try {
        localStorage.setItem('kelvin_financial_available_sheets', JSON.stringify(detectedSheets));
      } catch (e) {}
    }

    setSyncNotice(`Project aktif dialihkan ke ID: ${newSpreadsheetId.slice(0, 8)}... (${newSheetName})`);
  };

  // Helper to load offline/cached data for a given month
  const loadFallbackMonthData = (targetMonth: string) => {
    try {
      const cached = localStorage.getItem(`kelvin_financial_txs_${targetMonth}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setTransactions(parsed);
          return;
        }
      }
    } catch (e) {}

    const predefined =
      INITIAL_TRANSACTIONS_BY_MONTH[targetMonth] ||
      INITIAL_TRANSACTIONS_BY_MONTH[targetMonth.toUpperCase()] ||
      INITIAL_TRANSACTIONS_BY_MONTH[targetMonth.toLowerCase()];

    if (predefined) {
      setTransactions(predefined);
    } else {
      setTransactions([
        {
          id: `tx-init-${targetMonth}-1`,
          bulan: targetMonth,
          kategori: 'Salary',
          akun: 'Bank BCA',
          tipe: 'Income',
          jumlah: 5916058,
          catatan: `Gaji MYPAK ${targetMonth}`
        }
      ]);
    }
  };

  // --- Switch Month Sheet (mimicking Google Sheets tab switching) ---
  const handleSelectMonth = async (targetMonth: string) => {
    const cleanTarget = targetMonth.trim();
    if (!cleanTarget) return;

    setSheetName(cleanTarget);
    try {
      localStorage.setItem('kelvin_financial_sheet_name', cleanTarget);
    } catch (e) {}

    const token = await getAccessToken();
    const cleanId = extractSpreadsheetId(spreadsheetId);

    if (token && cleanId && !cleanId.startsWith('1x_SheetsID')) {
      try {
        setIsSyncing(true);
        setSyncNotice(`Menghubungkan ke tab sheet "${cleanTarget}" dari Google Sheets...`);
        // Fetch A1:N100 to capture both transaction records and summary metrics
        const safeRange = formatSheetRange(cleanTarget, 'A1:N100');
        const rows = await fetchSheetValues(cleanId, safeRange, token);
        if (rows && rows.length > 0) {
          const { transactions: parsedRows, summary } = parseSheetGridData(rows, cleanTarget);

          if (parsedRows.length > 0) {
            setTransactions(parsedRows);
            setLastSynced(new Date());
            setSyncNotice(`Berhasil memuat ${parsedRows.length} baris rekapan bulan ${cleanTarget} dari Google Sheets.`);
            try {
              localStorage.setItem(`kelvin_financial_txs_${cleanTarget}`, JSON.stringify(parsedRows));
            } catch (e) {}
          }

          if (
            summary.totalAset ||
            summary.totalInvestment ||
            (summary.accountBalances && Object.keys(summary.accountBalances).length > 0)
          ) {
            setSheetSummaries((prev) => {
              const updated = {
                ...prev,
                [cleanTarget]: summary,
                [cleanTarget.toUpperCase()]: summary,
                [cleanTarget.toLowerCase()]: summary
              };
              try {
                localStorage.setItem('kelvin_financial_sheet_summaries', JSON.stringify(updated));
              } catch (e) {}
              return updated;
            });
          }

          if (parsedRows.length > 0 || summary.totalAset) {
            return;
          }
        }

        // When rows are empty or not formatted yet
        setSyncNotice(`Tab sheet "${cleanTarget}" berhasil dibuka (belum ada transaksi). Siap untuk diisi.`);
        loadFallbackMonthData(cleanTarget);
      } catch (err: any) {
        console.warn(`Catatan tab sheet ${cleanTarget}:`, err);
        setSyncNotice(`Tab "${cleanTarget}" dibuka secara lokal. Pastikan nama tab persis sama di Google Sheets.`);
        loadFallbackMonthData(cleanTarget);
      } finally {
        setIsSyncing(false);
      }
    } else {
      loadFallbackMonthData(cleanTarget);
      setSyncNotice(`Beralih ke rekapan bulan ${cleanTarget}. Data tersimpan otomatis dan siap disinkronkan.`);
    }
  };

  const handleAddNewSheet = async (newSheetName: string) => {
    const clean = newSheetName.trim();
    if (!clean) return;

    if (!availableSheets.includes(clean)) {
      const updated = [clean, ...availableSheets];
      setAvailableSheets(updated);
      try {
        localStorage.setItem('kelvin_financial_available_sheets', JSON.stringify(updated));
      } catch (e) {}
    }

    handleSelectMonth(clean);
  };

  // --- Synchronize Active Month from Google Sheets ---
  const handleSyncFromSheets = async (overrideId?: string, overrideSheet?: string) => {
    const activeSpreadsheetId = overrideId || spreadsheetId;
    const activeSheetName = overrideSheet || sheetName;
    const cleanId = extractSpreadsheetId(activeSpreadsheetId);
    if (!cleanId || cleanId.startsWith('1x_SheetsID')) {
      alert('Masukkan link atau ID Google Spreadsheet terlebih dahulu.');
      return;
    }

    const token = await getAccessToken();
    if (!token) {
      alert('Silakan klik "Sign in with Google" untuk mengizinkan akses ke Google Sheets.');
      return;
    }

    try {
      setIsSyncing(true);
      setSyncNotice(`Menarik data live dari tab sheet ${activeSheetName}...`);

      // 1. Fetch remote tab sheet titles to eliminate stale tabs and show all real ones!
      try {
        const remoteTitles = await getSpreadsheetSheetTitles(cleanId, token);
        if (remoteTitles && remoteTitles.length > 0) {
          setAvailableSheets(remoteTitles);
          try {
            localStorage.setItem('kelvin_financial_available_sheets', JSON.stringify(remoteTitles));
          } catch (e) {}
        }
      } catch (e) {
        console.warn('Could not refresh remote sheet titles:', e);
      }

      // 2. Fetch grid data A1:N100 to capture transactions and summary metrics
      const safeRange = formatSheetRange(activeSheetName, 'A1:N100');
      const rows = await fetchSheetValues(cleanId, safeRange, token);
      if (rows && rows.length > 0) {
        const { transactions: parsedRows, summary } = parseSheetGridData(rows, activeSheetName);

        if (parsedRows.length > 0) {
          setTransactions(parsedRows);
          setLastSynced(new Date());
          try {
            localStorage.setItem(`kelvin_financial_txs_${activeSheetName}`, JSON.stringify(parsedRows));
          } catch (e) {}
        }

        if (
          summary.totalAset ||
          summary.totalInvestment ||
          (summary.accountBalances && Object.keys(summary.accountBalances).length > 0)
        ) {
          setSheetSummaries((prev) => {
            const updated = {
              ...prev,
              [activeSheetName]: summary,
              [activeSheetName.toUpperCase()]: summary,
              [activeSheetName.toLowerCase()]: summary
            };
            try {
              localStorage.setItem('kelvin_financial_sheet_summaries', JSON.stringify(updated));
            } catch (e) {}
            return updated;
          });
        }

        if (parsedRows.length > 0) {
          setSyncNotice(`Berhasil menarik ${parsedRows.length} baris transaksi dari sheet ${activeSheetName}!`);
        } else {
          setSyncNotice(`Sheet ${activeSheetName} berhasil terhubung.`);
        }
      } else {
        setSyncNotice(`Lembar Google Sheet tab ${activeSheetName} belum memiliki data.`);
      }
    } catch (err: any) {
      console.error('Sync error:', err);
      alert(`Gagal sinkronisasi Google Sheets tab ${activeSheetName}: ${err?.message || 'Periksa ID dan izin akses'}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handlePushAllToSheet = async () => {
    const cleanId = extractSpreadsheetId(spreadsheetId);
    if (!cleanId) {
      alert('Masukkan link atau ID Google Spreadsheet terlebih dahulu.');
      return;
    }

    const token = await getAccessToken();
    if (!token) {
      alert('Silakan klik "Sign in with Google" untuk memberikan izin.');
      return;
    }

    try {
      setIsSyncing(true);
      const newest = transactions[0];
      if (newest) {
        await appendRowToSheet(cleanId, sheetName, newest, token);
      }
      setLastSynced(new Date());
      setSyncNotice(`Transaksi terbaru berhasil ditambahkan ke baris Google Sheets tab ${sheetName}!`);
    } catch (err: any) {
      console.error('Push error:', err);
      alert(`Gagal mengirim data ke Sheets: ${err?.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  // --- Add Transaction (with optional auto-sync to Sheets) ---
  const handleAddTransaction = async (newTx: Omit<Transaction, 'id'>, autoSync: boolean = true) => {
    const createdTx: Transaction = {
      ...newTx,
      bulan: newTx.bulan || sheetName,
      id: `tx-${Date.now()}`
    };

    const nextTxs = [createdTx, ...transactions];
    setTransactions(nextTxs);
    try {
      localStorage.setItem(`kelvin_financial_txs_${sheetName}`, JSON.stringify(nextTxs));
    } catch (e) {}

    // Live Google Sheets synchronization
    if (autoSync) {
      const token = await getAccessToken();
      const cleanId = extractSpreadsheetId(spreadsheetId);
      if (token && cleanId) {
        try {
          await appendRowToSheet(cleanId, sheetName, createdTx, token);
          setLastSynced(new Date());
          setSyncNotice(
            `Transaksi ${formatRupiah(createdTx.jumlah)} [${createdTx.kategori}] berhasil disimpan & otomatis tertambah ke Google Sheets tab ${sheetName}.`
          );
        } catch (e: any) {
          console.warn('Google sheets append error:', e);
          setSyncNotice(`Tersimpan lokal di bulan ${sheetName}. Catatan Google Sheet: ${e.message}`);
        }
      }
    }
  };

  // --- Edit Transaction ---
  const handleEditTransaction = async (updatedTx: Transaction) => {
    const nextTxs = transactions.map((t) => (t.id === updatedTx.id ? updatedTx : t));
    setTransactions(nextTxs);
    try {
      localStorage.setItem(`kelvin_financial_txs_${sheetName}`, JSON.stringify(nextTxs));
    } catch (e) {}

    const token = await getAccessToken();
    const cleanId = extractSpreadsheetId(spreadsheetId);
    if (token && cleanId && updatedTx.rowIndex) {
      try {
        await updateRowInSheet(cleanId, sheetName, updatedTx.rowIndex, updatedTx, token);
        setLastSynced(new Date());
        setSyncNotice(`Baris ${updatedTx.rowIndex} di Google Sheets tab ${sheetName} berhasil diperbarui.`);
      } catch (e) {
        console.warn('Failed to update remote row:', e);
      }
    }
  };

  // --- Delete Transaction ---
  const handleDeleteTransaction = async (id: string) => {
    const target = transactions.find((t) => t.id === id);
    const nextTxs = transactions.filter((t) => t.id !== id);
    setTransactions(nextTxs);
    try {
      localStorage.setItem(`kelvin_financial_txs_${sheetName}`, JSON.stringify(nextTxs));
    } catch (e) {}

    const token = await getAccessToken();
    const cleanId = extractSpreadsheetId(spreadsheetId);
    if (token && cleanId && target?.rowIndex) {
      try {
        await clearRowInSheet(cleanId, sheetName, target.rowIndex, token);
        setLastSynced(new Date());
        setSyncNotice(`Baris ${target.rowIndex} di Google Sheets tab ${sheetName} telah dikosongkan.`);
      } catch (e) {
        console.warn('Failed to clear remote row:', e);
      }
    }
  };

  // --- Internal Account Transfer ---
  const handleInternalTransfer = async (
    fromAccount: string,
    toAccount: string,
    amount: number,
    note: string
  ) => {
    const txOut: Omit<Transaction, 'id'> = {
      bulan: sheetName,
      kategori: 'Transfer Internal',
      akun: fromAccount,
      tipe: 'Transfer Keluar',
      jumlah: amount,
      catatan: `Transfer keluar ke ${toAccount}: ${note}`
    };

    const txIn: Omit<Transaction, 'id'> = {
      bulan: sheetName,
      kategori: 'Transfer Internal',
      akun: toAccount,
      tipe: 'Transfer Masuk',
      jumlah: amount,
      catatan: `Transfer masuk dari ${fromAccount}: ${note}`
    };

    await handleAddTransaction(txOut, true);
    await handleAddTransaction(txIn, true);
    setSyncNotice(`Transfer ${formatRupiah(amount)} dari ${fromAccount} ke ${toAccount} sukses dicatat pada rekapan ${sheetName}.`);
  };

  // Monthly transaction counts for tab bar badges
  const txCountsByMonth = useMemo(() => {
    const counts: Record<string, number> = {};
    counts[sheetName] = transactions.length;
    counts[sheetName.toUpperCase()] = transactions.length;

    availableSheets.forEach((sh) => {
      const upper = sh.toUpperCase();
      if (upper === sheetName.toUpperCase()) return;
      try {
        const cached = localStorage.getItem(`kelvin_financial_txs_${sh}`);
        if (cached) {
          const arr = JSON.parse(cached);
          if (Array.isArray(arr)) {
            counts[sh] = arr.length;
            counts[upper] = arr.length;
          }
        } else if (INITIAL_TRANSACTIONS_BY_MONTH[upper]) {
          counts[sh] = INITIAL_TRANSACTIONS_BY_MONTH[upper].length;
          counts[upper] = INITIAL_TRANSACTIONS_BY_MONTH[upper].length;
        }
      } catch (e) {}
    });
    return counts;
  }, [transactions, sheetName, availableSheets]);

  return (
    <div className="min-h-screen bg-[#060713] text-slate-100 relative selection:bg-blue-500/30 selection:text-white">
      {/* Atmospheric 3D Liquid Glass Ambient Orbs */}
      <div className="ambient-glow-1 top-[-100px] left-[-150px]" />
      <div className="ambient-glow-2 top-[35%] right-[-120px]" />
      <div className="ambient-glow-3 bottom-[-100px] left-[20%]" />

      {/* Main Container - Optimized Margins for Screen Real Estate (Mepet Kanan & Kiri yang Nyaman) */}
      <div className="relative z-20 w-full max-w-[98%] 2xl:max-w-[96%] mx-auto px-2 sm:px-4 lg:px-6 py-5 sm:py-6 space-y-6">
        {/* Ultra-Clean Modern Apple Top Bar */}
        <header className="flex items-center justify-between gap-3 py-1">
          {/* Left: User profile & status */}
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-500 p-0.5 shadow-md shrink-0">
              <div className="w-full h-full rounded-full bg-[#0d1024] flex items-center justify-center text-sm font-black text-sky-300">
                {user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'K'}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
                  {user?.displayName ? `Halo, ${user.displayName.split(' ')[0]}` : 'Halo, Kelvin'}
                </h2>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Online" />
              </div>
              <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <span className="font-semibold text-slate-200">{formattedSheetMonth}</span>
                <span className="text-slate-600">•</span>
                <button
                  onClick={() => {
                    triggerHaptic('light');
                    setIsMenuPopupOpen(true);
                  }}
                  className="text-emerald-400/90 hover:text-emerald-300 font-medium transition cursor-pointer hover:underline"
                  title="Klik untuk membuka menu & sinkronisasi Google Sheets"
                >
                  {user ? 'Sheets Connected ⚙' : 'Local Mode ⚙'}
                </button>
              </p>
            </div>
          </div>

          {/* Right: Clean Action Buttons & Semi-Transparent Glass Menu Trigger */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Sync Button */}
            <button
              onClick={() => {
                triggerHaptic('medium');
                handleSyncFromSheets();
              }}
              disabled={isSyncing}
              className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-xs font-semibold text-slate-200 transition active:scale-95 disabled:opacity-50"
              title="Sinkronisasi Google Sheets"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-sky-400 ${isSyncing ? 'animate-spin' : ''}`} />
              <span className="hidden md:inline">{isSyncing ? 'Sinkron...' : 'Sync'}</span>
            </button>

            {/* Laporan Otomatis */}
            <button
              onClick={() => {
                triggerHaptic('light');
                setIsReportModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-xs font-semibold text-slate-200 transition active:scale-95"
              title="Laporan Otomatis"
            >
              <FileText className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden md:inline">Laporan</span>
            </button>

            {/* Popup Menu Button (Semi-Transparent Glass Popup Container) */}
            <button
              onClick={() => {
                triggerHaptic('medium');
                setIsMenuPopupOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-blue-600/30 hover:bg-blue-600/40 border border-blue-400/40 text-xs font-bold text-white shadow-lg shadow-blue-600/20 transition active:scale-95"
              title="Buka Menu & Navigasi"
            >
              <Sliders className="w-3.5 h-3.5 text-blue-300" />
              <span>Menu</span>
            </button>
          </div>
        </header>

        {/* Sync Status Banner */}
        {syncNotice && (
          <div className="p-3 rounded-2xl bg-blue-500/15 border border-blue-400/30 flex items-center justify-between text-xs text-blue-200 animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0" />
              <span>{syncNotice}</span>
            </div>
            <button
              onClick={() => setSyncNotice(null)}
              className="text-xs text-blue-300 hover:text-white px-2 py-0.5 rounded-md hover:bg-white/10"
            >
              Tutup
            </button>
          </div>
        )}

        {/* 1 Compact Button Pilihan Bulan Google Sheet (Popup otomatis tertutup ketika dipilih) */}
        <div className="animate-in fade-in duration-200">
          <GoogleSheetMonthTabBar
            currentSheet={sheetName}
            onSelectSheet={handleSelectMonth}
            availableSheets={availableSheets}
            onAddNewSheet={handleAddNewSheet}
            onRefreshTabs={handleRefreshSpreadsheetTabs}
            isGoogleConnected={Boolean(user)}
            user={user}
            isSyncing={isSyncing}
            onSyncCurrentSheet={handleSyncFromSheets}
            settings={glassSettings}
            txCountsByMonth={txCountsByMonth}
          />
        </div>

        {/* Multi-Page Modern Mobile & Desktop iOS Tab Navigation with Direct Swipe & Menu Trigger */}
        <NavigationTabBar
          activePage={activePage}
          onSelectPage={setActivePage}
          settings={glassSettings}
          txCount={transactions.length}
          onOpenMenu={() => setIsMenuPopupOpen(true)}
          onOpenProjectManager={() => setIsProjectManagerOpen(true)}
        />

        {/* PAGE 1: SUMMARY */}
        {activePage === 'summary' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Executive KPIs matching Images 3 & 4 with large balance, sparklines, swipeable wallets & quick actions */}
            <ExecutiveSummary
              totalAset={totalAset}
              cashStandbyDanaDarurat={cashStandbyDanaDarurat}
              totalInvestment={totalInvestment}
              totalPemasukan={totalPemasukan}
              totalPengeluaran={totalPengeluaran}
              sisaSaldoIncome={sisaSaldoIncome}
              settings={glassSettings}
              budgets={budgets}
              accounts={accounts}
              transactions={transactions}
              assets={assets}
              history={history}
              onNavigate={setActivePage}
              onSyncGoogleSheets={handleSyncFromSheets}
              onOpenProjectManager={() => setIsProjectManagerOpen(true)}
              isSyncing={isSyncing}
              currentMonthSheet={sheetName}
              availableSheets={availableSheets}
              onSelectMonthSheet={handleSelectMonth}
            />

            {/* Emergency Fund & Investment Trend Preview */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <EmergencyFundCard fund={emergencyFund} settings={glassSettings} />
              </div>
              <div className="lg:col-span-2">
                <InvestmentPortfolio
                  assets={assets}
                  history={history}
                  settings={glassSettings}
                  totalProfit2026={1148790}
                />
              </div>
            </div>
          </div>
        )}

        {/* PAGE 2: INPUT CASHFLOW (Pengeluaran & Pemasukan by Kategori Google Sheets) */}
        {activePage === 'cashflow' && (
          <div className="animate-in fade-in duration-300">
            <CashflowInputPage
              settings={glassSettings}
              onAddTransaction={handleAddTransaction}
              transactions={transactions}
              isSyncing={isSyncing}
              isGoogleConnected={Boolean(user)}
              onNavigateToJournal={() => setActivePage('journal')}
              currentSheetName={sheetName}
              onSelectMonth={handleSelectMonth}
              availableSheets={availableSheets}
            />
          </div>
        )}

        {/* PAGE 3: BUDGETING ENVELOPES */}
        {activePage === 'budgeting' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <BudgetingTracker budgets={budgets} settings={glassSettings} />

            {/* Spending vs Envelope Detailed Insight */}
            <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 text-xs text-slate-300 leading-relaxed">
              <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                <PieChart className="w-4 h-4 text-amber-400" />
                Mekanisme Rolling Budget & Sinking Fund
              </h4>
              <p>
                Setiap pos di atas mengadopsi prinsip amplop finansial (*Envelope Budgeting*): Saldo bulan lalu yang
                belum terserap otomatis diakumulasikan (*rolled-over*) bersama jatah alokasi gaji bulan baru,
                menghasilkan total plafon belanja yang aman tanpa risiko defisit.
              </p>
            </div>
          </div>
        )}

        {/* PAGE 4: PORTOFOLIO & INVESTASI */}
        {activePage === 'portfolio' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <InvestmentPortfolio
              assets={assets}
              history={history}
              settings={glassSettings}
              totalProfit2026={1148790}
            />
            <EmergencyFundCard fund={emergencyFund} settings={glassSettings} />
          </div>
        )}

        {/* PAGE 5: SALDO BY REKENING */}
        {activePage === 'accounts' && (
          <div className="animate-in fade-in duration-300">
            <AccountsPage
              accounts={accounts}
              settings={glassSettings}
              onTransfer={handleInternalTransfer}
              transactions={transactions}
            />
          </div>
        )}

        {/* PAGE 6: JURNAL & REKAP DATA */}
        {activePage === 'journal' && (
          <div className="animate-in fade-in duration-300">
            <TransactionManager
              transactions={transactions}
              settings={glassSettings}
              onAddTransaction={(tx) => handleAddTransaction(tx, true)}
              onEditTransaction={handleEditTransaction}
              onDeleteTransaction={handleDeleteTransaction}
              onSyncGoogleSheet={handleSyncFromSheets}
              isSyncing={isSyncing}
              currentSheetName={sheetName}
              onSelectMonth={handleSelectMonth}
              availableSheets={availableSheets}
            />
          </div>
        )}

        {/* Footer */}
        <footer className="pt-6 pb-10 border-t border-white/10 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© 2026 Kelvin Gautama</p>
          <p className="flex items-center gap-1.5 text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Real-time Google Workspace Sheets Synchronized
          </p>
        </footer>
      </div>

      {/* Glass Inspector Modal */}
      <GlassSettingsModal
        isOpen={isGlassModalOpen}
        onClose={() => setIsGlassModalOpen(false)}
        settings={glassSettings}
        onUpdateSettings={setGlassSettings}
      />

      {/* Automated Financial Report Modal */}
      <AutomatedReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        transactions={transactions}
        budgets={budgets}
        emergencyFund={emergencyFund}
        totalAset={totalAset}
        totalIncome={totalPemasukan}
        totalExpense={totalPengeluaran}
        settings={glassSettings}
      />

      {/* Semi-Transparent Liquid Glass Popup Menu Container */}
      <GlassMenuPopup
        isOpen={isMenuPopupOpen}
        onClose={() => setIsMenuPopupOpen(false)}
        activePage={activePage}
        onSelectPage={setActivePage}
        settings={glassSettings}
        txCount={transactions.length}
        onOpenReport={() => setIsReportModalOpen(true)}
        onOpenInspector={() => setIsGlassModalOpen(true)}
        onOpenProjectManager={() => setIsProjectManagerOpen(true)}
        isGoogleConnected={Boolean(user)}
        user={user}
        spreadsheetId={spreadsheetId}
        sheetName={sheetName}
        isSyncing={isSyncing}
        lastSynced={lastSynced}
        onLogin={handleGoogleLogin}
        onLogout={handleGoogleLogout}
        onUpdateSpreadsheetId={(id) => handleSaveProjectConfig(id, sheetName)}
        onUpdateSheetName={(name) => handleSaveProjectConfig(spreadsheetId, name)}
        onSyncNow={handleSyncFromSheets}
        onPushToSheet={handlePushAllToSheet}
      />

      {/* Google Sheets Project Sync Manager Modal */}
      <ProjectSyncManagerModal
        isOpen={isProjectManagerOpen}
        onClose={() => setIsProjectManagerOpen(false)}
        user={user}
        spreadsheetId={spreadsheetId}
        sheetName={sheetName}
        onSaveProjectConfig={handleSaveProjectConfig}
        onLogin={handleGoogleLogin}
        onSyncNow={handleSyncFromSheets}
        isSyncing={isSyncing}
        settings={glassSettings}
      />

      {/* Floating Liquid Glass Interface Bottom Pill (Image 4 Match) */}
      <div className="fixed bottom-4 inset-x-0 z-40 flex justify-center pointer-events-none px-3">
        <div
          style={{
            background: 'rgba(15, 20, 38, 0.78)',
            backdropFilter: 'blur(24px) saturate(190%)',
            WebkitBackdropFilter: 'blur(24px) saturate(190%)',
            boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.7), inset 0 1px 1px rgba(255, 255, 255, 0.25)'
          }}
          className="pointer-events-auto flex items-center gap-1.5 p-1.5 rounded-full border border-white/15 text-xs font-semibold text-slate-200"
        >
          <button
            onClick={() => {
              triggerHaptic('selection');
              setActivePage('summary');
            }}
            className={`px-3 py-1.5 rounded-full transition ${
              activePage === 'summary'
                ? 'bg-white/20 text-white font-bold'
                : 'hover:text-white hover:bg-white/5 text-slate-300'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => {
              triggerHaptic('selection');
              setActivePage('cashflow');
            }}
            className={`px-3 py-1.5 rounded-full transition flex items-center gap-1 ${
              activePage === 'cashflow'
                ? 'bg-emerald-500/25 text-emerald-300 font-bold border border-emerald-500/30'
                : 'hover:text-white hover:bg-white/5 text-slate-300'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span>Cashflow</span>
          </button>
          <button
            onClick={() => {
              triggerHaptic('medium');
              setIsMenuPopupOpen(true);
            }}
            className="px-3.5 py-1.5 rounded-full bg-blue-600/30 text-blue-300 hover:bg-blue-600/40 border border-blue-400/40 font-bold transition flex items-center gap-1.5 shadow-sm active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5 text-sky-300" />
            <span>Menu</span>
          </button>
        </div>
      </div>
    </div>
  );
}
