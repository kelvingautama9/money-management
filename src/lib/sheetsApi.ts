import { Transaction, SheetSummary } from '../types';

/**
 * Extracts Google Spreadsheet ID from a URL or raw ID string.
 * Supports /spreadsheets/d/{id}, /spreadsheets/u/0/d/{id}, /d/{id}, and raw IDs.
 */
export function extractSpreadsheetId(input: string): string {
  if (!input) return '';
  const trimmed = input.trim();
  // Match standard /d/{id} pattern in any Google Docs URL
  const match = trimmed.match(/\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return match[1];
  }
  // Strip any URL protocol, domain, parameters or hashes if present
  const cleaned = trimmed
    .replace(/^https?:\/\/[^/]+\//, '')
    .split('?')[0]
    .split('#')[0]
    .split('/')[0];
  return cleaned || trimmed;
}

/**
 * Formats a number to Indonesian Rupiah currency string.
 */
export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(amount);
}

/**
 * Parses Indonesian currency strings like "Rp5.916.058", "Rp 200.122", "5.916.058" into a number.
 */
export function parseCurrencyToNumber(val: string | number | undefined): number {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  const clean = val
    .toString()
    .replace(/[^0-9,-]/g, '')
    .replace(',', '.');
  const num = parseFloat(clean);
  return isNaN(num) ? 0 : num;
}

/**
 * Parses both transaction records (columns A..F) and the spreadsheet's precalculated
 * monthly summary tables (columns H..N) from Google Sheets grid data.
 */
export function parseSheetGridData(
  rows: string[][],
  sheetName: string
): { transactions: Transaction[]; summary: SheetSummary } {
  const transactions: Transaction[] = [];
  const summary: SheetSummary = {
    accountBalances: {}
  };

  if (!rows || rows.length === 0) {
    return { transactions, summary };
  }

  let readingAccountSection = false;

  rows.forEach((row, rowIndex) => {
    if (!row || row.length === 0) return;

    // --- 1. Extract Transaction from columns A..F ---
    // Header check
    const col0 = (row[0] || '').toString().trim();
    const col1 = (row[1] || '').toString().trim();
    const col2 = (row[2] || '').toString().trim();
    const col3 = (row[3] || '').toString().trim();
    const col4 = (row[4] || '').toString().trim();
    const col5 = (row[5] || '').toString().trim();

    const isHeaderRow =
      col0.toLowerCase().includes('bulan') &&
      (col1.toLowerCase().includes('kategori') || col2.toLowerCase().includes('akun'));

    if (!isHeaderRow && (col0 || col1 || col4)) {
      const parsedAmount = parseCurrencyToNumber(col4);
      // Valid transaction candidate
      if (col1 || col2 || parsedAmount > 0) {
        transactions.push({
          id: `sheet-tx-${sheetName}-${rowIndex + 1}`,
          bulan: col0 || sheetName,
          kategori: col1 || 'Lain-lain',
          akun: col2 || 'Bank BCA',
          tipe: (col3 as any) || 'Expense',
          jumlah: parsedAmount,
          catatan: col5 || '',
          rowIndex: rowIndex + 1
        });
      }
    }

    // --- 2. Extract Precalculated Summary from columns H..N (or scan all cells >= column index 6) ---
    for (let c = 6; c < row.length; c++) {
      const cellText = (row[c] || '').toString().trim();
      const cellTextLower = cellText.toLowerCase();
      if (!cellText) continue;

      // Check Total Aset (Net Worth)
      if (cellTextLower === 'total aset' || cellTextLower === 'total asset' || cellTextLower.includes('kekayaan bersih')) {
        const nextVal = row[c + 1] || row[c + 2];
        const num = parseCurrencyToNumber(nextVal);
        if (num > 0) {
          summary.totalAset = num;
        }
      }

      // Check Total Cash Standby + Dana Darurat
      if (cellTextLower.includes('total cash standby') || cellTextLower.includes('cash standby')) {
        const nextVal = row[c + 1] || row[c + 2];
        const num = parseCurrencyToNumber(nextVal);
        if (num > 0) {
          summary.cashStandbyDanaDarurat = num;
        }
      }

      // Check Total Investment
      if (cellTextLower === 'total investment' || cellTextLower === 'total investasi' || cellTextLower.includes('portofolio investasi')) {
        const nextVal = row[c + 1] || row[c + 2];
        const num = parseCurrencyToNumber(nextVal);
        if (num > 0) {
          summary.totalInvestment = num;
        }
      }

      // Check Account Balances section header
      if (cellTextLower === 'nama akun') {
        readingAccountSection = true;
      }

      // Read account rows under "Nama Akun"
      if (readingAccountSection && cellTextLower !== 'nama akun') {
        if (cellTextLower.startsWith('total pemasukan') || cellTextLower.startsWith('dana darurat') || cellTextLower.startsWith('jenis budgeting')) {
          readingAccountSection = false;
        } else {
          const nextVal = row[c + 1];
          if (nextVal !== undefined && nextVal !== '') {
            const num = parseCurrencyToNumber(nextVal);
            if (summary.accountBalances) {
              summary.accountBalances[cellText] = num;
            }
          }
        }
      }

      // Check Emergency Fund
      if (cellTextLower.includes('dana darurat (blu bca)') || cellTextLower.includes('dana darurat saat ini')) {
        const nextVal = row[c + 1];
        const num = parseCurrencyToNumber(nextVal);
        if (num > 0) {
          summary.emergencyFund = {
            ...(summary.emergencyFund || { target: 12000000, kekurangan: 0, persentase: 0 }),
            current: num
          };
        }
      }

      if (cellTextLower.includes('target dana darurat')) {
        const nextVal = row[c + 1];
        const num = parseCurrencyToNumber(nextVal);
        if (num > 0 && summary.emergencyFund) {
          summary.emergencyFund.target = num;
        }
      }
    }
  });

  return { transactions, summary };
}

