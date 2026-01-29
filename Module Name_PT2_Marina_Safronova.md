# Module Name_PT2_Marina_Safronova

**GitHub:** https://github.com/safronovamy/genai-copilot_pt2-orda

## Task: Build a Data Validation Module Using ChatGPT

### Objective

Learn how to use ChatGPT to generate, test, and document production-ready code for a real-world data validation feature.

### Feature

**Data Validation Module** — validates user input (email, password, phone number) using custom rules and user-friendly error messages.

---

## 1. Requirements Document

### Validation Rules

| Field | Rule | Description | Example Valid | Example Invalid | Error Message |
| --- | --- | --- | --- | --- | --- |
| Email | Format | Must follow standard email format (local@domain) | [user@test.com](mailto:user@test.com) | user@ | Invalid email format |
| Password | Length | Must be at least 8 characters long | Passw0rd! | Pass1! | Password must be at least 8 characters long |
| Password | Numeric character | Must contain at least one numeric digit (0–9) | Passw0rd! | Password! | Password must contain at least one number |
| Password | Special character | Must contain at least one special character | Passw0rd! | Password1 | Password must contain at least one special character |
| Phone | International format | Must follow international format (E.164, starting with +) | +14155552671 | 4155552671 | Invalid phone number format |

### Notes

- Validation rules are **explicit and deterministic**, enabling consistent behavior across backend logic and unit tests.
- Error messages are **user-friendly**, non-technical, and safe for exposure to end users.
- All error messages are designed to be returned in the `errors` array without leaking sensitive information.

---

## 2. Source Code

### validation.js

```js
// validation.js
// Data Validation Module (Node.js, ES6+, CommonJS)
//
// Exports:
//   - validateEmail(value)
//   - validatePassword(value)
//   - validatePhone(value)
//
// Each function returns:
//   { valid: boolean, errors: string[] }

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// E.164: "+" followed by 8..15 digits (common practical range)
const E164_REGEX = /^\+[1-9]\d{7,14}$/;

// Explicit whitelist of allowed special characters for password validation
const PASSWORD_SPECIAL_REGEX =
  /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/;

const ERROR_MESSAGES = Object.freeze({
  email_format: "Invalid email format",
  password_length: "Password must be at least 8 characters long",
  password_number: "Password must contain at least one number",
  password_special: "Password must contain at least one special character",
  phone_format: "Invalid phone number format",
});

function normalizeInput(value) {
  // Treat null/undefined as empty string for consistent validation behavior
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function result(errors) {
  return { valid: errors.length === 0, errors };
}

function validateEmail(value) {
  const v = normalizeInput(value);
  const errors = [];

  if (!EMAIL_REGEX.test(v)) {
    errors.push(ERROR_MESSAGES.email_format);
  }

  return result(errors);
}

function validatePassword(value) {
  const v = normalizeInput(value);
  const errors = [];

  // Length >= 8
  if (v.length < 8) {
    errors.push(ERROR_MESSAGES.password_length);
  }

  // At least one digit
  if (!/\d/.test(v)) {
    errors.push(ERROR_MESSAGES.password_number);
  }

  // At least one special character from explicit allowed set
  if (!PASSWORD_SPECIAL_REGEX.test(v)) {
    errors.push(ERROR_MESSAGES.password_special);
  }

  return result(errors);
}

function validatePhone(value) {
  const v = normalizeInput(value);
  const errors = [];

  if (!E164_REGEX.test(v)) {
    errors.push(ERROR_MESSAGES.phone_format);
  }

  return result(errors);
}

module.exports = {
  validateEmail,
  validatePassword,
  validatePhone,
  // exported for reuse (optional)
  ERROR_MESSAGES,
};

```

---

## 3. Database Schema

### schema.sql

