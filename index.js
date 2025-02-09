const express = require('express');
const { Telegraf } = require('telegraf');
const path = require('path');
const fs = require('fs');
const ExcelJS = require('exceljs');
const dotenv = require('dotenv');

dotenv.config(); // Load environment variables

const app = express();
app.use(express.json());

// Gunakan BOT_TOKEN dari Environment Variables
const bot = new Telegraf(process.env.BOT_TOKEN);

const BASE_URL = process.env.BASE_URL || 'https://human-capital-five.vercel.app'; // Sesuaikan dengan domain Vercel
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
