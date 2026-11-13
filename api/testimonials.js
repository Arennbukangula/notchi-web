/**
 * Vercel Serverless Function — Proxy untuk Google Apps Script Testimonials
 *
 * Menghindari CORS issue saat fetch dari browser di domain publik.
 * Vercel memanggil Google Apps Script dari server-side (tidak ada CORS).
 *
 * GET  /api/testimonials        → ambil semua testimonial dari Google Sheets
 * POST /api/testimonials        → tambah testimonial baru ke Google Sheets
 */

const APPS_SCRIPT_URL =
  process.env.TESTIMONIALS_APPS_SCRIPT_URL ||
  'https://script.google.com/macros/s/AKfycbwyqZJ9tRljJUZAWWZTiboMHUaVC_SyzuCtkgJVY0fJmJgeU43IofeZkNZeltcHsM2d0g/exec';

export default async function handler(req, res) {
  // Allow CORS dari semua origin (aman karena ini hanya proxy read/write testimonial publik)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      // Forward GET ke Apps Script
      const upstream = await fetch(APPS_SCRIPT_URL, {
        redirect: 'follow',
        headers: { Accept: 'application/json' },
      });

      const text = await upstream.text();

      // Coba parse JSON
      try {
        const json = JSON.parse(text);
        return res.status(200).json(json);
      } catch {
        // Apps Script kadang return HTML jika ada error deployment
        return res.status(502).json({
          status: 'error',
          message: 'Apps Script response bukan JSON',
          raw: text.slice(0, 200),
        });
      }
    }

    if (req.method === 'POST') {
      // Forward POST ke Apps Script
      const body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);

      const upstream = await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body,
        redirect: 'follow',
      });

      const text = await upstream.text();

      try {
        const json = JSON.parse(text);
        return res.status(200).json(json);
      } catch {
        // Apps Script berhasil menerima tapi response-nya bukan JSON standar
        return res.status(200).json({ status: 'success' });
      }
    }

    return res.status(405).json({ status: 'error', message: 'Method not allowed' });
  } catch (err) {
    return res.status(500).json({
      status: 'error',
      message: err instanceof Error ? err.message : 'Internal server error',
    });
  }
}

