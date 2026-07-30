const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
    {
        telegramId: {
            type: Number,
            required: true,
            unique: true,
        },

        firstName: String,
        lastName: String,
        username: String,
        name: String,

        monthlyIncome: {
            type: Number,
            default: 0
        },

        currentSavings: {
            type: Number,
            default: 0
        },

        salaryDate: {
            type: Number,
            default: null
        },

        currency: {
            type: String,
            default: 'INR',
        },

        monthlyBudget: {
            type: Number,
            default: 0,
        },
        
        emergencyFundTarget: {
            type: Number,
            default: 0,
        },

        isSetupComplete: {
            type: Boolean,
            default: false,
        },

        preferences: {
            language: {
                type: String,
                default: 'en',
            },

            notifications: {
                type: Boolean,
                default: true,
            },

            currency: {
                type: String,
                default: 'INR',
            },
        },

        
        pendingReceipt: {
            type: Object,
            default: null,
        },



        financialGoals: {
            type: String,
            default: '',
        },
        
        setupStep: {
            type: Number,
            default: 0,
        },
        
    },
    { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);

