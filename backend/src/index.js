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




// /start command handler
bot.start(async (ctx) => {
  logger.info(`User started bot: ${ctx.from.id}`);
  await commandHandler.handleStart(ctx);
});

// /help command handler
bot.help(async (ctx) => {
  logger.info(`User requested help: ${ctx.from.id}`);
  await commandHandler.handleHelp(ctx);
});

// /setup command handler
bot.command('setup', async (ctx) => {
  logger.info(`User initiated setup: ${ctx.from.id}`);
  await commandHandler.handleSetup(ctx);
});

// /summary command handler
bot.command('summary', async (ctx) => {
  logger.info(`User requested summary: ${ctx.from.id}`);
  await commandHandler.handleSummary(ctx);
});

// /report command handler
bot.command('report', async(ctx) => {
    logger.info(`User requested report: ${ctx.from.id}`);
    await commandHandler.handleReport(ctx);
})

// /budget command handler
bot.command('budget', async(ctx)=>{
    logger.info(`User requested budget: ${ctx.from.id}`);
    await commandHandler.handleBudget(ctx);
})

// /goals command handler
bot.command('goals',async(ctx) => {
    logger.info(`User requested goals: ${ctx.from.id}`);
    await commandHandler.handleGoals(ctx);
})

// /afford command handler
bot.command('afford', async(ctx) => {
    logger.info(`User requested affordability analysis: ${ctx.from.id}`);
    await commandHandler.handleAfford(ctx);
});


// ============ MESSAGE HANDLER (Last) ============

bot.on('message', async (ctx) => {
  logger.info(`Message from ${ctx.from.id}: ${ctx.message.text}`);
  await messageHandler.handleMessage(ctx);
});

// ============ EXPRESS ROUTES ============

app.get('/health', (req, res) => {
  res.json({ status: 'Bot is running' });
});

app.post('/webhook', (req, res) => {
  bot.handleUpdate(req.body);
  res.send('ok');
});

app.listen(port, () => {
  logger.info(`✅ Server running on port ${port}`);
  logger.info(`🤖 Bot is ready to receive messages`);
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