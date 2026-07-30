const mongoose = require('mongoose');

const billSchema = new mongoose.Schema(
  {
    userId: {
      type: Number,
      required: true,
      index: true,
    },


    name: {
      type: String,
      required: true,
    },

    amount: {
      type: Number,
      required: true,
    },

    dueDate: {
      type: Number, 
      required: true,
    },

    category: String,
    frequency: {
      type: String,
      enum: ['monthly', 'yearly'],
      default: 'monthly',
    },

    isActive: {
      type: Boolean,
      default: true,
    },
    
    lastReminded: Date,
    nextDueDate: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Bill', billSchema);