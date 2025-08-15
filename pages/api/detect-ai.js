export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const { text } = req.body;
  
  if (!text || text.length < 50) {
    return res.status(400).json({ error: 'Text must be at least 50 characters long' });
  }
  
  try {
    const rawResult = await callHuggingFaceDebug(text);
    
    // Return both the raw result and our attempt to parse it
    res.status(200).json({
      debug: true,
      rawHuggingFaceResponse: rawResult,
      responseType: typeof rawResult,
      isArray: Array.isArray(rawResult),
      textLength: text.length,
      message: "This is the raw response from Hugging Face"
    });
  } catch (error) {
    console.error('Detection error:', error);
    res.status(500).json({ 
      error: 'Analysis failed',
      details: error.message 
    });
  }
}

async function callHuggingFaceDebug(text) {
  const API_URL = 'https://api-inference.huggingface.co/models/roberta-base-openai-detector';
  
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
  
  // Log to server console too
  console.log('Hugging Face Raw Response:');
  console.log(JSON.stringify(result, null, 2));
  
  return result;
}
