/**
 * AI Natural Language Processor for Financial Operations
 * Handles expense, income, budget, subscription, and goal parsing.
 * Supports rule-based pattern matching out of the box with optional Gemini LLM integration.
 */

const CATEGORY_KEYWORDS = {
  'Groceries': ['grocery', 'groceries', 'whole foods', 'trader joe', 'walmart', 'safeway', 'supermarket', 'market', 'produce', 'sprouts', 'costco', 'kroger', 'target food'],
  'Dining Out': ['dining out', 'dining', 'eating out', 'dinner', 'lunch', 'breakfast', 'brunch', 'coffee', 'cafe', 'restaurant', 'starbucks', 'chipotle', 'uber eats', 'doordash', 'grubhub', 'sushi', 'pizza', 'burger', 'bar', 'drinks', 'mcdonalds'],
  'Housing & Utilities': ['rent', 'mortgage', 'electric', 'electricity', 'water bill', 'power', 'coned', 'gas bill', 'internet', 'wifi', 'comcast', 'verizon', 'utility', 'utilities', 'hoa'],
  'Transportation': ['gas', 'fuel', 'petrol', 'shell', 'chevron', 'uber', 'lyft', 'subway', 'transit', 'metro', 'bus', 'parking', 'toll', 'train'],
  'Entertainment & Leisure': ['movie', 'cinema', 'netflix', 'spotify', 'hulu', 'disney', 'concert', 'gaming', 'steam', 'playstation', 'nintendo', 'ticket'],
  'Shopping': ['amazon', 'clothes', 'shoes', 'electronics', 'apparel', 'nordstrom', 'zara', 'h&m', 'mall', 'bought'],
  'Health & Wellness': ['gym', 'fitness', 'doctor', 'dentist', 'pharmacy', 'medicine', 'cvs', 'walgreens', 'equinox', 'yoga', 'workout'],
  'Work & Development': ['aws', 'hosting', 'github', 'software', 'domain', 'saas', 'office', 'books', 'course', 'udemy'],
  'Salary': ['salary', 'paycheck', 'direct deposit', 'wages', 'compensation'],
  'Freelance & Consulting': ['freelance', 'client', 'consulting', 'contract', 'gig', 'upwork', 'fiverr', 'invoice'],
  'Dividends & Yield': ['dividend', 'interest', 'yield', 'crypto staking', 'return', 'capital gain']
};

const parseNaturalLanguage = async (text, apiKey = null) => {
  if (!text || typeof text !== 'string') {
    throw new Error('Input text is required');
  }

  const cleanText = text.trim();

  // If Gemini API Key is provided, try LLM parsing first
  if (apiKey) {
    try {
      const llmResult = await parseWithGemini(cleanText, apiKey);
      if (llmResult) return llmResult;
    } catch (err) {
      console.warn('Gemini LLM parse fallback to rule-based parser:', err.message);
    }
  }

  // Robust Rule-Based Parser
  return parseWithRules(cleanText);
};