/**
 * Fetches sheet metadata to determine sheet names and titles.
 */
export async function getSpreadsheetDetails(spreadsheetId: string, accessToken: string) {
  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?includeGridData=false`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData?.error?.message || `Gagal membaca informasi spreadsheet (HTTP ${res.status})`);
  }
  return await res.json();
}

/**
 * Reads range values from Google Sheets.
 */
export async function fetchSheetValues(spreadsheetId: string, range: string, accessToken: string): Promise<string[][]> {
  const encodedRange = encodeURIComponent(range);
  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodedRange}`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData?.error?.message || `Gagal mengambil data dari Google Sheets (HTTP ${res.status})`);
  }
  const data = await res.json();
  return data.values || [];
}

/**
 * Formats a sheet name and range into a safe Google Sheets A1 notation string with single quotes.
 */
export function formatSheetRange(sheetName: string, cellRange: string): string {
  const clean = sheetName.replace(/'/g, "''");
  return `'${clean}'!${cellRange}`;
}

/**
 * Appends a transaction row to Google Sheets.
 */
export async function appendRowToSheet(
  spreadsheetId: string,
  sheetName: string,
  tx: Omit<Transaction, 'id'>,
  accessToken: string
) {
  const formattedJumlah = formatRupiah(tx.jumlah);
  const rowValues = [[tx.bulan, tx.kategori, tx.akun, tx.tipe, formattedJumlah, tx.catatan || '']];
  const range = encodeURIComponent(formatSheetRange(sheetName, 'A:F'));

  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ values: rowValues })
    }
  );

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData?.error?.message || 'Gagal menambahkan baris ke Google Sheets');
  }
  return await res.json();
}

/**
 * Updates a specific row in Google Sheets.
 */
export async function updateRowInSheet(
  spreadsheetId: string,
  sheetName: string,
  rowIndex: number,
  tx: Transaction,
  accessToken: string
) {
  const formattedJumlah = formatRupiah(tx.jumlah);
  const rowValues = [[tx.bulan, tx.kategori, tx.akun, tx.tipe, formattedJumlah, tx.catatan || '']];
  const range = encodeURIComponent(formatSheetRange(sheetName, `A${rowIndex}:F${rowIndex}`));

  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ values: rowValues })
    }
  );

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData?.error?.message || 'Gagal memperbarui baris di Google Sheets');
  }
  return await res.json();
}

/**
 * Clears/Empties a row in Google Sheets when deleting.
 */
export async function clearRowInSheet(
  spreadsheetId: string,
  sheetName: string,
  rowIndex: number,
  accessToken: string
) {
  const range = encodeURIComponent(formatSheetRange(sheetName, `A${rowIndex}:F${rowIndex}`));
  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:clear`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData?.error?.message || 'Gagal menghapus baris dari Google Sheets');
  }
  return await res.json();
}

/**
 * Creates a brand new Google Spreadsheet with the exact template headers & formatting.
 */
export async function createNewProjectSpreadsheet(
  title: string,
  accessToken: string
): Promise<{ spreadsheetId: string; spreadsheetUrl: string; sheetName: string }> {
  const payload = {
    properties: {
      title: title || 'Liquid Glass Financial - Mutasi & Cashflow'
    },
    sheets: [
      {
        properties: {
          title: 'Sheet1',
          gridProperties: {
            frozenRowCount: 1
          }
        },
        data: [
          {
            startRow: 0,
            startColumn: 0,
            rowData: [
              {
                values: [
                  { userEnteredValue: { stringValue: 'Bulan' } },
                  { userEnteredValue: { stringValue: 'Kategori' } },
                  { userEnteredValue: { stringValue: 'Akun' } },
                  { userEnteredValue: { stringValue: 'Tipe' } },
                  { userEnteredValue: { stringValue: 'Jumlah' } },
                  { userEnteredValue: { stringValue: 'Catatan' } }
                ]
              }
            ]
          }
        ]
      }
    ]
  };

  const res = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData?.error?.message || `Gagal membuat spreadsheet baru (HTTP ${res.status})`);
  }

  const data = await res.json();
  return {
    spreadsheetId: data.spreadsheetId,
    spreadsheetUrl: data.spreadsheetUrl,
    sheetName: 'Sheet1'
  };
}

/**
 * Lists user spreadsheets from Google Drive to allow 1-click project selection.
 */
export async function listUserSpreadsheets(
  accessToken: string
): Promise<Array<{ id: string; name: string; modifiedTime?: string; webViewLink?: string }>> {
  const query = encodeURIComponent("mimeType='application/vnd.google-apps.spreadsheet' and trashed=false");
  const fields = encodeURIComponent('files(id, name, modifiedTime, webViewLink)');
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${query}&orderBy=modifiedTime desc&pageSize=20&fields=${fields}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` }
    }
  );

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData?.error?.message || `Gagal mengambil daftar file spreadsheet (HTTP ${res.status})`);
  }

  const data = await res.json();
  return data.files || [];
}

/**
 * Retrieves all sheet/tab titles from a Google Spreadsheet.
 */
export async function getSpreadsheetSheetTitles(
  spreadsheetId: string,
  accessToken: string
): Promise<string[]> {
  try {
    const details = await getSpreadsheetDetails(spreadsheetId, accessToken);
    if (details && details.sheets && Array.isArray(details.sheets)) {
      return details.sheets
        .map((s: any) => s.properties?.title)
        .filter((title: any) => typeof title === 'string' && title.trim().length > 0);
    }
    return [];
  } catch (err) {
    console.warn('Failed to get sheet titles from spreadsheet details:', err);
    return [];
  }
}
