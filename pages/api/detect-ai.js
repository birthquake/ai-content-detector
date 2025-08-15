export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { text } = req.body;

  if (!text || text.length < 10) {
    return res.status(400).json({ error: 'Text too short to analyze' });
  }

  try {
    // Simple AI detection logic (we'll improve this later)
    const aiProbability = calculateAIProbability(text);
    const confidence = aiProbability > 70 ? 'High' : aiProbability > 40 ? 'Medium' : 'Low';

    res.status(200).json({
      aiProbability: Math.round(aiProbability),
      confidence: confidence,
      textLength: text.length
    });
  } catch (error) {
    res.status(500).json({ error: 'Analysis failed' });
  }
}

function calculateAIProbability(text) {
  // Basic heuristic - we'll replace this with real AI detection later
  let score = 0;
  
  // Check for AI-like patterns
  if (text.includes('As an AI') || text.includes('I apologize')) score += 30;
  if (text.split('.').length > 10) score += 20; // Long sentences
  if (text.includes('Furthermore') || text.includes('Moreover')) score += 15;
  if (text.split(' ').length > 100) score += 10; // Length factor
  
  return Math.min(score, 95); // Cap at 95%
}
