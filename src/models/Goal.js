const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema(
    {
        userId:{
            type:Number,
            required:true,
            index:true,
        },

        name:{
            type:String,
            required:true,
        },

        targetAmount:{
            type:Number,
            required:true,
        },

        currentAmount:{
            type:Number,
            default:0,
        },

        deadline: Date,
        category: String,
        description: String,

        status:{
            type:String,
            enum:['active','completed','archived'],
            default:'active',
        },

        priority:{
            type:String,
            enum:['low','medium','high'],
            default:'medium',
        },

        monthlyContribution:{
            type:Number,
            default:0,
        },

        progress:{
            type:Number,
            default:0,
        },
    },
    {timestamps:true}
);

module.exports= mongoose.model('Goal', goalSchema);