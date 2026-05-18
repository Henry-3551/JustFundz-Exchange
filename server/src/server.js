require("dotenv").config();

const express = require("express");
const session = require("express-session");
const helmet = require("helmet");
const bcrypt = require("bcryptjs");
const pgSession = require("connect-pg-simple")(session);
const cors = require("cors");

const { pool, query } = require("./db");
const { sendMail } = require("./mailer");
const {
  registerSchema,
  loginSchema,
  resetRequestSchema,
  resetConfirmSchema
} = require("./validation");

const app = express();

app.use(helmet());
app.use(express.json());
app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:4000", "http://127.0.0.1:5500", "http://localhost:5500"],
    credentials: true
  })
);

app.use(
  session({
    store: new pgSession({
      pool,
      tableName: "sessions"
    }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      maxAge: 1000 * 60 * 60 * 24 * 7
    }
  })
);

const skipEmailVerification = process.env.SKIP_EMAIL_VERIFICATION === "true";

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.post("/api/auth/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid input" });
  }

  const { name, email, password } = parsed.data;
  const existing = await query("SELECT id FROM users WHERE email = $1", [email]);
  if (existing.rowCount > 0) {
    return res.status(409).json({ error: "Email already registered" });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const result = await query(
    "INSERT INTO users (name, email, password_hash, is_verified) VALUES ($1, $2, $3, $4) RETURNING id",
    [name, email, passwordHash, skipEmailVerification]
  );

  if (!skipEmailVerification) {
    const tokenResult = await query(
      "INSERT INTO email_verifications (user_id) VALUES ($1) RETURNING token",
      [result.rows[0].id]
    );

    const verifyUrl = `${process.env.APP_BASE_URL}/api/auth/verify-email?token=${tokenResult.rows[0].token}`;

    try {
      await sendMail({
        to: email,
        subject: "Verify your JustFundz account",
        html: `<p>Welcome to JustFundz.</p><p>Verify your email: <a href="${verifyUrl}">Verify account</a></p>`
      });
    } catch (error) {
      console.error("Email send failed", error);
    }

    return res.status(201).json({ message: "Registered. Please verify your email." });
  }

  return res.status(201).json({ message: "Registered. You can now log in." });
});

app.get("/api/auth/verify-email", async (req, res) => {
  const token = req.query.token;
  if (!token) {
    return res.status(400).send("Missing token");
  }

  const verification = await query(
    "SELECT user_id FROM email_verifications WHERE token = $1 AND used_at IS NULL",
    [token]
  );

  if (verification.rowCount === 0) {
    return res.status(400).send("Invalid or expired token");
  }

  const userId = verification.rows[0].user_id;
  await query("UPDATE users SET is_verified = true WHERE id = $1", [userId]);
  await query("UPDATE email_verifications SET used_at = NOW() WHERE token = $1", [token]);

  return res.send("Email verified. You can now log in.");
});

app.post("/api/auth/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid input" });
  }

  const { email, password } = parsed.data;
  const result = await query(
    "SELECT id, password_hash, is_verified FROM users WHERE email = $1",
    [email]
  );

  if (result.rowCount === 0) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const user = result.rows[0];
  const isValid = await bcrypt.compare(password, user.password_hash);
  if (!isValid) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  if (!skipEmailVerification && !user.is_verified) {
    return res.status(403).json({ error: "Please verify your email" });
  }

  req.session.userId = user.id;
  return res.json({ message: "Logged in" });
});

app.post("/api/auth/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("connect.sid");
    res.json({ message: "Logged out" });
  });
});

app.post("/api/auth/reset", async (req, res) => {
  const parsed = resetRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid input" });
  }

  const { email } = parsed.data;
  const result = await query("SELECT id FROM users WHERE email = $1", [email]);
  if (result.rowCount === 0) {
    return res.json({ message: "If the email exists, a reset link has been sent." });
  }

  const userId = result.rows[0].id;
  const tokenResult = await query(
    "INSERT INTO password_resets (user_id) VALUES ($1) RETURNING token",
    [userId]
  );

  const resetUrl = `${process.env.APP_BASE_URL}/reset-password.html?token=${tokenResult.rows[0].token}`;

  await sendMail({
    to: email,
    subject: "Reset your JustFundz password",
    html: `<p>Reset your password: <a href="${resetUrl}">Reset password</a></p>`
  });

  return res.json({ message: "If the email exists, a reset link has been sent." });
});

app.post("/api/auth/reset/confirm", async (req, res) => {
  const parsed = resetConfirmSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid input" });
  }

  const { token, password } = parsed.data;
  const result = await query(
    "SELECT user_id FROM password_resets WHERE token = $1 AND used_at IS NULL AND expires_at > NOW()",
    [token]
  );

  if (result.rowCount === 0) {
    return res.status(400).json({ error: "Invalid or expired token" });
  }

  const userId = result.rows[0].user_id;
  const passwordHash = await bcrypt.hash(password, 12);
  await query("UPDATE users SET password_hash = $1 WHERE id = $2", [passwordHash, userId]);
  await query("UPDATE password_resets SET used_at = NOW() WHERE token = $1", [token]);

  return res.json({ message: "Password updated" });
});

app.get("/api/me", async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const result = await query(
    "SELECT id, name, email, is_verified FROM users WHERE id = $1",
    [req.session.userId]
  );

  return res.json(result.rows[0]);
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
