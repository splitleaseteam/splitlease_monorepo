/**
 * Google Drive Uploader for Lease Documents Edge Function
 * Split Lease - Supabase Edge Functions
 *
 * Uses Google Service Account authentication for server-to-server uploads.
 * No OAuth flow needed - uses JWT-based authentication.
 */

// ================================================
// TYPES
// ================================================

interface GoogleDriveUploadResult {
  success: boolean;
  fileId?: string;
  webViewLink?: string;
  error?: string;
}

interface ServiceAccountCredentials {
  client_email: string;
  private_key: string;
}

// ================================================
// JWT TOKEN GENERATION
// ================================================

/**
 * Create a JWT for Google Service Account authentication.
 * This replaces the need for google-auth-library in Deno.
 */
async function createServiceAccountJWT(
  credentials: ServiceAccountCredentials,
  impersonatedEmail?: string
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const expiry = now + 3600; // 1 hour

  const header = {
    alg: 'RS256',
    typ: 'JWT',
  };

  const payload: Record<string, unknown> = {
    iss: credentials.client_email,
    scope: 'https://www.googleapis.com/auth/drive.file',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: expiry,
  };

  // Add subject for Domain-Wide Delegation (Impersonation)
  if (impersonatedEmail) {
    payload.sub = impersonatedEmail;
  }

  // Base64URL encode header and payload
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signatureInput = `${encodedHeader}.${encodedPayload}`;

  // Sign with RSA-SHA256
  const signature = await signWithRSA(signatureInput, credentials.private_key);

  return `${signatureInput}.${signature}`;
}

/**
 * Base64URL encode a string.
 */
function base64UrlEncode(str: string): string {
  const base64 = btoa(str);
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Sign data with RSA-SHA256 using the service account private key.
 */
async function signWithRSA(data: string, privateKeyPem: string): Promise<string> {
  // Parse PEM to get the key data
  const pemContents = privateKeyPem
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/\s/g, '');

  const binaryKey = atob(pemContents);
  const keyBytes = new Uint8Array(binaryKey.length);
  for (let i = 0; i < binaryKey.length; i++) {
    keyBytes[i] = binaryKey.charCodeAt(i);
  }

  // Import the private key
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    keyBytes,
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: 'SHA-256',
    },
    false,
    ['sign']
  );

  // Sign the data
  const encoder = new TextEncoder();
  const dataBytes = encoder.encode(data);
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    dataBytes
  );

  // Convert to base64url
  const signatureBytes = new Uint8Array(signature);
  let binary = '';
  for (let i = 0; i < signatureBytes.byteLength; i++) {
    binary += String.fromCharCode(signatureBytes[i]);
  }
  return base64UrlEncode(binary);
}

// ================================================
// ACCESS TOKEN
// ================================================

/**
 * Exchange JWT for an access token.
 */
async function getAccessToken(
  credentials: ServiceAccountCredentials,
  impersonatedEmail?: string
): Promise<string> {
  const jwt = await createServiceAccountJWT(credentials, impersonatedEmail);

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to get access token: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.access_token;
}

// ================================================
// GOOGLE DRIVE UPLOAD
// ================================================

/**
 * Upload a file to Google Drive using the service account.
 *
 * @param fileContent - The file content as Uint8Array
 * @param fileName - The name for the file in Google Drive
 * @param mimeType - The MIME type of the file
 * @returns Upload result with file ID and web view link
 */
