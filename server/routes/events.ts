import express from 'express';
import { getSheetData, appendSheetData, updateSheetData, clearSheetData, rowsToObjects, objectToRow, ensureSheetExists, findRowIndexById } from '../../lib/googleSheets.js';
import { uploadImage } from '../../lib/cloudinary.js';

const router = express.Router();
const SHEET_NAME = 'Events';
const HEADERS = ['id', 'title', 'description', 'date', 'image', 'registration_link', 'created_by', 'created_at'];

router.get('/', async (req, res) => {
  try {
    res.setHeader('Cache-Control', 'no-store, max-age=0');
    await ensureSheetExists(SHEET_NAME, HEADERS);
    const rows = await getSheetData(`${SHEET_NAME}!A:Z`);
    const events = rowsToObjects(rows, HEADERS);
    // Sort by created_at DESC
    events.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

router.post('/', async (req, res) => {
  try {
    await ensureSheetExists(SHEET_NAME, HEADERS);

    let imageUrl = req.body.image || '';
    if (imageUrl.startsWith('data:image')) {
      imageUrl = await uploadImage(imageUrl, 'events');
    }

    const newEvent = {
      id: Date.now().toString(),
      title: req.body.title || '',
      description: req.body.description || '',
      date: req.body.date || '',
      image: imageUrl,
      registration_link: req.body.registration_link || '',
      created_by: req.body.created_by || '',
      created_at: new Date().toISOString(),
    };
    
    const rowData = objectToRow(newEvent, HEADERS);
    await appendSheetData(`${SHEET_NAME}!A:Z`, [rowData]);
    
    res.json(newEvent);
  } catch (error: any) {
    console.error('Failed to add event. Detailed error:', error);
    res.status(500).json({ error: `Failed to add event: ${error.message || 'Unknown error'}` });
  }
});

router.put('/:id', async (req, res) => {
  try {
    await ensureSheetExists(SHEET_NAME, HEADERS);
    const { id } = req.params;
    const rowIndex = await findRowIndexById(SHEET_NAME, id);
    
    if (rowIndex === -1) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const rows = await getSheetData(`${SHEET_NAME}!A${rowIndex}:Z${rowIndex}`);
    const existingEvent = rowsToObjects(rows, HEADERS)[0];

    let imageUrl = req.body.image !== undefined ? req.body.image : existingEvent.image || '';
    if (imageUrl.startsWith('data:image')) {
      imageUrl = await uploadImage(imageUrl, 'events');
    }

    const updatedEvent = { 
      ...existingEvent, 
      ...req.body,
      image: imageUrl,
      registration_link: req.body.registration_link !== undefined ? req.body.registration_link : existingEvent.registration_link || ''
    };
    
    const rowData = objectToRow(updatedEvent, HEADERS);
    await updateSheetData(`${SHEET_NAME}!A${rowIndex}:Z${rowIndex}`, [rowData]);
    
    res.json(updatedEvent);
  } catch (error) {
    console.error('Failed to update event:', error);
    res.status(500).json({ error: 'Failed to update event' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await ensureSheetExists(SHEET_NAME, HEADERS);
    const { id } = req.params;
    const rowIndex = await findRowIndexById(SHEET_NAME, id);
    
    if (rowIndex === -1) {
      return res.status(404).json({ error: 'Event not found' });
    }

    await clearSheetData(`${SHEET_NAME}!A${rowIndex}:Z${rowIndex}`);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

export default router;
