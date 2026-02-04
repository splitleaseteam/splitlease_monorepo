# API Code Examples

Comprehensive collection of code examples for the Split Lease API, including cURL commands and JavaScript implementations.

---

## Overview

This document provides practical examples for all major API operations, with both cURL commands for testing and JavaScript code for integration.

**Prerequisites**:
- Supabase project URL and anon key
- Valid access token (for authenticated requests)
- Understanding of action-based routing pattern

---

## Authentication Examples

### User Signup

**cURL**:
```bash
curl -X POST 'https://splitlease-backend.supabase.co/functions/v1/auth-user' \
  -H 'Content-Type: application/json' \
  -H 'apikey: YOUR_SUPABASE_ANON_KEY' \
  -d '{
    "action": "signup",
    "payload": {
      "email": "john@example.com",
      "password": "securepass123",
      "retype": "securepass123",
      "additionalData": {
        "firstName": "John",
        "lastName": "Doe",
        "userType": "Guest",
        "birthDate": "1990-01-01",
        "phoneNumber": "+1234567890"
      }
    }
  }'
```

**JavaScript**:
```javascript
const SUPABASE_URL = 'https://splitlease-backend.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

async function signupUser(userData) {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/auth-user`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY
    },
    body: JSON.stringify({
      action: 'signup',
      payload: {
        email: userData.email,
        password: userData.password,
        retype: userData.password,
        additionalData: {
          firstName: userData.firstName,
          lastName: userData.lastName,
          userType: userData.userType,
          birthDate: userData.birthDate,
          phoneNumber: userData.phoneNumber
        }
      }
    })
  });

  const result = await response.json();

  if (result.success) {
    // Store tokens
    localStorage.setItem('access_token', result.data.accessToken);
    localStorage.setItem('refresh_token', result.data.refreshToken);
    localStorage.setItem('user_id', result.data.userId);
    localStorage.setItem('user_type', result.data.userType);

    // Set Supabase session
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    await supabase.auth.setSession({
      access_token: result.data.accessToken,
      refresh_token: result.data.refreshToken
    });

    return result.data;
  } else {
    throw new Error(result.error);
  }
}

// Usage
try {
  const user = await signupUser({
    email: 'john@example.com',
    password: 'securepass123',
    firstName: 'John',
    lastName: 'Doe',
    userType: 'Guest',
    birthDate: '1990-01-01',
    phoneNumber: '+1234567890'
  });
  console.log('Signup successful:', user.userId);
} catch (error) {
  console.error('Signup failed:', error.message);
}
```

---

### User Login

**cURL**:
```bash
curl -X POST 'https://splitlease-backend.supabase.co/functions/v1/auth-user' \
  -H 'Content-Type: application/json' \
  -H 'apikey: YOUR_SUPABASE_ANON_KEY' \
  -d '{
    "action": "login",
    "payload": {
      "email": "john@example.com",
      "password": "securepass123"
    }
  }'
```

**JavaScript**:
```javascript
async function loginUser(email, password) {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/auth-user`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY
    },
    body: JSON.stringify({
      action: 'login',
      payload: { email, password }
    })
  });

  const result = await response.json();

  if (result.success) {
    // Store tokens securely
    localStorage.setItem('access_token', result.data.accessToken);
    localStorage.setItem('refresh_token', result.data.refreshToken);
    localStorage.setItem('user_id', result.data.userId);
    localStorage.setItem('user_type', result.data.userType);

    return result.data;
  } else {
    throw new Error(result.error);
  }
}

// Usage
try {
  const session = await loginUser('john@example.com', 'securepass123');
  console.log('Login successful:', session.userId);
} catch (error) {
  console.error('Login failed:', error.message);
}
```

---

### Token Validation

**cURL**:
```bash
curl -X POST 'https://splitlease-backend.supabase.co/functions/v1/auth-user' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN' \
  -H 'apikey: YOUR_SUPABASE_ANON_KEY' \
  -d '{
    "action": "validate",
    "payload": {
      "token": "YOUR_ACCESS_TOKEN",
      "user_id": "USER_ID"
    }
  }'
```

**JavaScript**:
```javascript
async function validateToken(token, userId) {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/auth-user`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'apikey': SUPABASE_ANON_KEY
    },
    body: JSON.stringify({
      action: 'validate',
      payload: { token, user_id: userId }
    })
  });

  const result = await response.json();

  if (result.success) {
    return result.data; // User data
  } else {
    throw new Error(result.error);
  }
}

