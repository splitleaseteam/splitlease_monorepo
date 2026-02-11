import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('React Error Boundary caught error:', error, errorInfo);
  }

  handleReload() {
    window.location.reload();
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'sans-serif' }} role="alert">
          <h1 style={{ color: '#e53e3e' }}>Something went wrong. Please try again.</h1>
          <button
            type="button"
            onClick={this.handleReload}
            style={{
              marginTop: '16px',
              padding: '10px 16px',
              borderRadius: '8px',
              border: '1px solid #d1d5db',
              background: '#ffffff',
              cursor: 'pointer'
            }}
          >
            Reload
          </button>
          {this.state.error && (
            <details style={{ marginTop: '20px', textAlign: 'left' }}>
              <summary>Error Details</summary>
              <pre>{this.state.error.toString()}</pre>
            </details>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}
