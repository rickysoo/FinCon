// Vercel serverless function to securely proxy OpenAI API calls
// This keeps the API key secure on the server side

// Simple in-memory rate limiting (resets on function cold start)
const requestCounts = new Map();
const RATE_LIMIT = 10; // requests per IP per hour
const RATE_WINDOW = 60 * 60 * 1000; // 1 hour in ms

function isRateLimited(ip) {
    const now = Date.now();
    const userRequests = requestCounts.get(ip) || { count: 0, resetTime: now + RATE_WINDOW };
    
    if (now > userRequests.resetTime) {
        // Reset counter if window has passed
        userRequests.count = 0;
        userRequests.resetTime = now + RATE_WINDOW;
    }
    
    if (userRequests.count >= RATE_LIMIT) {
        return true;
    }
    
    userRequests.count++;
    requestCounts.set(ip, userRequests);
    return false;
}

export default async function handler(req, res) {
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'POST');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        return res.status(200).end();
    }

    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Basic rate limiting
    const clientIP = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.connection.remoteAddress || 'unknown';
    if (isRateLimited(clientIP)) {
        return res.status(429).json({ error: 'Rate limit exceeded. Please try again later.' });
    }

    try {
        const { calculationType, data } = req.body;

        // Validate required fields
        if (!calculationType || !data) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Validate calculation type
        if (!['retirement', 'loan'].includes(calculationType)) {
            return res.status(400).json({ error: 'Invalid calculation type' });
        }

        // Get API key from environment variables
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            console.error('OpenAI API key not configured');
            return res.status(500).json({ error: 'Service configuration error' });
        }

        // Create prompt based on calculation type
        const prompt = createPromptForCalculation(calculationType, data);

        // Call OpenAI API
        const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a friendly Malaysian financial advisor. Write ONLY in proper English using simple HTML tags (h3, strong, ul, li, p). Keep explanations SHORT and COMPACT - avoid extra spacing or line breaks. Use Malaysian financial context and investment options. Do NOT include ```html code blocks or local slang words. Always end with a disclaimer about consulting a financial planner. Use professional, clear English throughout. Format as compact lists with minimal spacing.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: 400,
                temperature: 0.7
            })
        });

        if (!openaiResponse.ok) {
            const errorData = await openaiResponse.text();
            console.error('OpenAI API error:', openaiResponse.status, errorData);
            return res.status(500).json({ error: 'AI service temporarily unavailable' });
        }

        const result = await openaiResponse.json();
        const explanation = result.choices?.[0]?.message?.content;

        if (!explanation) {
            return res.status(500).json({ error: 'No explanation generated' });
        }

        return res.status(200).json({ explanation });

    } catch (error) {
        console.error('Server error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

// Create prompts for different calculation types
function createPromptForCalculation(type, data) {
    if (type === 'retirement') {
        const savingsPercentage = ((data.monthlySavingsRequired / data.monthlyExpenses) * 100).toFixed(1);
        return `Provide a SHORT retirement analysis for a ${data.currentAge}-year-old Malaysian planning to retire at ${data.retirementAge}.

Key numbers:
- Monthly savings needed: RM${Math.round(data.monthlySavingsRequired).toLocaleString()} (${savingsPercentage}% of current RM${data.monthlyExpenses.toLocaleString()} expenses)
- Retirement corpus target: RM${Math.round(data.corpusNeeded).toLocaleString()}

Format with HTML tags. Include:
- Quick assessment of the savings challenge
- 2-3 specific Malaysian investment tips (EPF, ASB, unit trusts)
- One actionable next step
- Financial planner consultation disclaimer

Keep it under 250 words with an encouraging, professional tone in proper English.`;
    } else if (type === 'loan') {
        const interestPercentage = (data.totalInterest / data.loanAmount * 100).toFixed(1);
        return `Provide a SHORT loan analysis for a Malaysian borrower.

Key numbers:
- Loan: RM${data.loanAmount.toLocaleString()} at ${data.interestRate}% for ${data.loanTermYears} years
- Monthly payment: RM${Math.round(data.monthlyPayment).toLocaleString()}
- Total interest: RM${Math.round(data.totalInterest).toLocaleString()} (${interestPercentage}% extra cost)

Format with HTML tags. Include:
- Quick assessment if this is reasonable for Malaysian standards
- 2-3 specific tips to reduce interest (early payment, refinancing)
- One budget management tip
- Financial planner consultation disclaimer

Keep it under 250 words with a practical, professional tone in proper English.`;
    }
}