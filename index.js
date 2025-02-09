<<<<<<< HEAD
const express = require('express');
const { Telegraf } = require('telegraf');
const path = require('path');
const fs = require('fs');
const ExcelJS = require('exceljs');

const app = express();
app.use(express.json());

// Gunakan BOT_TOKEN langsung di dalam script (tidak disarankan untuk production)
const BOT_TOKEN = '8072489713:AAF5D8OBkikMefxO5UwV8c9h0Ec8ebp96lU';
const bot = new Telegraf(BOT_TOKEN);

const BASE_URL = 'https://human-capital-five.vercel.app'; // Sesuaikan dengan domain Vercel
const LINKS_FILE = path.join(__dirname, 'links.json');
const UPLOADS_DIR = path.join(__dirname, 'uploads');

// Pastikan direktori uploads ada
if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR);
}

bot.start((ctx) => ctx.reply('Welcome! Bot is running on Vercel!'));

// Handle perintah sederhana
bot.command('ping', (ctx) => {
    ctx.reply('Pong! Bot is alive.');
});

// Endpoint untuk webhook Telegram
app.post('/api/bot', (req, res) => {
    bot.handleUpdate(req.body, res);
});

// Endpoint root sebagai indikasi server aktif
app.get('/', (req, res) => {
    res.send('Telegram Bot is running on Vercel');
});

// Konfigurasi bot untuk menggunakan webhook
const setWebhook = async () => {
    try {
        const webhookUrl = `${BASE_URL}/api/bot`;
        await bot.telegram.setWebhook(webhookUrl);
        console.log(`Webhook set to: ${webhookUrl}`);
    } catch (error) {
        console.error('Failed to set webhook:', error);
    }
};

setWebhook();

// Ekspor app agar bisa dijalankan oleh Vercel
module.exports = app;
=======
const express = require("express");
const fs = require("fs");
const path = require("path");
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware untuk parsing JSON
app.use(express.json());

// File penyimpanan link
const LINKS_FILE = path.join(__dirname, "links.json");

// Load links dari file
const loadLinks = () => {
    try {
        const data = fs.readFileSync(LINKS_FILE, "utf8");
        return JSON.parse(data);
    } catch (err) {
        return [];
    }
};

// Simpan links ke file
const saveLinks = (links) => {
    fs.writeFileSync(LINKS_FILE, JSON.stringify(links, null, 2));
};

// Endpoint utama
app.get("/", (req, res) => {
    res.send("Telegram Bot Link Tracker Running on Vercel");
});

// Endpoint untuk mendapatkan daftar link
app.get("/links", (req, res) => {
    const links = loadLinks();
    res.json(links);
});

// Endpoint untuk menambahkan link baru
app.post("/links", (req, res) => {
    const links = loadLinks();
    const newLink = req.body;
    links.push(newLink);
    saveLinks(links);
    res.json({ message: "Link added successfully", link: newLink });
});

// Mulai server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = app; // Untuk kompatibilitas dengan Vercel
>>>>>>> 970afe6 (Update untuk deployment di Vercel)
