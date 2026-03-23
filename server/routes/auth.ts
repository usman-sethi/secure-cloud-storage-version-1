import express from 'express';
import bcrypt from 'bcryptjs';
import { getSheetData, appendSheetData, updateSheetData, rowsToObjects, objectToRow, ensureSheetExists, findRowIndexById } from '../../lib/googleSheets.js';

const router = express.Router();
const SHEET_NAME = 'Users';
const HEADERS = ['id', 'name', 'email', 'password', 'role', 'profile_pic', 'bio', 'created_at'];

const getAdminEmails = () => {
  const emails = process.env.ADMIN_EMAILS || '';
  return emails.split(',').map((e) => e.trim().toLowerCase());
};

router.post('/signup', async (req, res) => {
  try {
    await ensureSheetExists(SHEET_NAME, HEADERS);
    const { name, email, password } = req.body;
    
    if (!process.env.GOOGLE_SHEET_ID) {
      return res.status(500).json({ error: 'GOOGLE_SHEET_ID is not configured. Please set it in your environment variables.' });
    }

    const rows = await getSheetData(`${SHEET_NAME}!A:Z`);
    const users = rowsToObjects(rows, HEADERS);
    const existingUser = users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());
    
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const isAdmin = getAdminEmails().includes(email.toLowerCase());
    const role = isAdmin ? 'Admin' : 'Member';
    
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = {
      id: Date.now().toString(),
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role,
      profile_pic: '',
      bio: '',
      created_at: new Date().toISOString(),
    };

    const rowData = objectToRow(newUser, HEADERS);
    await appendSheetData(`${SHEET_NAME}!A:Z`, [rowData]);

    const { password: _, ...userWithoutPassword } = newUser;
    res.json({ user: userWithoutPassword });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/login', async (req, res) => {
  try {
    await ensureSheetExists(SHEET_NAME, HEADERS);
    const { email, password } = req.body;
    
    if (!process.env.GOOGLE_SHEET_ID) {
      return res.status(500).json({ error: 'GOOGLE_SHEET_ID is not configured. Please set it in your environment variables.' });
    }

    const rows = await getSheetData(`${SHEET_NAME}!A:Z`);
    const users = rowsToObjects(rows, HEADERS);
    const user = users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    let isMatch = false;
    if (!user.password.startsWith('$2a$') && !user.password.startsWith('$2b$')) {
      isMatch = user.password === password;
    } else {
      isMatch = await bcrypt.compare(password, user.password);
    }

    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isAdmin = getAdminEmails().includes(email.toLowerCase());
    if (isAdmin && user.role !== 'Admin') {
       user.role = 'Admin';
       const rowIndex = await findRowIndexById(SHEET_NAME, user.id);
       if (rowIndex !== -1) {
         const rowData = objectToRow(user, HEADERS);
         await updateSheetData(`${SHEET_NAME}!A${rowIndex}:Z${rowIndex}`, [rowData]);
       }
    }

    const { password: _, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
