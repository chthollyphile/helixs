import express from 'express';
import path from 'path';
import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3234;
const SUPPORTED_LANGS = ['en', 'zh', 'ja'];
const normalizedEnvLang = (process.env.lang || '').toLowerCase();
const DEFAULT_LANG = SUPPORTED_LANGS.includes(normalizedEnvLang)
  ? normalizedEnvLang
  : 'en';
const publicConfigPath = path.join(__dirname, 'public', 'config.json');
const distConfigPath = path.join(__dirname, 'dist', 'config.json');

const readConfigFile = async () => {
  const candidates = [publicConfigPath, distConfigPath];

  for (const filePath of candidates) {
    try {
      const file = await fs.readFile(filePath, 'utf-8');
      return file;
    } catch {
      // Try next candidate
    }
  }

  return null;
};

app.get('/config.json', async (_req, res) => {
  const configContent = await readConfigFile();

  if (!configContent) {
    return res.status(404).json({ error: 'Configuration file not found' });
  }

  res.type('application/json').send(configContent);
});

app.get('/api/lang', (_req, res) => {
  res.json({ lang: DEFAULT_LANG });
});

app.get('/api/title', (_req, res) => {
  res.json({ title: process.env.title || 'HELIXS' });
});

// Serve static files from the build directory
app.use(express.static(path.join(__dirname, 'dist')));

// API Endpoint for Status Checks
app.get('/api/status', async (req, res) => {
    const { url } = req.query;

    if (!url || typeof url !== 'string') {
        return res.status(400).json({ status: 'error', message: 'Missing URL parameter' });
    }

    try {
        // Use a short timeout to prevent hanging
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);

        // We use 'HEAD' to check existence without downloading body
        // Note: Some services might not support HEAD, fallback to GET if needed, 
        // but HEAD is faster and lighter.
        const response = await fetch(url, {
            method: 'HEAD',
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);

        // If we got a response (even 401, 403, 500), the service is reachable ("online")
        // We only consider it "offline" if the network connection fails completely.
        res.json({ status: 'online', code: response.status });
    } catch (error) {
        // Network error, DNS error, timeout -> Offline
        res.json({ status: 'offline' });
    }
});

// Handle SPA routing - return index.html for any unknown routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});