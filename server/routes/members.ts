import express from 'express';
import { getSheetData, appendSheetData, updateSheetData, clearSheetData, rowsToObjects, objectToRow, ensureSheetExists, findRowIndexById } from '../../lib/googleSheets.js';
import { uploadImage } from '../../lib/cloudinary.js';

const router = express.Router();
const SHEET_NAME = 'Members';
const HEADERS = ['id', 'user_id', 'team_id', 'role', 'joined_at', 'image', 'bio'];

router.get('/', async (req, res) => {
  try {
    res.setHeader('Cache-Control', 'no-store, max-age=0');
    await ensureSheetExists(SHEET_NAME, HEADERS);
    const rows = await getSheetData(`${SHEET_NAME}!A:Z`);
    const members = rowsToObjects(rows, HEADERS);
    // Sort by joined_at DESC
    members.sort((a, b) => new Date(b.joined_at).getTime() - new Date(a.joined_at).getTime());
    res.json(members);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch members' });
  }
});

router.post('/', async (req, res) => {
  try {
    await ensureSheetExists(SHEET_NAME, HEADERS);
    let imageUrl = req.body.image || '';
    if (imageUrl.startsWith('data:image')) {
      imageUrl = await uploadImage(imageUrl, 'members');
    }

    const newMember = {
      id: Date.now().toString(),
      user_id: req.body.user_id || req.body.name || '',
      team_id: req.body.team_id || '',
      role: req.body.role || '',
      joined_at: new Date().toISOString(),
      image: imageUrl,
      bio: req.body.bio || '',
    };
    
    const rowData = objectToRow(newMember, HEADERS);
    await appendSheetData(`${SHEET_NAME}!A:Z`, [rowData]);
    
    res.json(newMember);
  } catch (error) {
    console.error('Failed to add member:', error);
    res.status(500).json({ error: 'Failed to add member' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    await ensureSheetExists(SHEET_NAME, HEADERS);
    const { id } = req.params;
    const rowIndex = await findRowIndexById(SHEET_NAME, id);
    
    if (rowIndex === -1) {
      return res.status(404).json({ error: 'Member not found' });
    }

    const rows = await getSheetData(`${SHEET_NAME}!A${rowIndex}:Z${rowIndex}`);
    const existingMember = rowsToObjects(rows, HEADERS)[0];

    let imageUrl = req.body.image !== undefined ? req.body.image : existingMember.image || '';
    if (imageUrl.startsWith('data:image')) {
      imageUrl = await uploadImage(imageUrl, 'members');
    }

    const updatedMember = { 
      ...existingMember, 
      ...req.body,
      role: req.body.role !== undefined ? req.body.role : existingMember.role || '',
      image: imageUrl,
      bio: req.body.bio !== undefined ? req.body.bio : existingMember.bio || ''
    };
    
    const rowData = objectToRow(updatedMember, HEADERS);
    await updateSheetData(`${SHEET_NAME}!A${rowIndex}:Z${rowIndex}`, [rowData]);
    
    res.json(updatedMember);
  } catch (error) {
    console.error('Failed to update member:', error);
    res.status(500).json({ error: 'Failed to update member' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await ensureSheetExists(SHEET_NAME, HEADERS);
    const { id } = req.params;
    const rowIndex = await findRowIndexById(SHEET_NAME, id);
    
    if (rowIndex === -1) {
      return res.status(404).json({ error: 'Member not found' });
    }

    await clearSheetData(`${SHEET_NAME}!A${rowIndex}:Z${rowIndex}`);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete member' });
  }
});

export default router;
