const http = require('http');
const https = require('https');

/**
 * DRY HTTP/HTTPS Request Helper
 * @param {string} urlStr - The target URL
 * @param {object} options - Options containing method, headers, and body
 * @returns {Promise<any>} Response data parsed as JSON if possible, otherwise raw string
 */
function request(urlStr, options = {}) {
    return new Promise((resolve, reject) => {
        try {
            const url = new URL(urlStr);
            const client = url.protocol === 'https:' ? https : http;
            
            const reqOptions = {
                hostname: url.hostname,
                port: url.port || (url.protocol === 'https:' ? 443 : 80),
                path: url.pathname + url.search,
                method: options.method || 'GET',
                headers: options.headers || {}
            };

            if (options.body) {
                reqOptions.headers['Content-Type'] = 'application/json';
                reqOptions.headers['Content-Length'] = Buffer.byteLength(options.body);
            }

            const req = client.request(reqOptions, (res) => {
                let data = '';
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => {
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        try {
                            resolve(JSON.parse(data));
                        } catch (err) {
                            resolve(data);
                        }
                    } else {
                        reject(new Error(`HTTP Error ${res.statusCode}: ${data}`));
                    }
                });
            });

            req.on('error', reject);
            if (options.body) {
                req.write(options.body);
            }
            req.end();
        } catch (err) {
            reject(err);
        }
    });
}

module.exports = { request };