```sql
-- schema.sql
-- Stores validation rules used by the application.
-- Note: This schema is designed for portability (PostgreSQL-friendly).

CREATE TABLE IF NOT EXISTS validation_rules (
  id BIGSERIAL PRIMARY KEY,
  rule_name VARCHAR(64) NOT NULL UNIQUE,
  regex_pattern TEXT NOT NULL,
  error_message VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Optional: seed data matching the Requirements Document + validation.js (whitelist specials)

INSERT INTO validation_rules (rule_name, regex_pattern, error_message)
VALUES
  ('email_format', '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$', 'Invalid email format'),
  ('password_length', '^.{8,}$', 'Password must be at least 8 characters long'),
  ('password_number', '.*\\d.*', 'Password must contain at least one number'),

  -- Whitelist specials (same as in validation.js):
  -- [!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]
  ('password_special', '.*[!@#$%^&*()_+\\-=\\[\\]{};'':"\\\\|,.<>\\/?].*', 'Password must contain at least one special character'),

  ('phone_format', '^\\+[1-9]\\d{7,14}$', 'Invalid phone number format')
ON CONFLICT (rule_name) DO NOTHING;

-- Automatically update updated_at on row modification (PostgreSQL)

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_validation_rules_updated_at ON validation_rules;

CREATE TRIGGER trg_validation_rules_updated_at
BEFORE UPDATE ON validation_rules
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();


```

**Schema Notes (for the document):**

- `rule_name` is unique to prevent duplicate definitions.
- `regex_pattern` allows rules to be data-driven (stored and retrieved dynamically).
- `created_at/updated_at` support auditing and operational maintenance.

---

## 4. API Specification

### Overview

The API provides:

1. **Validation** of input fields via `POST /validate`
2. **Retrieval** of configured validation rules via `GET /validation-rules`

Base response convention:

- Validation results return `{ valid: boolean, errors: string[] }` for each field and overall.

---

### Endpoint 1: POST /validate

**Purpose:** Validate user inputs (email, password, phone) using the module’s rules.

**Request**

- Method: `POST`
- Path: `/validate`
- Content-Type: `application/json`

**Request Body (JSON)**

```json
{
"email":"user@test.com",
"password":"Passw0rd!",
"phone":"+14155552671"
}
```
**Field presence behavior:** The API validates **only the fields that are provided** in the request body.  
- If a field is **missing** (e.g., no `phone` key), it is **skipped** and produces **no errors** for that field.  
- If a field is present but is `null` or an empty/whitespace string, it is validated and will return the corresponding validation errors.

**Implementation note:** validate a field only if the key exists in JSON (hasOwnProperty). Do not call validateX(body.email) when the key is missing, otherwise undefined will be treated as empty string and will fail validation.

**Success Response (200 OK) — all valid**

```json
{
"valid":true,
"errors":[],
"fields":{
"email":{"valid":true,"errors":[]},
"password":{"valid":true,"errors":[]},
"phone":{"valid":true,"errors":[]}
}
}
```

**Success Response (200 OK) — some invalid**

```json
{
"valid":false,
"errors":[
"Invalid email format",
"Password must contain at least one special character"
],
"fields":{
"email":{"valid":false,"errors":["Invalid email format"]},
"password":{"valid":false,"errors":["Password must contain at least one special character"]},
"phone":{"valid":true,"errors":[]}
}
}
```

**Error Responses**

- `400 Bad Request` — invalid JSON payload or missing body

```json
{
"error":"Bad Request",
"message":"Invalid JSON payload"
}
```

- `415 Unsupported Media Type` — wrong Content-Type

```json
{
"error":"Unsupported Media Type",
"message":"Content-Type must be application/json"
}
```

**Notes**

- The `errors` array at the top level aggregates all field errors for convenience.
- Field-level results follow the same structure as the validation module: `{ valid, errors }`.

---

### Endpoint 2: GET /validation-rules

**Purpose:** Return all validation rules stored in the database.

**Request**

- Method: `GET`
- Path: `/validation-rules`

**Success Response (200 OK)**

```json
[
{
"rule_name":"email_format",
"regex_pattern":"^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$",
"error_message":"Invalid email format"
},
{
"rule_name":"phone_format",
"regex_pattern":"^\\+[1-9]\\d{7,14}$",
"error_message":"Invalid phone number format"
}
]
```

**Error Responses**

- `500 Internal Server Error` — database not available

```json
{
"error":"Internal Server Error",
"message":"Unable to fetch validation rules"
}

```

---

## 5. Unit Tests

### validation.test.js

