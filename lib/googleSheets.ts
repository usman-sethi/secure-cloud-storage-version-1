import { google } from 'googleapis';
import dotenv from 'dotenv';

dotenv.config();

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

// Handle private key formatting (replace escaped newlines and remove quotes)
const getPrivateKey = () => {
  let key = process.env.GOOGLE_PRIVATE_KEY;
  if (!key) return undefined;
  
  // Remove surrounding quotes if they exist (common in Netlify/Vercel env vars)
  if (key.startsWith('"') && key.endsWith('"')) {
    key = key.slice(1, -1);
  } else if (key.startsWith("'") && key.endsWith("'")) {
    key = key.slice(1, -1);
  }
  
  // Replace escaped newlines with actual newlines
  return key.replace(/\\n/g, '\n');
};

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: getPrivateKey(),
  },
  scopes: SCOPES,
});

const sheets = google.sheets({ version: 'v4', auth });
const spreadsheetId = process.env.GOOGLE_SHEET_ID;

// Simple in-memory cache to avoid hitting Google Sheets API quota limits
const cache = new Map<string, { data: any[][], timestamp: number }>();
const CACHE_TTL = 60 * 1000; // 60 seconds

function extractSheetName(range: string): string {
  const match = range.match(/^'?([^'!]+)'?!/);
  return match ? match[1] : '';
}

function invalidateCache(range: string) {
  const sheetName = extractSheetName(range);
  if (!sheetName) {
    cache.clear();
    return;
  }
  
  for (const key of cache.keys()) {
    if (key.includes(`_${sheetName}!`) || key.includes(`_'${sheetName}'!`)) {
      cache.delete(key);
    }
  }
}

export async function getSheetData(range: string) {
  if (!spreadsheetId) {
    console.warn(`[Google Sheets] Missing GOOGLE_SHEET_ID. Returning empty data for ${range}.`);
    return [];
  }

  const cacheKey = `${spreadsheetId}_${range}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });
    const data = response.data.values || [];
    cache.set(cacheKey, { data, timestamp: Date.now() });
    return data;
  } catch (error: any) {
    // If quota exceeded, return cached data if available (even if expired)
    if (error?.message?.includes('Quota exceeded') && cached) {
      console.warn(`[Google Sheets] Quota exceeded for ${range}. Returning expired cached data.`);
      return cached.data;
    }
    console.error(`Error getting data from ${range}:`, error);
    return [];
  }
}

export async function appendSheetData(range: string, values: any[][]) {
  if (!spreadsheetId) {
    throw new Error('Missing GOOGLE_SHEET_ID environment variable.');
  }
  try {
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range,
      valueInputOption: 'RAW',
      requestBody: {
        values,
      },
    });
    invalidateCache(range);
    return response.data;
  } catch (error) {
    console.error(`Error appending data to ${range}:`, error);
    throw error;
  }
}

export async function updateSheetData(range: string, values: any[][]) {
  if (!spreadsheetId) {
    throw new Error('Missing GOOGLE_SHEET_ID environment variable.');
  }
  try {
    // Fetch existing row to find offset
    const existingDataResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });
    
    const existingRow = existingDataResponse.data.values?.[0] || [];
    let firstNonEmptyIndex = 0;
    while (firstNonEmptyIndex < existingRow.length && (!existingRow[firstNonEmptyIndex] || existingRow[firstNonEmptyIndex].toString().trim() === '')) {
      firstNonEmptyIndex++;
    }

    // Pad the values
    const paddedValues = values.map(row => Array(firstNonEmptyIndex).fill('').concat(row));

    const response = await sheets.spreadsheets.values.update({
      spreadsheetId,
      range,
      valueInputOption: 'RAW',
      requestBody: {
        values: paddedValues,
      },
    });
    invalidateCache(range);
    return response.data;
  } catch (error) {
    console.error(`Error updating data in ${range}:`, error);
    throw error;
  }
}

export async function clearSheetData(range: string) {
  if (!spreadsheetId) {
    throw new Error('Missing GOOGLE_SHEET_ID environment variable.');
  }
  try {
    const response = await sheets.spreadsheets.values.clear({
      spreadsheetId,
      range,
    });
    invalidateCache(range);
    return response.data;
  } catch (error) {
    console.error(`Error clearing data in ${range}:`, error);
    throw error;
  }
}

const existingSheets = new Set<string>();

export async function ensureSheetExists(sheetTitle: string, headers: string[]) {
  if (!spreadsheetId) return;
  if (existingSheets.has(sheetTitle)) return;

  try {
    const response = await sheets.spreadsheets.get({
      spreadsheetId,
    });
    
    const sheetExists = response.data.sheets?.some(
      (sheet) => sheet.properties?.title === sheetTitle
    );

    if (!sheetExists) {
      console.log(`Creating sheet: ${sheetTitle}`);
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [
            {
              addSheet: {
                properties: {
                  title: sheetTitle,
                },
              },
            },
          ],
        },
      });

      // Add headers
      await appendSheetData(`'${sheetTitle}'!A1`, [headers]);
    }
    
    existingSheets.add(sheetTitle);
  } catch (error) {
    console.error(`Error ensuring sheet ${sheetTitle} exists:`, error);
    throw error;
  }
}

// Helper to find row index by ID
export async function findRowIndexById(sheetName: string, id: string): Promise<number> {
  const rows = await getSheetData(`'${sheetName}'!A:Z`);
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;
    
    // Find the first non-empty cell index
    let firstNonEmptyIndex = 0;
    while (firstNonEmptyIndex < row.length && (!row[firstNonEmptyIndex] || row[firstNonEmptyIndex].toString().trim() === '')) {
      firstNonEmptyIndex++;
    }
    
    // The ID is the first column (index 0 relative to first non-empty)
    if (row[firstNonEmptyIndex] && row[firstNonEmptyIndex].toString().trim() === id.toString().trim()) {
      return i + 1; // 1-based index for sheets
    }
  }
  return -1;
}

// Helper to convert array of arrays to array of objects
export function rowsToObjects(rows: any[][], headers: string[]) {
  if (!rows || rows.length === 0) return [];
  
  // Check if the first row is a header row (handling shifted data)
  let startIndex = 0;
  if (rows[0] && rows[0].length > 0) {
    let firstNonEmptyIndex = 0;
    while (firstNonEmptyIndex < rows[0].length && (!rows[0][firstNonEmptyIndex] || rows[0][firstNonEmptyIndex].toString().trim() === '')) {
      firstNonEmptyIndex++;
    }
    if (rows[0][firstNonEmptyIndex] && rows[0][firstNonEmptyIndex].toString().toLowerCase() === headers[0].toLowerCase()) {
      startIndex = 1;
    }
  }

  return rows
    .slice(startIndex)
    .filter((row) => row && row.length > 0 && row.some(cell => cell && cell.toString().trim() !== ''))
    .map((row) => {
      // Find the first non-empty cell index to handle shifted data
      let firstNonEmptyIndex = 0;
      while (firstNonEmptyIndex < row.length && (!row[firstNonEmptyIndex] || row[firstNonEmptyIndex].toString().trim() === '')) {
        firstNonEmptyIndex++;
      }

      const obj: any = {};
      headers.forEach((header, index) => {
        obj[header] = row[firstNonEmptyIndex + index] || '';
      });
      return obj;
    });
}

// Helper to convert object to array based on headers
export function objectToRow(obj: any, headers: string[]) {
  return headers.map((header) => obj[header] || '');
}
