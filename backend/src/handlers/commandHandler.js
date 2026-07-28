const User = require('../models/User');
const logger = require('../utils/logger');



const commandHandler = {
  handleStart: async (ctx) => {
    const telegramId = ctx.from.id;
    
    
    try {
      let user = await User.findOne({ telegramId });

      if (!user) {
        user = await User.create({
          telegramId,
          firstName: ctx.from.first_name,
          lastName: ctx.from.last_name,
          username: ctx.from.username,
        });
        logger.info(`New user created: ${telegramId}`);
      }

      const welcomeMessage = `🎉 Welcome to FinBot AI!

I'm your personal finance advisor. I help you:
✅ Track expenses & income naturally
📊 Get monthly reports
💰 Plan budgets
🎯 Track financial goals

Let's get started! Use /setup to configure your profile.

Or just chat naturally:
- "Spent ₹450 on pizza"
- "Salary credited ₹60,000"

Type /help for all commands.`;

      await ctx.reply(welcomeMessage);
    } catch (error) {
      logger.error('Error in handleStart:', error);
      await ctx.reply('❌ An error occurred. Please try again later.');

    }
  },

  handleHelp: async (ctx) => {
    const helpMessage = `📚 FinBot Commands:

/start - Start the bot
/help - Show this message
/setup - Configure your profile
/summary - Quick summary
/report - Monthly report
/budget - Create/edit budget
/goals - Manage financial goals
/analyze - Analyze spending
/afford - Check affordability

💬 Just chat naturally:
- "Spent ₹500 on lunch"
- "Received ₹80,000 salary"
- "How much did I spend on food?"`;

    await ctx.reply(helpMessage);
  },

  handleSetup: async (ctx) => {
    const telegramId = ctx.from.id;

    
    try {
      const user = await User.findOne({ telegramId });

      if (!user) {
        await ctx.reply('❌ User not found. Please /start first.');
        return;
      }

      const setupMessage = `🔧 Let's set up your profile!

Please tell me:
1️⃣ What's your average monthly income? (in ₹)
   Example: "60000"

2️⃣ How much savings do you have? (in ₹)
   Example: "120000"

3️⃣ Emergency fund target? (in ₹)
   Example: "250000"

4️⃣ Your main financial goal?
   Example: "Save for a laptop"

Just reply with each answer!`;

      await ctx.reply(setupMessage);
      user.setupStep = 1;
      await user.save();
      
      
    } catch (error) {
      logger.error('Error in handleSetup:', error);
      await ctx.reply('❌ Setup failed. Please try again.');
    }
  },
};

module.exports = commandHandler;