```js
// validation.test.js
const {
  validateEmail,
  validatePassword,
  validatePhone,
} = require("./validation");

describe("Data Validation Module", () => {
  // --------------------
  // Email validation
  // --------------------
  test("validateEmail: should accept a valid email", () => {
    const r = validateEmail("user@test.com");
    expect(r.valid).toBe(true);
    expect(r.errors).toEqual([]);
  });

  test("validateEmail: should reject an invalid email (missing domain)", () => {
    const r = validateEmail("user@");
    expect(r.valid).toBe(false);
    expect(r.errors).toContain("Invalid email format");
  });

  test("validateEmail: should reject empty string", () => {
    const r = validateEmail("");
    expect(r.valid).toBe(false);
    expect(r.errors).toContain("Invalid email format");
  });

  test("validateEmail: should reject null", () => {
    const r = validateEmail(null);
    expect(r.valid).toBe(false);
    expect(r.errors).toContain("Invalid email format");
  });

  test("validateEmail: should trim whitespace before validation", () => {
    const r = validateEmail("  user@test.com  ");
    expect(r.valid).toBe(true);
    expect(r.errors).toEqual([]);
  });

  // --------------------
  // Password validation
  // --------------------
  test("validatePassword: should accept a strong password", () => {
    const r = validatePassword("Passw0rd!");
    expect(r.valid).toBe(true);
    expect(r.errors).toEqual([]);
  });

  test("validatePassword: should accept a password with '_' from the whitelist", () => {
    const r = validatePassword("Password1_");
    expect(r.valid).toBe(true);
    expect(r.errors).toEqual([]);
  });

  test("validatePassword: should reject password shorter than 8 chars", () => {
    const r = validatePassword("Pass1!");
    expect(r.valid).toBe(false);
    expect(r.errors).toContain("Password must be at least 8 characters long");
  });

  test("validatePassword: should reject password missing a number", () => {
    const r = validatePassword("Password!");
    expect(r.valid).toBe(false);
    expect(r.errors).toContain("Password must contain at least one number");
  });

  test("validatePassword: should reject password missing a special character", () => {
    const r = validatePassword("Password1");
    expect(r.valid).toBe(false);
    expect(r.errors).toContain("Password must contain at least one special character");
  });

  test("validatePassword: should report multiple errors when multiple rules fail", () => {
    // short, no number, no special char
    const r = validatePassword("Pass");
    expect(r.valid).toBe(false);
    expect(r.errors).toEqual(
      expect.arrayContaining([
        "Password must be at least 8 characters long",
        "Password must contain at least one number",
        "Password must contain at least one special character",
      ])
    );
  });

  test("validatePassword: should handle null input", () => {
    const r = validatePassword(null);
    expect(r.valid).toBe(false);
    expect(r.errors).toEqual(
      expect.arrayContaining([
        "Password must be at least 8 characters long",
        "Password must contain at least one number",
        "Password must contain at least one special character",
      ])
    );
  });

  // --------------------
  // Phone validation (E.164)
  // --------------------
  test("validatePhone: should accept a valid E.164 phone number", () => {
    const r = validatePhone("+14155552671");
    expect(r.valid).toBe(true);
    expect(r.errors).toEqual([]);
  });

  test("validatePhone: should reject a phone number without + prefix", () => {
    const r = validatePhone("4155552671");
    expect(r.valid).toBe(false);
    expect(r.errors).toContain("Invalid phone number format");
  });

  test("validatePhone: should reject phone with invalid characters", () => {
    const r = validatePhone("+1(415)555-2671");
    expect(r.valid).toBe(false);
    expect(r.errors).toContain("Invalid phone number format");
  });

  test("validatePhone: should trim whitespace before validation", () => {
    const r = validatePhone("  +14155552671  ");
    expect(r.valid).toBe(true);
    expect(r.errors).toEqual([]);
  });

  test("validatePhone: should reject empty string", () => {
    const r = validatePhone("");
    expect(r.valid).toBe(false);
    expect(r.errors).toContain("Invalid phone number format");
  });
});
```

**Description:**

Jest unit tests covering:

- valid inputs
- invalid inputs
- edge cases (empty strings, null, special characters)

---

## 6. Documentation

### README.md

## Data Validation Module

## Overview

The **Data Validation Module** provides reusable validation logic for common user input fields:

- Email
- Password
- Phone number (international format)

The module is designed to be **simple, predictable, and production-ready**, returning consistent validation results and user-friendly error messages.

---

## Installation

### Prerequisites

- Node.js (LTS recommended)
- npm

### Setup

Clone or copy the project files and install dependencies:

```bash
npm install
```

For running unit tests:

```bash
npm test
```

---

## Usage Examples

### Importing the module

```js
const {
  validateEmail,
  validatePassword,
  validatePhone,
} = require("./validation");
```

### Validating email

```js
const result = validateEmail("user@test.com");

if (!result.valid) {
  console.log(result.errors);
}
```

### Validating password

