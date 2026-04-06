export const config = { runtime: 'edge' };

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
  }

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return new Response(JSON.stringify({ error: 'Clé API manquante' }), { status: 500 });

  const { messages, system } = await req.json();

  const upstream = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 1200,
      stream: true,
      system,
      messages
    })
  });

  return new Response(upstream.body, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-cache'
    }
  });
}