// Usage
const token = localStorage.getItem('access_token');
const userId = localStorage.getItem('user_id');

try {
  const userData = await validateToken(token, userId);
  console.log('User data:', userData);
} catch (error) {
  console.error('Validation failed:', error.message);
  // Redirect to login
  window.location.href = '/signup-login';
}
```

---

### Password Reset

**cURL - Request Reset**:
```bash
curl -X POST 'https://splitlease-backend.supabase.co/functions/v1/auth-user' \
  -H 'Content-Type: application/json' \
  -H 'apikey: YOUR_SUPABASE_ANON_KEY' \
  -d '{
    "action": "request_password_reset",
    "payload": {
      "email": "john@example.com",
      "redirectTo": "https://split.lease/reset-password"
    }
  }'
```

**JavaScript - Request Reset**:
```javascript
async function requestPasswordReset(email) {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/auth-user`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY
    },
    body: JSON.stringify({
      action: 'request_password_reset',
      payload: {
        email,
        redirectTo: `${window.location.origin}/reset-password`
      }
    })
  });

  const result = await response.json();

  // Always returns success (prevents email enumeration)
  console.log(result.message);
  return result.success;
}

// Usage
await requestPasswordReset('john@example.com');
console.log('If an account exists, a password reset link has been sent.');
```

**JavaScript - Update Password**:
```javascript
async function updatePassword(newPassword) {
  // Get current session (from PASSWORD_RECOVERY event)
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    throw new Error('No active session. Please request a new reset link.');
  }

  const response = await fetch(`${SUPABASE_URL}/functions/v1/auth-user`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
      'apikey': SUPABASE_ANON_KEY
    },
    body: JSON.stringify({
      action: 'update_password',
      payload: {
        password: newPassword,
        access_token: session.access_token
      }
    })
  });

  const result = await response.json();

  if (result.success) {
    return result.data;
  } else {
    throw new Error(result.error);
  }
}

// Usage
try {
  await updatePassword('new_secure_pass');
  console.log('Password updated successfully');
} catch (error) {
  console.error('Password update failed:', error.message);
}
```

---

## Proposal Examples

### Create Proposal

**cURL**:
```bash
curl -X POST 'https://splitlease-backend.supabase.co/functions/v1/proposal' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN' \
  -H 'apikey: YOUR_SUPABASE_ANON_KEY' \
  -d '{
    "action": "create",
    "payload": {
      "listingId": "listing_abc123",
      "checkInDate": "2026-02-01",
      "checkOutDate": "2026-02-28",
      "selectedDays": [1, 2, 3, 4, 5],
      "guestMessage": "Looking forward to staying!",
      "rentalApplicationId": "rental_app_xyz"
    }
  }'
```

**JavaScript**:
```javascript
async function createProposal(token, proposalData) {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/proposal`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'apikey': SUPABASE_ANON_KEY
    },
    body: JSON.stringify({
      action: 'create',
      payload: proposalData
    })
  });

  const result = await response.json();

  if (result.success) {
    return result.data;
  } else {
    throw new Error(result.error);
  }
}

// Usage
const token = localStorage.getItem('access_token');

