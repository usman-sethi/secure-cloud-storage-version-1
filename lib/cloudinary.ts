import { v2 as cloudinary } from 'cloudinary';
import { appendSheetData, ensureSheetExists } from './googleSheets.js';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dppwgwy1v',
  api_key: process.env.CLOUDINARY_API_KEY || '218685277464572',
  api_secret: process.env.CLOUDINARY_API_SECRET || '0I6ZWDIEfPMtWzz5jo6tfxGXaBY',
});

const SHEET_NAME = 'PIC';
const HEADERS = ['id', 'url', 'public_id', 'created_at'];

export async function uploadImage(base64Image: string, folder: string = 'ccs-society'): Promise<string> {
  if (!base64Image || !base64Image.startsWith('data:image')) {
    return base64Image; // Return as is if it's already a URL or empty
  }

  try {
    await ensureSheetExists(SHEET_NAME, HEADERS);
    const result = await cloudinary.uploader.upload(base64Image, {
      folder,
      upload_preset: 'ccs-society',
    });

    const picData = [
      Date.now().toString(),
      result.secure_url,
      result.public_id,
      new Date().toISOString(),
    ];

    await appendSheetData(`${SHEET_NAME}!A:D`, [picData]);

    return result.secure_url;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error('Failed to upload image');
  }
}
