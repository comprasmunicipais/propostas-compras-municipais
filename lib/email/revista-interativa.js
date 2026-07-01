import { sanitizeEmailHeaderValue, sendEmail } from "./smtp.js";

const INTERNAL_SUBJECT_PREFIX = "Novo aceite — Revista Interativa — ";
const CUSTOMER_SUBJECT =
  "Confirmação de aceite — Revista Interativa Compras Municipais";

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function digitsOnly(value) {
  return String(value).replace(/\D/g, "");
}

export function formatCnpj(value) {
  const digits = digitsOnly(value);

  if (digits.length !== 14) {
    return String(value || "").trim() || "não informado";
  }

  return digits.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/u,
    "$1.$2.$3/$4-$5",
  );
}

export function maskCpf(value) {
  const digits = digitsOnly(value);

  if (digits.length !== 11) {
    return "não informado";
  }

  return `***.***.***-${digits.slice(-2)}`;
}

function formatAcceptedAt(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value || "").trim() || "não informado";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "medium",
    timeZone: "America/Sao_Paulo",
  }).format(date);
}

export function buildInternalNotificationMessage(context) {
  const formattedCnpj = formatCnpj(context.cnpj);
  const maskedCpf = maskCpf(context.cpf);
  const acceptedAt = formatAcceptedAt(context.acceptedAt);
  const subject = `${INTERNAL_SUBJECT_PREFIX}${sanitizeEmailHeaderValue(context.empresa)}`;
  const text = [
    "Novo aceite da Revista Interativa",
    "",
    `Identificador do aceite: ${context.acceptanceId}`,
    `Empresa: ${context.empresa}`,
    `CNPJ: ${formattedCnpj}`,
    `Responsável: ${context.responsavel}`,
    `CPF: ${maskedCpf}`,
    `Cargo: ${context.cargo}`,
    `WhatsApp: ${context.whatsapp}`,
    `E-mail: ${context.email}`,
    "Valor total: R$ 6.000,00",
    "Parcelas: 12 parcelas de R$ 500,00",
    `Data e hora do aceite: ${acceptedAt}`,
    `IP: ${context.ipAddress || "não informado"}`,
    `User agent: ${context.userAgent || "não informado"}`,
    `URL de origem: ${context.proposalUrl}`,
  ].join("\n");
  const html = `
    <p>Novo aceite da Revista Interativa</p>
    <ul>
      <li><strong>Identificador do aceite:</strong> ${escapeHtml(context.acceptanceId)}</li>
      <li><strong>Empresa:</strong> ${escapeHtml(context.empresa)}</li>
      <li><strong>CNPJ:</strong> ${escapeHtml(formattedCnpj)}</li>
      <li><strong>Responsável:</strong> ${escapeHtml(context.responsavel)}</li>
      <li><strong>CPF:</strong> ${escapeHtml(maskedCpf)}</li>
      <li><strong>Cargo:</strong> ${escapeHtml(context.cargo)}</li>
      <li><strong>WhatsApp:</strong> ${escapeHtml(context.whatsapp)}</li>
      <li><strong>E-mail:</strong> ${escapeHtml(context.email)}</li>
      <li><strong>Valor total:</strong> R$ 6.000,00</li>
      <li><strong>Parcelas:</strong> 12 parcelas de R$ 500,00</li>
      <li><strong>Data e hora do aceite:</strong> ${escapeHtml(acceptedAt)}</li>
      <li><strong>IP:</strong> ${escapeHtml(context.ipAddress || "não informado")}</li>
      <li><strong>User agent:</strong> ${escapeHtml(context.userAgent || "não informado")}</li>
      <li><strong>URL de origem:</strong> ${escapeHtml(context.proposalUrl)}</li>
    </ul>
  `.trim();

  return { subject, text, html };
}