```js
const result = validatePassword("Passw0rd!");

if (!result.valid) {
  console.log(result.errors);
}
```

### Validating phone number

```js
const result = validatePhone("+14155552671");

if (!result.valid) {
console.log(result.errors);
}
```

Each validation function returns the same structure:

```js
{
valid: boolean,
errors: string[]
}
```

---

## API Endpoints

### POST /validate

Validates user input fields.

**Request**

```json
{
"email":"user@test.com",
"password":"Passw0rd!",
"phone":"+14155552671"
}

```

**Response (all valid)**

```json
{
"valid":true,
"errors":[],
"fields":{
"email":{"valid":true,"errors":[]},
"password":{"valid":true,"errors":[]},
"phone":{"valid":true,"errors":[]}
}
}
```

**Response (some invalid)**

```json
{
"valid":false,
"errors":["Invalid email format"],
"fields":{
"email":{"valid":false,"errors":["Invalid email format"]},
"password":{"valid":true,"errors":[]},
"phone":{"valid":true,"errors":[]}
}
}
```

---

### GET /validation-rules

Returns all validation rules stored in the database.

**Response**

```json
[
{
"rule_name":"email_format",
"regex_pattern":"^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$",
"error_message":"Invalid email format"
}
]
```

---

## Error Codes

| Code | Description |
| --- | --- |
| 200 | Validation completed successfully |
| 400 | Invalid request payload |
| 415 | Unsupported Media Type |
| 500 | Internal server error |

---

## Validation Rules Summary

- **Email**: Must follow standard email format
- **Password**:
    - Minimum 8 characters
    - At least one numeric digit
    - At least one special character
- **Phone**: Must follow international format (E.164)

### Password validation notes

- Passwords are normalized using `trim()` before validation.
- A special character is any character from: !@#$%^&*()_+-=[]{};':"\\|,.<>/?.
- Validation rules are intentionally simple and deterministic for demonstration purposes.

---

## Testing

Unit tests are written using **Jest** and cover:

- Valid inputs
- Invalid inputs
- Edge cases (empty strings, null values, whitespace, special characters)

Run tests with:

```bash
npm test
```

---

## Notes on Security and Performance

- Validation logic uses predefined regular expressions to avoid dynamic code execution.
- Error messages are safe for exposure to end users and do not leak sensitive information.
- Regular expressions are compiled once and reused for better performance.
- Validation functions are stateless and lightweight, suitable for typical API workloads.
- If strict throughput/SLO targets are required, benchmark under the target environment and optimize based on profiling results.


---

## Conclusion

This module demonstrates how ChatGPT can be used to:

- Define clear validation requirements
- Generate production-ready validation logic
- Create unit tests and documentation
- Review code quality, security, and performance considerations

---

## 7. Validation & Refinement

### Security Review

- Input values are treated as plain strings and never executed as code, reducing the risk of code injection.
- Validation logic relies on predefined regular expressions and does not allow dynamic rule execution.
- Error messages are generic and user-friendly, avoiding exposure of internal implementation details.
- The database schema separates regex patterns and error messages, reducing the risk of hardcoded sensitive data.
- Email format validation intentionally uses a lightweight regex (not full RFC 5322 compliance). This is a pragmatic choice to keep validation fast and maintainable.


**Improvements Applied:**

- Centralized all error messages in a single constant object to ensure consistency and prevent accidental leakage.
- Normalized input values (trimming whitespace, handling null/undefined) to avoid bypassing validation rules.

---

### Performance Review

- Regular expressions are defined once and reused across validations, avoiding unnecessary recompilation.
- Validation functions are stateless and lightweight, suitable for typical API workloads.
- If strict throughput/SLO targets are required, benchmark under the target environment and optimize based on profiling results.


**Improvements Applied:**

- Avoided expensive operations inside validation loops.
- Ensured each validation function performs a minimal number of checks.

---

### Code Quality & Maintainability Review

- Validation logic is separated into small, single-purpose functions.
- Shared helper functions are reused to avoid duplication.
- Consistent return format `{ valid, errors }` simplifies integration and testing.

**Improvements Applied:**

- Introduced helper functions (`normalizeInput`, `result`) to reduce code repetition.
- Used descriptive function and variable names for better readability and long-term maintainability.

---

### Summary

The data validation module was reviewed for security, performance, and code quality.

All critical findings were addressed, and improvements were applied directly to the implementation, resulting in a maintainable and production-ready solution.