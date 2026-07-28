const Goal = require('../models/Goal');
const User = require('../models/User');

const goalService = {




    createGoal: async (userId, goalData) => {
        try {
            const goal = await Goal.create({
                userId,
                name: goalData.name,
                targetAmount: goalData.targetAmount,
                currentAmount: goalData.currentAmount || 0,
                deadline: goalData.deadline,
                category: goalData.category,
                description: goalData.description,
            });
            return goal;


        } catch (error) {
            throw error;
        }
    },


    getGoals:async (userId) =>{
        try{
            const goals= await Goal.find({userId, status: 'active'});
            return goals.map(goal => ({
                id: goal._id,
                name: goal.name,
                targetAmount: goal.targetAmount,
                currentAmount: goal.currentAmount,
                progress: ((goal.currentAmount / goal.targetAmount) * 100).toFixed(1),
                remaining: goal.targetAmount - goal.currentAmount,
                status: goal.status,
            }))
        }catch(error){
            throw error;
        }
    },




    updateGoal:async (userId, amount) => {
        try{
            const goal= await Goal.findOne({goalId});

            if(!goal) return null;

            goal.currentAmount += amount;

            if(goal.currentAmount >= goal.targetAmount){
                goal.status = 'completed';
            }

            await goal.save();
            return goal;
        }catch(error){
            throw error;
        }
    },



    getGoalProgress:async(userId) => {
        try{
            const goals = await Goal.find({userId, status: 'active'});

            if(!goals || goals.length === 0) return null;

            const progress  = goals.map(goal => ({
                name: goal.name,
                target: goal.targetAmount,
                current: goal.currentAmount,
                progress: ((goal.currentAmount / goal.targetAmount) * 100).toFixed(1),
                remaining: goal.targetAmount - goal.currentAmount,
            }));
            return progress;

        }catch(error){
            throw error;
        }
    },
}

module.exports = goalService;