try {
  const proposal = await createProposal(token, {
    listingId: 'listing_abc123',
    checkInDate: '2026-02-01',
    checkOutDate: '2026-02-28',
    selectedDays: [1, 2, 3, 4, 5], // Mon-Fri (0-based)
    guestMessage: 'Looking forward to staying!',
    rentalApplicationId: 'rental_app_xyz'
  });

  console.log('Proposal created:', proposal.proposalId);
  console.log('Total rent:', proposal.totalRent);
  console.log('Service fee:', proposal.serviceFee);
} catch (error) {
  console.error('Proposal creation failed:', error.message);
}
```

---

### Get Proposal

**cURL**:
```bash
curl -X POST 'https://splitlease-backend.supabase.co/functions/v1/proposal' \
  -H 'Content-Type: application/json' \
  -H 'apikey: YOUR_SUPABASE_ANON_KEY' \
  -d '{
    "action": "get",
    "payload": {
      "proposalId": "proposal_abc123"
    }
  }'
```

**JavaScript**:
```javascript
async function getProposal(proposalId) {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/proposal`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY
    },
    body: JSON.stringify({
      action: 'get',
      payload: { proposalId }
    })
  });

  const result = await response.json();

  if (result.success) {
    return result.data;
  } else {
    throw new Error(result.error);
  }
}

// Usage
try {
  const proposal = await getProposal('proposal_abc123');
  console.log('Proposal status:', proposal.status);
  console.log('Check-in:', proposal.checkInDate);
  console.log('Check-out:', proposal.checkOutDate);
} catch (error) {
  console.error('Failed to fetch proposal:', error.message);
}
```

---

### Accept Proposal

**cURL**:
```bash
curl -X POST 'https://splitlease-backend.supabase.co/functions/v1/proposal' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN' \
  -H 'apikey: YOUR_SUPABASE_ANON_KEY' \
  -d '{
    "action": "acceptProposal",
    "payload": {
      "proposalId": "proposal_abc123"
    }
  }'
```

**JavaScript**:
```javascript
async function acceptProposal(token, proposalId) {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/proposal`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'apikey': SUPABASE_ANON_KEY
    },
    body: JSON.stringify({
      action: 'acceptProposal',
      payload: { proposalId }
    })
  });

  const result = await response.json();

  if (result.success) {
    return result.data;
  } else {
    throw new Error(result.error);
  }
}

// Usage
const token = localStorage.getItem('access_token');

try {
  const result = await acceptProposal(token, 'proposal_abc123');
  console.log('Proposal accepted:', result.proposalId);
  console.log('Lease created:', result.leaseId);
} catch (error) {
  console.error('Failed to accept proposal:', error.message);
}
```

---

### Create Counteroffer

**cURL**:
```bash
curl -X POST 'https://splitlease-backend.supabase.co/functions/v1/proposal' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN' \
  -H 'apikey: YOUR_SUPABASE_ANON_KEY' \
  -d '{
    "action": "create_counteroffer",
    "payload": {
      "proposalId": "proposal_abc123",
      "checkInDate": "2026-02-05",
      "checkOutDate": "2026-03-05",
      "selectedDays": [1, 2, 3, 4, 5],
      "nightlyRate": 175,
      "message": "I can offer these dates at a slightly higher rate."
    }
  }'
```

**JavaScript**:
```javascript
async function createCounteroffer(token, proposalId, counterofferData) {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/proposal`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'apikey': SUPABASE_ANON_KEY
    },
    body: JSON.stringify({
      action: 'create_counteroffer',
      payload: {
        proposalId,
        ...counterofferData
      }
    })
  });

  const result = await response.json();

  if (result.success) {
    return result.data;
  } else {
    throw new Error(result.error);
  }
}

// Usage
const token = localStorage.getItem('access_token');

try {
  const counteroffer = await createCounteroffer(token, 'proposal_abc123', {
    checkInDate: '2026-02-05',
    checkOutDate: '2026-03-05',
    selectedDays: [1, 2, 3, 4, 5],
    nightlyRate: 175,
    message: 'I can offer these dates at a slightly higher rate.'
  });

  console.log('Counteroffer created:', counteroffer.proposalId);
} catch (error) {
  console.error('Failed to create counteroffer:', error.message);
}
```

---

## Listing Examples

### Get Listing

**cURL**:
```bash
curl -X POST 'https://splitlease-backend.supabase.co/functions/v1/listing' \
  -H 'Content-Type: application/json' \
  -H 'apikey: YOUR_SUPABASE_ANON_KEY' \
  -d '{
    "action": "get",
    "payload": {
      "listingId": "listing_abc123"
    }
  }'
```

**JavaScript**:
```javascript
async function getListing(listingId) {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/listing`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY
    },
    body: JSON.stringify({
      action: 'get',
      payload: { listingId }
    })
  });

  const result = await response.json();

  if (result.success) {
    return result.data;
  } else {
    throw new Error(result.error);
  }
}

