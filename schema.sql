-- schema.sql
-- Stores validation rules used by the application.
-- Note: This schema is designed for portability (PostgreSQL-oriented).

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
