export default async function handler(req, res) {
  // If GET request, return environment info
  if (req.method === 'GET') {
    const hasApiKey = !!process.env.HUGGING_FACE_API_KEY;
    const keyPreview = process.env.HUGGING_FACE_API_KEY 
      ? process.env.HUGGING_FACE_API_KEY.substring(0, 8) + '...' 
      : 'NOT SET';
      
    return res.status(200).json({
      hasApiKey,
      keyPreview,
      environment: process.env.NODE_ENV
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const { text } = req.body;
  
  if (!text || text.length < 50) {
    return res.status(400).json({ error: 'Text must be at least 50 characters long' });
  }
  
  // Check if API key exists
  if (!process.env.HUGGING_FACE_API_KEY) {
    return res.status(500).json({ error: 'Hugging Face API key not configured' });
  }
  
  return res.status(200).json({
    message: "API key exists, but detection temporarily disabled for testing",
    textLength: text.length
  });
}
