const axios = require('axios');

const geminiService = {
    categorizeExpense: async (description) => {
        return null;
        try {
            const apiKey = process.env.GEMINI_API_KEY;

            if (!apiKey) {
                console.log('Gemini API key not found, using regex fallback');
                return null;
            }

            const prompt = `Categorize this expense: "${description}"
      
Return ONLY ONE category from this list: Food, Transport, Utilities, Entertainment, Shopping, Healthcare, Education, Other

Reply with just the category name, nothing else.`;

            const response = await axios.post(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
                {
                    contents: [{
                        parts: [{ text: prompt }]
                    }]
                }
            );

            const category = response.data.candidates[0].content.parts[0].text.trim();
            return category;

        } catch (error) {
            console.log('Gemini API error:', error.response?.data || error.message);
            return null;
        }
    },
}

module.exports = geminiService;