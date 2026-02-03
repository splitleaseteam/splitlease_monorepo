import React, { useState, useCallback } from 'react';
import { createRoot } from 'react-dom/client';

// ============================================
// SAMPLE PAYLOADS (from PythonAnywhere test_config.py)
// ============================================

const SAMPLE_PAYLOADS = {
  generate_host_payout: {
    "Address": "123 Main St, New York, NY 10001",
    "Agreement Number": "AGR-TEST-001",
    "Date1": "2024-01-15",
    "Date2": "2024-02-15",
    "Date3": "2024-03-15",
    "Date4": "2024-04-15",
    "Date5": "2024-05-15",
    "Date6": "2024-06-15",
    "Date7": "2024-07-15",
    "Date8": "2024-08-15",
    "Date9": "2024-09-15",
    "Date10": "2024-10-15",
    "Date11": "2024-11-15",
    "Date12": "2024-12-15",
    "Date13": "2025-01-15",
    "Host Email": "testhost@example.com",
    "Host Name": "John Test Host",
    "Host Phone": "555-123-4567",
    "Maintenance Fee": "$100",
    "Payout Number": "PAY-TEST-001",
    "Rent1": "$1000",
    "Rent2": "$1000",
    "Rent3": "$1000",
    "Rent4": "$1000",
    "Rent5": "$1000",
    "Rent6": "$1000",
    "Rent7": "$1000",
    "Rent8": "$1000",
    "Rent9": "$1000",
    "Rent10": "$1000",
    "Rent11": "$1000",
    "Rent12": "$1000",
    "Rent13": "$1000",
    "Total1": "$1100",
    "Total2": "$1100",
    "Total3": "$1100",
    "Total4": "$1100",
    "Total5": "$1100",
    "Total6": "$1100",
    "Total7": "$1100",
    "Total8": "$1100",
    "Total9": "$1100",
    "Total10": "$1100",
    "Total11": "$1100",
    "Total12": "$1100",
    "Total13": "$1100",
    "TotalHostPayments": "$14300"
  },

  generate_periodic_tenancy: {
    "Agreement Number": "AGR-TEST-002",
    "Check in Date": "01/15/24",
    "Check Out Date": "04/15/24",
    "Check In Day": "Monday",
    "Check Out Day": "Monday",
    "Number of weeks": 13,
    "Guests Allowed": 2,
    "Host name": "John Test Host",
    "Guest name": "Jane Test Guest",
    "Supplemental Number": "SUP-TEST-001",
    "Authorization Card Number": "AUTH-TEST-001",
    "Host Payout Schedule Number": "PAY-TEST-001",
    "Extra Requests on Cancellation Policy": "Full refund if cancelled 14 days before check-in",
    "Damage Deposit": "$500",
    "Location": "Manhattan, New York",
    "Type of Space": "Private Room",
    "House Rules": [
      "No smoking",
      "No pets",
      "No parties or events",
      "Quiet hours 10 PM - 8 AM",
      "No shoes inside"
    ],
    "Listing Title": "Cozy Private Room in Manhattan",
    "Listing Description": "Enjoy a comfortable stay in our well-appointed private room located in the heart of Manhattan. Walking distance to subway stations and local attractions.",
    "Capacity": "1 Bedroom",
    "Amenity In Unit": [
      "Wi-Fi",
      "Air Conditioning",
      "Heating",
      "TV",
      "Desk/Workspace"
    ],
    "Amenity Building": [
      "Elevator",
      "Laundry Room",
      "Doorman"
    ],
    "Space Details": "Private"
  },

  generate_supplemental: {
    "Agreement Number": "AGR-TEST-003",
    "Check in Date": "01/15/24",
    "Check Out Date": "04/15/24",
    "Number of weeks": 13,
    "Guests Allowed": 2,
    "Host Name": "John Test Host",
    "Supplemental Number": "SUP-TEST-002",
    "Location": "Brooklyn, New York",
    "Type of Space": "Entire Apartment",
    "Listing Title": "Modern 2BR Apartment in Brooklyn",
    "Listing Description": "Spacious 2-bedroom apartment with stunning city views. Fully equipped kitchen, comfortable living space, and easy access to public transportation.",
    "Space Details": "2 Bedrooms, 1 Bathroom",
    "image1": "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800",
    "image2": "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800",
    "image3": "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800"
  },

  generate_credit_card_auth: {
    "Agreement Number": "AGR-TEST-004",
    "Host Name": "John Test Host",
    "Guest Name": "Jane Test Guest",
    "Weeks Number": "16",
    "Listing Description": "Cozy 2-bedroom apartment in downtown Manhattan",
    "Number of Payments": "4",
    "Four Week Rent": "2000.00",
    "Damage Deposit": "1000.00",
    "Maintenance Fee": "50.00",
    "Total First Payment": "3050.00",
    "Penultimate Week Number": "15",
    "Total Second Payment": "2050.00",
    "Last Payment Rent": "500.00",
    "Splitlease Credit": "100.00",
    "Last Payment Weeks": 4,
    "Is Prorated": true
  },

  generate_all: {
    "leaseId": "test-lease-id-123",
    "agreementNumber": "AGR-TEST-ALL",
    "hostPayoutData": {
      "Address": "456 Test Ave, Brooklyn, NY 11201",
      "Host Name": "Test Host",
      "Host Email": "host@test.com",
      "Host Phone": "555-000-1234"
    },
    "periodicTenancyData": {
      "Guest name": "Test Guest",
      "Location": "Brooklyn"
    },
    "supplementalData": {
      "Listing Title": "Test Listing"
    },
    "creditCardAuthData": {
      "Is Prorated": false
    }
  }
};

