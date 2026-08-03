const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Goal = require('../models/Goal');
const logger = require('../utils/logger');
const { getOrdinalSuffix } = require('../utils/helpers');


const messageHandler = {
    handleMessage: async (ctx) => {
        const telegramId = ctx.from.id;

          
        try {
            let user = await User.findOne({ telegramId });

            if (!user) {
                await ctx.reply('❌ User not found. Please /start first.');
                return;
            }

            // PHOTO CHECK FIRST - before accessing text
            if (ctx.message && ctx.message.photo) {
                await handleReceipt(ctx, user, ctx.message.photo[ctx.message.photo.length - 1].file_id);
                return;
            }

            // NOW get text
            if (!ctx.message || !ctx.message.text) {
                await ctx.reply('❌ Please send text or photo');
                return;
            }

            const userMessage = ctx.message.text.toLowerCase();

            // Check if waiting for receipt confirmation
            if (user.pendingReceipt) {
                if (userMessage === 'yes' || userMessage === 'confirm') {
                    const transaction = await Transaction.create({
                        userId: user.telegramId,
                        amount: user.pendingReceipt.amount,
                        type: 'expense',
                        category: user.pendingReceipt.category,
                        description: `Receipt: ${user.pendingReceipt.text}`,
                        taggedBy: 'ocr',
                    });
                    const amount = user.pendingReceipt.amount;
                    const category = user.pendingReceipt.category;
                    user.pendingReceipt = null;
                    await user.save();
                    await ctx.reply(`✅ Expense logged! ₹${amount} ${category}`);
                    return;
                } else if (userMessage.match(/^[\d,]+$/)) {
                    const match = userMessage.match(/[\d,]+/);
                    if (match) {
                        const newAmount = parseInt(match[0].replace(/,/g, ''));
                        user.pendingReceipt = {
                            ...user.pendingReceipt,
                            amount: newAmount
                        };

                        await user.save();
                        await ctx.reply(`✅ Amount updated to ₹${user.pendingReceipt.amount}. Reply "yes" to confirm.`);
                        return;
                    }
                }
                await ctx.reply('Reply "yes" to confirm or "₹XXX" to change amount');
                return;
            }

            // Check setup
            if (!user.isSetupComplete && user.setupStep > 0) {
                await handleSetupProgress(ctx, user, userMessage);
                return;
            }

            // Expense
            if (userMessage.includes('spent') || userMessage.includes('paid') || userMessage.includes('bought')) {
                await handleExpense(ctx, user, userMessage);
                return;
            }

            // Income
            if (userMessage.includes('earned') || userMessage.includes('received') || userMessage.includes('got')) {
                await handleIncome(ctx, user, userMessage);
                return;
            }

            // Goals
            if (userMessage.includes('goal:') || userMessage.includes('save for')) {
                await handleGoal(ctx, user, userMessage);
                return;
            }

            // Affordability
            if (userMessage.includes('afford') || userMessage.includes('can i buy')) {
                await handleAffordability(ctx, user, userMessage);
                return;
            }


            // Detect bill reminder
            if (userMessage.includes('remind') && userMessage.includes('on') && userMessage.match(/on\s+\d+/i)) {
                await handleBillReminder(ctx, user, userMessage);
                return;
            }

            // goal progress 
            if(userMessage.includes('add') && userMessage.includes('to') && userMessage.includes('goal')){
                // console.log('GOAL PROGRESS TRIGGERED!');
                await handleGoalProgress(ctx,user,userMessage);
                return;
            }

 
            await ctx.reply(
                '💭 I didn\'t understand. Try:\n\n' +
                '• "Spent ₹450 on pizza"\n' +
                '• "Received ₹60,000 salary"\n' +
                '• "Goal: Save ₹1,00,000 for laptop"\n' +
                '• "Add ₹20,000 to laptop goal"\n' +
                '• "Can I afford ₹80,000 laptop?"\n' +
                '• "Remind me wifi bill 800 on 15"\n' +
                '• Upload receipt photo\n\n' +
                '📞 Need help? Use /help or message @abhi0506'
            );

        } catch (error) {
            logger.error('Error in handleMessage:', error);
            await ctx.reply('❌ An error occurred. Please try again.');
        }
    },
};






