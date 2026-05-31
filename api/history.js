import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { data, error } = await supabase
      .from('analyses')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;

    const analyses = data.map(row => ({
      id: row.id,
      timestamp: new Date(row.created_at).getTime(),
      photoUrl: row.photo_url,
      edits: row.edits,
    }));

    return res.status(200).json(analyses);

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
