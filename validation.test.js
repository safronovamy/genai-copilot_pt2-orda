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