// Usage
try {
  const listing = await getListing('listing_abc123');
  console.log('Listing title:', listing.title);
  console.log('Base rate:', listing.baseNightlyRate);
  console.log('Available days:', listing.availableDays);
} catch (error) {
  console.error('Failed to fetch listing:', error.message);
}
```

---

### Create Listing

**cURL**:
```bash
curl -X POST 'https://splitlease-backend.supabase.co/functions/v1/listing' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN' \
  -H 'apikey: YOUR_SUPABASE_ANON_KEY' \
  -d '{
    "action": "create",
    "payload": {
      "title": "Beautiful Brooklyn Apartment",
      "description": "Spacious 2BR in prime location",
      "streetAddress": "123 Main St",
      "city": "Brooklyn",
      "state": "NY",
      "zipCode": "11201",
      "baseNightlyRate": 150,
      "availableDays": [1, 2, 3, 4, 5]
    }
  }'
```

**JavaScript**:
```javascript
async function createListing(token, listingData) {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/listing`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'apikey': SUPABASE_ANON_KEY
    },
    body: JSON.stringify({
      action: 'create',
      payload: listingData
    })
  });

  const result = await response.json();

  if (result.success) {
    return result.data;
  } else {
    throw new Error(result.error);
  }
}

// Usage
const token = localStorage.getItem('access_token');

try {
  const listing = await createListing(token, {
    title: 'Beautiful Brooklyn Apartment',
    description: 'Spacious 2BR in prime location',
    streetAddress: '123 Main St',
    city: 'Brooklyn',
    state: 'NY',
    zipCode: '11201',
    baseNightlyRate: 150,
    availableDays: [1, 2, 3, 4, 5]
  });

  console.log('Listing created:', listing.listingId);
} catch (error) {
  console.error('Failed to create listing:', error.message);
}
```

---

## Pricing Examples

### Calculate Pricing

**cURL**:
```bash
curl -X POST 'https://splitlease-backend.supabase.co/functions/v1/pricing' \
  -H 'Content-Type: application/json' \
  -H 'apikey: YOUR_SUPABASE_ANON_KEY' \
  -d '{
    "action": "calculate",
    "payload": {
      "listingId": "listing_abc123",
      "checkInDate": "2026-02-01",
      "checkOutDate": "2026-02-28",
      "selectedDays": [1, 2, 3, 4, 5]
    }
  }'
```

**JavaScript**:
```javascript
async function calculatePricing(listingId, checkInDate, checkOutDate, selectedDays) {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/pricing`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY
    },
    body: JSON.stringify({
      action: 'calculate',
      payload: {
        listingId,
        checkInDate,
        checkOutDate,
        selectedDays
      }
    })
  });

  const result = await response.json();

  if (result.success) {
    return result.data;
  } else {
    throw new Error(result.error);
  }
}

// Usage
try {
  const pricing = await calculatePricing(
    'listing_abc123',
    '2026-02-01',
    '2026-02-28',
    [1, 2, 3, 4, 5]
  );

  console.log('Nightly rate:', pricing.nightlyRate);
  console.log('Weekly rate:', pricing.weeklyRate);
  console.log('Four-week rate:', pricing.fourWeekRate);
  console.log('Total rent:', pricing.totalRent);
  console.log('Service fee:', pricing.serviceFee);
  console.log('Total:', pricing.total);
} catch (error) {
  console.error('Pricing calculation failed:', error.message);
}
```

---

## Messaging Examples

### Send Message

**cURL**:
```bash
curl -X POST 'https://splitlease-backend.supabase.co/functions/v1/messages' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN' \
  -H 'apikey: YOUR_SUPABASE_ANON_KEY' \
  -d '{
    "action": "send",
    "payload": {
      "recipientId": "user_xyz789",
      "proposalId": "proposal_abc123",
      "message": "Is the listing still available?"
    }
  }'
