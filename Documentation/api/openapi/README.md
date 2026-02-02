# OpenAPI Specifications

OpenAPI 3.0 specifications for the Split Lease API.

---

## Overview

This directory contains OpenAPI specifications for Split Lease API endpoints. These specifications can be used with API documentation tools like Swagger UI, Redoc, or Postman.

---

## Available Specifications

### auth-user-openapi.yaml

**Description**: Complete OpenAPI specification for the auth-user Edge Function.

**Endpoints**:
- `POST /auth-user` - Authentication operations (login, signup, logout, password reset, OAuth)

**Usage**:
```bash
# View in Swagger UI
swagger-ui auth-user-openapi.yaml

# View in Redoc
redocly auth-user-openapi.yaml

# Import into Postman
# File → Import → Select auth-user-openapi.yaml
```

---

## Using OpenAPI Specifications

### Swagger UI

1. Install Swagger UI:
```bash
npm install -g swagger-ui
```

2. Serve specification:
```bash
swagger-ui auth-user-openapi.yaml
```

3. Open browser:
```
http://localhost:8080
```

---

### Redoc

1. Install Redoc CLI:
```bash
npm install -g @redocly/cli
```

2. Serve specification:
```bash
redocly auth-user-openapi.yaml
```

3. Open browser:
```
http://localhost:8080
```

---

### Postman

1. Open Postman
2. Click "Import"
3. Select "File" tab
4. Choose `auth-user-openapi.yaml`
5. Click "Import"

Postman will create a collection with all endpoints from the specification.

---

### VS Code REST Client

1. Install REST Client extension for VS Code
2. Open `auth-user-openapi.yaml`
3. Right-click → "Send Request"

---

## Specification Structure

### General Information

```yaml
info:
  title: Split Lease API
  version: 1.0.0
  contact:
    name: Split Lease Engineering
    email: support@split.lease
```

### Servers

```yaml
servers:
  - url: https://splitlease-backend.supabase.co/functions/v1
    description: Production server
  - url: http://localhost:54321/functions/v1
    description: Local development server
```

### Authentication

```yaml
components:
  securitySchemes:
    ApiKeyAuth:
      type: apiKey
      in: header
      name: apikey

    BearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
```

### Request/Response Schemas

```yaml
components:
  schemas:
    AuthSuccessResponse:
      type: object
      properties:
        success:
          type: boolean
        data:
          type: object
          properties:
            accessToken:
              type: string
            userId:
              type: string
            # ... other fields
```

---

## Examples

### Authentication Request

```yaml
requestBody:
  content:
    application/json:
      schema:
        type: object
        required: [action, payload]
        properties:
          action:
            type: string
            enum: [login, signup, logout, validate]
          payload:
            type: object
      examples:
        login:
          value:
            action: login
            payload:
              email: john@example.com
              password: securepass123
```

### Success Response

```yaml
responses:
  '200':
    content:
      application/json:
        schema:
          type: object
          properties:
            success:
              type: boolean
              example: true
            data:
              type: object
        examples:
          login_success:
            value:
              success: true
              data:
                accessToken: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
                userId: user_abc123
                userType: Guest
```

### Error Response

```yaml
responses:
  '400':
    content:
      application/json:
        schema:
          $ref: '#/components/schemas/ErrorResponse'
        examples:
          validation_error:
            value:
              success: false
              error: Email is required
```

---

## Common Schemas

### Success Response

```yaml
SuccessResponse:
  type: object
  properties:
    success:
      type: boolean
      example: true
    data:
      type: object
      additionalProperties: true
```

### Error Response

```yaml
ErrorResponse:
  type: object
  properties:
    success:
      type: boolean
      example: false
    error:
      type: string
      description: Human-readable error message
```

### Edge Function Request

```yaml
EdgeFunctionRequest:
  type: object
  required:
    - action
    - payload
  properties:
    action:
      type: string
      description: The action to perform
    payload:
      type: object
      description: Action-specific data
```

---

## Security

### API Key Authentication

For public endpoints:

```yaml
security:
  - ApiKeyAuth: []
```

**Header**:
```
apikey: YOUR_SUPABASE_ANON_KEY
```

---

### Bearer Token Authentication

For authenticated endpoints:

```yaml
security:
  - BearerAuth: []
```

**Header**:
```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

---

## Validating Specifications

### Validate with Swagger CLI

```bash
npm install -g @apidevtools/swagger-cli

swagger-cli validate auth-user-openapi.yaml
```

---

### Validate with Redocly CLI

```bash
npm install -g @redocly/cli

redocly lint auth-user-openapi.yaml
```

---

## Converting Formats

### OpenAPI to HTML

```bash
# Using redocly
redocly bundle auth-user-openapi.yaml -o index.html

# Using swagger-ui
swagger-ui auth-user-openapi.yaml -o index.html
```

---

### OpenAPI to Markdown

```bash
npm install -g widdershins

widdershins auth-user-openapi.yaml -o readme.md
```

---

### OpenAPI to JSON

```bash
npm install -g js-yaml

js-yaml auth-user-openapi.yaml > auth-user-openapi.json
```

---

## Best Practices

### Versioning

Include version in info section:
```yaml
info:
  version: 1.0.0
```

### Descriptions

Provide clear descriptions for:
- Overall API
- Each endpoint
- Each parameter
- Each schema

### Examples

Include examples for:
- Request bodies
- Responses (success and error)
- Parameters

### Security

Specify security requirements for each endpoint:
```yaml
security:
  - BearerAuth: []
```

### Tags

Group endpoints with tags:
```yaml
tags:
  - name: Authentication
    description: User authentication operations
  - name: Proposals
    description: Proposal management
```

---

## See Also

- [Edge Functions Reference](../edge-functions/README.md)
- [Code Examples](../examples/README.md)
- [TypeScript Types](../types/README.md)

---

## Resources

- [OpenAPI Specification](https://swagger.io/specification/)
- [Swagger UI](https://swagger.io/tools/swagger-ui/)
- [Redoc](https://github.com/Redocly/redoc)
- [OpenAPI Tools](https://openapi-generator.tech/)
