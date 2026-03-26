const https = require('https');
const API_URL = 'https://project-8iej.onrender.com/health';

function keepAlive() {
  console.log('Pinging backend to keep alive:', new Date().toISOString());
  https.get(API_URL, (res) => {
    console.log('Health check status:', res.statusCode);
  }).on('error', (err) => {
    console.error('Ping failed:', err.message);
  });
}

// Ping every 15 minutes (Render free tier sleeps after 15min inactivity)
setInterval(keepAlive, 15 * 60 * 1000);

// Initial ping
keepAlive();

console.log('Keepalive script running. Ctrl+C to stop.');

