# Playme API Documentation

## Overview

Playme API is a FastAPI-based backend service that manages device trials, token-based activation, and runtime configuration. The API supports trial periods, activation tokens with multi-device support, and proxy configuration management.

**Base URL**: `http://144.172.88.9:8000`

**API Name**: Playme API

---

## Table of Contents

- [Authentication](#authentication)
- [App Routes](#app-routes)
- [Admin Routes](#admin-routes)
- [Update Routes](#update-routes)
- [Health Check](#health-check)
- [Error Handling](#error-handling)

---

## Authentication

### Admin Authentication

Admin endpoints require an API key passed in the request. The API key is configured via the `ADMIN_API_KEY` environment variable.

**Header**: `x-api-key: {ADMIN_API_KEY}`

---

## App Routes

All app routes are prefixed with `/app`.

### 1. Check Trial Status

**Endpoint**: `GET /app/trial/{mac}`

**Description**: Check if a device has an active trial, is already activated, or if the trial has expired.

**Parameters**:
- `mac` (string, path): MAC address of the device

**Response Examples**:

**Device Not Registered** (New device):
```json
{
  "not_registered": true
}
```

**Paid/Activated Device** (Has active subscription):
```json
{
  "already_active": true,
  "expires_at": "2026-02-15T10:30:00+00:00"
}
```

**Trial Active**:
```json
{
  "trial_active": true,
  "expires_at": "2026-01-30T14:22:15.123456+00:00"
}
```

**Trial Expired**:
```json
{
  "trial_expired": true
}
```

**Status Codes**:
- `200 OK`: Trial status retrieved successfully
- `500 Internal Server Error`: Server error

---

### 2. Start Trial

**Endpoint**: `POST /app/trial/start`

**Description**: Start a new trial period for a device. Trials last for a configured number of days (default: 3 days).

**Request Body**:
```json
{
  "mac_address": "00:11:22:33:44:55",
  "email": "user@example.com"
}
```

**Fields**:
- `mac_address` (string, required): MAC address of the device
- `email` (string, required): Valid email address

**Response**:
```json
{
  "trial_started": true,
  "expires_at": "2026-01-30T14:22:15.123456+00:00"
}
```

**Alternate Response** (Device already exists):
```json
{
  "already_exists": true
}
```

**Status Codes**:
- `200 OK`: Trial started successfully
- `422 Unprocessable Entity`: Invalid email format or missing fields

**Notes**:
- Trials cannot be reset for existing devices (safety feature)
- The expiration date is calculated as: current UTC time + TRIAL_DAYS

---

### 3. Activate Token

**Endpoint**: `POST /app/activate`

**Description**: Activate a device using a premium activation token. Each token can be used on up to TOKEN_MAX_DEVICES devices (default: 2).

**Request Body**:
```json
{
  "mac_address": "00:11:22:33:44:55",
  "email": "user@example.com",
  "token": "a1b2c3d4e5f6g7h8"
}
```

**Fields**:
- `mac_address` (string, required): MAC address of the device
- `email` (string, required): User email address
- `token` (string, required): Activation token

**Response**:
```json
{
  "expires_at": "2026-02-27T14:22:15.123456+00:00"
}
```

**Status Codes**:
- `200 OK`: Token activated successfully
- `400 Bad Request`: Invalid or already revoked token
- `403 Forbidden`: Token limit reached (all device slots are occupied)
- `422 Unprocessable Entity`: Invalid request data

**Notes**:
- Each token has a defined duration (in days)
- Activation expires at: current UTC time + token.duration_days
- Existing devices are updated; new devices are created

---

### 4. Get Runtime Configuration

**Endpoint**: `GET /app/config/{mac}`

**Description**: Fetch runtime configuration and authorization status for an active device.

**Parameters**:
- `mac` (string, path): MAC address of the device

**Response** (Device is active and not expired - Trial):
```json
{
  "allowed": true,
  "expires_at": "2026-01-30T14:22:15.123456+00:00",
  "is_trial": true,
  "token_id": null
}
```

**Response** (Device is active and not expired - Token-based):
```json
{
  "allowed": true,
  "expires_at": "2026-02-27T14:22:15.123456+00:00",
  "is_trial": false,
  "token_id": "a1b2c3d4e5f6g7h8"
}
```

**Response** (Device is inactive or expired):
```json
{
  "allowed": false
}
```

**Status Codes**:
- `200 OK`: Configuration retrieved successfully

**Response Fields**:
- `allowed` (boolean): Whether the device is active and not expired
- `expires_at` (string, ISO 8601): Device activation expiration timestamp
- `is_trial` (boolean): Whether this is a trial activation (true) or token-based (false)
- `token_id` (string or null): The activation token ID if using paid activation; null if trial

**Notes**:
- Returns device authorization status and subscription information
- Use `is_trial` and `token_id` to determine the activation type

---

## Admin Routes

All admin routes are prefixed with `/admin` and require authentication via `ADMIN_API_KEY`.

### 1. Create Activation Tokens

**Endpoint**: `POST /admin/tokens`

**Description**: Generate new activation tokens with specified validity period.

**Parameters** (Query):
- `days` (integer, required): Duration in days for which the token is valid
- `count` (integer, required): Number of tokens to generate

**Example Request**: `POST /admin/tokens?days=30&count=5`

**Response**:
```json
{
  "tokens": [
    "a1b2c3d4e5f6g7h8",
    "i9j8k7l6m5n4o3p2",
    "q1r2s3t4u5v6w7x8",
    "y9z0a1b2c3d4e5f6",
    "g7h8i9j0k1l2m3n4"
  ]
}
```

**Status Codes**:
- `200 OK`: Tokens created successfully
- `403 Forbidden`: Authentication failed
- `422 Unprocessable Entity`: Invalid parameters

**Notes**:
- Each token is a 16-character hex string
- Token expiration is set to: current UTC time + days

---

### 2. List All Devices

**Endpoint**: `GET /admin/devices`

**Description**: Retrieve a list of all registered devices.

**Response**:
```json
[
  {
    "mac_address": "00:11:22:33:44:55",
    "email": "user@example.com",
    "is_trial": false,
    "expires_at": "2026-02-27T14:22:15.123456",
    "active": true,
    "token_id": "a1b2c3d4e5f6g7h8",
    "created_at": "2026-01-27T14:22:15.123456"
  },
  {
    "mac_address": "aa:bb:cc:dd:ee:ff",
    "email": "admin@example.com",
    "is_trial": true,
    "expires_at": "2026-01-30T14:22:15.123456",
    "active": true,
    "token_id": null,
    "created_at": "2026-01-27T10:00:00.123456"
  }
]
```

**Status Codes**:
- `200 OK`: Devices retrieved successfully
- `403 Forbidden`: Authentication failed

---

### 3. Deactivate Device

**Endpoint**: `POST /admin/devices/{mac}/deactivate`

**Description**: Deactivate a specific device by MAC address.

**Parameters**:
- `mac` (string, path): MAC address of the device to deactivate

**Example Request**: `POST /admin/devices/00:11:22:33:44:55/deactivate`

**Response**:
```json
{
  "status": "ok"
}
```

**Status Codes**:
- `200 OK`: Device deactivated successfully
- `403 Forbidden`: Authentication failed

**Notes**:
- Deactivated devices will receive `"allowed": false` when checking config
- Device record is not deleted, only marked as inactive

---

### 4. Set Proxy Configuration

**Endpoint**: `POST /admin/proxy`

**Description**: Configure global proxy settings. Supports `direct` (no proxy) or `socks5` mode with optional credentials.

**Request Body (direct)**:
```json
{
  "mode": "direct"
}
```

**Request Body (socks5)**:
```json
{
  "mode": "socks5",
  "socks": {
    "host": "1.2.3.4",
    "port": 1080,
    "user": "proxyuser",
    "pass": "proxypass"
  }
}
```

**Response**:
```json
{
  "status": "ok",
  "previous_mode": "direct",
  "current_mode": "socks5",
  "socks5": {
    "host": "1.2.3.4",
    "port": 1080,
    "user": "proxyuser"
  }
}
```

**Notes**:
- Saves `proxy_mode` and `socks5` config into the global config table.
- When switching to `direct`, any stored `socks5` config is removed.

---

### 5. Message Management (Admin)

Admin can create, list, view, update, enable/disable and delete messages.

**Create Message**

**Endpoint**: `POST /admin/messages`

**Request Body**:
```json
{
  "title": "Important notice",
  "content": "Service will be down for maintenance.",
  "enabled": true
}
```

**Response**: `MessageResponse` (see schemas)

**List Messages**

**Endpoint**: `GET /admin/messages`

**Response**: Array of `MessageResponse` objects

**Get Message**

**Endpoint**: `GET /admin/messages/{message_id}`

**Update Message**

**Endpoint**: `PUT /admin/messages/{message_id}`

**Request Body** (any field optional):
```json
{
  "title": "Updated title",
  "content": "Updated content",
  "enabled": false
}
```

**Enable / Disable**

**Endpoint**: `POST /admin/messages/{message_id}/enable`

**Endpoint**: `POST /admin/messages/{message_id}/disable`

**Delete Message**

**Endpoint**: `DELETE /admin/messages/{message_id}`

**Response**:
```json
{ "status": "ok" }
```

---

### 6. Heartbeats (Admin)

**List Heartbeats**

**Endpoint**: `GET /admin/heartbeats`

**Response**: `HeartbeatListResponse` containing list of devices with `mac`, `first_seen`, `last_seen`.

**Get Heartbeat**

**Endpoint**: `GET /admin/heartbeats/{mac}`

**Response**: `HeartbeatItem` for the given `mac`.

---

### 7. App Status Management (Admin)

**Endpoint**: `PUT /admin/app/status`

**Description**: Set global app status (allowed or not) and optional expiration time. `expires_at` should be an ISO 8601 string.

**Request Body**:
```json
{
  "allowed": true,
  "expires_at": "2026-02-27T12:00:00+00:00"
}
```

**Response**:
```json
{
  "allowed": true,
  "expires_at": "2026-02-27T12:00:00"
}
```

**Notes**:
- If `expires_at` is omitted, the server will set it to now (effectively immediate).
- Use this to globally enable/disable the app for all devices.

---

### React (Admin panel) quick examples

- Send admin requests with the `x-api-key` header set to your `ADMIN_API_KEY`.

Create token example:

```javascript
fetch('/admin/tokens?days=30&count=3', {
  method: 'POST',
  headers: { 'x-api-key': process.env.ADMIN_API_KEY }
}).then(r => r.json()).then(console.log)
```

Create message example:

```javascript
fetch('/admin/messages', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': process.env.ADMIN_API_KEY
  },
  body: JSON.stringify({ title: 'Notice', content: 'Text', enabled: true })
}).then(r => r.json()).then(console.log)
```

Set proxy example:

```javascript
fetch('/admin/proxy', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': process.env.ADMIN_API_KEY
  },
  body: JSON.stringify({ mode: 'socks5', socks: { host: '1.2.3.4', port: 1080 } })
})
.then(r => r.json()).then(console.log)
```

---

## Update Routes

All update routes are prefixed with `/update`.

### 1. Check for Updates

**Endpoint**: `GET /update`

**Description**: Check for the latest application version and download URL.

**Response**:
```json
{
  "latest_version": 1,
  "force_update": false,
  "apk_url": "https://updates.playme.app/playme.apk"
}
```

**Fields**:
- `latest_version` (integer): Current latest version number
- `force_update` (boolean): Whether to force client update
- `apk_url` (string): URL to download the APK file

**Status Codes**:
- `200 OK`: Update information retrieved successfully

---

## Health Check

### 1. Health Status

**Endpoint**: `GET /health`

**Description**: Check if the API is running and healthy.

**Response**:
```json
{
  "status": "healthy"
}
```

**Status Codes**:
- `200 OK`: API is healthy and running

---

### 2. Root Endpoint

**Endpoint**: `GET /`

**Description**: Welcome message.

**Response**:
```json
{
  "message": "Playme API is running with CORS enabled"
}
```

---

## Error Handling

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| `200` | Success |
| `400` | Bad Request (invalid token, etc.) |
| `403` | Forbidden (authentication failed, token limit reached) |
| `422` | Unprocessable Entity (validation error) |
| `500` | Internal Server Error |

### Error Response Format

```json
{
  "detail": "Error message describing what went wrong"
}
```

---

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `APP_NAME` | "Playme" | Application name |
| `DATABASE_URL` | "sqlite:///./playme.db" | Database connection URL |
| `ADMIN_API_KEY` | (required) | API key for admin endpoints |
| `APP_VERSION` | 1 | Current application version |
| `TRIAL_DAYS` | 3 | Duration of trial period in days |
| `TOKEN_MAX_DEVICES` | 2 | Maximum devices per activation token |

### CORS Configuration

The API allows requests from:
- `http://144.172.88.9`
- `http://127.0.0.1:3000`

---

## Data Models

### Device

| Field | Type | Description |
|-------|------|-------------|
| `mac_address` | String (Primary Key) | Device MAC address |
| `email` | String | User email address |
| `is_trial` | Boolean | Whether the device is on trial |
| `expires_at` | DateTime | Expiration timestamp |
| `active` | Boolean | Whether the device is active |
| `token_id` | String (Foreign Key) | Associated activation token |
| `created_at` | DateTime | Device registration timestamp |

### Token

| Field | Type | Description |
|-------|------|-------------|
| `token` | String (Primary Key) | Token value (hex string) |
| `duration_days` | Integer | Token validity in days |
| `expires_at` | DateTime | Token expiration timestamp |
| `revoked` | Boolean | Whether the token is revoked |

### Global Config

| Field | Type | Description |
|-------|------|-------------|
| `key` | String (Primary Key) | Configuration key |
| `value` | String | Configuration value |

---

## Usage Examples

### Example 1: Start a Trial

```bash
curl -X POST http://144.172.88.9:8000/app/trial/start \
  -H "Content-Type: application/json" \
  -d '{
    "mac_address": "00:11:22:33:44:55",
    "email": "user@example.com"
  }'
```

### Example 2: Check Trial Status

```bash
curl http://144.172.88.9:8000/app/trial/00:11:22:33:44:55
```

### Example 3: Create Admin Tokens

```bash
curl -X POST "http://144.172.88.9:8000/admin/tokens?days=30&count=5" \
  -H "Authorization: Bearer YOUR_ADMIN_API_KEY"
```

### Example 4: Activate Device with Token

```bash
curl -X POST http://144.172.88.9:8000/app/activate \
  -H "Content-Type: application/json" \
  -d '{
    "mac_address": "00:11:22:33:44:55",
    "email": "user@example.com",
    "token": "a1b2c3d4e5f6g7h8"
  }'
```

### Example 5: Get Device Configuration

```bash
curl http://144.172.88.9:8000/app/config/00:11:22:33:44:55
```

---

## Android App Integration Flow

This section describes the recommended flow for integrating Playme activation with your Android app.

### 1. Initial App Launch - Check Device Status

**Step 1.1: Check Trial Status**

Make a GET request to check if the device has an active trial:

```
GET http://144.172.88.9:8000/app/trial/{mac_address}
```

Replace `{mac_address}` with the device's MAC address (e.g., `00:11:22:33:44:55`).

**Possible Responses:**

**Response A - Trial is Active:**
```json
{
  "trial_active": true,
  "expires_at": "2026-01-27T06:59:11.759190+00:00"
}
```
**Action**: Display "TRIAL" label in green and show expiry date. Allow app access.

**Response B - Device Not Registered:**
```json
{
  "not_registered": true
}
```
**Action**: Show popup with two options:
- "Start 3-Day Trial"
- "Activate with Token/Coupon"

**Response C - Trial Expired:**
```json
{
  "trial_expired": true
}
```
**Action**: Show popup with message "Trial expired" and one option:
- "Activate with Token/Coupon"

**Response D - Device is Paid/Active:**
```json
{
  "already_active": true,
  "expires_at": "2026-02-27T06:59:11.759190+00:00"
}
```
**Action**: Display "ACTIVE" label and allow app access.

---

### 2. Starting a Trial

**Step 2.1: User Selects "Start 3-Day Trial"**

If the device is not registered, show a popup asking for the user's email address.

**Step 2.2: Send Trial Start Request**

Make a POST request to start the trial:

```
POST http://144.172.88.9:8000/app/trial/start
Content-Type: application/json

{
  "mac_address": "00:11:22:33:44:55",
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "trial_started": true,
  "expires_at": "2026-01-30T06:59:11.759190+00:00"
}
```

**Step 2.3: Confirm Trial Status**

After successful response, make another GET request to `/app/trial/{mac}` to confirm the trial is active, then allow app access and display "TRIAL" label in green with expiry date.

---

### 3. Activating with Token/Coupon

**Step 3.1: User Selects "Activate with Token/Coupon"**

Show a popup asking for:
1. Email address
2. Activation token/coupon code

**Step 3.2: Send Activation Request**

Make a POST request to activate the device:

```
POST http://144.172.88.9:8000/app/activate
Content-Type: application/json

{
  "mac_address": "00:11:22:33:44:55",
  "email": "user@example.com",
  "token": "a1b2c3d4e5f6g7h8"
}
```

**Success Response (200 OK):**
```json
{
  "expires_at": "2026-02-27T06:59:11.759190+00:00"
}
```
**Action**: Display success message and allow app access. Update UI to show "ACTIVE" label with expiry date.

**Error Responses:**

**Invalid Token (400 Bad Request):**
```json
{
  "detail": "Invalid token"
}
```
**Action**: Show error popup "Invalid token. Please check and try again."

**Token Limit Reached (403 Forbidden):**
```json
{
  "detail": "Token limit reached"
}
```
**Action**: Show error popup "This token has reached the maximum number of devices. Please contact support."

---

### 4. Ongoing - Check Subscription/Config Status

**Step 4.1: Regular Authorization Check**

Before allowing user to access app features, check the device authorization:

```
GET http://144.172.88.9:8000/app/config/{mac_address}
```

**Response - Device is Authorized:**
```json
{
  "allowed": true,
  "expires_at": "2026-02-27T06:59:11.759190+00:00",
  "is_trial": false,
  "token_id": "a1b2c3d4e5f6g7h8"
}
```

**Action**: Allow app usage. The `is_trial` field indicates whether it's a trial (true) or paid (false).

**Response - Device is Not Authorized:**
```json
{
  "allowed": false
}
```

**Action**: Block app access and show message "Your subscription has expired. Please activate with a token to continue."

---

### 5. Complete Decision Tree

```
┌─────────────────────────┐
│   App Launch            │
│   Get Device MAC        │
└────────────┬────────────┘
             │
             v
   ┌─────────────────────────────┐
   │ GET /app/trial/{mac}        │
   └────────────┬────────────────┘
                │
        ┌───────┴───────┬──────────┬────────────┐
        │               │          │            │
        v               v          v            v
   TRIAL_ACTIVE   NOT_REGISTERED  TRIAL_EXPIRED ALREADY_ACTIVE
        │               │          │            │
        │               v          v            │
        │        ┌──────────────┐  │            │
        │        │ Show Popup:  │  │            │
        │        │ [Trial]      │  │            │
        │        │ [Token]      │  │            │
        │        └──┬────────┬──┘  │            │
        │           │        │     │            │
        │           v        v     v            │
        │      TRIAL    TOKEN  TOKEN_ONLY      │
        │        │        │       │            │
        │        │        v       v            │
        │        │   ┌──────────────────┐      │
        │        │   │ Popup: Ask Email │      │
        │        │   │ & Token          │      │
        │        │   └────────┬─────────┘      │
        │        │            │                │
        │        v            v                │
        │   ┌──────────────────────────┐       │
        │   │ Popup: Ask Email         │       │
        │   └────────┬─────────────────┘       │
        │            │                        │
        │            v                        │
        │   ┌────────────────────────────┐    │
        │   │ POST /app/trial/start      │    │
        │   │ POST /app/activate         │    │
        │   │ POST /app/activate         │    │
        │   └──────────┬─────────────────┘    │
        │              │                      │
        │     ┌────────┴────────┐             │
        │     │                 │             │
        │  Success          Error             │
        │     │                 │             │
        │     v                 v             │
        │  Re-check         Show Error        │
        │  Trial/Config     Message           │
        │     │                 │             │
        └─────┴─────────────────┴─────────────┘
             │
             v
    ┌──────────────────────┐
    │ Check /app/config    │
    │ for authorization    │
    └──────────┬───────────┘
               │
         ┌─────┴──────┐
         │            │
         v            v
      ALLOWED    NOT_ALLOWED
         │            │
         v            v
    Allow App    Block App
    Access       Access
```

---

### 6. Android Implementation Pseudocode

Here's a pseudocode example for your Android app:

```kotlin
class ActivationManager {
    
    fun checkAndInitialize() {
        val mac = getDeviceMacAddress()
        checkTrialStatus(mac)
    }
    
    fun checkTrialStatus(mac: String) {
        api.getTrialStatus(mac) { response ->
            when {
                response.trial_active -> {
                    showTrialActive(response.expires_at)
                    allowAppAccess()
                }
                response.not_registered -> {
                    showActivationPopup(mac)
                }
                response.trial_expired -> {
                    showTokenOnlyPopup(mac)
                }
                response.already_active -> {
                    showAlreadyActive(response.expires_at)
                    allowAppAccess()
                }
            }
        }
    }
    
    fun showActivationPopup(mac: String) {
        // Show dialog with two buttons
        val dialog = AlertDialog.Builder(context)
            .setTitle("Activate Playme")
            .setMessage("Choose activation method:")
            .setPositiveButton("Start 3-Day Trial") { _, _ ->
                askEmailAndStartTrial(mac)
            }
            .setNegativeButton("Use Token/Coupon") { _, _ ->
                askEmailAndToken(mac)
            }
            .create()
        dialog.show()
    }
    
    fun askEmailAndStartTrial(mac: String) {
        val emailInput = getEmailFromUser() // Show email input dialog
        api.startTrial(
            mac_address = mac,
            email = emailInput
        ) { response ->
            if (response.trial_started) {
                // Recheck trial status
                checkTrialStatus(mac)
            }
        }
    }
    
    fun askEmailAndToken(mac: String) {
        val email = getEmailFromUser()
        val token = getTokenFromUser() // Show token input dialog
        
        api.activateToken(
            mac_address = mac,
            email = email,
            token = token
        ) { response, error ->
            when {
                response != null -> {
                    showSuccessMessage("Activation successful!")
                    allowAppAccess()
                }
                error?.contains("Invalid token") == true -> {
                    showErrorDialog("Invalid token. Please check and try again.")
                }
                error?.contains("Token limit reached") == true -> {
                    showErrorDialog("Token limit reached. Please contact support.")
                }
                else -> {
                    showErrorDialog("Activation failed. Please try again.")
                }
            }
        }
    }
    
    fun checkAppAuthorization(mac: String) {
        api.getConfig(mac) { response ->
            when {
                response.allowed -> {
                    allowAppAccess()
                    updateExpiryUI(response.expires_at, response.is_trial)
                }
                !response.allowed -> {
                    blockAppAccess()
                    showMessage("Your subscription has expired.")
                }
            }
        }
    }
    
    fun showTrialActive(expiresAt: String) {
        statusView.text = "TRIAL"
        statusView.setTextColor(Color.GREEN)
        expiryView.text = "Expires: $expiresAt"
    }
    
    fun showAlreadyActive(expiresAt: String) {
        statusView.text = "ACTIVE"
        statusView.setTextColor(Color.BLUE)
        expiryView.text = "Expires: $expiresAt"
    }
}
```

---

### 7. Error Handling Best Practices

1. **Network Errors**: If API call fails, show "Connection error. Please check your internet and try again."
2. **Expired Credentials**: If config check returns `allowed: false`, prompt user to renew subscription.
3. **Invalid Email**: If email format is rejected, show "Please enter a valid email address."
4. **Retry Logic**: Implement exponential backoff for network retries (max 3 attempts recommended).
5. **Timeout Handling**: Set 30-second timeout for API calls; show user-friendly timeout message.

---

### 8. Data to Cache Locally

Recommended local caching (Android SharedPreferences or equivalent):
- `mac_address`: Device MAC address
- `email`: Last used email (optional, for convenience)
- `activation_type`: "trial" or "paid" (from `is_trial` field)
- `expires_at`: Expiration timestamp
- `last_config_check`: Timestamp of last config check

**Cache Refresh**: Re-check `/app/config/{mac}` every time the app launches or every 24 hours.

---

## Notes\n\n- All timestamps are in UTC (ISO 8601 format)
- MAC addresses should be in standard format (e.g., `00:11:22:33:44:55`)
- Email validation is enforced on trial start and activation
- Devices can only activate one token at a time
- Trial periods cannot be reset once started
- Always check trial status first before checking full config
- Use the `is_trial` flag to differentiate between trial and paid activations
- Never hardcode the API base URL; make it configurable in your app settings
