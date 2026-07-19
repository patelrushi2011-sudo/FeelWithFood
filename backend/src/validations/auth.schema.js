const { z } = require('zod');

const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    phone: z.string().optional(),
    height: z.union([z.number(), z.string()]).optional().transform(v => v ? parseFloat(v) : undefined),
    weight: z.union([z.number(), z.string()]).optional().transform(v => v ? parseFloat(v) : undefined),
    age: z.union([z.number(), z.string()]).optional().transform(v => v ? parseInt(v) : undefined),
    gender: z.string().optional(),
    // Accept both camelCase and snake_case for activity level
    activityLevel: z.string().optional(),
    activity_level: z.string().optional(),
    goal: z.string().optional()
  })
});

const loginSchema = z.object({
  body: z.object({
    // Accept either an email or a phone number in the 'email' field
    email: z.string().min(1, "Email or phone is required"),
    password: z.string().min(1, "Password is required")
  })
});

const refreshSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, "Refresh token is required")
  })
});

module.exports = {
  registerSchema,
  loginSchema,
  refreshSchema
};
