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
    <div className="container">
      <h1>AI Content Detector</h1>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste text to analyze for AI generation..."
      />
      <button onClick={analyzeText} disabled={loading || !text}>
        {loading ? 'Analyzing...' : 'Detect AI Content'}
      </button>
      
      {result && (
        <div className="result-box">
          <h3>Analysis Result:</h3>
          <p><strong>AI Probability:</strong> {result.aiProbability}%</p>
          <p><strong>Confidence Level:</strong> {result.confidence}</p>
          <p><strong>Text Length:</strong> {result.textLength} characters</p>
        </div>
      )}
    </div>
  );
}
