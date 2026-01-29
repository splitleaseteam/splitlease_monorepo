# Authentication Flow Architecture

This document describes the authentication system in Split Lease.

## Authentication Methods

Split Lease supports multiple authentication methods:

1. **Email/Password** - Traditional credential-based login
2. **Google OAuth** - Sign in with Google
3. **LinkedIn OAuth** - Sign in with LinkedIn
4. **Magic Link** - Passwordless email login

## Authentication Architecture

```mermaid
flowchart TB
    subgraph "Frontend"
        Login[LoginModal]
        Signup[SignupModal]
        Header[Header Component]
        Auth[auth.js]
        SS[secureStorage.js]
    end

    subgraph "Supabase"
        EF[auth-user Edge Function]
        SA[Supabase Auth]
        DB[(user table)]
    end

    subgraph "OAuth Providers"
        Google[Google OAuth]
        LinkedIn[LinkedIn OAuth]
    end

    Login -->|email/password| Auth
    Signup -->|email/password| Auth
    Auth -->|invoke| EF

    Login -->|OAuth| SA
    Signup -->|OAuth| SA
    SA -->|redirect| Google
    SA -->|redirect| LinkedIn
    Google -->|callback| SA
    LinkedIn -->|callback| SA

    EF -->|verify/create| DB
    EF -->|session| SA
    SA -->|tokens| Auth
    Auth -->|encrypt| SS
```

## Email/Password Login Flow

```mermaid
sequenceDiagram
    participant User
    participant LoginModal
    participant auth.js
    participant EF as auth-user
    participant DB as Supabase DB
    participant SA as Supabase Auth

    User->>LoginModal: Enter email & password
    LoginModal->>auth.js: loginUser(email, password)

    auth.js->>EF: POST {action: 'login', payload}
    EF->>DB: SELECT * FROM user WHERE email
    DB-->>EF: User record (with password hash)

    alt Password matches
        EF->>EF: bcrypt.compare(password, hash)
        EF->>SA: signInWithPassword()
        SA-->>EF: {access_token, refresh_token, expires_in}
        EF-->>auth.js: {success: true, tokens, user_id, user_type}

        auth.js->>auth.js: setAuthToken(access_token)
        auth.js->>auth.js: setSessionId(user_id)
        auth.js->>auth.js: setAuthState(true, userId)
        auth.js->>auth.js: setUserType(user_type)
        auth.js-->>LoginModal: {success: true}

        LoginModal->>LoginModal: Close modal
        LoginModal->>User: Refresh page
    else Password incorrect
        EF-->>auth.js: {success: false, error}
        auth.js-->>LoginModal: {success: false, error}
        LoginModal-->>User: Show error message
    end
```

## Email/Password Signup Flow

```mermaid
sequenceDiagram
    participant User
    participant SignupModal
    participant auth.js
    participant EF as auth-user
    participant DB as Supabase DB
    participant SA as Supabase Auth

    User->>SignupModal: Enter details
    SignupModal->>auth.js: signupUser(email, password, retype, additionalData)

    auth.js->>auth.js: Validate password match
    auth.js->>EF: POST {action: 'signup', payload}

    EF->>DB: SELECT * FROM user WHERE email
    DB-->>EF: Check existing

    alt Email not taken
        EF->>SA: signUp({email, password, metadata})
        SA-->>EF: {user, session}

        EF->>DB: INSERT INTO user (...)
        DB-->>EF: New user record

        EF->>DB: INSERT INTO account_host (for hosts)
        EF->>DB: INSERT INTO account_guest (for guests)

        EF-->>auth.js: {success: true, tokens, user_id}
        auth.js->>auth.js: Store session
        auth.js-->>SignupModal: {success: true}

        SignupModal->>User: Redirect to profile
    else Email taken
        EF-->>auth.js: {success: false, error: 'Email exists'}
        auth.js-->>SignupModal: Show error
    end
```

## OAuth Login Flow (Google/LinkedIn)

```mermaid
sequenceDiagram
    participant User
    participant LoginModal
    participant auth.js
    participant SA as Supabase Auth
    participant Provider as OAuth Provider
    participant EF as auth-user
    participant DB as Supabase DB

    User->>LoginModal: Click "Sign in with Google"
    LoginModal->>auth.js: initiateGoogleOAuthLogin()

    auth.js->>auth.js: setGoogleOAuthLoginFlow(true)
    auth.js->>SA: signInWithOAuth({provider: 'google'})
    SA-->>User: Redirect to Google

    User->>Provider: Authenticate
    Provider-->>SA: OAuth callback
    SA-->>User: Redirect to app

    Note over User,SA: Page reloads with session

    auth.js->>auth.js: Check getGoogleOAuthLoginFlow()
    auth.js->>SA: getSession()
    SA-->>auth.js: {session, user}

    auth.js->>EF: POST {action: 'oauth_login', payload}
    EF->>DB: SELECT * FROM user WHERE email
    DB-->>EF: User record (or null)

    alt User exists
        EF->>EF: Update supabase_user_id if needed
        EF-->>auth.js: {success: true, user_id, user_type}
        auth.js->>auth.js: Store session
        auth.js-->>User: Login complete
    else User not found
        auth.js-->>User: Show "Account not found" message
    end
```

## OAuth Signup Flow

