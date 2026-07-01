import assert from "node:assert/strict";
import test from "node:test";

import {
  buildCustomerConfirmationMessage,
  buildInternalNotificationMessage,
  maskCpf,
  sendRevistaAcceptanceCustomerConfirmation,
  sendRevistaAcceptanceInternalNotification,
} from "../lib/email/revista-interativa.js";
import { sendEmail } from "../lib/email/smtp.js";
import { handleAcceptanceRequest } from "../lib/revista-interativa/acceptance.js";

const validPayload = {
  empresa: "Empresa Teste",
  cnpj: "12345678000199",
  responsavel: "Maria Silva",
  cpf: "12345678909",
  cargo: "Diretora",
  whatsapp: "(11) 99999-0000",
  email: "cliente@empresa.com",
};

const smtpEnv = {
  NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
  SMTP_HOST: "smtp.example.com",
  SMTP_PORT: "587",
  SMTP_SECURE: "false",
  SMTP_REQUIRE_TLS: "true",
  SMTP_USER: "mailer@example.com",
  SMTP_PASSWORD: "secret",
  SMTP_FROM_EMAIL: "mailer@example.com",
  SMTP_FROM_NAME: "Compras Municipais",
  REVISTA_ACCEPTANCE_NOTIFICATION_EMAIL: "interno@comprasmunicipais.com.br",
};

function createRequest(body) {
  return new Request("https://portal.com/api/revista-interativa/acceptance", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "user-agent": "node-test",
      "x-forwarded-for": "203.0.113.1",
      origin: "https://portal.com",
      referer: "https://portal.com/revista-interativa",
    },
    body: JSON.stringify(body),
  });
}

function createSendMailStub() {
  const calls = [];

  return {
    calls,
    createTransport: () => ({
      sendMail: async (message) => {
        calls.push(message);
        return { messageId: `message-${calls.length}` };
      },
    }),
  };
}

test("registers acceptance and sends both emails", async () => {
  const sent = [];

  const result = await handleAcceptanceRequest(createRequest(validPayload), {
    env: smtpEnv,
    fetchImpl: async () =>
      new Response(
        JSON.stringify([{ id: "acceptance-1", created_at: "2026-07-01T12:00:00.000Z" }]),
        {
          status: 201,
          headers: { "content-type": "application/json" },
        },
      ),
    sendInternalNotification: async () => {
      sent.push("internal");
      return { sent: true };
    },
    sendCustomerConfirmation: async () => {
      sent.push("customer");
      return { sent: true };
    },
  });

  assert.equal(result.status, 200);
  assert.deepEqual(result.body, { success: true, id: "acceptance-1" });
  assert.deepEqual(sent, ["internal", "customer"]);
});

test("keeps success when internal email fails", async () => {
  let customerSent = false;

  const result = await handleAcceptanceRequest(createRequest(validPayload), {
    env: smtpEnv,
    fetchImpl: async () =>
      new Response(JSON.stringify([{ id: "acceptance-2" }]), {
        status: 201,
        headers: { "content-type": "application/json" },
      }),
    sendInternalNotification: async () => {
      throw new Error("internal failure");
    },
    sendCustomerConfirmation: async () => {
      customerSent = true;
      return { sent: true };
    },
    now: () => new Date("2026-07-01T12:30:00.000Z"),
  });

  assert.equal(result.status, 200);
  assert.deepEqual(result.body, { success: true, id: "acceptance-2" });
  assert.equal(customerSent, true);
});

test("keeps success when customer email fails", async () => {
  let internalSent = false;

  const result = await handleAcceptanceRequest(createRequest(validPayload), {
    env: smtpEnv,
    fetchImpl: async () =>
      new Response(JSON.stringify([{ id: "acceptance-3" }]), {
        status: 201,
        headers: { "content-type": "application/json" },
      }),
    sendInternalNotification: async () => {
      internalSent = true;
      return { sent: true };
    },
    sendCustomerConfirmation: async () => {
      throw new Error("customer failure");
    },
    now: () => new Date("2026-07-01T13:00:00.000Z"),
  });

  assert.equal(result.status, 200);
  assert.deepEqual(result.body, { success: true, id: "acceptance-3" });
  assert.equal(internalSent, true);
});

test("keeps success when SMTP is not configured", async () => {
  const result = await handleAcceptanceRequest(createRequest(validPayload), {
    env: {
      NEXT_PUBLIC_SUPABASE_URL: smtpEnv.NEXT_PUBLIC_SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: smtpEnv.SUPABASE_SERVICE_ROLE_KEY,
      REVISTA_ACCEPTANCE_NOTIFICATION_EMAIL:
        smtpEnv.REVISTA_ACCEPTANCE_NOTIFICATION_EMAIL,
    },
    fetchImpl: async () =>
      new Response(JSON.stringify([{ id: "acceptance-4" }]), {
        status: 201,
        headers: { "content-type": "application/json" },
      }),
  });

  assert.equal(result.status, 200);
  assert.deepEqual(result.body, { success: true, id: "acceptance-4" });
});

