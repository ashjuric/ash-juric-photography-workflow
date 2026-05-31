import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { image, mediaType, edits } = req.body;
  if (!image || !mediaType || !edits) return res.status(400).json({ error: 'Missing required fields' });

  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const ext = mediaType.split('/')[1]?.replace('jpeg', 'jpg') || 'jpg';

  try {
    const { error: uploadError } = await supabase.storage
      .from('photo-edits')
      .upload(`${id}.${ext}`, Buffer.from(image, 'base64'), { contentType: mediaType });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('photo-edits')
      .getPublicUrl(`${id}.${ext}`);

    const { error: dbError } = await supabase
      .from('analyses')
      .insert({ id, photo_url: publicUrl, edits });

    if (dbError) throw dbError;

    return res.status(200).json({ success: true, id, photoUrl: publicUrl });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
