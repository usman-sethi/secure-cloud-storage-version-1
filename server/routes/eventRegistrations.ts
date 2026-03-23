import express from 'express';
import { getSheetData, appendSheetData, updateSheetData, clearSheetData, rowsToObjects, objectToRow, ensureSheetExists, findRowIndexById } from '../../lib/googleSheets.js';
import { uploadImage } from '../../lib/cloudinary.js';

const router = express.Router();
const SHEET_NAME = 'EVENT REGIS';
const HEADERS = ['id', 'event_id', 'full_name', 'program', 'section', 'mobile_number', 'email', 'payment_proof', 'status', 'created_at'];

router.get('/', async (req, res) => {
  try {
    res.setHeader('Cache-Control', 'no-store, max-age=0');
    await ensureSheetExists(SHEET_NAME, HEADERS);
    const rows = await getSheetData(`'${SHEET_NAME}'!A:Z`);
    const registrations = rowsToObjects(rows, HEADERS);
    res.json(registrations);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch event registrations' });
  }
});

router.post('/', async (req, res) => {
  try {
    await ensureSheetExists(SHEET_NAME, HEADERS);
    
    const newRegistration = {
      id: Date.now().toString(),
      event_id: req.body.event_id || '',
      full_name: req.body.full_name || '',
      program: req.body.program || '',
      section: req.body.section || '',
      mobile_number: req.body.mobile_number || '',
      email: req.body.email || '',
      payment_proof: '',
      status: 'registered', // 'registered', 'pending_approval', 'approved'
      created_at: new Date().toISOString(),
    };
    
    const rowData = objectToRow(newRegistration, HEADERS);
    await appendSheetData(`'${SHEET_NAME}'!A:Z`, [rowData]);
    
    res.json(newRegistration);
  } catch (error: any) {
    console.error('Failed to add registration. Detailed error:', error);
    res.status(500).json({ error: `Failed to add registration: ${error.message || 'Unknown error'}` });
  }
});

router.put('/:id', async (req, res) => {
  try {
    await ensureSheetExists(SHEET_NAME, HEADERS);
    const { id } = req.params;
    const rowIndex = await findRowIndexById(SHEET_NAME, id);
    
    if (rowIndex === -1) {
      return res.status(404).json({ error: 'Registration not found' });
    }

    const rows = await getSheetData(`'${SHEET_NAME}'!A${rowIndex}:Z${rowIndex}`);
    const existingRegistration = rowsToObjects(rows, HEADERS)[0];

    let paymentProofUrl = req.body.payment_proof !== undefined ? req.body.payment_proof : existingRegistration.payment_proof || '';
    if (paymentProofUrl.startsWith('data:image')) {
      paymentProofUrl = await uploadImage(paymentProofUrl, 'event_registrations');
    }

    const updatedRegistration = { 
      ...existingRegistration, 
      ...req.body,
      payment_proof: paymentProofUrl
    };
    
    const rowData = objectToRow(updatedRegistration, HEADERS);
    await updateSheetData(`'${SHEET_NAME}'!A${rowIndex}:Z${rowIndex}`, [rowData]);
    
    res.json(updatedRegistration);
  } catch (error) {
    console.error('Failed to update registration:', error);
    res.status(500).json({ error: 'Failed to update registration' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await ensureSheetExists(SHEET_NAME, HEADERS);
    const { id } = req.params;
    const rowIndex = await findRowIndexById(SHEET_NAME, id);
    
    if (rowIndex === -1) {
      return res.status(404).json({ error: 'Registration not found' });
    }

    await clearSheetData(`'${SHEET_NAME}'!A${rowIndex}:Z${rowIndex}`);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete registration' });
  }
});

export default router;