const handleSetupProgress = async (ctx, user, userMessage) => {
    try {
        const step = user.setupStep;

        if (step === 1) {
            const income = parseInt(userMessage.match(/\d+/)?.[0]);
            if (!income || isNaN(income)) {
                await ctx.reply('❌ Please enter a valid number. Example: 60000');
                return;
            }

            user.monthlyIncome = income;
            user.setupStep = 2;
            await user.save();
            await ctx.reply(`✅ Got it! Monthly income: ₹${income}\n\nNow, how much savings do you have? (in ₹)`);
        } else if (step === 2) {
            const savings = parseInt(userMessage.match(/\d+/)?.[0]);
            if (!savings || isNaN(savings)) {
                await ctx.reply('❌ Please enter a valid number. Example: 120000');
                return;
            }
            user.currentSavings = savings;
            user.setupStep = 3;
            await user.save();
            await ctx.reply(`✅ Got it! Current savings: ₹${savings}\n\nWhat's your emergency fund target? (in ₹)`);
        } else if (step === 3) {
            const target = parseInt(userMessage.match(/\d+/)?.[0]);
            if (!target || isNaN(target)) {
                await ctx.reply('❌ Please enter a valid number. Example: 250000');
                return;
            }
            user.emergencyFundTarget = target;
            user.setupStep = 4;
            await user.save();
            await ctx.reply(`✅ Got it! Emergency fund target: ₹${target}\n\nWhat's your main financial goal?`);
        } else if (step === 4) {
            user.financialGoals = userMessage;
            user.isSetupComplete = true;
            user.setupStep = 0;
            await user.save();
            await ctx.reply(`✅ Setup complete! 🎉\n\nNow you can start tracking expenses and income.\n\nTry: "Spent ₹500 on lunch" or "Salary ₹60000"`);
        }
    } catch (error) {
        logger.error('Error in handleSetupProgress:', error);
        await ctx.reply('❌ Setup error. Please try again.');
    }
};








const handleExpense = async (ctx, user, userMessage) => {
    try {
        const amountMatch = userMessage.match(/₹?([\d,]+)/);
        const amount = amountMatch ? parseInt(amountMatch[1].replace(/,/g, '')) : null;

        if (!amount || isNaN(amount)) {
            await ctx.reply('❌ Couldn\'t find amount. Example: "Spent ₹450 on pizza"');
            return;
        }


        const geminiService = require('../services/geminiService');
        let category = await geminiService.categorizeExpense(userMessage);

        // const huggingfaceService = require('../services/huggingfaceService');
        // let category = await huggingfaceService.categorizeExpense(userMessage);

        if (!category) {
            category = 'Other';
            if (userMessage.includes('food') || userMessage.includes('pizza') || userMessage.includes('lunch') || userMessage.includes('dinner') || userMessage.includes('restaurant')) category = 'Food';
            else if (userMessage.includes('fuel') || userMessage.includes('transport') || userMessage.includes('auto') || userMessage.includes('taxi') || userMessage.includes('uber')) category = 'Transport';
            else if (userMessage.includes('bill') || userMessage.includes('electric') || userMessage.includes('water') || userMessage.includes('internet')) category = 'Utilities';
            else if (userMessage.includes('movie') || userMessage.includes('entertainment') || userMessage.includes('game') || userMessage.includes('spotify')) category = 'Entertainment';
            else if (userMessage.includes('clothes') || userMessage.includes('shop') || userMessage.includes('dress') || userMessage.includes('shoes')) category = 'Shopping';
        }

        const transaction = await Transaction.create({
            userId: user.telegramId,
            amount,
            type: 'expense',
            category,
            description: userMessage,
            taggedBy: 'ai',
        });

        logger.info(`Expense logged: ₹${amount} by user ${user.telegramId}`);

        await ctx.reply(
            `✅ Expense Logged!\n\n` +
            `Amount: ₹${amount}\n` +
            `Category: ${category}\n` +
            `Date: Today`
        );
    } catch (error) {
        logger.error('Error in handleExpense:', error);
        await ctx.reply('❌ Failed to log expense. Try again.');
    }
};










