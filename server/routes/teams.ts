import express from 'express';
import { getSheetData, appendSheetData, updateSheetData, clearSheetData, rowsToObjects, objectToRow, ensureSheetExists, findRowIndexById } from '../../lib/googleSheets.js';

const router = express.Router();
const SHEET_NAME = 'Teams';
const HEADERS = ['id', 'team_name', 'description', 'lead_id', 'created_at'];

router.get('/', async (req, res) => {
  try {
    res.setHeader('Cache-Control', 'no-store, max-age=0');
    await ensureSheetExists(SHEET_NAME, HEADERS);
    const rows = await getSheetData(`${SHEET_NAME}!A:Z`);
    const teams = rowsToObjects(rows, HEADERS);
    // Sort by created_at DESC safely
    teams.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime() || 0;
      const dateB = new Date(b.created_at).getTime() || 0;
      return dateB - dateA;
    });
    
    if (req.query.debug === 'true') {
      return res.json({
        rawRows: rows,
        parsedTeams: teams,
        sheetName: SHEET_NAME,
        headers: HEADERS
      });
    }
    
    res.json(teams);
  } catch (error) {
    console.error('Error fetching teams:', error);
    res.status(500).json({ error: 'Failed to fetch teams', details: String(error) });
  }
});

router.post('/', async (req, res) => {
  try {
    await ensureSheetExists(SHEET_NAME, HEADERS);
    const newTeam = {
      id: Date.now().toString(),
      team_name: req.body.team_name || '',
      description: req.body.description || '',
      lead_id: req.body.lead_id || '',
      created_at: new Date().toISOString(),
    };
    
    const rowData = objectToRow(newTeam, HEADERS);
    await appendSheetData(`${SHEET_NAME}!A:Z`, [rowData]);
    
    res.json(newTeam);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add team' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    await ensureSheetExists(SHEET_NAME, HEADERS);
    const { id } = req.params;
    const rowIndex = await findRowIndexById(SHEET_NAME, id);
    
    if (rowIndex === -1) {
      return res.status(404).json({ error: 'Team not found' });
    }

    const rows = await getSheetData(`${SHEET_NAME}!A${rowIndex}:Z${rowIndex}`);
    const existingTeam = rowsToObjects(rows, HEADERS)[0];

    const updatedTeam = { 
      ...existingTeam, 
      ...req.body,
      description: req.body.description !== undefined ? req.body.description : existingTeam.description || '',
      lead_id: req.body.lead_id !== undefined ? req.body.lead_id : existingTeam.lead_id || ''
    };
    
    const rowData = objectToRow(updatedTeam, HEADERS);
    await updateSheetData(`${SHEET_NAME}!A${rowIndex}:Z${rowIndex}`, [rowData]);
    
    res.json(updatedTeam);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update team' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await ensureSheetExists(SHEET_NAME, HEADERS);
    const { id } = req.params;
    const rowIndex = await findRowIndexById(SHEET_NAME, id);
    
    if (rowIndex === -1) {
      return res.status(404).json({ error: 'Team not found' });
    }

    await clearSheetData(`${SHEET_NAME}!A${rowIndex}:Z${rowIndex}`);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete team' });
  }
});

export default router;
