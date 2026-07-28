const mongoose = require('mongoose');
const logger = require('../utils/logger');
const dns = require('dns');


dns.setServers(['8.8.8.8', '8.8.4.4']);

const connectDB = async () => {
    try{
        const mongoURI = process.env.MONGODB_URI;

        if(!mongoURI) {
            throw new Error('MONGODB_URI is not defined in environment variables');
        }

        await mongoose.connect(mongoURI)

        logger.info('MongoDB connected successfully');

    }catch(err){
        logger.error('MongoDB connection error:', err);
        process.exit(1);
    }
};

const disconnectDB = async () => {
    try{
        await mongoose.disconnect();
        logger.info('MongoDB disconnected');
    }catch(err){
        logger.error('Error disconnecting from MongoDB:', err);
    }
};


module.exports = { connectDB, disconnectDB };