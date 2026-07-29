const User = require('../models/User');
const Transaction = require('../models/Transaction');

const affordabilityService = {
    analyzeAffordability: async (userId, purchaseAmount) => {
        try{
            const user = await User.findOne({ telegramId: userId });
            if(!user) return null;

            const now = new Date();
            const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);

            const monthTransactions = await Transaction.find({
                userId,
                date: { $gte: startDate, $lte: endDate }
            })
            
            const monthlyExpenses  = monthTransactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);


            const monthlyIncome = user.monthlyIncome;
            const currentBalance = user.currentSavings;
            const emergencyFundTarget  = user.emergencyFundTarget;


            //cal affordability
            const balanceAfterPurchase = currentBalance - purchaseAmount;
            const savingsPercentage =((balanceAfterPurchase / currentBalance) * 100).toFixed(1);
            const percentOfSavings = ((purchaseAmount / currentBalance) * 100).toFixed(1);
            const percentOfIncome = ((purchaseAmount / monthlyIncome) * 100).toFixed(1);
            const emergencyFundAfterPurchase = balanceAfterPurchase;
            const emergencyFundShortage = emergencyFundTarget - emergencyFundAfterPurchase;

            let affordability ='RISKY';
            let recommendation = '';

            if(balanceAfterPurchase >= emergencyFundTarget){
                affordability = 'YES_SAFE';
                recommendation = '✅ You can comfortably afford this. Your emergency fund remains intact.';
            }else if (balanceAfterPurchase >= (emergencyFundTarget * 0.5)){
                affordability = 'YES_CAUTION';
                recommendation = `⚠️ You can afford it, but your emergency fund will drop to ₹${balanceAfterPurchase}. Consider waiting ${Math.ceil(emergencyFundShortage / (monthlyIncome * 0.2))} months.`;
            }else if( balanceAfterPurchase >= 0){
                affordability = 'RISKY';
                recommendation = `❌ Not recommended. This purchase will damage your emergency fund. You'll have only ₹${balanceAfterPurchase}`;
            }else{
                affordability = 'CANNOT_AFFORD';
                recommendation = `❌ You cannot afford this. You're ₹${Math.abs(balanceAfterPurchase)} short.`;
            }

            return {
                canAfford: affordability !== 'CANNOT_AFFORD',
                affordability,
                purchaseAmount,
                currentBalance,
                balanceAfterPurchase,
                percentOfSavings,
                percentOfIncome,
                emergencyFundTarget,
                emergencyFundAfterPurchase,
                monthlyIncome,
                monthlyExpenses,
                recommendation,
                analysis: {
                    balanceImpact: `Purchase = ${percentOfSavings}% of your savings`,
                    incomeImpact: `Purchase = ${percentOfIncome}% of monthly income`,
                    emergencyFundImpact: emergencyFundShortage > 0 ? `Shortage: ₹${emergencyFundShortage}` : 'Safe',
                }
            };


        }catch(error){
            throw error;
        }
    },
}

module.exports = affordabilityService;