export async function uploadToGoogleDrive(
  fileContent: Uint8Array,
  fileName: string,
  mimeType: string = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
): Promise<GoogleDriveUploadResult> {
  console.log(`[googleDrive] Uploading file: ${fileName}`);

  // Get credentials from environment
  const clientEmail = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_EMAIL');
  const privateKey = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY');
  const folderId = Deno.env.get('GOOGLE_DRIVE_FOLDER_ID');
  const impersonatedEmail = Deno.env.get('GOOGLE_IMPERSONATED_USER_EMAIL');

  console.log('[googleDrive] Configuration Check:');
  console.log(`- Service Account Email: ${clientEmail ? clientEmail.substring(0, 5) + '...' : 'MISSING'}`);
  console.log(`- Private Key Present: ${!!privateKey}`);
  console.log(`- Folder ID: ${folderId}`);
  console.log(`- Impersonated User: ${impersonatedEmail || 'NONE (Standard Service Account)'}`);

  if (!clientEmail || !privateKey) {
    console.error('[googleDrive] Missing service account credentials');
    return {
      success: false,
      error: 'Google Drive service account credentials not configured',
    };
  }

  if (!folderId) {
    console.error('[googleDrive] Missing folder ID');
    return {
      success: false,
      error: 'Google Drive folder ID not configured',
    };
  }

  try {
    // Get access token (with optional impersonation)
    if (impersonatedEmail) {
      console.log(`[googleDrive] Attempting to mint JWT with subject: ${impersonatedEmail}`);
    } else {
      console.log('[googleDrive] Minting standard Service Account JWT (no delegation)');
    }

    const accessToken = await getAccessToken(
      {
        client_email: clientEmail,
        private_key: privateKey.replace(/\\n/g, '\n'), // Handle escaped newlines
      },
      impersonatedEmail
    );

    console.log('[googleDrive] Access Token obtained successfully');

    // Prepare multipart upload
    const boundary = '-------' + Date.now().toString(16);

    const metadata = {
      name: fileName,
      parents: [folderId],
    };

    // Build multipart body
    const metadataJson = JSON.stringify(metadata);

    // Create the multipart body parts
    const parts: (string | Uint8Array)[] = [
      `--${boundary}\r\n`,
      'Content-Type: application/json; charset=UTF-8\r\n\r\n',
      metadataJson,
      `\r\n--${boundary}\r\n`,
      `Content-Type: ${mimeType}\r\n\r\n`,
    ];

    // Calculate total length
    const encoder = new TextEncoder();
    let totalLength = 0;
    const encodedParts: Uint8Array[] = [];

    for (const part of parts) {
      const encoded = typeof part === 'string' ? encoder.encode(part) : part;
      encodedParts.push(encoded);
      totalLength += encoded.length;
    }

    // Add file content
    totalLength += fileContent.length;

    // Add closing boundary
    const closingBoundary = encoder.encode(`\r\n--${boundary}--`);
    totalLength += closingBoundary.length;

    // Combine all parts into a single Uint8Array
    const body = new Uint8Array(totalLength);
    let offset = 0;

    for (const part of encodedParts) {
      body.set(part, offset);
      offset += part.length;
    }
    body.set(fileContent, offset);
    offset += fileContent.length;
    body.set(closingBoundary, offset);

    // Upload to Google Drive (supportsAllDrives enables Shared Drive support)
    const uploadResponse = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink&supportsAllDrives=true',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
          'Content-Length': totalLength.toString(),
        },
        body: body,
      }
    );

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error(`[googleDrive] Upload failed: ${uploadResponse.status} - ${errorText}`);
      return {
        success: false,
        error: `Upload failed: ${uploadResponse.status} - ${errorText}`,
      };
    }

    const uploadResult = await uploadResponse.json();
    console.log(`[googleDrive] Upload successful: ${uploadResult.id}`);

    return {
      success: true,
      fileId: uploadResult.id,
      webViewLink: uploadResult.webViewLink,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[googleDrive] Upload error: ${errorMessage}`);
    return {
      success: false,
      error: errorMessage,
    };
  }
}

// ================================================
// SLACK NOTIFICATION
// ================================================

/**
 * Send a Slack notification about document generation.
 */
export async function notifySlack(
  message: string,
  isError: boolean = false
): Promise<void> {
  const webhookUrl = isError
    ? Deno.env.get('SLACK_ERROR_WEBHOOK')
    : Deno.env.get('SLACK_SUCCESS_WEBHOOK');

  if (!webhookUrl) {
    console.warn(`[googleDrive] Slack webhook not configured for ${isError ? 'error' : 'success'} messages`);
    return;
  }

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: `[Lease Documents] ${message}`,
      }),
    });
  } catch (error) {
    console.warn(`[googleDrive] Failed to send Slack notification: ${error}`);
  }
}
