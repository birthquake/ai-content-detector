import { useState } from 'react';

export default function Home() {
  const [text, setText] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const analyzeText = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/detect-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Error:', error);
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>AI Content Detector</h1>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste text to analyze..."
        style={{ width: '100%', height: '200px', marginBottom: '10px' }}
      />
      <button onClick={analyzeText} disabled={loading || !text}>
        {loading ? 'Analyzing...' : 'Detect AI Content'}
      </button>
      
      {result && (
        <div style={{ marginTop: '20px', padding: '10px', border: '1px solid #ccc' }}>
          <h3>Result:</h3>
          <p>AI Probability: {result.aiProbability}%</p>
          <p>Confidence: {result.confidence}</p>
        </div>
      )}
    </div>
  );
}
