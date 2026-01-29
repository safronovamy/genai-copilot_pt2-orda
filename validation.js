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
