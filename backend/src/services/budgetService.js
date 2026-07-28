const User = require('../models/User');

const budgetService = {
    calculateBudget:  (monthlyIncome) => {

        //50-30-20 rule
        const income = parseInt(monthlyIncome);
        const needs = Math.round(income * 0.5);
        const wants = Math.round(income * 0.3);
        const savings = Math.round(income * 0.2);

        return {
            totalIncome: income,
            needs:needs,
            wants:wants,
            savings:savings
        };
    },
        

    saveBudget: async (userId, budget) => {
        try{
            const user = await User.findOne({ telegramId: userId });

            if(!user){
                return null;
            }

            user.monthlyBudget = budget.totalIncome;
            await user.save();

            return budget;


        }catch(error){
        
            throw error;
        }
    },

    getBudget: async (userId) => {
        try{
             const user = await User.findOne({ telegramId: userId });
      
            if (!user || !user.monthlyBudget) return null;

            return budgetService.calculateBudget(user.monthlyBudget);
        }catch(error){
            throw error;
        }
    },
        

    
};

module.exports = budgetService;