require('dotenv').config();
const express = require('express');
const { Telegraf } = require('telegraf');
const logger = require('./utils/logger');
const commandHandler = require('./handlers/commandHandler');
const messageHandler = require('./handlers/messageHandler');
const { connectDB } = require('./config/database');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

connectDB();


// Commands
bot.start(async (ctx) => {
  logger.info(`User started bot: ${ctx.from.id}`);
  await commandHandler.handleStart(ctx);
});


bot.help(async (ctx) => {
  logger.info(`User requested help: ${ctx.from.id}`);
  await commandHandler.handleHelp(ctx);
});


bot.command('setup', async (ctx) => {
  logger.info(`User initiated setup: ${ctx.from.id}`);
  await commandHandler.handleSetup(ctx);
});


// Handle messages
bot.on('message', async (ctx) => {
  logger.info(`Message from ${ctx.from.id}: ${ctx.message.text}`);
  await messageHandler.handleMessage(ctx);
});


// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'Bot is running' });
});



// Webhook endpoint
app.post('/webhook', (req, res) => {
  bot.handleUpdate(req.body);
  res.send('ok');
});


app.listen(port, () => {
  logger.info(`✅ Server running on port ${port}`);
});


bot.launch().catch((err) => {
  logger.error('Bot launch error:', err);
});


process.on('SIGINT', () => {
  logger.info('Shutting down gracefully...');
  bot.stop();
  process.exit(0);
});

module.exports = { app, bot };