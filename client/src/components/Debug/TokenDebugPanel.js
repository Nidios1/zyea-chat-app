import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

const DebugPanel = styled.div`
  position: fixed;
  top: 10px;
  right: 10px;
  background: rgba(0, 0, 0, 0.9);
  color: white;
  padding: 15px;
  border-radius: 8px;
  font-family: monospace;
  font-size: 12px;
  z-index: 99999;
  max-width: 400px;
  max-height: 500px;
  overflow-y: auto;
  
  h3 {
    margin: 0 0 10px 0;
    color: #4CAF50;
  }
  
  .status {
    margin: 5px 0;
    padding: 5px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
  }
  
  .key {
    color: #64B5F6;
  }
  
  .value {
    color: #81C784;
    word-break: break-all;
  }
  
  button {
    background: #2196F3;
    color: white;
    border: none;
    padding: 5px 10px;
    border-radius: 4px;
    cursor: pointer;
    margin: 5px 5px 5px 0;
  }
  
  button:hover {
    background: #1976D2;
  }
`;

const TokenDebugPanel = () => {
  const [show, setShow] = useState(false);
  const [debugInfo, setDebugInfo] = useState({});

  useEffect(() => {
    const updateDebugInfo = () => {
      const token = localStorage.getItem('token');
      const allKeys = Object.keys(localStorage);
      
      setDebugInfo({
        hasToken: !!token,
        tokenLength: token?.length || 0,
        tokenPreview: token?.substring(0, 30) || 'None',
        totalKeys: allKeys.length,
        allKeys: allKeys,
        timestamp: new Date().toLocaleTimeString()
      });
    };

    updateDebugInfo();
    const interval = setInterval(updateDebugInfo, 1000);
    
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleClearToken = () => {
    localStorage.removeItem('token');
    setDebugInfo({ ...debugInfo, hasToken: false });
  };

  if (!show) {
    return (
      <button 
        onClick={() => setShow(true)}
        style={{
          position: 'fixed',
          top: '10px',
          right: '10px',
          background: '#2196F3',
          color: 'white',
          border: 'none',
          padding: '10px',
          borderRadius: '4px',
          cursor: 'pointer',
          zIndex: 99999
        }}
      >
        🐛 Debug
      </button>
    );
  }

  return (
    <DebugPanel>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <h3>🐛 Token Debug Panel</h3>
        <button onClick={() => setShow(false)}>✖</button>
      </div>
      
      <div className="status">
        <div className="key">Time:</div>
        <div className="value">{debugInfo.timestamp}</div>
      </div>
      
      <div className="status">
        <div className="key">Has Token:</div>
        <div className="value">{debugInfo.hasToken ? '✅ YES' : '❌ NO'}</div>
      </div>
      
      <div className="status">
        <div className="key">Token Length:</div>
        <div className="value">{debugInfo.tokenLength}</div>
      </div>
      
      <div className="status">
        <div className="key">Token Preview:</div>
        <div className="value">{debugInfo.tokenPreview}</div>
      </div>
      
      <div className="status">
        <div className="key">Total localStorage Keys:</div>
        <div className="value">{debugInfo.totalKeys}</div>
      </div>
      
      <div className="status">
        <div className="key">All Keys:</div>
        <div className="value">{debugInfo.allKeys?.join(', ')}</div>
      </div>
      
      <div style={{ marginTop: '10px', display: 'flex', gap: '5px' }}>
        <button onClick={handleRefresh}>🔄 Refresh</button>
        <button onClick={handleClearToken}>🗑️ Clear Token</button>
      </div>
      
      <div style={{ marginTop: '10px', fontSize: '10px', color: '#999' }}>
        Open console (F12) to see detailed logs
      </div>
    </DebugPanel>
  );
};

export default TokenDebugPanel;

