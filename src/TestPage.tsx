import React from 'react';

function TestPage() {
  console.log('TestPage rendered at:', new Date().toISOString());
  
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Minimal Test Page</h1>
      <p>Current time: {new Date().toLocaleTimeString()}</p>
      <p>If this page keeps refreshing, the issue is not with React components.</p>
      <button onClick={() => console.log('Button clicked')}>
        Test Button
      </button>
    </div>
  );
}

export default TestPage;