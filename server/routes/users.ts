import express from 'express';
import bcrypt from 'bcryptjs';
import { getSheetData, updateSheetData, clearSheetData, appendSheetData, findRowIndexById, rowsToObjects, objectToRow, ensureSheetExists } from '../../lib/googleSheets.js';
import { uploadImage } from '../../lib/cloudinary.js';

const router = express.Router();
const SHEET_NAME = 'Users';
const HEADERS = ['id', 'name', 'email', 'password', 'role', 'profile_pic', 'bio', 'created_at'];

router.get('/', async (req, res) => {
  try {
    res.setHeader('Cache-Control', 'no-store, max-age=0');
    await ensureSheetExists(SHEET_NAME, HEADERS);
    const rows = await getSheetData(`${SHEET_NAME}!A:Z`);
    const users = rowsToObjects(rows, HEADERS).map(u => {
      const { password, ...safeUser } = u;
      return safeUser;
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    await ensureSheetExists(SHEET_NAME, HEADERS);
    const { id } = req.params;
    const rowIndex = await findRowIndexById(SHEET_NAME, id);
    
    if (rowIndex === -1) {
      return res.status(404).json({ error: 'User not found' });
    }

    const rows = await getSheetData(`${SHEET_NAME}!A${rowIndex}:Z${rowIndex}`);
    const existingUser = rowsToObjects(rows, HEADERS)[0];

    let profilePicUrl = req.body.profile_pic !== undefined ? req.body.profile_pic : existingUser.profile_pic || '';
    if (profilePicUrl.startsWith('data:image')) {
      profilePicUrl = await uploadImage(profilePicUrl, 'users');
    }

    const updatedUser = { 
      ...existingUser, 
      ...req.body,
      profile_pic: profilePicUrl,
      bio: req.body.bio !== undefined ? req.body.bio : existingUser.bio || ''
    };
    
    if (req.body.password) {
      const salt = await bcrypt.genSalt(10);
      updatedUser.password = await bcrypt.hash(req.body.password, salt);
    }

    const emails = process.env.ADMIN_EMAILS || '';
    const adminEmails = emails.split(',').map((e) => e.trim().toLowerCase());
    if (adminEmails.includes(updatedUser.email.toLowerCase())) {
       updatedUser.role = 'Admin';
    }

    const rowData = objectToRow(updatedUser, HEADERS);
    await updateSheetData(`${SHEET_NAME}!A${rowIndex}:Z${rowIndex}`, [rowData]);
    
    const { password, ...safeUser } = updatedUser;
    res.json(safeUser);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await ensureSheetExists(SHEET_NAME, HEADERS);
    const { id } = req.params;
    const rowIndex = await findRowIndexById(SHEET_NAME, id);
    
    if (rowIndex === -1) {
      return res.status(404).json({ error: 'User not found' });
    }

    await clearSheetData(`${SHEET_NAME}!A${rowIndex}:Z${rowIndex}`);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

export default router;
