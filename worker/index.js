const BFF_BASE = 'https://www.lefrecce.it/Channels.Website.BFF.WEB';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
  async fetch(request) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const url = new URL(request.url);
    const path = url.pathname.startsWith('/') ? url.pathname.slice(1) : url.pathname;
    const targetUrl = `${BFF_BASE}/${path}${url.search}`;

    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Accept-Language': 'it-IT,it;q=0.9',
    };

    const options = { method: request.method, headers };
    if (request.method === 'POST') {
      options.body = await request.text();
    }

    try {
      const response = await fetch(targetUrl, options);
      const body = await response.text();

      return new Response(body, {
        status: response.status,
        headers: {
          'Content-Type': response.headers.get('content-type') || 'application/json',
          ...CORS_HEADERS,
        },
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 502,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      });
    }
  },
};
