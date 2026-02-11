/**
 * ErrorBoundary Component Stories
 *
 * React error boundary for catching and displaying runtime errors.
 * Prevents entire application from crashing on component errors.
 */
import { ErrorBoundary } from './ErrorBoundary';

export default {
  title: 'States/ErrorBoundary',
  component: ErrorBoundary,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
## ErrorBoundary Component

A React class component that catches JavaScript errors in child components.
Displays a fallback UI instead of crashing the entire application.

### Features

- Catches rendering errors in child tree
- Logs errors to console
- Shows expandable error details
- Provides contact support messaging

### Usage

\`\`\`jsx
import { ErrorBoundary } from 'islands/shared/ErrorBoundary';

<ErrorBoundary>
  <ComponentThatMightError />
</ErrorBoundary>
\`\`\`

### When Errors Are Caught

The ErrorBoundary catches errors during:
- Rendering
- Lifecycle methods
- Constructors of child components

It does NOT catch:
- Event handlers
- Async code
- Server-side rendering
- Errors in the boundary itself
        `,
      },
    },
  },
};

// Working child (no error)
export const Working = {
  render: () => (
    <ErrorBoundary>
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2 style={{ color: '#22C55E' }}>Component is working!</h2>
        <p style={{ color: '#6b7280' }}>No errors detected.</p>
      </div>
    </ErrorBoundary>
  ),
  parameters: {
    docs: {
      description: {
        story: 'When children render successfully, they display normally.',
      },
    },
  },
};

// Simulated error display (for documentation)
export const ErrorDisplay = {
  render: () => (
    <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'sans-serif' }}>
      <h1 style={{ color: '#e53e3e' }}>Something went wrong</h1>
      <p>We couldn&apos;t load this page. Please refresh or contact support.</p>
      <details style={{ marginTop: '20px', textAlign: 'left' }}>
        <summary style={{ cursor: 'pointer' }}>Error Details</summary>
        <pre style={{ background: '#f3f4f6', padding: '12px', borderRadius: '6px', marginTop: '8px' }}>
          Error: Cannot read properties of undefined (reading &apos;map&apos;)
        </pre>
      </details>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Preview of the error UI shown when a child component throws.',
      },
    },
  },
};

// Error states gallery
export const ErrorStatesGallery = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
        <h4 style={{ marginBottom: '16px', color: '#31135D' }}>TypeError</h4>
        <div style={{ padding: '20px', textAlign: 'center', fontFamily: 'sans-serif' }}>
          <h1 style={{ color: '#e53e3e', fontSize: '24px' }}>Something went wrong</h1>
          <p style={{ color: '#6b7280' }}>We couldn&apos;t load this page. Please refresh or contact support.</p>
          <details style={{ marginTop: '16px', textAlign: 'left' }}>
            <summary style={{ cursor: 'pointer' }}>Error Details</summary>
            <pre style={{ background: '#f3f4f6', padding: '12px', borderRadius: '6px', marginTop: '8px', fontSize: '12px' }}>
              TypeError: Cannot read properties of undefined (reading &apos;map&apos;)
            </pre>
          </details>
        </div>
      </div>

      <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
        <h4 style={{ marginBottom: '16px', color: '#31135D' }}>ReferenceError</h4>
        <div style={{ padding: '20px', textAlign: 'center', fontFamily: 'sans-serif' }}>
          <h1 style={{ color: '#e53e3e', fontSize: '24px' }}>Something went wrong</h1>
          <p style={{ color: '#6b7280' }}>We couldn&apos;t load this page. Please refresh or contact support.</p>
          <details style={{ marginTop: '16px', textAlign: 'left' }}>
            <summary style={{ cursor: 'pointer' }}>Error Details</summary>
            <pre style={{ background: '#f3f4f6', padding: '12px', borderRadius: '6px', marginTop: '8px', fontSize: '12px' }}>
              ReferenceError: myVariable is not defined
            </pre>
          </details>
        </div>
      </div>

      <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
        <h4 style={{ marginBottom: '16px', color: '#31135D' }}>Network Error</h4>
        <div style={{ padding: '20px', textAlign: 'center', fontFamily: 'sans-serif' }}>
          <h1 style={{ color: '#e53e3e', fontSize: '24px' }}>Something went wrong</h1>
          <p style={{ color: '#6b7280' }}>We couldn&apos;t load this page. Please refresh or contact support.</p>
          <details style={{ marginTop: '16px', textAlign: 'left' }}>
            <summary style={{ cursor: 'pointer' }}>Error Details</summary>
            <pre style={{ background: '#f3f4f6', padding: '12px', borderRadius: '6px', marginTop: '8px', fontSize: '12px' }}>
              Error: Network request failed
            </pre>
          </details>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Gallery of common error types and their display.',
      },
    },
  },
};

// Usage example
export const UsageExample = {
  render: () => (
    <div style={{ padding: '24px' }}>
      <h3 style={{ marginBottom: '16px', color: '#31135D' }}>How to Use ErrorBoundary</h3>

      <div style={{ background: '#f3f4f6', padding: '16px', borderRadius: '8px', marginBottom: '24px' }}>
        <pre style={{ margin: 0, fontSize: '14px' }}>
{`import { ErrorBoundary } from 'islands/shared/ErrorBoundary';

// Wrap components that might throw
function App() {
  return (
    <ErrorBoundary>
      <Header />
      <ErrorBoundary>
        <MainContent />
      </ErrorBoundary>
      <Footer />
    </ErrorBoundary>
  );
}

// Nested boundaries allow partial failures
// If MainContent throws, Header and Footer still work`}
        </pre>
      </div>

      <h4 style={{ marginBottom: '12px', color: '#374151' }}>Best Practices</h4>
      <ul style={{ color: '#6b7280', lineHeight: '1.6' }}>
        <li>Wrap major page sections in separate boundaries</li>
        <li>Use at route level for full-page error handling</li>
        <li>Combine with logging service for production monitoring</li>
        <li>Provide &quot;retry&quot; or &quot;go home&quot; actions when possible</li>
      </ul>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Implementation guide and best practices.',
      },
    },
  },
};
