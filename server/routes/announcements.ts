import express from 'express';
import { getSheetData, appendSheetData, updateSheetData, clearSheetData, rowsToObjects, objectToRow, ensureSheetExists, findRowIndexById } from '../../lib/googleSheets.js';
import { uploadImage } from '../../lib/cloudinary.js';

const router = express.Router();
const SHEET_NAME = 'Announcements';
const HEADERS = ['id', 'title', 'content', 'created_by', 'created_at', 'type', 'image'];

router.get('/test-connection', async (req, res) => {
  try {
    await ensureSheetExists(SHEET_NAME, HEADERS);
    const rows = await getSheetData(`${SHEET_NAME}!A1:A2`);
    res.json({ success: true, rows, spreadsheetId: process.env.GOOGLE_SHEET_ID ? 'Set' : 'Missing', clientEmail: process.env.GOOGLE_CLIENT_EMAIL ? 'Set' : 'Missing' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/', async (req, res) => {
  try {
    res.setHeader('Cache-Control', 'no-store, max-age=0');
    await ensureSheetExists(SHEET_NAME, HEADERS);
    const rows = await getSheetData(`${SHEET_NAME}!A:Z`);
    const announcements = rowsToObjects(rows, HEADERS);
    // Sort by created_at DESC
    announcements.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    res.json(announcements);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch announcements' });
  }
});

router.post('/', async (req, res) => {
  try {
    await ensureSheetExists(SHEET_NAME, HEADERS);
    let imageUrl = req.body.image || '';
    if (imageUrl.startsWith('data:image')) {
      imageUrl = await uploadImage(imageUrl, 'announcements');
    }

    const newAnnouncement = {
      id: Date.now().toString(),
      title: req.body.title || '',
      content: req.body.content || '',
      created_by: req.body.created_by || '',
      created_at: new Date().toISOString(),
      type: req.body.type || 'info',
      image: imageUrl,
    };
    
    const rowData = objectToRow(newAnnouncement, HEADERS);
    await appendSheetData(`${SHEET_NAME}!A:Z`, [rowData]);
    
    res.json(newAnnouncement);
  } catch (error: any) {
    console.error('Failed to add announcement. Detailed error:', error);
    res.status(500).json({ error: `Failed to add announcement: ${error.message || 'Unknown error'}` });
  }
});

router.put('/:id', async (req, res) => {
  try {
    await ensureSheetExists(SHEET_NAME, HEADERS);
    const { id } = req.params;
    const rowIndex = await findRowIndexById(SHEET_NAME, id);
    
    if (rowIndex === -1) {
      return res.status(404).json({ error: 'Announcement not found' });
    }

    const rows = await getSheetData(`${SHEET_NAME}!A${rowIndex}:Z${rowIndex}`);
    const existingAnnouncement = rowsToObjects(rows, HEADERS)[0];

    let imageUrl = req.body.image !== undefined ? req.body.image : existingAnnouncement.image || '';
    if (imageUrl.startsWith('data:image')) {
      imageUrl = await uploadImage(imageUrl, 'announcements');
    }

    const updatedAnnouncement = { 
      ...existingAnnouncement, 
      ...req.body,
      image: imageUrl
    };
    
    const rowData = objectToRow(updatedAnnouncement, HEADERS);
    await updateSheetData(`${SHEET_NAME}!A${rowIndex}:Z${rowIndex}`, [rowData]);
    
    res.json(updatedAnnouncement);
  } catch (error) {
    console.error('Failed to update announcement:', error);
    res.status(500).json({ error: 'Failed to update announcement' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await ensureSheetExists(SHEET_NAME, HEADERS);
    const { id } = req.params;
    const rowIndex = await findRowIndexById(SHEET_NAME, id);
    
    if (rowIndex === -1) {
      return res.status(404).json({ error: 'Announcement not found' });
    }

    await clearSheetData(`${SHEET_NAME}!A${rowIndex}:Z${rowIndex}`);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete announcement' });
  }
});

export default router;
