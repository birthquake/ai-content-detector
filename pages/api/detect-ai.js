export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { text } = req.body;
  if (!text || text.length < 50) {
    return res.status(400).json({ error: 'Text must be at least 50 characters long' });
  }
  try {
    // Use Hugging Face AI detection model
    const aiProbability = await detectWithHuggingFace(text);
    const confidence = aiProbability > 70 ? 'High' : aiProbability > 40 ? 'Medium' : 'Low';
    res.status(200).json({
      aiProbability: Math.round(aiProbability),
      confidence: confidence,
      textLength: text.length,
      model: 'Hugging Face AI Detection'
    });
  } catch (error) {
    console.error('Detection error:', error);
    res.status(500).json({ error: 'Analysis failed' });
  }
}

async function detectWithHuggingFace(text) {
  // Try a more modern AI detection model
  const API_URL = 'https://api-inference.huggingface.co/models/Hello-SimpleAI/chatgpt-detector-roberta';
  
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
    throw new Error(`Hugging Face API error: ${response.status}`);
  }
  const result = await response.json();
  
  // This model returns 'HUMAN' and 'CHATGPT' labels
  if (result && result[0]) {
    const chatgptScore = result[0].find(item => item.label === 'CHATGPT');
    return chatgptScore ? chatgptScore.score * 100 : 0;
  }
  
  return 0;
}
