import nodemailer from "nodemailer";

const SMTP_TIMEOUTS = {
  connectionTimeout: 10_000,
  greetingTimeout: 10_000,
  socketTimeout: 20_000,
};

function hasHeaderBreaks(value) {
  return /[\r\n]/u.test(value);
}

function sanitizeHeaderValue(value) {
  return String(value).replace(/[\r\n]+/gu, " ").trim();
}

function getMissingConfig(env) {
  const requiredKeys = [
    "SMTP_HOST",
    "SMTP_PORT",
    "SMTP_USER",
    "SMTP_PASSWORD",
    "SMTP_FROM_EMAIL",
  ];

  return requiredKeys.filter((key) => !env[key]?.trim());
}

function parseBoolean(value, fallback) {
  if (value == null) {
    return fallback;
  }

  return value.trim().toLowerCase() === "true";
}

function parseSmtpConfig(env) {
  const missing = getMissingConfig(env);

  if (missing.length > 0) {
    return {
      configured: false,
      missing,
    };
  }

  const port = Number.parseInt(env.SMTP_PORT.trim(), 10);

  if (!Number.isFinite(port) || port <= 0) {
    throw new Error("Invalid SMTP_PORT configuration.");
  }

  return {
    configured: true,
    host: env.SMTP_HOST.trim(),
    port,
    secure: parseBoolean(env.SMTP_SECURE, port === 465),
    requireTLS: parseBoolean(env.SMTP_REQUIRE_TLS, true),
    auth: {
      user: env.SMTP_USER.trim(),
      pass: env.SMTP_PASSWORD,
    },
    fromEmail: env.SMTP_FROM_EMAIL.trim(),
    fromName: sanitizeHeaderValue(env.SMTP_FROM_NAME?.trim() || "Compras Municipais"),
  };
}

export function containsHeaderBreaks(value) {
  return hasHeaderBreaks(value);
}

export function sanitizeEmailHeaderValue(value) {
  return sanitizeHeaderValue(value);
}

export function createSmtpTransport(env = process.env, dependencies = {}) {
  const config = parseSmtpConfig(env);

  if (!config.configured) {
    return config;
  }

  const createTransport = dependencies.createTransport ?? nodemailer.createTransport;

  return {
    ...config,
    transport: createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      requireTLS: config.requireTLS,
      auth: config.auth,
      connectionTimeout: SMTP_TIMEOUTS.connectionTimeout,
      greetingTimeout: SMTP_TIMEOUTS.greetingTimeout,
      socketTimeout: SMTP_TIMEOUTS.socketTimeout,
    }),
  };
}

export async function sendEmail(input, env = process.env, dependencies = {}) {
  const logger = dependencies.logger ?? console;
  const transportConfig = createSmtpTransport(env, dependencies);

  if (!transportConfig.configured) {
    logger.warn("SMTP not configured for acceptance emails", {
      missing: transportConfig.missing,
    });

    return {
      sent: false,
      skipped: true,
      reason: "smtp_not_configured",
    };
  }

  const from = transportConfig.fromName
    ? `"${transportConfig.fromName}" <${transportConfig.fromEmail}>`
    : transportConfig.fromEmail;

  const result = await transportConfig.transport.sendMail({
    from,
    to: input.to.map((recipient) => sanitizeHeaderValue(recipient)),
    subject: sanitizeHeaderValue(input.subject),
    text: input.text,
    html: input.html,
    replyTo: input.replyTo ? sanitizeHeaderValue(input.replyTo) : undefined,
  });

  return {
    sent: true,
    skipped: false,
    messageId: result.messageId,
  };
}
