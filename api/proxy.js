/**
 * Vercel Serverless Function Proxy
 * Forwards POST requests to Google Apps Script Web App
 * Eliminates CORS restrictions for browser clients in production.
 */
const GOOGLE_SCRIPT_URL = process.env.VITE_GAS_URL || process.env.GAS_URL || 'https://script.google.com/macros/s/AKfycbyY9VbWzeoe0UR_riMeP6-8h6j01EIR3MVbUrKQJ4ZXAg14tZej574rNEmz6mUa0pfI/exec';

export default async function handler(req, res) {
  // CORS Preflight & Response Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const payload = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);

    const contentType = req.headers['content-type'] || 'application/json';
    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      body: payload,
      headers: {
        'Content-Type': contentType
      },
      redirect: 'follow'
    });

    const data = await response.text();

    try {
      const json = JSON.parse(data);
      return res.status(response.status).json(json);
    } catch {
      res.setHeader('Content-Type', 'application/json');
      return res.status(response.status).send(data);
    }
  } catch (error) {
    console.error('[Vercel Proxy] Error forwarding request:', error);
    return res.status(500).json({
      error: 'Proxy Error',
      message: error.message
    });
  }
}
