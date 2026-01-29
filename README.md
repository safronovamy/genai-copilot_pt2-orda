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
npmtest

```

---

## Usage Examples

### Importing the module

```jsx
const {
  validateEmail,
  validatePassword,
  validatePhone,
} =require("./validation");

```

### Validating email

```jsx
const result =validateEmail("user@test.com");

if (!result.valid) {
console.log(result.errors);
}

```

### Validating password

```jsx
const result =validatePassword("Passw0rd!");

if (!result.valid) {
console.log(result.errors);
}

```

### Validating phone number

```jsx
const result =validatePhone("+14155552671");

if (!result.valid) {
console.log(result.errors);
}

```

Each validation function returns the same structure:

```jsx
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
- A special character is any non-alphanumeric character (`[^A-Za-z0-9]`).
- Validation rules are intentionally simple and deterministic for demonstration purposes.

---

## Testing

Unit tests are written using **Jest** and cover:

- Valid inputs
- Invalid inputs
- Edge cases (empty strings, null values, whitespace, special characters)

Run tests with:

```bash
npmtest

```

---

## Notes on Security and Performance

- Validation logic uses predefined regular expressions to avoid dynamic code execution.
- Error messages are safe for exposure to end users and do not leak sensitive information.
- Regular expressions are compiled once and reused for better performance.
- Validation is O(n) over input length and uses precompiled regex; should be lightweight; performance needs benchmarking under target environment.

---

## Conclusion

This module demonstrates how ChatGPT can be used to:

- Define clear validation requirements
- Generate production-ready validation logic
- Create unit tests and documentation
- Review code quality, security, and performance considerations