const handleIncome = async (ctx, user, userMessage) => {
    try {
        const amountMatch = userMessage.match(/₹?([\d,]+)/);
        const amount = amountMatch ? parseInt(amountMatch[1].replace(/,/g, '')) : null;

        if (!amount || isNaN(amount)) {
            await ctx.reply('❌ Couldn\'t find amount. Example: "Received ₹60,000 salary"');
            return;
        }

        const source = userMessage.includes('freelance') ? 'freelance' : 'salary';

        const transaction = await Transaction.create({
            userId: user.telegramId,
            amount,
            type: 'income',
            category: 'Income',
            source,
            description: userMessage,
            taggedBy: 'regex',
        });

        logger.info(`Income logged: ₹${amount} by user ${user.telegramId}`);

        await ctx.reply(
            `✅ Income Added!\n\n` +
            `Amount: ₹${amount}\n` +
            `Type: ${source === 'freelance' ? 'Freelance' : 'Salary'}\n` +
            `Date: Today`
        );


    } catch (error) {
        logger.error('Error in handleIncome:', error);
        await ctx.reply('❌ Failed to log income. Try again.');
    }
};









const handleGoal = async (ctx, user, userMessage) => {
    try {
        const amountMatch = userMessage.match(/[\d,]+/);
        const amount = amountMatch ? parseInt(amountMatch[0].replace(/,/g, '')) : null;

        if (!amount || isNaN(amount)) {
            await ctx.reply('❌ Couldn\'t find amount. Example: "Goal: Save ₹1,00,000 for laptop"');
            return;
        }

        
        const goalName = userMessage.replace(amountMatch[0], '').replace(/goal:/i, '').replace(/save/i, '').replace(/for/i, '').trim();

        const goal = await Goal.create({
            userId: user.telegramId,
            name: goalName || 'Unnamed Goal',
            targetAmount: amount,
            currentAmount: 0,
            status: 'active',
        });

        logger.info(`Goal created: ${goalName} for ₹${amount} by user ${user.telegramId}`);

        await ctx.reply(
            `✅ Goal Created!\n\n` +
            `Goal: ${goalName}\n` +
            `Target: ₹${amount}\n` +
            `Progress: 0%\n\n` +
            `Use /goals to view all goals!`
        );

    } catch (error) {
        logger.error('Error in handleGoal:', error);
        await ctx.reply('❌ Failed to create goal. Try again.');
    }
};








const handleAffordability = async (ctx, user, userMessage) => {
    try {
        const amountMatch = userMessage.match(/[\d,]+/);
        const amount = amountMatch ? parseInt(amountMatch[0].replace(/,/g, '')) : null;

        if (!amount || isNaN(amount)) {
            await ctx.reply('❌ Please specify amount. Example: "Can I afford ₹80,000 laptop?"');
            return;
        }

        const affordabilityService = require('../services/affordabilityService');
        const analysis = await affordabilityService.analyzeAffordability(user.telegramId, amount);

        const affordabilityMessage = `💰 Affordability Analysis

Purchase: ₹${analysis.purchaseAmount}

📊 Your Profile:
- Current Savings: ₹${analysis.currentBalance}
- Monthly Income: ₹${analysis.monthlyIncome}
- Emergency Fund Target: ₹${analysis.emergencyFundTarget}

🔍 Analysis:
- ${analysis.analysis.balanceImpact}
- ${analysis.analysis.incomeImpact}
- Emergency Fund Impact: ${analysis.analysis.emergencyFundImpact}

💵 After Purchase:
- Balance: ₹${analysis.balanceAfterPurchase}

${analysis.recommendation}`;

        await ctx.reply(affordabilityMessage);

    } catch (error) {
        logger.error('Error in handleAffordability:', error);
        await ctx.reply('❌ Failed to analyze affordability. Try again.');
    }
};