```

**JavaScript**:
```javascript
async function sendMessage(token, recipientId, message, proposalId = null) {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'apikey': SUPABASE_ANON_KEY
    },
    body: JSON.stringify({
      action: 'send',
      payload: {
        recipientId,
        proposalId,
        message
      }
    })
  });

  const result = await response.json();

  if (result.success) {
    return result.data;
  } else {
    throw new Error(result.error);
  }
}

// Usage
const token = localStorage.getItem('access_token');

try {
  const message = await sendMessage(
    token,
    'user_xyz789',
    'Is the listing still available?',
    'proposal_abc123'
  );

  console.log('Message sent:', message.id);
} catch (error) {
  console.error('Failed to send message:', error.message);
}
```

---

### Get Message Thread

**cURL**:
```bash
curl -X POST 'https://splitlease-backend.supabase.co/functions/v1/messages' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN' \
  -H 'apikey: YOUR_SUPABASE_ANON_KEY' \
  -d '{
    "action": "get_thread",
    "payload": {
      "threadId": "thread_uuid"
    }
  }'
```

**JavaScript**:
```javascript
async function getMessageThread(token, threadId) {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'apikey': SUPABASE_ANON_KEY
    },
    body: JSON.stringify({
      action: 'get_thread',
      payload: { threadId }
    })
  });

  const result = await response.json();

  if (result.success) {
    return result.data;
  } else {
    throw new Error(result.error);
  }
}

// Usage
const token = localStorage.getItem('access_token');

try {
  const thread = await getMessageThread(token, 'thread_uuid');
  console.log('Messages:', thread.messages);
} catch (error) {
  console.error('Failed to fetch thread:', error.message);
}
```

---

## Rental Application Examples

### Submit Rental Application

**cURL**:
```bash
curl -X POST 'https://splitlease-backend.supabase.co/functions/v1/rental-application' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN' \
  -H 'apikey: YOUR_SUPABASE_ANON_KEY' \
  -d '{
    "action": "submit",
    "payload": {
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "phoneNumber": "+1234567890",
      "birthDate": "1990-01-01",
      "aboutMe": "Software engineer who loves to travel",
      "needForSpace": "Looking for a quiet place to work",
      "specialNeeds": "None",
      "profilePhoto": "https://example.com/photo.jpg"
    }
  }'
```

**JavaScript**:
```javascript
async function submitRentalApplication(token, applicationData) {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/rental-application`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'apikey': SUPABASE_ANON_KEY
    },
    body: JSON.stringify({
      action: 'submit',
      payload: applicationData
    })
  });

  const result = await response.json();

  if (result.success) {
    return result.data;
  } else {
    throw new Error(result.error);
  }
}

// Usage
const token = localStorage.getItem('access_token');

try {
  const application = await submitRentalApplication(token, {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    phoneNumber: '+1234567890',
    birthDate: '1990-01-01',
    aboutMe: 'Software engineer who loves to travel',
    needForSpace: 'Looking for a quiet place to work',
    specialNeeds: 'None',
    profilePhoto: 'https://example.com/photo.jpg'
  });

  console.log('Rental application submitted:', application._id);
} catch (error) {
  console.error('Failed to submit application:', error.message);
}
```

---

## AI Examples

### Generate Listing Description

**cURL**:
```bash
curl -X POST 'https://splitlease-backend.supabase.co/functions/v1/ai-gateway' \
  -H 'Content-Type: application/json' \
  -H 'apikey: YOUR_SUPABASE_ANON_KEY' \
  -d '{
    "action": "complete",
    "payload": {
      "prompt": "listing-description",
      "variables": {
        "neighborhood": "Williamsburg",
        "amenities": "wifi, kitchen, laundry",
        "beds": 2,
        "bathrooms": 1,
        "squareFeet": 1000
      }
    }
  }'
```

**JavaScript**:
```javascript
async function generateListingDescription(variables) {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/ai-gateway`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY
    },
    body: JSON.stringify({
      action: 'complete',
      payload: {
        prompt: 'listing-description',
        variables
      }
    })
  });

  const result = await response.json();

  if (result.success) {
    return result.data.response;
  } else {
    throw new Error(result.error);
  }
}

