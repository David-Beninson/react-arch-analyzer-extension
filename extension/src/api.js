const http = require('http');
const https = require('https');

/**
 * DRY HTTP/HTTPS request helper.
 * @param {string} urlStr - Target URL
 * @param {object} options - { method, headers, body, token }
 * @param {string} [options.token] - Optional Bearer JWT to attach
 * @returns {Promise<any>} Parsed JSON or raw string
 */
function request(urlStr, options = {}) {
    return new Promise((resolve, reject) => {
        try {
            const url = new URL(urlStr);
            const client = url.protocol === 'https:' ? https : http;

            const headers = { ...(options.headers || {}) };

            if (options.token) {
                headers['Authorization'] = `Bearer ${options.token}`;
            }

            if (options.body) {
                headers['Content-Type'] = 'application/json';
                headers['Content-Length'] = Buffer.byteLength(options.body);
            }

            const reqOptions = {
                hostname: url.hostname,
                port: url.port || (url.protocol === 'https:' ? 443 : 80),
                path: url.pathname + url.search,
                method: options.method || 'GET',
                headers,
            };

            const req = client.request(reqOptions, (res) => {
                let data = '';
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => {
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        try { resolve(JSON.parse(data)); } catch { resolve(data); }
                    } else {
                        reject(new Error(`HTTP ${res.statusCode}: ${data}`));
                    }
                });
            });

            req.on('error', reject);
            if (options.body) req.write(options.body);
            req.end();
        } catch (err) {
            reject(err);
        }
    });
}

module.exports = { request };
