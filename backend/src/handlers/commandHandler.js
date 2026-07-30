const User = require('../models/User');
const logger = require('../utils/logger');
const { getOrdinalSuffix } = require('../utils/helpers');

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
/afford - Check affordability
/insights - Weekly insights
/bill - Set bill reminder
/bills - View all bills
/reminders - Upcoming bills

💬 Just chat naturally:
- "Spent ₹500 on lunch"
- "Received ₹60,000 salary"
- Upload receipt photo
- "Goal: Save ₹1,00,000 for laptop"
- "Can I afford ₹80,000 laptop?"
- "Remind me wifi 800 on 15"`;

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




    handleSummary: async (ctx) => {
        const telegramId = ctx.from.id;

        try {
            const user = await User.findOne({ telegramId });

            if (!user) {
                await ctx.reply('❌ User not found. Please /start first.');
                return;
            }

            if (!user.isSetupComplete) {
                await ctx.reply('❌ Please complete /setup first.');
                return;
            }

            const transactionService = require('../services/transactionService');
            const summary = await transactionService.getSummary(telegramId);

            const summaryMessage = `📊 Your Financial Summary

💰 Current Savings: ₹${summary.currentSavings}
📈 Total Income: ₹${summary.totalIncome}
📉 Total Expenses: ₹${summary.totalExpense}
💵 Current Balance: ₹${summary.currentBalance}

📋 Monthly Income: ₹${summary.monthlyIncome}
🎯 Emergency Fund Target: ₹${summary.emergencyFundTarget}
📝 Total Transactions: ${summary.transactions}`;

            await ctx.reply(summaryMessage);

        } catch (error) {
            logger.error('Error in handleSummary:', error);
            await ctx.reply('❌ Failed to get summary. Please try again.');
        }
    },





    handleReport: async (ctx) => {
        const telegramId = ctx.from.id;

        try {
            const user = await User.findOne({ telegramId });

            if (!user) {
                await ctx.reply('❌ User not found. Please /start first.');
                return;
            }

            if (!user.isSetupComplete) {
                await ctx.reply('❌ Please complete /setup first.');
                return;
            }

            const reportService = require('../services/reportService');
            const now = new Date();
            
            const report = await reportService.getMonthlyReport(telegramId, now.getFullYear(), now.getMonth() + 1);

            let categoryText = '';
            report.categories.forEach((cat, i) => {
                const percentage = ((cat[1] / report.expenses) * 100).toFixed(0);
                categoryText += `${i + 1}. ${cat[0]}: ₹${cat[1]} (${percentage}%)\n`;
            });

            const reportMessage = `📊 Monthly Report - ${report.month}

💰 Income Summary:- Total Income: ₹${report.income}

💸 Expense Summary:
- Total Expenses: ₹${report.expenses}
- Avg Daily Spend: ₹${report.avgDailySpend}

💵 Financial Summary:
- Savings: ₹${report.savings}
- Savings Rate: ${report.savingsRate}%

📈 Top Spending Categories:
${categoryText}

📝 Transactions: ${report.transactionCount}`;

            await ctx.reply(reportMessage);



        } catch (error) {
            logger.error('Error in handleReport:', error);
            await ctx.reply('❌ Failed to get report. Please try again.');
        }
    },




    handleBudget: async(ctx) =>{
        const telegramId = ctx.from.id;

        try{

            const user = await User.findOne({ telegramId });

            if(!user){
                await ctx.reply('❌ User not found. Please /start first.');
                return;
            }

            if(!user.isSetupComplete){
                await ctx.reply('❌ Please complete /setup first.');
                return;
            }


            const budgetService = require('../services/budgetService');
            const budget = budgetService.calculateBudget(user.monthlyIncome);

            

            const budgetMessage = `💰 Recommended Budget Plan

Based on your income: ₹${user.monthlyIncome}

Using 50-30-20 Rule:

🏠 Needs (50%): ₹${budget.needs}
   Housing, food, utilities, transport

🎉 Wants (30%): ₹${budget.wants}
   Entertainment, shopping, dining out

💾 Savings (20%): ₹${budget.savings}
   Emergency fund, goals, investments

Total: ₹${budget.totalIncome}

