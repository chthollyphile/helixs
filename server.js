import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

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