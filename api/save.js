import { put } from '@vercel/blob';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { image, mediaType, edits } = req.body;
  if (!image || !mediaType || !edits) return res.status(400).json({ error: 'Missing required fields' });

  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const ext = mediaType.split('/')[1]?.replace('jpeg', 'jpg') || 'jpg';

  try {
    const photoBlob = await put(`photos/${id}.${ext}`, Buffer.from(image, 'base64'), {
      access: 'public',
      contentType: mediaType,
    });

    const analysis = { id, timestamp: Date.now(), photoUrl: photoBlob.url, edits };

    await put(`analyses/${id}.json`, JSON.stringify(analysis), {
      access: 'public',
      contentType: 'application/json',
    });

    return res.status(200).json({ success: true, id, photoUrl: photoBlob.url });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