test("does not send emails when Supabase fails", async () => {
  let emailAttempts = 0;

  const result = await handleAcceptanceRequest(createRequest(validPayload), {
    env: smtpEnv,
    fetchImpl: async () =>
      new Response(JSON.stringify({ message: "boom" }), {
        status: 500,
        headers: { "content-type": "application/json" },
      }),
    sendInternalNotification: async () => {
      emailAttempts += 1;
      return { sent: true };
    },
    sendCustomerConfirmation: async () => {
      emailAttempts += 1;
      return { sent: true };
    },
  });

  assert.equal(result.status, 500);
  assert.deepEqual(result.body, {
    success: false,
    error: "Não foi possível registrar o aceite.",
  });
  assert.equal(emailAttempts, 0);
});

test("rejects invalid customer email", async () => {
  const result = await handleAcceptanceRequest(
    createRequest({
      ...validPayload,
      email: "cliente-invalido",
    }),
    { env: smtpEnv },
  );

  assert.equal(result.status, 400);
  assert.deepEqual(result.body, {
    success: false,
    error: "Informe um e-mail válido.",
  });
});

test("rejects missing required fields", async () => {
  const result = await handleAcceptanceRequest(
    createRequest({
      ...validPayload,
      empresa: "",
    }),
    { env: smtpEnv },
  );

  assert.equal(result.status, 400);
  assert.deepEqual(result.body, {
    success: false,
    error: "Campos obrigatórios não preenchidos.",
  });
});

test("rejects CRLF injection attempt in company name", async () => {
  const result = await handleAcceptanceRequest(
    createRequest({
      ...validPayload,
      empresa: "Empresa Teste\r\nBCC: atacante@example.com",
    }),
    { env: smtpEnv },
  );

  assert.equal(result.status, 400);
  assert.deepEqual(result.body, {
    success: false,
    error: "Campos inválidos.",
  });
});

test("masks CPF in internal email", () => {
  const message = buildInternalNotificationMessage({
    ...validPayload,
    acceptanceId: "acceptance-5",
    acceptedAt: "2026-07-01T12:00:00.000Z",
    ipAddress: "203.0.113.1",
    userAgent: "node-test",
    proposalUrl: "https://portal.com/revista-interativa",
  });

  assert.equal(maskCpf(validPayload.cpf), "***.***.***-09");
  assert.match(message.text, /\*\*\*\.\*\*\*\.\*\*\*-\d{2}/u);
  assert.doesNotMatch(message.text, /12345678909/u);
  assert.doesNotMatch(message.html, /12345678909/u);
});

test("customer email omits CPF", () => {
  const message = buildCustomerConfirmationMessage({
    ...validPayload,
    acceptanceId: "acceptance-6",
    acceptedAt: "2026-07-01T12:00:00.000Z",
    ipAddress: "203.0.113.1",
    userAgent: "node-test",
    proposalUrl: "https://portal.com/revista-interativa",
  });

  assert.doesNotMatch(message.text, /CPF/u);
  assert.doesNotMatch(message.html, /CPF/u);
  assert.doesNotMatch(message.text, /12345678909/u);
  assert.doesNotMatch(message.html, /12345678909/u);
});

test("mocks Nodemailer transport without real SMTP calls", async () => {
  const stub = createSendMailStub();

  const result = await sendRevistaAcceptanceInternalNotification(
    {
      ...validPayload,
      acceptanceId: "acceptance-7",
      acceptedAt: "2026-07-01T12:00:00.000Z",
      ipAddress: "203.0.113.1",
      userAgent: "node-test",
      proposalUrl: "https://portal.com/revista-interativa",
    },
    smtpEnv,
    stub,
  );

  assert.equal(result.sent, true);
  assert.equal(stub.calls.length, 1);
  assert.equal(stub.calls[0].replyTo, validPayload.email);
});

test("sendEmail skips delivery when SMTP is not configured", async () => {
  const result = await sendEmail(
    {
      to: ["cliente@empresa.com"],
      subject: "Teste",
      text: "Teste",
      html: "<p>Teste</p>",
    },
    {},
    {
      createTransport: () => {
        throw new Error("should not create transport");
      },
      logger: { warn() {} },
    },
  );

  assert.deepEqual(result, {
    sent: false,
    skipped: true,
    reason: "smtp_not_configured",
  });
});

test("sanitizes header fields before handing off to Nodemailer", async () => {
  const stub = createSendMailStub();

  await sendRevistaAcceptanceCustomerConfirmation(
    {
      ...validPayload,
      email: "cliente@empresa.com\r\nBCC: atacante@example.com",
      responsavel: "Maria\r\nSilva",
      acceptanceId: "acceptance-8",
      acceptedAt: "2026-07-01T12:00:00.000Z",
      ipAddress: "203.0.113.1",
      userAgent: "node-test",
      proposalUrl: "https://portal.com/revista-interativa",
    },
    smtpEnv,
    stub,
  );

  assert.equal(stub.calls.length, 1);
  assert.doesNotMatch(stub.calls[0].to[0], /[\r\n]/u);
  assert.doesNotMatch(stub.calls[0].subject, /[\r\n]/u);
});
