const User = require('../models/User');
const Transaction = require('../models/Transaction');

const transactionService = {
  getSummary: async (userId) => {
    try {
      const user = await User.findOne({ telegramId: userId });
      
      
      if (!user) return null;

      const transactions = await Transaction.find({ userId });


      const totalIncome = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

      const totalExpense = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      const currentBalance = user.currentSavings + totalIncome - totalExpense;


      return {
        currentSavings: user.currentSavings,
        totalIncome,
        totalExpense,
        currentBalance,
        monthlyIncome: user.monthlyIncome,
        emergencyFundTarget: user.emergencyFundTarget,
        transactions: transactions.length,
      };


    } catch (error) {
      throw error;
    }
  },
};

module.exports = transactionService;