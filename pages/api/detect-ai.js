export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const { text } = req.body;
  
  if (!text || text.length < 50) {
    return res.status(400).json({ error: 'Text must be at least 50 characters long' });
  }
  
  try {
    const aiProbability = await detectWithHuggingFace(text);
    const confidence = aiProbability > 70 ? 'High' : aiProbability > 40 ? 'Medium' : 'Low';
    
    // Add assessment based on AI probability
    let assessment;
    if (aiProbability >= 70) {
      assessment = 'Likely AI-generated';
    } else if (aiProbability >= 40) {
      assessment = 'Uncertain - mixed signals detected';
    } else {
      assessment = 'Likely human-written';
    }
    
    res.status(200).json({
      aiProbability: Math.round(aiProbability),
      confidence: confidence,
      assessment: assessment,
      textLength: text.length,
      model: 'Hugging Face OpenAI Detector'
    });
  } catch (error) {
    console.error('Detection error:', error);
    res.status(500).json({ 
      error: 'Analysis failed',
      details: error.message 
    });
  }
}

async function detectWithHuggingFace(text) {
  // Correct URL format with openai-community namespace
  const API_URL = 'https://api-inference.huggingface.co/models/openai-community/roberta-base-openai-detector';
  
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.HUGGING_FACE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      inputs: text,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Hugging Face API error: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  
  // The model returns: [{'label': 'Real', 'score': 0.8} or {'label': 'Fake', 'score': 0.2}]
  if (result && result[0]) {
    const fakeScore = result[0].find(item => item.label === 'Fake');
    return fakeScore ? fakeScore.score * 100 : 0;
  }
  
  return 0;
}