const handleReceipt = async (ctx, user, fileId) => {
    try {
        await ctx.reply('📸 Processing receipt... please wait');

        const receiptService = require('../services/receiptService');
        const fileUrl = await ctx.telegram.getFileLink(fileId);

        const result = await receiptService.extractFromReceipt(fileUrl.href);

        if (!result.success || !result.amount) {
            await ctx.reply(
                `❓ OCR couldn't extract amount clearly.\n\n` +
                `Extracted text: "${result.text}"\n\n` +
                `Please reply with the amount:\n` +
                `"₹XXX" or "Spent ₹XXX on ${result.category}"`
            );
            return;
        }

        
        await ctx.reply(
            `📋 Extracted from receipt:\n\n` +
            `Amount: ₹${result.amount}\n` +
            `Category: ${result.category}\n\n` +
            `Reply with:\n` +
            `"Yes" to confirm\n` +
            `"₹XXX" to correct amount`
        );

        
        user.pendingReceipt = {
            amount: result.amount,
            category: result.category,
            text: result.text
        };
        await user.save();

    } catch (error) {
        logger.error('Error in handleReceipt:', error);
        await ctx.reply('❌ Failed to process receipt. Try again.');
    }
};










const handleBillReminder = async (ctx, user, userMessage) => {
    try {
        
        const amountMatch = userMessage.match(/[\d,]+/);
        const amount = amountMatch ? parseInt(amountMatch[0].replace(/,/g, '')) : null;

        if (!amount) {
            await ctx.reply('❌ Please specify amount. Example: "Remind me wifi 800 on 15"');
            return;
        }

        
        const dateMatch = userMessage.match(/on\s+(\d+)/i);
        const dueDate = dateMatch ? parseInt(dateMatch[1]) : null;

        if (!dueDate || dueDate < 1 || dueDate > 31) {
            await ctx.reply('❌ Please specify valid date (1-31). Example: "Remind me wifi 800 on 15"');
            return;
        }

       
        const billName = userMessage
            .replace(/remind\s+me\s+/i, '')
            .replace(/\s+[\d,]+\s+on\s+\d+/i, '')
            .trim();

        const billReminderService = require('../services/billReminderService');
        const bill = await billReminderService.createBill(user.telegramId, {
            name: billName || 'Bill',
            amount,
            dueDate,
            category: 'Bills',
        });

        logger.info(`Bill reminder created: ${billName} ₹${amount} on ${dueDate}th by user ${user.telegramId}`);

        await ctx.reply(
            `✅ Bill Reminder Set!\n\n` +
            `Bill: ${bill.name}\n` +
            `Amount: ₹${bill.amount}\n` +
            `Due: ${getOrdinalSuffix(bill.dueDate)} (monthly)\n\n` +
            `Use /bills to view all bills`
        );

    } catch (error) {
        logger.error('Error in handleBillReminder:', error);
        await ctx.reply('❌ Failed to set reminder. Try again.');
    }
};








const handleGoalProgress = async(ctx,user,userMessage) => {
    try{
        const amountMatch = userMessage.match(/₹?\s*([\d,]+)/);
        const amount = amountMatch ? parseInt(amountMatch[1].replace(/,/g, '')) : null;

        if(!amount ){
            await ctx.reply('❌ Please specify amount. Example: "Progress ₹20,000 for laptop"');
            return;
        }

        const goalMatch = userMessage.match(/to\s+(.+?)\s+goal/i);
        const goalName = goalMatch ? goalMatch[1].trim() : null;

        if(!goalName){
            await ctx.reply('❌ Please specify goal name. Example: "Progress ₹20,000 to laptop goal"');
            return;
        }

        const Goal = require('../models/Goal');
        const goal = await Goal.findOne({ userId: user.telegramId, name: new RegExp(goalName, 'i') });

        if (!goal) {
            await ctx.reply(`❌ Goal "${goalName}" not found. Use /goals to see your goals.`);
            return;
        }

        goal.currentAmount += amount;
        const progress= ((goal.currentAmount / goal.targetAmount) * 100).toFixed(1);

        if(goal.currentAmount >= goal.targetAmount){
            goal.status = 'completed';
        }

        await goal.save();

        await ctx.reply(
            `✅ Added ₹${amount} to "${goal.name}"\n\n` +
            `Current: ₹${goal.currentAmount}\n` +
            `Target: ₹${goal.targetAmount}\n` +
            `Progress: ${progress}% ${'█'.repeat(Math.round(progress / 10))}${'░'.repeat(10 - Math.round(progress / 10))}`
        )

    }catch(error){
        logger.error('Error in handleGoalProgress:', error);
        await ctx.reply('❌ Failed to update goal progress. Try again.');
    }
}

module.exports = messageHandler;