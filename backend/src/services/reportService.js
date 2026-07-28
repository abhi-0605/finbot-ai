const Transaction = require('../models/Transaction');
const User = require('../models/User');

const reportService = {
    getMonthlyReport: async (userId, year, month) => {
        try {
            const user = await User.findOne({ telegramId: userId });

            if (!user) return null;

            // Get transactions for the month
            // Get transactions for the month
            const startDate = new Date(year, month - 1, 1, 0, 0, 0);
            const endDate = new Date(year, month, 0, 23, 59, 59);

            const transactions = await Transaction.find({
                userId,
                date: { $gte: startDate, $lte: endDate }
            });


            //cal income and expense
            const income = transactions
                .filter(t => t.type === 'income')
                .reduce((sum, t) => sum + t.amount, 0);

            const expenses = transactions
                .filter(t => t.type === 'expense')
                .reduce((sum, t) => sum + t.amount, 0);

            const savings = income - expenses;
            const savingsRate = income > 0 ? ((savings / income) * 100).toFixed(2) : 0;

            // Categorize expenses
            const categoryBreakdown = {};
            transactions
                .filter(t => t.type === 'expense')
                .forEach(t => {
                    if (!categoryBreakdown[t.category]) {
                        categoryBreakdown[t.category] = 0;
                    }
                    categoryBreakdown[t.category] += t.amount;
                });


            //sort categories by amount spent

            const sortedCategories = Object.entries(categoryBreakdown)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5);

            return {
                month: startDate.toLocaleString('default', { month: 'long', year: 'numeric' }),
                income,
                expenses,
                savings,
                savingsRate,
                avgDailySpend: expenses > 0 ? (expenses / 30).toFixed(0) : 0,
                categories: sortedCategories,
                transactionCount: transactions.length,
            };



        } catch (error) {
            throw error;
        }
    },
};



module.exports = reportService;