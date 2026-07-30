const Bill = require('../models/Bill');
const User = require('../models/User');

const billReminderService = {
    createBill : async (userId, billData) => {
        try{
            const today = new Date();
            const nextDueDate = new Date(today.getFullYear(), today.getMonth(), billData.dueDate);

            if(nextDueDate < today){
                nextDueDate.setMonth(nextDueDate.getMonth() + 1);
            }
            
            const bill = await Bill.create({
                userId,
                name: billData.name,
                amount: billData.amount,
                dueDate: billData.dueDate,
                category: billData.category || 'Bills',
                frequency: billData.frequency || 'monthly',
                isActive: true,
                nextDueDate,
            });

            return bill;

        }catch(error){
            
            throw error;
        }
    },



    getBills: async (userId) => {
        try{
            const bills = await Bill.find({ userId, isActive: true });
            return bills;
        }catch(error){
            throw error;
        }
    },

    checkBillReminders: async(userId) => {
        try {
            const today = new Date();
            const bills = await Bill.find({ userId, isActive: true });

            let reminders = [];
      
            bills.forEach(bill => {
            const daysUntilDue = bill.dueDate - today.getDate();
        
                if (daysUntilDue === 3) {
                    reminders.push(`⏰ Reminder: ${bill.name} (₹${bill.amount}) due in 3 days on ${bill.dueDate}th`);
                } else if (daysUntilDue === 1) {
                    reminders.push(`⚠️ URGENT: ${bill.name} (₹${bill.amount}) due TOMORROW!`);
                } else if (daysUntilDue === 0) {
                    reminders.push(`🔴 DUE TODAY: ${bill.name} (₹${bill.amount})`);
                }
            });

            return reminders;
        } catch (error) {
            throw error;
        }
    },

    payBill: async ( billId) => {
        try{
            const bill = await Bill.findById(billId);

            if(!bill) return null;

            bill.lastReminded = new Date();
            const nextDue = new Date();

            nextDue.setMonth(nextDue.getMonth() + 1);
            bill.nextDueDate = nextDue;

            await bill.save();

            return bill;
        }catch(error){
            throw error;
        }
    },

    deleteBill: async (billId) => {
        try{
            const bill = await Bill.findById(billId);

            if(!bill) return null;

            bill.isActive = false;
            await bill.save();

            return bill;
        }catch(error){
            throw error;
        }
    },
}

module.exports = billReminderService;