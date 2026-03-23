import express from 'express';
import { getSheetData, appendSheetData, updateSheetData, rowsToObjects, objectToRow, ensureSheetExists, findRowIndexById } from '../../lib/googleSheets.js';

const router = express.Router();
const SHEET_NAME = 'Queries';
const HEADERS = ['id', 'name', 'email', 'message', 'status', 'created_at'];

router.get('/', async (req, res) => {
  try {
    res.setHeader('Cache-Control', 'no-store, max-age=0');
    await ensureSheetExists(SHEET_NAME, HEADERS);
    const rows = await getSheetData(`${SHEET_NAME}!A:Z`);
    const queries = rowsToObjects(rows, HEADERS);
    // Sort by created_at DESC
    queries.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    res.json(queries);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch queries' });
  }
});

router.post('/', async (req, res) => {
  try {
    await ensureSheetExists(SHEET_NAME, HEADERS);
    const newQuery = {
      id: Date.now().toString(),
      name: req.body.name || '',
      email: req.body.email || '',
      message: req.body.message || '',
      status: 'pending',
      created_at: new Date().toISOString(),
    };
    
    const rowData = objectToRow(newQuery, HEADERS);
    await appendSheetData(`${SHEET_NAME}!A:Z`, [rowData]);
    
    res.json(newQuery);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add query' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    await ensureSheetExists(SHEET_NAME, HEADERS);
    const { id } = req.params;
    const rowIndex = await findRowIndexById(SHEET_NAME, id);
    
    if (rowIndex === -1) {
      return res.status(404).json({ error: 'Query not found' });
    }

    const rows = await getSheetData(`${SHEET_NAME}!A${rowIndex}:Z${rowIndex}`);
    const existingQuery = rowsToObjects(rows, HEADERS)[0];

    const updatedQuery = { ...existingQuery, ...req.body };
    
    const rowData = objectToRow(updatedQuery, HEADERS);
    await updateSheetData(`${SHEET_NAME}!A${rowIndex}:Z${rowIndex}`, [rowData]);
    
    res.json(updatedQuery);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update query' });
  }
});

export default router;
