export default async function handler(req, res) {
  console.log('API called with method:', req.method);
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const { text } = req.body;
  console.log('Text received, length:', text?.length);
  
  if (!text || text.length < 50) {
    return res.status(400).json({ error: 'Text must be at least 50 characters long' });
  }
  
  try {
    console.log('Calling detectWithHuggingFace...');
    const aiProbability = await detectWithHuggingFace(text);
    console.log('Got AI probability:', aiProbability);
    
    const confidence = aiProbability > 70 ? 'High' : aiProbability > 40 ? 'Medium' : 'Low';
    
    const response = {
      aiProbability: Math.round(aiProbability),
      confidence: confidence,
      textLength: text.length,
      model: 'Hugging Face AI Detection'
    };
    
    console.log('Sending response:', response);
    res.status(200).json(response);
  } catch (error) {
    console.error('Detection error:', error);
    res.status(500).json({ 
      error: 'Analysis failed',
      details: error.message 
    });
  }
}

async function detectWithHuggingFace(text) {
  console.log('Making HF API call...');
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

  console.log('HF Response status:', response.status);

  if (!response.ok) {
    const errorText = await response.text();
    console.log('HF Error response:', errorText);
    throw new Error(`Hugging Face API error: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  console.log('HF Raw result:', JSON.stringify(result, null, 2));
  
  // Handle different possible response formats
  if (Array.isArray(result) && result[0]) {
    console.log('Processing array result...');
    const chatgptScore = result[0].find(item => item.label === 'CHATGPT');
    console.log('Found CHATGPT score:', chatgptScore);
    return chatgptScore ? chatgptScore.score * 100 : 0;
  }
  
  console.log('No valid result found, returning 0');
  return 0;
}
