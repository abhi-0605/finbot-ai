const Transaction = require('../models/Transaction');
const User = require('../models/User');

const insightService  = {
    getWeeklyInsights: async(userId) => {
        try{
            const user = await User.findOne({ telegramId: userId});
            if(!user) return null;

            //cal weekly insights
            const now = new Date();
            const sevenDaysAgo= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);


            // curr week transactions
            const currentWeek = await Transaction.find({
                userId,
                date: { $gte: sevenDaysAgo, $lte: now }
            });

            // prev week transactions
            const previousWeek = await Transaction.find({
                userId,
                date: { $gte: fourteenDaysAgo, $lt: sevenDaysAgo }
            });

            const currentExpense = currentWeek
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);

            const previousExpense = previousWeek
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);

            const currentIncome = currentWeek
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);


            

            const categoryBreakdown = {};
            currentWeek
                .filter(t => t.type === 'expense')
                .forEach(t => {
                    if (!categoryBreakdown[t.category]) {
                        categoryBreakdown[t.category] = 0;
                    }
                    categoryBreakdown[t.category] += parseInt(t.amount) || 0;
                });

            const topCategories = Object.entries(categoryBreakdown)
            .sort((a,b) => b[1] - a[1])
            .slice(0,3)

            // compare current and previous week expenses
            const expenseChange  = previousExpense > 0
                ? (((currentExpense - previousExpense) / previousExpense) * 100).toFixed(1)
                :0;
            

            let insights = [];

            if(currentExpense > previousExpense){
                insights.push(`📈 Spending up ${expenseChange}% vs last week`);
            }else if( currentExpense < previousExpense){
                insights.push(`📉 Spending down ${Math.abs(expenseChange)}% vs last week - Great job!`);
            }

            if (topCategories.length > 0 && topCategories[0][1] > (currentExpense * 0.4)) {
                insights.push(`⚠️ ${topCategories[0][0]} is ${((topCategories[0][1] / currentExpense) * 100).toFixed(0)}% of spending`);
            }

            if (currentIncome > 0 && currentExpense > currentIncome) {
                insights.push(`⚠️ Expenses exceed income this week!`);
            }

            if(currentExpense === 0){
                insights.push(`💰 No expenses logged yet this week`);
            }

            return {
                currentExpense,
                previousExpense,
                expenseChange, 
                currentIncome,
                topCategories,
                totalTransactions: currentWeek.length,
                insights: insights.length > 0 ? insights : ['Keep tracking your finances!']
            };


           
        }catch(error){
            throw error;
        }
    },
};

module.exports = insightService;