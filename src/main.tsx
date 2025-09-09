import React from 'react';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { telegramWebApp } from './lib/telegram';
import App from './App.tsx';
import './index.css';

// Error boundary to catch any rendering errors
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #7c3aed, #2563eb, #7c2d12)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontFamily: 'system-ui, sans-serif',
          textAlign: 'center',
          padding: '20px'
        }}>
          <div>
            <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Bear App</h1>
            <p>Something went wrong. Please refresh the page.</p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const root = createRoot(document.getElementById('root')!);

// Initialize Telegram Web App
if (window.Telegram?.WebApp) {
  window.Telegram.WebApp.ready();
  window.Telegram.WebApp.expand();
}

try {
  root.render(
    <StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </StrictMode>
  );
} catch (error) {
  console.error('Failed to render app:', error);
  // Fallback render
  document.getElementById('root')!.innerHTML = `
    <div style="min-height: 100vh; background: linear-gradient(135deg, #7c3aed, #2563eb, #7c2d12); display: flex; align-items: center; justify-content: center; color: white; font-family: system-ui, sans-serif; text-align: center; padding: 20px;">
      <div>
        <h1 style="font-size: 2rem; margin-bottom: 1rem;">Ad2Earn</h1>
        <p>Loading application...</p>
      </div>
    </div>
  `;
}