💡 Tip: Adjust based on your lifestyle!`;

            await ctx.reply(budgetMessage); 


        }catch(error){
            logger.error('Error in handleBudget:', error);
            await ctx.reply('❌ Failed to get budget. Please try again.');
        }
    },




    handleGoals: async(ctx) =>{
        const telegramId = ctx.from.id;

        try{
            const user = await User.findOne({ telegramId });

            if(!user){
                await ctx.reply('❌ User not found. Please /start first.');
                return;
            }

            if(!user.isSetupComplete){
                await ctx.reply('❌ Please complete /setup first.');
                return;
            }

            const goalService = require('../services/goalService');
            const goals = await goalService.getGoals(telegramId);

            if(goals.length === 0){
                await ctx.reply('📌 You have no active goals yet.\n\nYou can add goals by chatting:\n"Goal: Save ₹1,00,000 for a laptop"');
                return;
            }

            let goalsText  =  '🎯 Your Financial Goals\n\n';


            goals.forEach((goal, i) => {
                const progressBar = '█'.repeat(Math.round(goal.progress / 10)) + '░'.repeat(10 - Math.round(goal.progress / 10));
                goalsText += `${i + 1}. ${goal.name}\n`;
                goalsText += `   Target: ₹${goal.targetAmount}\n`;
                goalsText += `   Current: ₹${goal.currentAmount}\n`;
                goalsText += `   Progress: ${progressBar} ${goal.progress}%\n`;
                goalsText += `   Remaining: ₹${goal.remaining}\n\n`;
            });

            await ctx.reply(goalsText);


        }catch(error){
            logger.error('Error in handleGoals:', error);
            await ctx.reply('❌ Failed to get goals. Please try again.');
        }
    },



    handleAfford: async(ctx) =>{
        const telegramId = ctx.from.id;

        try{
            const user = await User.findOne({ telegramId });

            if(!user){
                await ctx.reply('❌ User not found. Please /start first.');
                return;
            }

            if(!user.isSetupComplete){
                await ctx.reply('❌ Please complete /setup first.');
                return;
            }

            await ctx.reply('💰 Tell me the amount you want to spend.\n\nExample: "Can I afford ₹80,000 laptop?"');
        }catch(error){
            logger.error('Error in handleAfford:', error);
            await ctx.reply('❌ An error occurred. Please try again.');
        }
    },

    
    handleWeeklyInsights: async(ctx) =>{
        const telegramId = ctx.from.id;

        try{
            const user = await User.findOne({ telegramId });

            if(!user){
                await ctx.reply('❌ User not found. Please /start first.');
                return;
            }

            if(!user.isSetupComplete){
                await ctx.reply('❌ Please complete /setup first.');
                return;
            }

            const insightService = require('../services/insightService');
            const insights = await insightService.getWeeklyInsights(telegramId);

            let topCategoriesText = '';
            if(insights.topCategories.length > 0){
                topCategoriesText = '\n📊 Top Categories:\n';
                insights.topCategories.forEach((cat, i) => {
                    topCategoriesText += `${i + 1}. ${cat[0]}: ₹${cat[1]}\n`;
                });
            }

            let insightsText = '';

            insights.insights.forEach(insight =>{
                insightsText += `- ${insight}\n`;
            });

            const weeklyMessage = `📊 Weekly Insights

💰 This Week:
- Expenses: ₹${insights.currentExpense}
- Income: ₹${insights.currentIncome}
- Transactions: ${insights.totalTransactions}

📈 vs Last Week:
- Change: ${insights.expenseChange > 0 ? '+' : ''}${insights.expenseChange}%
- Previous: ₹${insights.previousExpense}
${topCategoriesText}
💡 Insights:
${insightsText}`;



            await ctx.reply(weeklyMessage);


        }catch(error){
            logger.error('Error in handleWeeklyInsights:', error);
            await ctx.reply('❌ Failed to get insights. Please try again.');
        }
    },


    handleBill: async (ctx) => {
    const telegramId = ctx.from.id;

    try {
        const user = await User.findOne({ telegramId });

        if (!user) {
            await ctx.reply('❌ User not found. Please /start first.');
            return;
        }

        await ctx.reply(
            `📋 Bill Reminders\n\n` +
            `Set recurring bills:\n` +
            `"Remind me electricity bill ₹1500 on 5th"\n` +
            `"Remind me wifi ₹800 every month"\n\n` +
            `Or use /bills to view all bills`
        );

    } catch (error) {
        logger.error('Error in handleBill:', error);
        await ctx.reply('❌ An error occurred. Please try again.');
    }
  },

  handleBillList: async (ctx) => {
    const telegramId = ctx.from.id;

    try {
        const user = await User.findOne({ telegramId });

        if (!user) {
            await ctx.reply('❌ User not found. Please /start first.');
            return;
        }

        const billReminderService = require('../services/billReminderService');
        const bills = await billReminderService.getBills(telegramId);

        if (bills.length === 0) {
            await ctx.reply('📋 No bills set yet.\n\nUse: "Remind me electricity bill ₹1500 on 5th"');
            return;
        }

        let billsText = '📋 Your Bills:\n\n';
        bills.forEach((bill, i) => {
            billsText += `${i + 1}. ${bill.name}\n`;
            billsText += `   Amount: ₹${bill.amount}\n`;
            billsText += `   Due: ${getOrdinalSuffix(bill.dueDate)} (${bill.frequency})\n\n`;
        });

        await ctx.reply(billsText);

    } catch (error) {
        logger.error('Error in handleBillList:', error);
        await ctx.reply('❌ Failed to get bills. Please try again.');
    }
  },

  handleBillReminders: async (ctx) => {
    const telegramId = ctx.from.id;

    try {
        const user = await User.findOne({ telegramId });

        if (!user) {
            await ctx.reply('❌ User not found. Please /start first.');
            return;
        }

        const billReminderService = require('../services/billReminderService');
        const reminders = await billReminderService.checkBillReminders(telegramId);

        if (reminders.length === 0) {
            await ctx.reply('✅ No bills due soon!');
            return;
        }

        let reminderText = '⏰ Upcoming Bills:\n\n';
        reminders.forEach(reminder => {
            reminderText += reminder + '\n';
        });

        await ctx.reply(reminderText);

    } catch (error) {
        logger.error('Error in handleBillReminders:', error);
        await ctx.reply('❌ Failed to get reminders. Please try again.');
    }
  },

};

module.exports = commandHandler;