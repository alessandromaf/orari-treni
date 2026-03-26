import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = process.env.PORT || 3001;
const VT_BASE = 'http://www.viaggiatreno.it/infomobilita/resteasy/viaggiatreno';
const BFF_BASE = 'https://www.lefrecce.it/Channels.Website.BFF.WEB';
const BFF_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';

app.use(cors());
app.use(express.json());

// Session cookie management for lefrecce.it (Akamai bot protection)
let bffCookies = '';
let bffCookieExpiry = 0;

async function refreshBffSession() {
  try {
    const res = await fetch('https://www.lefrecce.it/', {
      headers: { 'User-Agent': BFF_UA },
      redirect: 'follow',
    });
    const setCookies = res.headers.getSetCookie?.() || [];
    if (setCookies.length > 0) {
      bffCookies = setCookies.map((c) => c.split(';')[0]).join('; ');
      bffCookieExpiry = Date.now() + 25 * 60 * 1000; // refresh every 25 min
      console.log('BFF session refreshed');
    }
  } catch (err) {
    console.error('Failed to refresh BFF session:', err.message);
  }
}

async function getBffCookies() {
  if (!bffCookies || Date.now() > bffCookieExpiry) {
    await refreshBffSession();
  }
  return bffCookies;
}

// Refresh session on startup
refreshBffSession();

// Proxy for Trenitalia BFF (journey solutions)
app.use('/bff', async (req, res) => {
  const subPath = req.url.startsWith('/') ? req.url.slice(1) : req.url;
  const url = `${BFF_BASE}/${subPath}`;

  try {
    const cookies = await getBffCookies();
    const options = {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Accept-Language': 'it-IT,it;q=0.9',
        'User-Agent': BFF_UA,
        'Origin': 'https://www.lefrecce.it',
        'Referer': 'https://www.lefrecce.it/',
        ...(cookies ? { 'Cookie': cookies } : {}),
      },
    };
    if ((req.method === 'POST' || req.method === 'PUT') && req.body) {
      options.body = JSON.stringify(req.body);
    }

    let response = await fetch(url, options);

    // If 403, try refreshing session and retry once
    if (response.status === 403) {
      console.log('BFF 403 - refreshing session and retrying');
      await refreshBffSession();
      options.headers.Cookie = bffCookies;
      response = await fetch(url, options);
    }

    // Update cookies from response
    const newCookies = response.headers.getSetCookie?.() || [];
    if (newCookies.length > 0) {
      const parsed = newCookies.map((c) => c.split(';')[0]);
      const existing = bffCookies ? bffCookies.split('; ') : [];
      const cookieMap = {};
      for (const c of [...existing, ...parsed]) {
        const [name] = c.split('=');
        cookieMap[name] = c;
      }
      bffCookies = Object.values(cookieMap).join('; ');
    }

    const contentType = response.headers.get('content-type') || '';
    const text = await response.text();

    res.set('Content-Type', contentType);
    res.status(response.status).send(text);
  } catch (err) {
    console.error('Proxy error (BFF):', err.message);
    res.status(502).json({ error: 'Errore di connessione a Trenitalia' });
  }
});

// Proxy for ViaggiaTreno (departures/arrivals)
app.use('/api', async (req, res) => {
  const path = req.url.startsWith('/') ? req.url.slice(1) : req.url;
  const url = `${VT_BASE}/${path}`;

  try {
    const response = await fetch(url);
    const contentType = response.headers.get('content-type') || '';
    const text = await response.text();

    res.set('Content-Type', contentType);
    res.status(response.status).send(text);
  } catch (err) {
    console.error('Proxy error (VT):', err.message);
    res.status(502).json({ error: 'Errore di connessione a ViaggiaTreno' });
  }
});

// Serve built frontend in production
const distPath = join(__dirname, '..', 'dist');
app.use(express.static(distPath));
app.use((req, res) => {
  res.sendFile(join(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
