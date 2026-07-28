const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Goal = require('../models/Goal');
const logger = require('../utils/logger');

const messageHandler ={
    handleMessage: async (ctx) => {
        const telegramId = ctx.from.id;
        const userMessage= ctx.message.text.toLowerCase();

        try{
            let user = await User.findOne({telegramId});

            if(!user){
                await ctx.reply('❌ User not found. Please /start first.');
                return;
            }

            // Check if the user is in the middle of setup
            if(!user.isSetupComplete && user.setupStep > 0){
                await handleSetupProgress(ctx, user, userMessage);
                return;
            }

            //expense handling logic
            if(userMessage.includes('spent') || userMessage.includes('paid') || userMessage.includes('bought')){
                await handleExpense(ctx, user, userMessage);
                return;
            }

            if(userMessage.includes('earned') || userMessage.includes('received') || userMessage.includes('got')){
                await handleIncome(ctx, user, userMessage);
                return;
            }

            if(userMessage.includes('goal:') || userMessage.includes('goal:') || userMessage.includes('goal:')){
                await handleGoal(ctx, user, userMessage);
                return;
            }


            await ctx.reply(
                '💭 I didn\'t understand. Try:\n\n' +
                '• "Spent ₹450 on pizza"\n' + 
                '• "Received ₹60,000 salary"\n' +
                '• Or use /help'
            ); 


        }catch(error){
            logger.error('Error in handleMessage:', error);
            await ctx.reply('❌ An error occurred. Please try again.');
        }
    },
};

const handleSetupProgress = async (ctx, user, userMessage) => {
    try{
        const step=user.setupStep;

        if(step===1){
            const income=parseInt(userMessage.match(/\d+/)?.[0]);
            if(!income || isNaN(income)){
                await ctx.reply('❌ Please enter a valid number. Example: 60000');
                return;
            }

            user.monthlyIncome=income;
            user.setupStep=2;
            await user.save();
            await ctx.reply(`✅ Got it! Monthly income: ₹${income}\n\nNow, how much savings do you have? (in ₹)`);
        }else if(step===2){
            const savings=parseInt(userMessage.match(/\d+/)?.[0]);
            if(!savings || isNaN(savings)){
                await ctx.reply('❌ Please enter a valid number. Example: 120000');
                return;
            }
            user.currentSavings=savings;
            user.setupStep=3;
            await user.save();
            await ctx.reply(`✅ Got it! Current savings: ₹${savings}\n\nWhat's your emergency fund target? (in ₹)`);
        }else if(step===3){
            const target = parseInt(userMessage.match(/\d+/)?.[0]);
            if(!target || isNaN(target)){
                await ctx.reply('❌ Please enter a valid number. Example: 250000');
                return;
            }
            user.emergencyFundTarget=target;
            user.setupStep=4;
            await user.save();
            await ctx.reply(`✅ Got it! Emergency fund target: ₹${target}\n\nWhat's your main financial goal?`);
        }else if(step===4){
            user.financialGoals=userMessage;
            user.isSetupComplete=true;
            user.setupStep=0;
            await user.save();
            await ctx.reply(`✅ Setup complete! 🎉\n\nNow you can start tracking expenses and income.\n\nTry: "Spent ₹500 on lunch" or "Salary ₹60000"`);
        }
    }catch(error){
        logger.error('Error in handleSetupProgress:', error);
        await ctx.reply('❌ Setup error. Please try again.');
    }
};


const handleExpense = async (ctx, user, userMessage) => {
    try{
        const amountMatch = userMessage.match(/₹?([\d,]+)/);
        const amount = amountMatch ? parseInt(amountMatch[1].replace(/,/g, '')) : null;

        if(!amount || isNaN(amount)){
            await ctx.reply('❌ Couldn\'t find amount. Example: "Spent ₹450 on pizza"');
            return;
        }


        let category = 'Other';
        if(userMessage.includes('food') || userMessage.includes('pizza') || userMessage.includes('lunch') || userMessage.includes('dinner')) category='Food';
        else if (userMessage.includes('fuel') || userMessage.includes('transport') || userMessage.includes('auto')) category = 'Transport';
        else if (userMessage.includes('bill') || userMessage.includes('electric') || userMessage.includes('water')) category = 'Utilities';
        else if (userMessage.includes('movie') || userMessage.includes('entertainment') || userMessage.includes('game')) category = 'Entertainment';
        else if (userMessage.includes('clothes') || userMessage.includes('shop') || userMessage.includes('dress')) category = 'Shopping';


        const transaction = await Transaction.create({
            userId: user.telegramId,
            amount,
            type: 'expense',
            category,
            description: userMessage,
            taggedBy: 'regex',
        });

        logger.info(`Expense logged: ₹${amount} by user ${user.telegramId}`);

        

        await ctx.reply(
            `✅ Expense Logged!\n\n` +
            `Amount: ₹${amount}\n` +
            `Category: ${category}\n` +
            `Date: Today`
        );
    }catch(error){
        logger.error('Error in handleExpense:', error);
        await ctx.reply('❌ Failed to log expense. Try again.');
    }
};


const handleIncome = async (ctx, user, userMessage) => {
    try{
        const amountMatch = userMessage.match(/₹?([\d,]+)/);
        const amount = amountMatch ? parseInt(amountMatch[1].replace(/,/g, '')) : null;

        if(!amount || isNaN(amount)){
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


    }catch(error){
        logger.error('Error in handleIncome:', error);
        await ctx.reply('❌ Failed to log income. Try again.');
    }
}


const handleGoal = async (ctx, user, userMessage) => {
  try {
    const amountMatch = userMessage.match(/[\d,]+/);
    const amount = amountMatch ? parseInt(amountMatch[0].replace(/,/g, '')) : null;

    if (!amount || isNaN(amount)) {
      await ctx.reply('❌ Couldn\'t find amount. Example: "Goal: Save ₹1,00,000 for laptop"');
      return;
    }

    // Remove the matched amount from the string
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

module.exports=messageHandler;