const ACTION_DESCRIPTIONS = {
  generate_host_payout: 'Host Payout Schedule Form',
  generate_periodic_tenancy: 'Periodic Tenancy Agreement',
  generate_supplemental: 'Supplemental Agreement',
  generate_credit_card_auth: 'Credit Card Authorization Form',
  generate_all: 'Generate All 4 Documents'
};

// ============================================
// ENVIRONMENT CONFIGURATION
// ============================================

// Anon keys for Supabase Edge Functions (public, safe for client)
const DEV_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF6c21oZ3lvam13dnRqbW5yZGVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5NTE2NDksImV4cCI6MjA4MzUyNzY0OX0.cSPOwU1wyiBorIicEGoyDEmoh34G0Hf_39bRXkwvCDc';
const PROD_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJxd3J2a2tmaXhyb2d4b2d1bnNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTcxMjEyMDIsImV4cCI6MjAzMjY5NzIwMn0.RLdus5-mCJZGKI1UT5LvOKEIlqhq6oqLbCYWyDwIKPg';

const ENVIRONMENTS = {
  development: {
    name: 'Development',
    url: 'https://qzsmhgyojmwvtjmnrdea.supabase.co/functions/v1/lease-documents',
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || DEV_ANON_KEY,
    color: '#22c55e'
  },
  production: {
    name: 'Production',
    url: 'https://rqwrvkkfixrogxogunsk.supabase.co/functions/v1/lease-documents',
    anonKey: PROD_ANON_KEY,
    color: '#ef4444'
  }
};

// ============================================
// STYLES
// ============================================

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '24px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  header: {
    marginBottom: '32px'
  },
  title: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: '8px'
  },
  subtitle: {
    fontSize: '14px',
    color: '#6b7280'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '24px'
  },
  panel: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
    padding: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  },
  panelTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  label: {
    display: 'block',
    fontSize: '13px',
    fontWeight: '500',
    color: '#4b5563',
    marginBottom: '6px'
  },
  select: {
    width: '100%',
    padding: '10px 12px',
    fontSize: '14px',
    borderRadius: '8px',
    border: '1px solid #d1d5db',
    backgroundColor: '#fff',
    cursor: 'pointer',
    marginBottom: '16px'
  },
  textarea: {
    width: '100%',
    minHeight: '400px',
    padding: '12px',
    fontSize: '12px',
    fontFamily: 'Monaco, Consolas, "Courier New", monospace',
    borderRadius: '8px',
    border: '1px solid #d1d5db',
    backgroundColor: '#f9fafb',
    resize: 'vertical',
    boxSizing: 'border-box'
  },
  button: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: '600',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  primaryButton: {
    backgroundColor: '#3b82f6',
    color: '#ffffff'
  },
  disabledButton: {
    backgroundColor: '#9ca3af',
    color: '#ffffff',
    cursor: 'not-allowed'
  },
  envBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 12px',
    fontSize: '12px',
    fontWeight: '600',
    borderRadius: '9999px',
    marginLeft: '12px'
  },
  responsePanel: {
    backgroundColor: '#1f2937',
    borderRadius: '8px',
    padding: '16px',
    minHeight: '300px',
    overflow: 'auto'
  },
  responseToolbar: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginBottom: '8px'
  },
  copyButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 10px',
    fontSize: '12px',
    fontWeight: '600',
    borderRadius: '6px',
    border: '1px solid #374151',
    backgroundColor: '#111827',
    color: '#e5e7eb',
    cursor: 'pointer'
  },
  responseText: {
    fontFamily: 'Monaco, Consolas, "Courier New", monospace',
    fontSize: '12px',
    color: '#e5e7eb',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word'
  },
  successText: {
    color: '#4ade80'
  },
  errorText: {
    color: '#f87171'
  },
  linkButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 16px',
    fontSize: '13px',
    fontWeight: '500',
    borderRadius: '6px',
    border: 'none',
    backgroundColor: '#dbeafe',
    color: '#1d4ed8',
    cursor: 'pointer',
    textDecoration: 'none',
    marginTop: '12px'
  },
  statusBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    backgroundColor: '#f3f4f6',
    borderRadius: '8px',
    marginBottom: '16px'
  },
  statusItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px',
    color: '#4b5563'
  }
};