// Usage
try {
  const description = await generateListingDescription({
    neighborhood: 'Williamsburg',
    amenities: 'wifi, kitchen, laundry',
    beds: 2,
    bathrooms: 1,
    squareFeet: 1000
  });

  console.log('Generated description:', description);
} catch (error) {
  console.error('Failed to generate description:', error.message);
}
```

---

## Review Examples

### Create Review

**cURL**:
```bash
curl -X POST 'https://splitlease-backend.supabase.co/functions/v1/reviews-overview' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN' \
  -H 'apikey: YOUR_SUPABASE_ANON_KEY' \
  -d '{
    "action": "create",
    "payload": {
      "stayId": "stay_abc123",
      "reviewType": "guest_reviews_host",
      "comment": "Great host, very responsive!",
      "overallRating": 5,
      "wouldRecommend": true,
      "ratingDetails": [
        {
          "category": "cleanliness",
          "categoryLabel": "Cleanliness",
          "rating": 5
        },
        {
          "category": "communication",
          "categoryLabel": "Communication",
          "rating": 5
        },
        {
          "category": "check_in",
          "categoryLabel": "Check-in",
          "rating": 5
        }
      ]
    }
  }'
```

**JavaScript**:
```javascript
async function createReview(token, reviewData) {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/reviews-overview`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'apikey': SUPABASE_ANON_KEY
    },
    body: JSON.stringify({
      action: 'create',
      payload: reviewData
    })
  });

  const result = await response.json();

  if (result.success) {
    return result.data;
  } else {
    throw new Error(result.error);
  }
}

// Usage
const token = localStorage.getItem('access_token');

try {
  const review = await createReview(token, {
    stayId: 'stay_abc123',
    reviewType: 'guest_reviews_host',
    comment: 'Great host, very responsive!',
    overallRating: 5,
    wouldRecommend: true,
    ratingDetails: [
      { category: 'cleanliness', categoryLabel: 'Cleanliness', rating: 5 },
      { category: 'communication', categoryLabel: 'Communication', rating: 5 },
      { category: 'check_in', categoryLabel: 'Check-in', rating: 5 }
    ]
  });

  console.log('Review created:', review._id);
} catch (error) {
  console.error('Failed to create review:', error.message);
}
```

---

## Error Handling Examples

### Standard Error Handling

```javascript
async function makeApiRequest(endpoint, action, payload, token = null) {
  const headers = {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_ANON_KEY
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ action, payload })
    });

    const result = await response.json();

    if (!response.ok) {
      // HTTP error (4xx, 5xx)
      throw new Error(result.error || `HTTP ${response.status}`);
    }

    if (!result.success) {
      // Application error
      throw new Error(result.error || 'Request failed');
    }

    return result.data;

  } catch (error) {
    // Network error or other exception
    console.error('API request failed:', error);
    throw error;
  }
}

// Usage
try {
  const proposal = await makeApiRequest(
    'proposal',
    'create',
    {
      listingId: 'listing_abc123',
      checkInDate: '2026-02-01',
      checkOutDate: '2026-02-28',
      selectedDays: [1, 2, 3, 4, 5]
    },
    localStorage.getItem('access_token')
  );

  console.log('Proposal created:', proposal.proposalId);

} catch (error) {
  console.error('Error:', error.message);

  // Handle specific errors
  if (error.message.includes('Authentication required')) {
    // Redirect to login
    window.location.href = '/signup-login';
  } else if (error.message.includes('Invalid')) {
    // Show validation error
    alert('Please check your input and try again.');
  } else {
    // Show generic error
    alert('Something went wrong. Please try again.');
  }
}
```

---

### Retry Logic

```javascript
async function makeApiRequestWithRetry(endpoint, action, payload, token = null, maxRetries = 3) {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await makeApiRequest(endpoint, action, payload, token);
      return result; // Success - return result

    } catch (error) {
      lastError = error;

      // Don't retry on auth errors or validation errors
      if (error.message.includes('Authentication') ||
          error.message.includes('Invalid') ||
          error.message.includes('validation')) {
        throw error;
      }

      // Wait before retrying (exponential backoff)
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        console.log(`Retry attempt ${attempt + 1}/${maxRetries}...`);
      }
    }
  }

  // All retries failed
  throw lastError;
}

// Usage
try {
  const proposal = await makeApiRequestWithRetry(
    'proposal',
    'create',
    proposalData,
    token
  );
  console.log('Proposal created:', proposal.proposalId);
} catch (error) {
  console.error('Failed after retries:', error.message);
}
```

---

## Utility Functions

### Get Auth Token

```javascript
function getAuthToken() {
  return localStorage.getItem('access_token');
}

function getUserId() {
  return localStorage.getItem('user_id');
}

function getUserType() {
  return localStorage.getItem('user_type');
}

function isAuthenticated() {
  return !!localStorage.getItem('access_token');
}
```

---

### Set Auth Token

```javascript
function setAuthToken(accessToken, refreshToken, userId, userType) {
  localStorage.setItem('access_token', accessToken);
  localStorage.setItem('refresh_token', refreshToken);
  localStorage.setItem('user_id', userId);
  localStorage.setItem('user_type', userType);
}

function clearAuthToken() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user_id');
  localStorage.removeItem('user_type');
}
```

---

### API Client Class

```javascript
class SplitLeaseAPI {
  constructor(baseUrl, anonKey) {
    this.baseUrl = baseUrl;
    this.anonKey = anonKey;
  }

  getHeaders(token = null) {
    const headers = {
      'Content-Type': 'application/json',
      'apikey': this.anonKey
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  async request(endpoint, action, payload, token = null) {
    const response = await fetch(`${this.baseUrl}/functions/v1/${endpoint}`, {
      method: 'POST',
      headers: this.getHeaders(token),
      body: JSON.stringify({ action, payload })
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error);
    }

    return result.data;
  }

  // Auth methods
  async signup(userData) {
    return this.request('auth-user', 'signup', userData);
  }

  async login(email, password) {
    return this.request('auth-user', 'login', { email, password });
  }

  async logout(token) {
    return this.request('auth-user', 'logout', { token }, token);
  }

  // Proposal methods
  async createProposal(token, proposalData) {
    return this.request('proposal', 'create', proposalData, token);
  }

  async getProposal(proposalId) {
    return this.request('proposal', 'get', { proposalId });
  }

  // Listing methods
  async getListing(listingId) {
    return this.request('listing', 'get', { listingId });
  }

  async createListing(token, listingData) {
    return this.request('listing', 'create', listingData, token);
  }
}

// Usage
const api = new SplitLeaseAPI(
  'https://splitlease-backend.supabase.co',
  'YOUR_SUPABASE_ANON_KEY'
);

// Signup
const user = await api.signup({
  email: 'john@example.com',
  password: 'securepass123',
  // ... other fields
});

// Login
const session = await api.login('john@example.com', 'securepass123');

// Create proposal (authenticated)
const proposal = await api.createProposal(session.accessToken, {
  listingId: 'listing_abc123',
  checkInDate: '2026-02-01',
  checkOutDate: '2026-02-28',
  selectedDays: [1, 2, 3, 4, 5]
});
```

---

## See Also

- [Edge Functions Reference](../edge-functions/README.md)
- [Authentication Flows](../authentication/README.md)
- [TypeScript Types](../types/README.md)
