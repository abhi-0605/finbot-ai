const Tesseract = require('tesseract.js');
const axios = require('axios');
const fs = require('fs');
const path = require('path');


const receiptService = {
    extractFromReceipt: async (imageUrl) => {
        try {
            console.log('Processing receipt:', imageUrl);

            // Create temp folder if doesn't exist
            const tempDir = path.join(__dirname, '../../temp');
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir);
            }

            const imagePath = path.join(tempDir, `receipt_${Date.now()}.jpg`);

            // Download image
            console.log('Downloading from:', imageUrl);
            const response = await axios.get(imageUrl, {
                responseType: 'arraybuffer',
                timeout: 10000
            });

            fs.writeFileSync(imagePath, response.data);
            console.log('Image saved to:', imagePath);

            // Extract text using Tesseract
            const result = await Tesseract.recognize(imagePath, 'eng', {
                logger: m => console.log('Progress:', Math.round(m.progress * 100) + '%')
            });

            const text = result.data.text.toLowerCase();
            console.log('OCR Text:', text.substring(0, 200));

            // Extract amount
            // Extract amount - find all numbers and pick reasonable price (100-50000)
            // Extract amount - get all numbers and find most likely price
            const allNumbers = text.match(/\d+/g) || [];
            let amount = null;

            // Convert to integers and filter by reasonable price range
            const validPrices = allNumbers
                .map(n => parseInt(n))
                .filter(n => n >= 50 && n <= 50000)
                .sort((a, b) => b - a); // Largest first

            if (validPrices.length > 0) {
                amount = validPrices[0]; // Take largest valid number as total
            }

            // Detect category
            let category = 'Other';
            if (text.includes('food') || text.includes('restaurant') || text.includes('cafe')) category = 'Food';
            else if (text.includes('fuel') || text.includes('petrol')) category = 'Transport';
            else if (text.includes('bill') || text.includes('electric')) category = 'Utilities';
            else if (text.includes('movie') || text.includes('entertainment')) category = 'Entertainment';
            else if (text.includes('clothes') || text.includes('dress')) category = 'Shopping';

            // Cleanup
            fs.unlinkSync(imagePath);

            return {
                amount,
                category,
                text: text.substring(0, 200),
                success: amount ? true : false,
            };

        } catch (error) {
            console.log('Receipt OCR error:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    },
};


module.exports = receiptService;