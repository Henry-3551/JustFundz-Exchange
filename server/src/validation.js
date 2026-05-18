const { z } = require("zod");

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8)
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

const resetRequestSchema = z.object({
  email: z.string().email()
});

const resetConfirmSchema = z.object({
  token: z.string().min(10),
  password: z.string().min(8)
});

module.exports = {
  registerSchema,
  loginSchema,
  resetRequestSchema,
  resetConfirmSchema
};
