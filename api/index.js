const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const axios = require('axios');
const cluster = require('cluster');
const os = require('os');
const path = require('path');
const adBlocker = require('./adBlocker');
require('dotenv').config();

const app = express();

// Security, Parsing, & Optimization Middlewares
app.use(cors({ origin: process.env.ALLOWED_ORIGINS || '*' }));
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false })); // Disabled CSP to allow external streams
app.use(compression());
app.use(morgan('dev'));

// =========================================================================
// FRONTEND SERVING (Required for Railway / Docker / PM2)
// =========================================================================
// Serve static files from the public directory
app.use(express.static(path.join(__dirname, '../public')));

// Vercel / Root Health Check
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'Omega Engine Online', version: '10.0.0', process: process.pid });
});

// =========================================================================
// OMEGA PROXY: Bypasses CORS & X-Frame-Options + Injects AdBlocker
// =========================================================================
app.get('/api/proxy', async (req, res) => {
    const targetUrl = req.query.url;

    if (!targetUrl) return res.status(400).send('URL parameter is missing.');
    if (adBlocker.isAdUrl(targetUrl)) return res.status(403).send('Malicious URL Blocked by Omega.');

    try {
        const response = await axios.get(targetUrl, {
            responseType: 'arraybuffer',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5'
            },
            timeout: 15000 
        });

        const contentType = response.headers['content-type'];
        
        // Strip out protective headers preventing iframe embedding
        res.removeHeader('X-Frame-Options');
        res.removeHeader('Content-Security-Policy');
        res.setHeader('Access-Control-Allow-Origin', '*');

        if (contentType && contentType.includes('text/html')) {
            // Inject AdBlocker into HTML payload
            let html = response.data.toString('utf8');
            const injection = adBlocker.getInjectionScript();
            
            // Insert after <head> or at start of document
            if (html.includes('<head>')) {
                html = html.replace('<head>', '<head>' + injection);
            } else {
                html = injection + html;
            }
            res.set('Content-Type', 'text/html');
            res.send(Buffer.from(html, 'utf8'));
        } else {
            // Forward media/other files as-is
            res.set('Content-Type', contentType);
            res.send(response.data);
        }

    } catch (error) {
        console.error(`[Proxy Error] -> ${targetUrl} : ${error.message}`);
        res.status(500).json({ error: 'Omega Proxy failed to route the target URL.' });
    }
});

// =========================================================================
// CATCH-ALL ROUTE: Send to UI (Must be the very last route)
// =========================================================================
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Export for Serverless Function compatibility
module.exports = app;

// Local Node.js / Railway / VPS Clustering initialization
if (require.main === module) {
    // Railway assigns a dynamic PORT environment variable. We MUST use it.
    const PORT = process.env.PORT || 3000;
    const ENABLE_CLUSTERING = process.env.ENABLE_CLUSTERING === 'true';

    if (ENABLE_CLUSTERING && cluster.isPrimary) {
        console.log(`[Omega Master] Primary ${process.pid} running`);
        const numCPUs = os.cpus().length;
        // Fork a worker for every CPU core Railway provisions for your container
        for (let i = 0; i < numCPUs; i++) cluster.fork();
        
        cluster.on('exit', (worker) => {
            console.log(`[Omega Worker] Worker ${worker.process.pid} died. Booting replacement...`);
            cluster.fork();
        });
    } else {
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`[Omega Engine] Listening on port ${PORT} (PID: ${process.pid})`);
        });
    }
}
