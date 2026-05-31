import { list } from '@vercel/blob';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { blobs } = await list({ prefix: 'analyses/', limit: 100 });

    const analyses = await Promise.all(
      blobs.map(async blob => {
        try {
          const r = await fetch(blob.url);
          return await r.json();
        } catch {
          return null;
        }
      })
    );

    const valid = analyses
      .filter(Boolean)
      .sort((a, b) => b.timestamp - a.timestamp);

    return res.status(200).json(valid);

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
