export default async function handler(req, res) {
  const hasApiKey = !!process.env.HUGGING_FACE_API_KEY;
  const keyPreview = process.env.HUGGING_FACE_API_KEY 
    ? process.env.HUGGING_FACE_API_KEY.substring(0, 8) + '...' 
    : 'NOT SET';
    
  res.status(200).json({
    hasApiKey,
    keyPreview,
    nodeVersion: process.version,
    environment: process.env.NODE_ENV
  });
}
