const https = require('https');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    res.status(500).json({ error: 'ANTHROPIC_API_KEY manquante dans Vercel > Settings > Environment Variables' });
    return;
  }

  try {
    const { messages, system } = req.body;
    const payload = JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 1200, system, messages });

    const result = await new Promise((resolve, reject) => {
      const request = https.request({
        hostname: 'api.anthropic.com',
        path: '/v1/messages',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': key,
          'anthropic-version': '2023-06-01',
          'Content-Length': Buffer.byteLength(payload)
        }
      }, (response) => {
        let raw = '';
        response.on('data', chunk => raw += chunk);
        response.on('end', () => {
          try { resolve(JSON.parse(raw)); }
          catch (e) { reject(new Error('Réponse invalide: ' + raw.slice(0, 200))); }
        });
      });
      request.on('error', reject);
      request.write(payload);
      request.end();
    });

    const text = result.content?.[0]?.text || '';
    res.json({ text });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