const parseWithRules = (text) => {
  const lower = text.toLowerCase();
  
  // 1. Detect Intent
  let intent = 'add_transaction';
  if (lower.startsWith('budget') || lower.includes('set budget') || lower.includes('budget for')) {
    intent = 'add_budget';
  } else if (lower.includes('subscribe') || lower.includes('subscription') || lower.includes('/mo') || lower.includes('per month')) {
    intent = 'add_subscription';
  } else if (lower.includes('save for') || lower.includes('savings goal') || lower.includes('target goal') || lower.includes('fund')) {
    intent = 'add_goal';
  }

  // 2. Extract Amount
  // Matches: $45.50, $45, 45.50 dollars, 45 bucks, etc.
  let amount = null;
  const currencyRegex = /(?:\$|usd\s*|dollars?\s*)?([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{1,2})?|[0-9]+(?:\.[0-9]{1,2})?)(?:\s*(?:dollars?|bucks|usd))?/i;
  const amountMatch = text.match(currencyRegex);
  if (amountMatch && amountMatch[1]) {
    const rawNum = amountMatch[1].replace(/,/g, '');
    const parsedVal = parseFloat(rawNum);
    if (!isNaN(parsedVal) && parsedVal > 0) {
      amount = parsedVal;
    }
  }

  // 3. Detect Type (income vs expense)
  let type = 'expense';
  const incomeKeywords = ['earned', 'received', 'salary', 'income', 'deposit', 'got paid', 'paycheck', 'dividend', 'revenue', 'sold'];
  if (incomeKeywords.some(w => lower.includes(w))) {
    type = 'income';
  }

  // 4. Detect Category
  let category = type === 'income' ? 'Salary' : 'General';
  let highestScore = 0;

  for (const [catName, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const kw of keywords) {
      if (lower.includes(kw)) {
        const score = kw.length; // prioritize longer, more specific matches
        if (score > highestScore) {
          highestScore = score;
          category = catName;
        }
      }
    }
  }

  // 5. Detect Date
  let date = new Date().toISOString().split('T')[0];
  if (lower.includes('yesterday')) {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    date = d.toISOString().split('T')[0];
  } else if (lower.includes('day before yesterday')) {
    const d = new Date();
    d.setDate(d.getDate() - 2);
    date = d.toISOString().split('T')[0];
  } else {
    // Check for "X days ago"
    const daysAgoMatch = lower.match(/(\d+)\s+days?\s+ago/);
    if (daysAgoMatch) {
      const days = parseInt(daysAgoMatch[1], 10);
      const d = new Date();
      d.setDate(d.getDate() - days);
      date = d.toISOString().split('T')[0];
    }
  }

  // 6. Extract Merchant / Entity
  let merchant = null;
  // Patterns like "at [Merchant]", "from [Merchant]", "to [Merchant]"
  const merchantMatch = text.match(/(?:at|from|to|for)\s+([A-Z][A-Za-z0-9'&.\s]+?)(?:\s+(?:yesterday|today|on|using|via|\$|\d)|$)/i);
  if (merchantMatch && merchantMatch[1]) {
    merchant = merchantMatch[1].trim();
  }

  if (!merchant) {
    // If no explicit preposition, try to look for brand names in keywords
    for (const keywords of Object.values(CATEGORY_KEYWORDS)) {
      for (const kw of keywords) {
        if (kw.includes(' ') || kw.length > 5) {
          if (lower.includes(kw)) {
            // Capitalize match
            merchant = kw.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
            break;
          }
        }
      }
      if (merchant) break;
    }
  }

  if (!merchant) {
    merchant = type === 'income' ? 'Client / Employer' : (category !== 'General' ? category : 'General Merchant');
  }

  // 7. Generate clean description
  let description = text;
  if (text.length > 100) {
    description = text.substring(0, 97) + '...';
  }

  return {
    success: true,
    intent,
    raw_query: text,
    extracted: {
      amount: amount !== null ? amount : 0,
      type,
      category,
      merchant,
      description,
      date,
      billing_cycle: intent === 'add_subscription' ? 'monthly' : undefined,
      target_amount: intent === 'add_goal' ? (amount || 1000) : undefined,
      monthly_limit: intent === 'add_budget' ? (amount || 500) : undefined
    },
    confidence: amount !== null ? 0.92 : 0.65,
    source: 'local_nlp_engine'
  };
};

const parseWithGemini = async (text, apiKey) => {
  // Direct HTTP call to Google Gemini Generative Language API
  const prompt = `
You are an expert financial ledger assistant. Parse the following user query into a JSON object:
Query: "${text}"

Schema expected:
{
  "intent": "add_transaction" | "add_budget" | "add_subscription" | "add_goal",
  "amount": number,
  "type": "expense" | "income",
  "category": "Groceries" | "Dining Out" | "Housing & Utilities" | "Transportation" | "Entertainment & Leisure" | "Shopping" | "Health & Wellness" | "Work & Development" | "Salary" | "Freelance & Consulting" | "Other",
  "merchant": string,
  "description": string,
  "date": "YYYY-MM-DD"
}
Return ONLY valid raw JSON with no markdown tags.
`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.1 }
    })
  });

  if (!response.ok) {
    throw new Error(`Gemini API error ${response.status}: ${await response.text()}`);
  }

  const data = await response.json();
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) throw new Error('Empty response from Gemini');

  const cleaned = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
  const parsed = JSON.parse(cleaned);

  return {
    success: true,
    intent: parsed.intent || 'add_transaction',
    raw_query: text,
    extracted: parsed,
    confidence: 0.98,
    source: 'gemini_ai_engine'
  };
};

module.exports = {
  parseNaturalLanguage,
  CATEGORY_KEYWORDS
};
