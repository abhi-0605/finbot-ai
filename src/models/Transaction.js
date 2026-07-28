
const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
    {
        userId:{
            type:Number,
            required:true,
            index:true,
        },

        amount:{
            type:Number,
            required:true,
        },

        type:{
            type:String,
            enum:['income','expense'],
            required:true,
        },

        category:{
            type:String,
            required:true,
        },

        description: String,
        source: String,

        date:{
            type:Date,
            default:Date.now,
        },

        month:{
            type:Number,
            default: () => new Date().toISOString().slice(0, 7),
        },

        year:{
            type:Number,
            default: () => new Date().getFullYear(),
        },

        taggedBy: String,
        notes: String,

    },
    {timestamps:true}
);


module.exports = mongoose.model('Transaction', transactionSchema);