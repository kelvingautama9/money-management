import { Transaction } from '../types';

/**
 * Extracts Google Spreadsheet ID from a URL or raw ID string.
 */
export function extractSpreadsheetId(input: string): string {
  if (!input) return '';
  const trimmed = input.trim();
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return match[1];
  }
  return trimmed;
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
