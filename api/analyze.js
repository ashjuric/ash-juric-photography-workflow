const PROMPT = `You are an expert photo editor. Analyze this photograph and provide specific, actionable editing recommendations.

Return ONLY a JSON object in this exact format (no markdown, no explanation):
{
  "edits": [
    {
      "id": 1,
      "priority": "critical",
      "title": "Short title (3-6 words)",
      "description": "Specific actionable advice explaining what to adjust and why (1-2 sentences).",
      "region": { "x": 10, "y": 5, "w": 40, "h": 30 }
    }
  ]
}

Rules:
- priority must be exactly "critical", "helpful", or "optional"
- Sort edits: critical first, then helpful, then optional
- critical = edits that significantly impact the photo's quality or impact
- helpful = edits that would noticeably improve the photo
- optional = minor tweaks that are nice but not necessary
- region is the affected area as percentage of image (0–100). Use null if the edit applies to the whole image (e.g. overall contrast, white balance)
- x, y are top-left corner; w, h are width and height
- Be specific about areas: "upper-left shadows", "subject's face", "foreground rocks", etc.
- Limit to 6–10 edits total
- Do not include edits that are not actually needed`;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { image, mediaType } = req.body;
  if (!image || !mediaType) return res.status(400).json({ error: 'Missing image or mediaType' });

  try {
    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-8',
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mediaType, data: image } },
            { type: 'text', text: PROMPT },
          ],
        }],
      }),
    });

    if (!upstream.ok) {
      const err = await upstream.json().catch(() => ({}));
      return res.status(upstream.status).json({ error: err.error?.message || 'Claude API error' });
    }

    const data = await upstream.json();
    const raw = data.content[0].text.trim().replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    return res.status(200).json(JSON.parse(raw));

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
