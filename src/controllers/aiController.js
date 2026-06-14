/**
 * AI Controller
 * Aarna AI-powered endpoints for solar recommendation and content generation.
 * Uses Google Gemini API under the hood.
 */

const { getModel, isConfigured } = require('../../config/gemini');

/**
 * POST /api/ai/recommend-system
 * AI-powered solar system recommendation based on customer profile.
 */
async function recommendSystem(req, res, next) {
  try {
    if (!isConfigured) {
      return res.status(503).json({ error: 'AI service not configured' });
    }

    const {
      gridStatus,
      backupNeed,
      capacityKwp,
      monthlyBill,
      location,
      installationType
    } = req.body;

    const model = getModel('gemini-1.5-flash');

    const prompt = `
You are an expert solar energy consultant for Aarna Solars & Services, a TATA Power SOLAROOF Authorized Partner in Madhya Pradesh, India.

Based on the following customer profile, recommend the BEST solar installation type (On-Grid, Off-Grid, or Hybrid) and provide a detailed explanation.

Customer Profile:
- Installation Type: ${installationType || 'Residential'}
- Grid Availability: ${gridStatus || 'reliable'}
- Battery Backup Need: ${backupNeed || 'no'}
- Proposed Capacity: ${capacityKwp || 5} kWp
- Average Monthly Bill: ₹${monthlyBill || 6500}
- Location: ${location || 'Madhya Pradesh'}

Respond ONLY in this JSON format:
{
  "recommendedSystem": "On-Grid|Off-Grid|Hybrid",
  "recommendedType": "e.g. Residential On-Grid",
  "confidence": "High|Medium|Low",
  "reasoning": "2-3 sentences explaining why",
  "benefits": ["benefit 1", "benefit 2", "benefit 3"],
  "considerations": ["consideration 1", "consideration 2"],
  "subsidyEligible": true|false,
  "estimatedPaybackYears": number
}
`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // Extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const recommendation = jsonMatch ? JSON.parse(jsonMatch[0]) : null;

    if (!recommendation) {
      return res.status(500).json({ error: 'Failed to parse AI response' });
    }

    res.json({
      success: true,
      source: 'aarna-ai',
      recommendation
    });
  } catch (error) {
    console.error('[AI] recommendSystem error:', error.message);
    next(error);
  }
}

/**
 * POST /api/ai/generate-quotation-text
 * AI-generated personalized quotation intro/letter content.
 */
async function generateQuotationText(req, res, next) {
  try {
    if (!isConfigured) {
      return res.status(503).json({ error: 'AI service not configured' });
    }

    const {
      customerName,
      location,
      systemType,
      capacityKwp,
      estimatedCost,
      subsidy,
      yearlySavings,
      paybackPeriod
    } = req.body;

    const model = getModel('gemini-1.5-flash');

    const prompt = `
You are a professional solar consultant at Aarna Solars & Services, a TATA Power SOLAROOF Authorized Partner in Satna, Madhya Pradesh, India.

Write a warm, professional, and persuasive 3-4 sentence paragraph for a solar proposal letter to a customer.

Customer Details:
- Name: ${customerName || 'Sir/Madam'}
- Location: ${location || 'Madhya Pradesh'}
- System: ${systemType || 'On-Grid Solar'} (${capacityKwp || 5} kWp)
- Estimated Cost: ₹${estimatedCost || '2,85,000'}
- Govt Subsidy: ₹${subsidy || '78,000'}
- Yearly Savings: ₹${yearlySavings || '75,600'}
- Payback Period: ${paybackPeriod || '4.5'} years

The tone should be welcoming, confident, and focused on value. Mention TATA Power SOLAROOF technology and 25-year warranty. Keep it under 80 words total.
`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    res.json({
      success: true,
      source: 'aarna-ai',
      content: text
    });
  } catch (error) {
    console.error('[AI] generateQuotationText error:', error.message);
    next(error);
  }
}

/**
 * POST /api/ai/lead-insights
 * AI-generated insights for a sales lead.
 */
async function generateLeadInsights(req, res, next) {
  try {
    if (!isConfigured) {
      return res.status(503).json({ error: 'AI service not configured' });
    }

    const { name, phone, location, serviceType, message, status } = req.body;

    const model = getModel('gemini-1.5-flash');

    const prompt = `
You are a solar sales expert at Aarna Solars & Services in Madhya Pradesh, India.
Analyze this lead and provide a brief insight.

Lead Information:
- Name: ${name || 'Unknown'}
- Location: ${location || 'Unknown'}
- Interested In: ${serviceType || 'Solar Installation'}
- Message: ${message || 'No message'}
- Current Status: ${status || 'New'}

Respond ONLY in this JSON format:
{
  "priorityScore": "High|Medium|Low",
  "sentiment": "Positive|Neutral|Needs Follow-up",
  "nextAction": "1-sentence recommended next step",
  "talkingPoints": ["point 1", "point 2"]
}
`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const insights = jsonMatch ? JSON.parse(jsonMatch[0]) : null;

    if (!insights) {
      return res.status(500).json({ error: 'Failed to parse AI response' });
    }

    res.json({
      success: true,
      source: 'aarna-ai',
      insights
    });
  } catch (error) {
    console.error('[AI] generateLeadInsights error:', error.message);
    next(error);
  }
}

module.exports = {
  recommendSystem,
  generateQuotationText,
  generateLeadInsights
};