```mermaid
sequenceDiagram
    participant User
    participant SignupModal
    participant auth.js
    participant SA as Supabase Auth
    participant Provider as OAuth Provider
    participant EF as auth-user
    participant DB as Supabase DB

    User->>SignupModal: Select user type (Host/Guest)
    User->>SignupModal: Click "Sign up with LinkedIn"
    SignupModal->>auth.js: initiateLinkedInOAuth('Host')

    auth.js->>auth.js: setLinkedInOAuthUserType('Host')
    auth.js->>SA: signInWithOAuth({provider: 'linkedin_oidc'})
    SA-->>User: Redirect to LinkedIn

    User->>Provider: Authorize
    Provider-->>SA: OAuth callback with profile
    SA-->>User: Redirect to /account-profile

    Note over User,SA: Page loads with session

    auth.js->>auth.js: Check getLinkedInOAuthUserType()
    auth.js->>SA: getSession()
    SA-->>auth.js: {session, user_metadata}

    auth.js->>EF: POST {action: 'oauth_signup', payload}
    Note over EF: payload includes firstName, lastName,<br/>profilePhoto from OAuth

    EF->>DB: Check if email exists
    alt New user
        EF->>SA: Update user metadata
        EF->>DB: INSERT INTO user
        EF->>DB: INSERT INTO account_host
        EF-->>auth.js: {success: true, isNewUser: true}
    else Existing email
        EF-->>auth.js: {success: false, isDuplicate: true}
        auth.js-->>User: Show "Email already registered"
    end
```

## Token Validation Flow

```mermaid
sequenceDiagram
    participant Page
    participant auth.js
    participant SS as secureStorage
    participant SA as Supabase Auth
    participant EF as auth-user
    participant DB as Supabase DB

    Page->>auth.js: validateTokenAndFetchUser()

    auth.js->>SS: getAuthToken()
    auth.js->>SS: getSessionId()

    alt Has tokens
        auth.js->>EF: POST {action: 'validate', payload}
        EF->>DB: SELECT * FROM user WHERE _id
        DB-->>EF: User data

        alt Valid user
            EF-->>auth.js: {success: true, userData}
            auth.js->>SS: Cache firstName, avatarUrl
            auth.js-->>Page: User data object
        else Invalid
            EF-->>auth.js: {success: false}
            auth.js->>SS: clearAllAuthData()
            auth.js-->>Page: null
        end
    else No tokens
        auth.js->>SA: getSession()
        alt Has Supabase session
            SA-->>auth.js: {session}
            auth.js->>auth.js: Sync to secureStorage
            auth.js->>EF: Validate
        else No session
            auth.js-->>Page: null
        end
    end
```

## Password Reset Flow

```mermaid
sequenceDiagram
    participant User
    participant ResetPage as ResetPasswordPage
    participant auth.js
    participant EF as auth-user
    participant SA as Supabase Auth
    participant Email as Resend Email

    User->>ResetPage: Enter email
    ResetPage->>auth.js: requestPasswordReset(email)
    auth.js->>EF: POST {action: 'request_password_reset'}
    EF->>SA: resetPasswordForEmail(email)
    SA->>Email: Send reset link
    Email-->>User: Password reset email

    EF-->>auth.js: {success: true}
    auth.js-->>ResetPage: Show confirmation

    Note over User: User clicks email link

    User->>ResetPage: Land on /reset-password
    ResetPage->>SA: Handle PASSWORD_RECOVERY event
    SA-->>ResetPage: Session established

    User->>ResetPage: Enter new password
    ResetPage->>auth.js: updatePassword(newPassword)
    auth.js->>EF: POST {action: 'update_password'}
    EF->>SA: updateUser({password})
    SA-->>EF: Success
    EF-->>auth.js: {success: true}
    auth.js-->>ResetPage: Password updated
    ResetPage-->>User: Redirect to home (logged in)
```

## Session Storage Architecture

```mermaid
flowchart TB
    subgraph "Encrypted Storage (secureStorage.js)"
        Token[auth_token - AES encrypted]
        Session[session_id - AES encrypted]
        UserType[user_type - plain]
        FirstName[first_name - plain]
        Avatar[avatar_url - plain]
    end

    subgraph "Supabase Session (localStorage)"
        SBToken[sb-*-auth-token]
    end

    subgraph "State Flags (localStorage)"
        AuthState[auth_state]
        UserID[user_id]
    end

    Auth[auth.js] -->|write| Token
    Auth -->|write| Session
    Auth -->|write| UserType
    Auth -->|write| AuthState

    Header[Header] -->|read| AuthState
    Header -->|read| FirstName
    Header -->|read| Avatar

    Validation[validateTokenAndFetchUser] -->|read| Token
    Validation -->|read| Session
```

## Protected Route Pattern

```mermaid
flowchart TB
    subgraph "Page Load"
        Route[Protected Route]
        Check[checkAuthStatus]
        Validate[validateTokenAndFetchUser]
    end

    subgraph "Auth States"
        Auth[Authenticated]
        Unauth[Not Authenticated]
    end

    subgraph "Actions"
        Render[Render Page]
        Redirect[Redirect to /]
        Modal[Show Login Modal]
    end

    Route --> Check
    Check -->|has tokens| Validate
    Check -->|no tokens| Unauth

    Validate -->|valid| Auth
    Validate -->|invalid| Unauth

    Auth --> Render
    Unauth --> Redirect
    Unauth -.->|optional| Modal
```

## Security Considerations

1. **Token Storage**: Auth tokens are AES-encrypted in localStorage
2. **JWT Validation**: Edge Functions verify JWTs on protected endpoints
3. **CORS**: Strict CORS headers on all Edge Functions
4. **Password Hashing**: bcrypt for password storage
5. **Session Expiry**: Tokens expire and require refresh
6. **OAuth State**: OAuth flow state stored in localStorage during redirect
7. **Secure Cookies**: Production uses secure cookies for session persistence

## Key Files

| File | Purpose |
|------|---------|
| `app/src/lib/auth.js` | Core auth functions |
| `app/src/lib/secureStorage.js` | Encrypted storage |
| `app/src/lib/supabase.js` | Supabase client setup |
| `supabase/functions/auth-user/` | Auth Edge Function |