export function buildCustomerConfirmationMessage(context) {
  const formattedCnpj = formatCnpj(context.cnpj);
  const text = [
    `Olá, ${context.responsavel}.`,
    "",
    "Confirmamos o recebimento do aceite da proposta de participação anual na Revista Interativa Compras Municipais.",
    "",
    `Identificação do aceite: ${context.acceptanceId}`,
    `Empresa: ${context.empresa}`,
    `CNPJ: ${formattedCnpj}`,
    "Valor total: R$ 6.000,00",
    "Forma de pagamento: 12 parcelas mensais de R$ 500,00",
    "",
    "Dados para pagamento da primeira parcela",
    "",
    "Chave PIX — CNPJ: 05.904.375/0001-08",
    "Chave para copiar: 05904375000108",
    "Favorecido: D’AMICO EDITORA LTDA",
    "Banco: Bradesco",
    "Valor da primeira parcela: R$ 500,00",
    "",
    "Após o pagamento, envie o comprovante pelo WhatsApp:",
    "+55 11 3280-7010",
    "",
    "Antes de concluir o pagamento, confirme se o favorecido apresentado pelo banco é D’AMICO EDITORA LTDA.",
    "",
    "Por segurança, qualquer alteração de chave PIX deverá ser confirmada diretamente com nossa equipe pelo WhatsApp oficial.",
    "",
    "Em caso de dúvidas, nossa equipe está à disposição.",
    "",
    "Compras Municipais",
    "D'Amico Editora Ltda.",
    "WhatsApp: (11) 3280-7010",
  ].join("\n");
  const html = `
    <p>Olá, ${escapeHtml(context.responsavel)}.</p>
    <p>Confirmamos o recebimento do aceite da proposta de participação anual na Revista Interativa Compras Municipais.</p>
    <p>
      <strong>Identificação do aceite:</strong> ${escapeHtml(context.acceptanceId)}<br />
      <strong>Empresa:</strong> ${escapeHtml(context.empresa)}<br />
      <strong>CNPJ:</strong> ${escapeHtml(formattedCnpj)}<br />
      <strong>Valor total:</strong> R$ 6.000,00<br />
      <strong>Forma de pagamento:</strong> 12 parcelas mensais de R$ 500,00
    </p>
    <p><strong>Dados para pagamento da primeira parcela</strong></p>
    <p>
      <strong>Chave PIX — CNPJ:</strong> 05.904.375/0001-08<br />
      <strong>Chave para copiar:</strong> 05904375000108<br />
      <strong>Favorecido:</strong> D’AMICO EDITORA LTDA<br />
      <strong>Banco:</strong> Bradesco<br />
      <strong>Valor da primeira parcela:</strong> R$ 500,00
    </p>
    <p>
      Após o pagamento, envie o comprovante pelo WhatsApp:<br />
      +55 11 3280-7010
    </p>
    <p>Antes de concluir o pagamento, confirme se o favorecido apresentado pelo banco é D’AMICO EDITORA LTDA.</p>
    <p>Por segurança, qualquer alteração de chave PIX deverá ser confirmada diretamente com nossa equipe pelo WhatsApp oficial.</p>
    <p>Em caso de dúvidas, nossa equipe está à disposição.</p>
    <p>
      Compras Municipais<br />
      D&apos;Amico Editora Ltda.<br />
      WhatsApp: (11) 3280-7010
    </p>
  `.trim();

  return {
    subject: CUSTOMER_SUBJECT,
    text,
    html,
  };
}

function getInternalNotificationEmail(env) {
  const value = env.REVISTA_ACCEPTANCE_NOTIFICATION_EMAIL?.trim().toLowerCase();

  if (!value) {
    return null;
  }

  return sanitizeEmailHeaderValue(value);
}

export async function sendRevistaAcceptanceInternalNotification(
  context,
  env = process.env,
  dependencies = {},
) {
  const recipient = getInternalNotificationEmail(env);

  if (!recipient) {
    console.warn("Internal acceptance notification email not configured");

    return {
      sent: false,
      skipped: true,
      reason: "internal_notification_not_configured",
    };
  }

  return sendEmail(
    {
      to: [recipient],
      replyTo: sanitizeEmailHeaderValue(context.email),
      ...buildInternalNotificationMessage(context),
    },
    env,
    dependencies,
  );
}

export async function sendRevistaAcceptanceCustomerConfirmation(
  context,
  env = process.env,
  dependencies = {},
) {
  return sendEmail(
    {
      to: [sanitizeEmailHeaderValue(context.email)],
      ...buildCustomerConfirmationMessage(context),
    },
    env,
    dependencies,
  );
}
