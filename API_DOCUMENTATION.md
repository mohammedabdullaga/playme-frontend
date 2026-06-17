# PlayMe API Documentation

## Overview
This document describes the existing and new endpoints for the PlayMe backend API. The current logic still supports activation by token and email, with a maximum of 2 devices per token and 2 devices per email license.

---

## App Endpoints

### GET /app/status
Returns current app license status.

Response:
```json
{
  "allowed": true,
  "expires_at": "2026-06-17T12:00:00Z"
}
```

### POST /app/heartbeat
Registers a heartbeat from a device.

Request:
```json
{
  "mac": "AA:BB:CC:DD:EE:FF"
}
```

Response:
```json
{
  "ok": true
}
```

### GET /app/trial/{mac}
Checks trial or activation state for a device.

Response examples:
```json
{ "not_registered": true }
{ "already_active": true, "expires_at": "..." }
{ "trial_active": true, "expires_at": "..." }
{ "trial_expired": true }
```

### POST /app/trial/start
Starts a trial for a device.

Request:
```json
{
  "mac_address": "AA:BB:CC:DD:EE:FF",
  "email": "user@example.com"
}
```

Response:
```json
{
  "trial_started": true,
  "expires_at": "..."
}
```

### POST /app/activate
Activates a token for a specific device.
Each token may be activated on up to 2 unique devices (different MAC addresses).

Request:
```json
{
  "mac_address": "AA:BB:CC:DD:EE:FF",
  "email": "user@example.com",
  "token": "ABCDEF12"
}
```

Response:
```json
{
  "expires_at": "..."
}
```

Error:
- `403 Token limit reached` when the token is already active on 2 devices.
- `400 Invalid token` when the token is invalid or revoked.

### POST /app/authorize/email
Authorizes a device for an email license.
Each email may be active on up to 2 devices at once.

Request:
```json
{
  "mac_address": "AA:BB:CC:DD:EE:FF",
  "email": "user@example.com"
}
```

Response:
```json
{
  "authorized": true,
  "expires_at": "..."
}
```

Error:
- `403 Email has no valid license`
- `403 Email device limit reached`

### GET /app/config/{mac}
Returns whether the device is currently allowed to run.

Response:
```json
{
  "allowed": true,
  "expires_at": "...",
  "is_trial": false,
  "token_id": "ABCDEF12"
}
```

### GET /app/message
Returns the latest enabled message for the Android app UI.

Response:
```json
{
  "message": {
    "id": "...",
    "title": "...",
    "content": "...",
    "enabled": true,
    "created_at": "..."
  }
}
```

---

## Admin Endpoints
All admin endpoints require the `admin_auth` dependency and the configured admin API key.

### Token management

#### POST /admin/tokens
Create new tokens.

Query parameters:
- `days` (int)
- `count` (int)

Response:
```json
{
  "tokens": ["ABCDEF12", "GHIJKL34"]
}
```

### Device management

#### GET /admin/devices
List all registered devices.

#### POST /admin/devices/{mac}/deactivate
Deactivate a device by MAC.

#### POST /admin/devices/{mac}/activate
Activate a device by MAC.

#### PUT /admin/devices/{mac}
Update a device record.

Request body fields:
- `email` (optional)
- `active` (optional)
- `is_trial` (optional)
- `expires_at` (optional datetime)
- `token` (optional token string)

---

## Account / User CRUD Endpoints
These new endpoints allow managing accounts by email.

### GET /admin/accounts
List all accounts.

Response:
```json
{
  "accounts": [
    {
      "email": "user@example.com",
      "device_count": 2,
      "active_device_count": 2,
      "token_count": 1
    }
  ]
}
```

### GET /admin/accounts/{email}
Get account details for one email.

Response:
```json
{
  "email": "user@example.com",
  "device_count": 2,
  "active_device_count": 2,
  "tokens": ["ABCDEF12"],
  "devices": [
    {
      "mac_address": "AA:BB:CC:DD:EE:FF",
      "token_id": "ABCDEF12",
      "is_trial": false,
      "active": true,
      "expires_at": "..."
    },
    {
      "mac_address": "11:22:33:44:55:66",
      "token_id": "ABCDEF12",
      "is_trial": false,
      "active": true,
      "expires_at": "..."
    }
  ]
}
```

### PUT /admin/accounts/{email}
Update an account by email.

Request body fields:
- `new_email` (optional): change the account email.
- `expires_at` (optional datetime): set a new expiration date for all devices.
- `extend_days` (optional int): extend expiration by days for all devices.
- `active` (optional bool): set all devices active or inactive.

Example request:
```json
{
  "extend_days": 30,
  "active": false
}
```

### DELETE /admin/accounts/{email}
Delete all devices for an account, effectively removing the account.

Response:
```json
{ "status": "ok" }
```

---

## Notes
- `TOKEN_MAX_DEVICES` is configured as `2` in `app/core/config.py`.
- `EMAIL_MAX_DEVICES` is configured as `2` in `app/core/config.py`.
- Each token can be activated on up to 2 different MAC addresses.
- Account update operations apply to all devices tied to the same email.

---

## Example Front-End Workflow
1. Call `/app/activate` with token, MAC address, and email.
2. Call `/app/config/{mac}` to confirm allowed status.
3. Admin can use `/admin/accounts/{email}` to inspect which tokens are active for that account.
4. Admin can use `/admin/accounts/{email}` to update or deactivate the account.
