const { error } = require('console');
const fs = require('fs');
const path = require('path');

const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}


const logFile = path.join(logsDir, 'app.log');

const logger={
    info:(message)=>{
        const timestamp= new Date().toISOString();
        const logMessage=`[${timestamp}] INFO: ${message}`;
        console.log(logMessage);
        fs.appendFileSync(logFile, logMessage + '\n');
    },

    error:(message, error) => {
        const timestamp= new Date().toISOString();
        const errorMessage= error ? error.stack : '';
        const logMessage = `[${timestamp}] ERROR: ${message}\n${errorMessage}`;
        console.error(logMessage);
        fs.appendFileSync(logFile, logMessage + '\n');
    },

    warn:(message)=>{
        const timestamp= new Date().toISOString();
        const logMessage = `[${timestamp}] WARN: ${message}`;
        console.warn(logMessage);
        fs.appendFileSync(logFile, logMessage + '\n');
    },
};

module.exports=logger;