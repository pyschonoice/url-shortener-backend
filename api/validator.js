// validator.js
const { z } = require("zod");
const URL = process.env.URL;

// Create URL Schema
const createUrlSchema = z.object({
  orgUrl: z
    .string()
    .trim()
    .url("Must be a valid URL")
    .max(2048),
  expiresIn: z.number().int().min(1).max(720).optional(),
  isActive: z.boolean().optional(),
});

// Validate the hash part of short URL (e.g. sho.rt/Ab3k9sL)
const shortUrlParamSchema = z.object({
  url: z
    .string()
    .trim()
    .regex(/^[0-9A-Za-z]{7}$/, "URL hash must be 7 alphanumeric chars"),
});

// Generic validator middleware
function validate(schema, source = "body") {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const errors = result.error.errors.map(e => e.message).join(", ");
      return res.status(400).json({ error: "Validation failed", details: errors });
    }
    req[source] = result.data; // sanitized
    next();
  };
}

module.exports = {
  validateCreateUrl: validate(createUrlSchema, "body"),
  validateShortUrlParam: validate(shortUrlParamSchema, "params"),
};
