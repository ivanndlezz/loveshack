# SHUM API — Technical Documentation

**Version:** 2.0  
**Last Updated:** January 2026  
**Author:** Klef Development Team  
**Status:** Production Ready

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Installation](#installation)
4. [API Reference](#api-reference)
5. [Request Format](#request-format)
6. [Response Format](#response-format)
7. [CRUD Operations](#crud-operations)
8. [Error Handling](#error-handling)
9. [Security](#security)
10. [Performance](#performance)
11. [Best Practices](#best-practices)
12. [Troubleshooting](#troubleshooting)

---

## Overview

### What is SHUM?

**SHUM** (`heb. establecer, colocar, asignar`) is a universal PHP middleware designed to act as a secure, flexible, and scalable bridge between any frontend application and Airtable databases.

### Key Features

- ✅ **Single Endpoint Architecture** — One `api.php` file handles all CRUD operations
- ✅ **Multi-Base Support** — Connect to unlimited Airtable bases
- ✅ **Multi-Table Support** — Dynamic table routing without backend changes
- ✅ **Schema Agnostic** — Works with any Airtable structure
- ✅ **Security First** — API key isolation, CORS control, request validation
- ✅ **Standardized Responses** — Consistent JSON output format
- ✅ **Zero Dependencies** — Pure PHP with cURL (no external libraries)

### Use Cases

- Frontend apps (React, Vue, vanilla JS)
- Mobile apps (React Native, Flutter)
- WordPress integrations
- No-code tools (n8n, Make, Zapier)
- Progressive Web Apps (PWAs)
- Server-side integrations

---

## Architecture

### System Diagram

```
┌─────────────────────────────────────┐
│   Frontend Application              │
│   (JS, React, Mobile, WordPress)    │
└─────────────────────────────────────┘
              ↓ POST JSON
┌─────────────────────────────────────┐
│   SHUM API (api.php)                │
│   ├── Request Validation            │
│   ├── Action Router                 │
│   ├── CRUD Functions                │
│   └── Response Handler              │
└─────────────────────────────────────┘
              ↓ cURL
┌─────────────────────────────────────┐
│   Airtable REST API v0              │
│   (https://api.airtable.com/v0/)    │
└─────────────────────────────────────┘
```

### File Structure

```
/
├── shum-api/
│   ├── api.php          ← Main endpoint (public)
│   └── README.md        ← Documentation
└── zakra/
    └── garden.php       ← Config file (protected, outside public_html)
```

### Configuration Management

**garden.php** (Outside public directory)

```php
<?php
// Airtable API Configuration
define('AIRTABLE_API_KEY', 'patXXXXXXXXXXXXXX');

// Optional: Multiple API keys for different environments
define('AIRTABLE_API_KEY_PROD', 'patPROD...');
define('AIRTABLE_API_KEY_DEV', 'patDEV...');

// Security
define('ALLOWED_ORIGINS', ['https://yourdomain.com', 'http://localhost:3000']);
define('RATE_LIMIT_PER_MINUTE', 100);
?>
```

---

## Installation

### Requirements

- PHP 8.0+ (recommended) or PHP 7.4+
- cURL extension enabled
- Apache/Nginx web server
- SSL certificate (Let's Encrypt recommended)

### Step 1: Download SHUM API

```bash
# Clone or download SHUM API
cd /var/www/
mkdir shum-api
cd shum-api
```

### Step 2: Upload api.php

Place the `api.php` file in a publicly accessible directory:

```
/var/www/html/shum-api/api.php
```

### Step 3: Configure garden.php

Create `garden.php` **outside** the public directory:

```bash
# Create config directory outside public_html
mkdir -p /var/www/zakra
nano /var/www/zakra/garden.php
```

Add your Airtable API key:

```php
<?php
define('AIRTABLE_API_KEY', 'patYourAirtableAPIKeyHere');
?>
```

### Step 4: Update api.php Path

In `api.php`, ensure the path to `garden.php` is correct:

```php
require_once('/var/www/zakra/garden.php');
```

### Step 5: Set Permissions

```bash
# Secure garden.php
chmod 600 /var/www/zakra/garden.php

# Make api.php executable
chmod 755 /var/www/html/shum-api/api.php
```

### Step 6: Test Installation

```bash
curl -X POST https://yourdomain.com/shum-api/api.php \
  -H "Content-Type: application/json" \
  -d '{
    "action": "list",
    "baseId": "appYourBaseId",
    "table": "YourTable"
  }'
```

// actualmente tenemos un shum api endpoint disponible en https://klef.newfacecards.com/shum-api/api.php

Expected response:

```json
{
  "success": true,
  "message": "Records retrieved successfully",
  "data": {
    "records": [...]
  }
}
```

---

## API Reference

### Endpoint

```
POST https://yourdomain.com/shum-api/api.php
```

### Headers

```
Content-Type: application/json
```

### Supported Actions

| Action   | Description            | Required Parameters              |
| -------- | ---------------------- | -------------------------------- |
| `create` | Create new record(s)   | baseId, table, data              |
| `update` | Update existing record | baseId, table, recordId, data    |
| `delete` | Delete record          | baseId, table, recordId          |
| `get`    | Get single record      | baseId, table, recordId          |
| `list`   | List/filter records    | baseId, table, filter (optional) |

---

## Request Format

### Standard Request Structure

```json
{
  "action": "string",
  "baseId": "string",
  "table": "string",
  "recordId": "string (optional)",
  "data": "object or array (optional)",
  "filter": "object (optional)"
}
```

### Parameter Details

#### `action` (required)

- Type: `string`
- Values: `create`, `update`, `delete`, `get`, `list`

#### `baseId` (required)

- Type: `string`
- Format: `app` + 14 alphanumeric characters
- Example: `appWUKGwSfJzOcy6o`

#### `table` (required)

- Type: `string`
- Format: Exact table name (case-sensitive)
- Example: `Clients`, `Projects`, `Tasks`

#### `recordId` (conditional)

- Type: `string`
- Required for: `update`, `delete`, `get`
- Format: `rec` + 14 alphanumeric characters
- Example: `recXYZ123abc456`

#### `data` (conditional)

- Type: `object` or `array`
- Required for: `create`, `update`
- Format: Field names as keys, values as Airtable-compatible types

#### `filter` (optional)

- Type: `object`
- Available for: `list` action
- Fields:
  - `maxRecords`: integer (default: 100)
  - `view`: string (Airtable view name)
  - `filterByFormula`: string (Airtable formula)
  - `sort`: array of objects

---

## Response Format

### Success Response

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    // Response data varies by action
  }
}
```

### Error Response

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message (optional)"
}
```

### HTTP Status Codes

| Code | Meaning               | SHUM Usage                  |
| ---- | --------------------- | --------------------------- |
| 200  | OK                    | Successful operation        |
| 400  | Bad Request           | Missing required parameters |
| 401  | Unauthorized          | Invalid Airtable API key    |
| 404  | Not Found             | Record/table not found      |
| 405  | Method Not Allowed    | Non-POST request            |
| 500  | Internal Server Error | Server/cURL error           |

---

## CRUD Operations

### CREATE — Create New Record(s)

#### Single Record

**Request:**

```json
{
  "action": "create",
  "baseId": "appWUKGwSfJzOcy6o",
  "table": "Clients",
  "data": {
    "Name": "Acme Corporation",
    "Email": "contact@acme.com",
    "Status": "Lead"
  }
}
```

**Response:**

```json
{
  "success": true,
  "message": "Record created successfully",
  "data": {
    "id": "recABC123",
    "fields": {
      "Name": "Acme Corporation",
      "Email": "contact@acme.com",
      "Status": "Lead"
    },
    "createdTime": "2026-01-30T10:30:00.000Z"
  }
}
```

#### Multiple Records

**Request:**

```json
{
  "action": "create",
  "baseId": "appWUKGwSfJzOcy6o",
  "table": "Tasks",
  "data": [
    {
      "Task Title": "Initial discovery",
      "Priority": "High"
    },
    {
      "Task Title": "Create wireframes",
      "Priority": "Medium"
    }
  ]
}
```

**Response:**

```json
{
  "success": true,
  "message": "2 records created successfully",
  "data": {
    "records": [
      {
        "id": "recDEF456",
        "fields": { "Task Title": "Initial discovery", "Priority": "High" }
      },
      {
        "id": "recGHI789",
        "fields": { "Task Title": "Create wireframes", "Priority": "Medium" }
      }
    ]
  }
}
```

---

### UPDATE — Update Existing Record

**Request:**

```json
{
  "action": "update",
  "baseId": "appWUKGwSfJzOcy6o",
  "table": "Clients",
  "recordId": "recABC123",
  "data": {
    "Status": "Active",
    "Last Contact": "2026-01-30"
  }
}
```

**Response:**

```json
{
  "success": true,
  "message": "Record updated successfully",
  "data": {
    "id": "recABC123",
    "fields": {
      "Name": "Acme Corporation",
      "Email": "contact@acme.com",
      "Status": "Active",
      "Last Contact": "2026-01-30"
    }
  }
}
```

---

### DELETE — Delete Record

**Request:**

```json
{
  "action": "delete",
  "baseId": "appWUKGwSfJzOcy6o",
  "table": "Clients",
  "recordId": "recABC123"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Record deleted successfully",
  "data": {
    "deleted": true,
    "id": "recABC123"
  }
}
```

---

### GET — Retrieve Single Record

**Request:**

```json
{
  "action": "get",
  "baseId": "appWUKGwSfJzOcy6o",
  "table": "Clients",
  "recordId": "recABC123"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Record retrieved successfully",
  "data": {
    "id": "recABC123",
    "fields": {
      "Name": "Acme Corporation",
      "Email": "contact@acme.com",
      "Status": "Active"
    },
    "createdTime": "2026-01-30T10:30:00.000Z"
  }
}
```

---

### LIST — List/Filter Records

#### Simple List (All Records)

**Request:**

```json
{
  "action": "list",
  "baseId": "appWUKGwSfJzOcy6o",
  "table": "Clients"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Records retrieved successfully",
  "data": {
    "records": [
      {
        "id": "recABC123",
        "fields": { "Name": "Acme Corporation", "Status": "Active" }
      },
      {
        "id": "recDEF456",
        "fields": { "Name": "Beta Inc", "Status": "Lead" }
      }
    ]
  }
}
```

#### Filtered List

**Request:**

```json
{
  "action": "list",
  "baseId": "appWUKGwSfJzOcy6o",
  "table": "Clients",
  "filter": {
    "maxRecords": 20,
    "filterByFormula": "{Status} = 'Active'",
    "sort": [
      {
        "field": "Created Date",
        "direction": "desc"
      }
    ]
  }
}
```

**Response:**

```json
{
  "success": true,
  "message": "20 records retrieved successfully",
  "data": {
    "records": [...]
  }
}
```

---

## Error Handling

### Common Errors

#### Missing Required Parameters

**Request:**

```json
{
  "action": "create",
  "baseId": "appWUKGwSfJzOcy6o"
  // Missing "table" parameter
}
```

**Response:**

```json
{
  "success": false,
  "message": "Missing required parameters: table"
}
```

#### Invalid Action

**Request:**

```json
{
  "action": "invalid_action",
  "baseId": "appWUKGwSfJzOcy6o",
  "table": "Clients"
}
```

**Response:**

```json
{
  "success": false,
  "message": "Invalid action: invalid_action"
}
```

#### Airtable API Error

**Response:**

```json
{
  "success": false,
  "message": "Airtable API error",
  "error": "INVALID_REQUEST_UNKNOWN: Field 'NonExistentField' does not exist"
}
```

---

## Security

### API Key Protection

**✅ DO:**

- Store API key in `garden.php` outside public directory
- Use environment variables in production
- Rotate API keys periodically
- Use Airtable's scoped tokens (limited permissions)

**❌ DON'T:**

- Hardcode API keys in `api.php`
- Commit `garden.php` to Git
- Expose API keys in frontend code
- Use same key for dev/staging/production

### CORS Configuration

Add to `api.php`:

```php
$allowedOrigins = ['https://yourdomain.com', 'https://app.yourdomain.com'];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

if (in_array($origin, $allowedOrigins)) {
    header("Access-Control-Allow-Origin: $origin");
    header("Access-Control-Allow-Methods: POST, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type");
}

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}
```

### Rate Limiting

Implement rate limiting:

```php
session_start();

$limit = 100; // requests per minute
$key = 'api_requests_' . $_SERVER['REMOTE_ADDR'];

if (!isset($_SESSION[$key])) {
    $_SESSION[$key] = ['count' => 0, 'time' => time()];
}

$elapsed = time() - $_SESSION[$key]['time'];

if ($elapsed < 60) {
    $_SESSION[$key]['count']++;
    if ($_SESSION[$key]['count'] > $limit) {
        http_response_code(429);
        echo json_encode(['success' => false, 'message' => 'Rate limit exceeded']);
        exit;
    }
} else {
    $_SESSION[$key] = ['count' => 1, 'time' => time()];
}
```

### Input Validation

Always validate input:

```php
// Validate baseId format
if (!preg_match('/^app[a-zA-Z0-9]{14}$/', $baseId)) {
    respondError('Invalid baseId format');
}

// Validate recordId format
if (!preg_match('/^rec[a-zA-Z0-9]{14}$/', $recordId)) {
    respondError('Invalid recordId format');
}

// Sanitize table name
$table = preg_replace('/[^a-zA-Z0-9_\s-]/', '', $table);
```

---

## Performance

### Optimization Tips

1. **Use Views for Filtering**
   - Pre-filter data in Airtable views
   - Faster than `filterByFormula`

2. **Limit Records**
   - Always set `maxRecords` in list operations
   - Default: 100 records

3. **Batch Operations**
   - Create multiple records in one request
   - Reduce API calls

4. **Caching**
   - Cache frequently accessed data
   - Use Redis/Memcached for production

5. **Async Requests**
   - Use JavaScript `Promise.all()` for parallel requests
   - Don't wait for sequential operations

### Performance Benchmarks

| Operation          | Avg Response Time |
| ------------------ | ----------------- |
| CREATE single      | 150-300ms         |
| UPDATE single      | 150-300ms         |
| DELETE single      | 100-200ms         |
| GET single         | 100-200ms         |
| LIST (100 records) | 200-400ms         |
| LIST (filtered)    | 300-500ms         |

_Benchmarks on GCP e2-medium with Airtable Creator Plan_

---

## Best Practices

### Frontend Integration

**JavaScript Example:**

```javascript
async function shumRequest(action, params) {
  try {
    const response = await fetch("https://yourdomain.com/shum-api/api.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...params }),
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message);
    }

    return result.data;
  } catch (error) {
    console.error("SHUM API Error:", error);
    throw error;
  }
}

// Usage
const clients = await shumRequest("list", {
  baseId: "appWUKGwSfJzOcy6o",
  table: "Clients",
  filter: { maxRecords: 50 },
});
```

### Error Handling Pattern

```javascript
try {
  const data = await shumRequest("create", {
    baseId: "appXYZ",
    table: "Clients",
    data: { Name: "Test" },
  });
  console.log("Created:", data);
} catch (error) {
  if (error.message.includes("INVALID_REQUEST")) {
    alert("Invalid data format");
  } else if (error.message.includes("UNAUTHORIZED")) {
    alert("Authentication error");
  } else {
    alert("An error occurred");
  }
}
```

### Linked Records

```javascript
// Create Project linked to Client
const project = await shumRequest("create", {
  baseId: "appXYZ",
  table: "Projects",
  data: {
    "Project Name": "Website Redesign",
    Client: ["recClientABC123"], // Array of record IDs
    Status: "Active",
  },
});
```

---

## Troubleshooting

### Issue: "CORS Error"

**Symptoms:** Browser shows CORS policy error

**Solution:**

1. Check `Access-Control-Allow-Origin` header in `api.php`
2. Add your frontend domain to allowed origins
3. Handle OPTIONS preflight requests

---

### Issue: "Invalid API Key"

**Symptoms:** Error 401, "AUTHENTICATION_REQUIRED"

**Solution:**

1. Verify API key in `garden.php`
2. Check API key has correct permissions in Airtable
3. Ensure API key hasn't expired

---

### Issue: "Field Does Not Exist"

**Symptoms:** "Field 'XYZ' does not exist"

**Solution:**

1. Check exact field name (case-sensitive)
2. Verify field exists in Airtable table
3. Use Airtable API metadata to confirm field names

---

### Issue: "Slow Response Times"

**Symptoms:** Requests take >1 second

**Solution:**

1. Use Airtable views instead of `filterByFormula`
2. Reduce `maxRecords` in list operations
3. Enable caching for frequently accessed data
4. Check server resources (CPU, memory)

---

## Changelog

### Version 2.0 (January 2026)

- Added multi-base support
- Improved error handling
- Added batch create operations
- Optimized cURL requests
- Enhanced security (input validation, rate limiting)

### Version 1.5 (December 2025)

- Added filter support for list operations
- Implemented standardized JSON responses
- Added CORS configuration

### Version 1.0 (October 2025)

- Initial release
- Basic CRUD operations
- Single endpoint architecture

---

## Support

**Documentation:** https://docs.klef.mx/shum-api  
**Issues:** support@klef.mx  
**GitHub:** (Private repository)

---

**© 2026 Klef. All rights reserved.**
