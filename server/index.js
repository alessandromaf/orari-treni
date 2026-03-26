import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = process.env.PORT || 3001;
const VT_BASE = 'http://www.viaggiatreno.it/infomobilita/resteasy/viaggiatreno';
const BFF_BASE = 'https://www.lefrecce.it/Channels.Website.BFF.WEB';

app.use(cors());
app.use(express.json());

// Proxy for Trenitalia BFF (journey solutions)
app.use('/bff', async (req, res) => {
  const subPath = req.url.startsWith('/') ? req.url.slice(1) : req.url;
  const url = `${BFF_BASE}/${subPath}`;

  try {
    const options = {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
        'Origin': 'https://www.lefrecce.it',
        'Referer': 'https://www.lefrecce.it/',
      },
    };
    if ((req.method === 'POST' || req.method === 'PUT') && req.body) {
      options.body = JSON.stringify(req.body);
    }

    const response = await fetch(url, options);
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
