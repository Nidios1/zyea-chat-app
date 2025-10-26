import React, { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';

function App() {
  useEffect(() => {
    console.log('🚀 App mounted!');
    console.log('📱 Platform:', Capacitor.getPlatform());
    console.log('🌐 Is Native:', Capacitor.isNativePlatform());
    
    // Hide splash screen
    if (Capacitor.isNativePlatform()) {
      setTimeout(() => {
        SplashScreen.hide({
          fadeOutDuration: 300
        }).catch(err => {
          console.error('Splash hide error:', err);
        });
      }, 500);
    }
  }, []);

  const handleTest = () => {
    alert('Button clicked! App is working!');
    console.log('✅ Button test passed');
  };

  const testAPI = async () => {
    try {
      const apiUrl = 'http://192.168.0.102:5000/api';
      console.log('🔌 Testing API:', apiUrl);
      
      const response = await fetch(`${apiUrl}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      alert(`API Response: ${JSON.stringify(data)}`);
      console.log('✅ API test passed:', data);
    } catch (error) {
      alert(`API Error: ${error.message}`);
      console.error('❌ API test failed:', error);
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      fontFamily: 'Arial, sans-serif',
      padding: '20px',
      textAlign: 'center'
    }}>
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        padding: '40px',
        borderRadius: '20px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
        color: '#333',
        maxWidth: '400px',
        width: '100%'
      }}>
        <h1 style={{ 
          fontSize: '2.5rem',
          margin: '0 0 10px 0',
          color: '#667eea'
        }}>
          ✅ Zyea+ Test
        </h1>
        
        <p style={{
          fontSize: '1.2rem',
          margin: '10px 0 30px 0',
          color: '#666'
        }}>
          If you see this, React is working!
        </p>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '15px'
        }}>
          <button 
            onClick={handleTest}
            style={{
              padding: '15px 30px',
              fontSize: '1.1rem',
              background: '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              fontWeight: 'bold',
              transition: 'all 0.3s ease'
            }}
            onMouseDown={(e) => e.target.style.transform = 'scale(0.95)'}
            onMouseUp={(e) => e.target.style.transform = 'scale(1)'}
          >
            🎯 Test Button
          </button>

          <button 
            onClick={testAPI}
            style={{
              padding: '15px 30px',
              fontSize: '1.1rem',
              background: '#764ba2',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              fontWeight: 'bold',
              transition: 'all 0.3s ease'
            }}
            onMouseDown={(e) => e.target.style.transform = 'scale(0.95)'}
            onMouseUp={(e) => e.target.style.transform = 'scale(1)'}
          >
            🔌 Test API Connection
          </button>
        </div>

        <div style={{
          marginTop: '30px',
          padding: '15px',
          background: '#f8f9fa',
          borderRadius: '10px',
          fontSize: '0.9rem',
          color: '#666'
        }}>
          <p style={{ margin: '5px 0' }}>
            <strong>Platform:</strong> {Capacitor.getPlatform()}
          </p>
          <p style={{ margin: '5px 0' }}>
            <strong>Native:</strong> {Capacitor.isNativePlatform() ? 'Yes' : 'No'}
          </p>
          <p style={{ margin: '5px 0' }}>
            <strong>API URL:</strong> 192.168.0.102:5000
          </p>
        </div>
      </div>

      <div style={{
        marginTop: '20px',
        fontSize: '0.9rem',
        opacity: 0.8
      }}>
        <p>Check console for logs (if accessible)</p>
      </div>
    </div>
  );
}

export default App;


import { Capacitor } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';

function App() {
  useEffect(() => {
    console.log('🚀 App mounted!');
    console.log('📱 Platform:', Capacitor.getPlatform());
    console.log('🌐 Is Native:', Capacitor.isNativePlatform());
    
    // Hide splash screen
    if (Capacitor.isNativePlatform()) {
      setTimeout(() => {
        SplashScreen.hide({
          fadeOutDuration: 300
        }).catch(err => {
          console.error('Splash hide error:', err);
        });
      }, 500);
    }
  }, []);

  const handleTest = () => {
    alert('Button clicked! App is working!');
    console.log('✅ Button test passed');
  };

  const testAPI = async () => {
    try {
      const apiUrl = 'http://192.168.0.102:5000/api';
      console.log('🔌 Testing API:', apiUrl);
      
      const response = await fetch(`${apiUrl}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      alert(`API Response: ${JSON.stringify(data)}`);
      console.log('✅ API test passed:', data);
    } catch (error) {
      alert(`API Error: ${error.message}`);
      console.error('❌ API test failed:', error);
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      fontFamily: 'Arial, sans-serif',
      padding: '20px',
      textAlign: 'center'
    }}>
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        padding: '40px',
        borderRadius: '20px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
        color: '#333',
        maxWidth: '400px',
        width: '100%'
      }}>
        <h1 style={{ 
          fontSize: '2.5rem',
          margin: '0 0 10px 0',
          color: '#667eea'
        }}>
          ✅ Zyea+ Test
        </h1>
        
        <p style={{
          fontSize: '1.2rem',
          margin: '10px 0 30px 0',
          color: '#666'
        }}>
          If you see this, React is working!
        </p>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '15px'
        }}>
          <button 
            onClick={handleTest}
            style={{
              padding: '15px 30px',
              fontSize: '1.1rem',
              background: '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              fontWeight: 'bold',
              transition: 'all 0.3s ease'
            }}
            onMouseDown={(e) => e.target.style.transform = 'scale(0.95)'}
            onMouseUp={(e) => e.target.style.transform = 'scale(1)'}
          >
            🎯 Test Button
          </button>

          <button 
            onClick={testAPI}
            style={{
              padding: '15px 30px',
              fontSize: '1.1rem',
              background: '#764ba2',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              fontWeight: 'bold',
              transition: 'all 0.3s ease'
            }}
            onMouseDown={(e) => e.target.style.transform = 'scale(0.95)'}
            onMouseUp={(e) => e.target.style.transform = 'scale(1)'}
          >
            🔌 Test API Connection
          </button>
        </div>

        <div style={{
          marginTop: '30px',
          padding: '15px',
          background: '#f8f9fa',
          borderRadius: '10px',
          fontSize: '0.9rem',
          color: '#666'
        }}>
          <p style={{ margin: '5px 0' }}>
            <strong>Platform:</strong> {Capacitor.getPlatform()}
          </p>
          <p style={{ margin: '5px 0' }}>
            <strong>Native:</strong> {Capacitor.isNativePlatform() ? 'Yes' : 'No'}
          </p>
          <p style={{ margin: '5px 0' }}>
            <strong>API URL:</strong> 192.168.0.102:5000
          </p>
        </div>
      </div>

      <div style={{
        marginTop: '20px',
        fontSize: '0.9rem',
        opacity: 0.8
      }}>
        <p>Check console for logs (if accessible)</p>
      </div>
    </div>
  );
}

export default App;

