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

app.get('/api/env', (_req, res) => {
  res.json({ alt_mode: process.env.alt_mode === 'true' });
});

app.get('/api/title', (_req, res) => {
  res.json({ title: process.env.title || 'HELIXS' });
});

// Serve static files from the build directory
app.use(express.static(path.join(__dirname, 'dist')));

const dockerHostIp = process.env.docker_host_ip;
const dockerLoopbackHost = '172.17.0.1';
const TLS_ERROR_CODES = new Set([
  'DEPTH_ZERO_SELF_SIGNED_CERT',
  'ERR_TLS_CERT_ALTNAME_INVALID',
  'ERR_TLS_CERT_SIGNATURE_ALGORITHM_UNSUPPORTED',
  'ERR_TLS_DH_PARAM_SIZE',
  'ERR_TLS_CERT_ALTNAME_FORMAT',
  'ERR_TLS_INVALID_PROTOCOL_VERSION',
  'ERR_TLS_SELF_SIGNED_CERT_IN_CHAIN',
  'SELF_SIGNED_CERT_IN_CHAIN',
  'UNABLE_TO_VERIFY_LEAF_SIGNATURE',
]);

const isCertificateError = (error) => {
  const code = error?.cause?.code || error?.code;
  if (code && TLS_ERROR_CODES.has(code)) {
    return true;
  }

  const message = (error?.cause?.message || error?.message || '').toLowerCase();
  return (
    message.includes('self signed certificate') ||
    message.includes('certificate has expired') ||
    message.includes('unable to verify the first certificate') ||
    message.includes('cert') // fallback
  );
};

// API Endpoint for Status Checks
app.get('/api/status', async (req, res) => {
    const { url } = req.query;

    if (!url || typeof url !== 'string') {
        return res.status(400).json({ status: 'error', message: 'Missing URL parameter' });
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    try {
        const parsedUrl = new URL(url);
        if (dockerHostIp && parsedUrl.hostname === dockerHostIp) {
            // console.log('Replacing hostname with Docker loopback host');
            parsedUrl.hostname = dockerLoopbackHost;
            // console.log('parsedUrl after replacement', parsedUrl);
        }

        const response = await fetch(parsedUrl.toString(), {
            method: 'HEAD',
            signal: controller.signal
        });

        // console.log('response', response);

        res.json({ status: 'online', code: response.status });
    } catch (error) {
        if (isCertificateError(error)) {
            // console.log('TLS certificate error detected, treating as online', error);
            return res.json({ status: 'online', code: 'TLS_ERROR' });
        }

        if (error?.name === 'AbortError') {
            // console.log('Status check timed out');
        } else {
            // console.log('error', error);
        }
        res.json({ status: 'offline' });
    } finally {
        clearTimeout(timeoutId);
    }
});

// Handle SPA routing - return index.html for any unknown routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});