// ============================================
// MAIN COMPONENT
// ============================================

function TestContractsPage() {
  const [environment, setEnvironment] = useState('development');
  const [action, setAction] = useState('generate_host_payout');
  const [payload, setPayload] = useState(JSON.stringify(SAMPLE_PAYLOADS.generate_host_payout, null, 2));
  const [response, setResponse] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [responseTime, setResponseTime] = useState(null);
  const [copyStatus, setCopyStatus] = useState('Copy JSON');

  const handleActionChange = useCallback((e) => {
    const newAction = e.target.value;
    setAction(newAction);
    setPayload(JSON.stringify(SAMPLE_PAYLOADS[newAction], null, 2));
    setResponse(null);
    setResponseTime(null);
  }, []);

  const handleEnvironmentChange = useCallback((e) => {
    setEnvironment(e.target.value);
    setResponse(null);
    setResponseTime(null);
  }, []);

  const handleExecute = useCallback(async () => {
    setCopyStatus('Copy JSON');
    setIsLoading(true);
    setResponse(null);
    setResponseTime(null);

    const startTime = performance.now();

    try {
      let parsedPayload;
      try {
        parsedPayload = JSON.parse(payload);
      } catch (parseError) {
        throw new Error(`Invalid JSON: ${parseError.message}`);
      }

      const env = ENVIRONMENTS[environment];
      const requestBody = {
        action,
        payload: parsedPayload
      };

      console.log(`[TestContracts] Calling ${env.name}: ${action}`);
      console.log('[TestContracts] Request:', requestBody);

      const res = await fetch(env.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${env.anonKey}`,
          'apikey': env.anonKey
        },
        body: JSON.stringify(requestBody)
      });

      const endTime = performance.now();
      setResponseTime(Math.round(endTime - startTime));

      const data = await res.json();

      setResponse({
        success: res.ok,
        status: res.status,
        data
      });

      console.log('[TestContracts] Response:', data);

    } catch (error) {
      const endTime = performance.now();
      setResponseTime(Math.round(endTime - startTime));

      setResponse({
        success: false,
        status: 0,
        data: {
          error: error.message
        }
      });

      console.error('[TestContracts] Error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [environment, action, payload]);

  const handleCopyResponse = useCallback(async () => {
    if (!response) {
      return;
    }

    try {
      const json = JSON.stringify(response.data, null, 2);
      await navigator.clipboard.writeText(json);
      setCopyStatus('Copied');
    } catch (error) {
      setCopyStatus('Copy failed');
    }

    window.setTimeout(() => {
      setCopyStatus('Copy JSON');
    }, 1500);
  }, [response]);

  const env = ENVIRONMENTS[environment];

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>
          Contract Generator Test
          <span
            style={{
              ...styles.envBadge,
              backgroundColor: env.color + '20',
              color: env.color
            }}
          >
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: env.color
            }} />
            {env.name}
          </span>
        </h1>
        <p style={styles.subtitle}>
          Test the lease-documents Edge Function with sample payloads
        </p>
      </div>

      {/* Status Bar */}
      <div style={styles.statusBar}>
        <div style={styles.statusItem}>
          <strong>Endpoint:</strong>
          <code style={{ fontSize: '12px', color: '#1f2937' }}>{env.url}</code>
        </div>
        {responseTime && (
          <div style={styles.statusItem}>
            <strong>Response Time:</strong>
            <span>{responseTime}ms</span>
          </div>
        )}
      </div>

      {/* Main Grid */}
      <div style={styles.grid}>
        {/* Left Panel - Request */}
        <div style={styles.panel}>
          <h2 style={styles.panelTitle}>Request Configuration</h2>

          {/* Environment Selector */}
          <label style={styles.label}>Environment</label>
          <select
            style={styles.select}
            value={environment}
            onChange={handleEnvironmentChange}
          >
            <option value="development">Development (splitlease-backend-dev)</option>
            <option value="production">Production (splitlease-backend-live)</option>
          </select>

          {/* Action Selector */}
          <label style={styles.label}>Action</label>
          <select
            style={styles.select}
            value={action}
            onChange={handleActionChange}
          >
            {Object.entries(ACTION_DESCRIPTIONS).map(([key, description]) => (
              <option key={key} value={key}>
                {key} - {description}
              </option>
            ))}
          </select>

          {/* Payload Editor */}
          <label style={styles.label}>Payload (JSON)</label>
          <textarea
            style={styles.textarea}
            value={payload}
            onChange={(e) => setPayload(e.target.value)}
            spellCheck={false}
          />

          {/* Execute Button */}
          <div style={{ marginTop: '16px' }}>
            <button
              style={{
                ...styles.button,
                ...(isLoading ? styles.disabledButton : styles.primaryButton)
              }}
              onClick={handleExecute}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span style={{ animation: 'spin 1s linear infinite' }}>...</span>
                  Generating...
                </>
              ) : (
                <>
                  Generate Document
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Panel - Response */}
        <div style={styles.panel}>
          <h2 style={styles.panelTitle}>Response</h2>

          <div style={styles.responsePanel}>
            {response && (
              <div style={styles.responseToolbar}>
                <button type="button" style={styles.copyButton} onClick={handleCopyResponse}>
                  {copyStatus}
                </button>
              </div>
            )}
            {!response && !isLoading && (
              <p style={{ ...styles.responseText, color: '#9ca3af' }}>
                Click "Generate Document" to see the response...
              </p>
            )}

            {isLoading && (
              <p style={{ ...styles.responseText, color: '#fbbf24' }}>
                Generating document...
              </p>
            )}

            {response && (
              <>
                <p style={{
                  ...styles.responseText,
                  ...(response.success ? styles.successText : styles.errorText),
                  marginBottom: '12px'
                }}>
                  Status: {response.status} {response.success ? 'OK' : 'Error'}
                </p>
                <pre style={styles.responseText}>
                  {JSON.stringify(response.data, null, 2)}
                </pre>
              </>
            )}
          </div>

          {/* Drive Link */}
          {response?.success && response?.data?.data?.driveUrl && (
            <a
              href={response.data.data.driveUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={styles.linkButton}
            >
              Open in Google Drive
            </a>
          )}

          {/* Multiple Drive Links for generate_all */}
          {response?.success && response?.data?.data?.documents && (
            <div style={{ marginTop: '12px' }}>
              <p style={{ fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                Generated Documents:
              </p>
              {response.data.data.documents.map((doc, index) => (
                <a
                  key={index}
                  href={doc.driveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ ...styles.linkButton, marginRight: '8px', marginTop: '4px' }}
                >
                  {doc.filename}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Help Section */}
      <div style={{ ...styles.panel, marginTop: '24px' }}>
        <h2 style={styles.panelTitle}>Quick Reference</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
          <div>
            <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
              Available Actions
            </h3>
            <ul style={{ fontSize: '13px', color: '#6b7280', paddingLeft: '20px', margin: 0 }}>
              {Object.entries(ACTION_DESCRIPTIONS).map(([key, desc]) => (
                <li key={key} style={{ marginBottom: '4px' }}>
                  <code style={{ backgroundColor: '#f3f4f6', padding: '2px 6px', borderRadius: '4px' }}>
                    {key}
                  </code>
                  {' '}- {desc}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
              Environment Variables (Edge Function)
            </h3>
            <ul style={{ fontSize: '13px', color: '#6b7280', paddingLeft: '20px', margin: 0 }}>
              <li style={{ marginBottom: '4px' }}>GOOGLE_SERVICE_ACCOUNT_EMAIL</li>
              <li style={{ marginBottom: '4px' }}>GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY</li>
              <li style={{ marginBottom: '4px' }}>GOOGLE_DRIVE_FOLDER_ID</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// MOUNT
// ============================================

const container = document.getElementById('root');
const root = createRoot(container);
root.render(<TestContractsPage />);
