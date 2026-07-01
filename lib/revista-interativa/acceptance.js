import { containsHeaderBreaks } from "../email/smtp.js";
import {
  sendRevistaAcceptanceCustomerConfirmation,
  sendRevistaAcceptanceInternalNotification,
} from "../email/revista-interativa.js";

const ACCEPTANCE_ERROR_MESSAGE = "Não foi possível registrar o aceite.";
const REQUIRED_FIELDS_ERROR_MESSAGE = "Campos obrigatórios não preenchidos.";
const INVALID_EMAIL_ERROR_MESSAGE = "Informe um e-mail válido.";
const INVALID_FIELDS_ERROR_MESSAGE = "Campos inválidos.";
const PROPOSAL_SLUG = "revista-interativa";
const CONTRACT_VERSION = "v1.0";

function sanitizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function sanitizeEmail(value) {
  return sanitizeText(value).toLowerCase();
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(value);
}

function hasInvalidHeaderCharacters(data) {
  const fields = [data.empresa, data.responsavel, data.cargo, data.email];

  return fields.some((field) => containsHeaderBreaks(field));
}

function getClientIp(request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() ?? "";
  }

  return request.headers.get("x-real-ip")?.trim() ?? "";
}

function getProposalUrl(request) {
  const referer = request.headers.get("referer")?.trim();

  if (referer) {
    try {
      const url = new URL(referer);
      return `${url.origin}/${PROPOSAL_SLUG}`;
    } catch {
      // Ignore malformed referer.
    }
  }

  const origin = request.headers.get("origin")?.trim();
  if (origin) {
    return `${origin}/${PROPOSAL_SLUG}`;
  }

  try {
    const url = new URL(request.url);
    return `${url.origin}/${PROPOSAL_SLUG}`;
  } catch {
    return `/${PROPOSAL_SLUG}`;
  }
}

function validateAcceptancePayload(payload) {
  const data = {
    empresa: sanitizeText(payload.empresa),
    cnpj: sanitizeText(payload.cnpj),
    responsavel: sanitizeText(payload.responsavel),
    cpf: sanitizeText(payload.cpf),
    cargo: sanitizeText(payload.cargo),
    whatsapp: sanitizeText(payload.whatsapp),
    email: sanitizeEmail(payload.email),
  };

  if (
    !data.empresa ||
    !data.cnpj ||
    !data.responsavel ||
    !data.cpf ||
    !data.cargo ||
    !data.whatsapp ||
    !data.email
  ) {
    return {
      success: false,
      status: 400,
      error: REQUIRED_FIELDS_ERROR_MESSAGE,
    };
  }

  if (!isValidEmail(data.email)) {
    return {
      success: false,
      status: 400,
      error: INVALID_EMAIL_ERROR_MESSAGE,
    };
  }

  if (hasInvalidHeaderCharacters(data)) {
    return {
      success: false,
      status: 400,
      error: INVALID_FIELDS_ERROR_MESSAGE,
    };
  }

  return {
    success: true,
    data,
  };
}

async function createAcceptanceRecord({
  data,
  env,
  fetchImpl,
  ipAddress,
  userAgent,
  now,
}) {
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase configuration.");
  }

  const endpoint = `${supabaseUrl}/rest/v1/revista_proposal_acceptances`;
  const supabaseResponse = await fetchImpl(endpoint, {
    method: "POST",
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify({
      empresa: data.empresa,
      cnpj: data.cnpj,
      responsavel: data.responsavel,
      cpf: data.cpf,
      cargo: data.cargo,
      whatsapp: data.whatsapp,
      email: data.email,
      ip_address: ipAddress,
      user_agent: userAgent,
      proposal_slug: PROPOSAL_SLUG,
      contract_version: CONTRACT_VERSION,
      status: "aguardando_pagamento",
    }),
  });

  if (!supabaseResponse.ok) {
    console.error("Supabase acceptance error", {
      status: supabaseResponse.status,
    });

    throw new Error("Supabase acceptance request failed.");
  }

  const records = await supabaseResponse.json();
  const record = records[0];
  const acceptanceId = record?.id?.trim();

  if (!acceptanceId) {
    throw new Error("Supabase acceptance response missing id.");
  }

  return {
    id: acceptanceId,
    createdAt: record?.created_at?.trim() || now().toISOString(),
  };
}

function logNewAcceptance(acceptanceId) {
  console.log("NOVA PROPOSTA ACEITA");
  console.log("acceptanceId:", acceptanceId);
  console.log("proposalSlug:", PROPOSAL_SLUG);
}

function logEmailResult(label, acceptanceId, result) {
  if (result.status === "rejected") {
    const reason = result.reason;

    console.error(`Failed to send ${label} acceptance email`, {
      acceptanceId,
      message: reason instanceof Error ? reason.message : "Unknown error",
    });
    return;
  }

  if (!result.value?.sent) {
    console.warn(`${label} acceptance email skipped`, {
      acceptanceId,
      reason: result.value?.reason ?? "unknown",
    });
  }
}

export async function handleAcceptanceRequest(request, dependencies = {}) {
  const env = dependencies.env ?? process.env;
  const fetchImpl = dependencies.fetchImpl ?? fetch;
  const sendInternalNotification =
    dependencies.sendInternalNotification ?? sendRevistaAcceptanceInternalNotification;
  const sendCustomerConfirmation =
    dependencies.sendCustomerConfirmation ?? sendRevistaAcceptanceCustomerConfirmation;
  const now = dependencies.now ?? (() => new Date());

  try {
    const payload = await request.json();
    const validation = validateAcceptancePayload(payload);

    if (!validation.success) {
      return {
        status: validation.status,
        body: { success: false, error: validation.error },
      };
    }

    const ipAddress = getClientIp(request);
    const userAgent = request.headers.get("user-agent")?.trim() ?? "";
    const proposalUrl = getProposalUrl(request);
    const createdAcceptance = await createAcceptanceRecord({
      data: validation.data,
      env,
      fetchImpl,
      ipAddress,
      userAgent,
      now,
    });

    logNewAcceptance(createdAcceptance.id);

    const emailContext = {
      ...validation.data,
      acceptanceId: createdAcceptance.id,
      acceptedAt: createdAcceptance.createdAt,
      ipAddress,
      userAgent,
      proposalUrl,
    };

    const emailResults = await Promise.allSettled([
      sendInternalNotification(emailContext),
      sendCustomerConfirmation(emailContext),
    ]);

    logEmailResult("internal", createdAcceptance.id, emailResults[0]);
    logEmailResult("customer", createdAcceptance.id, emailResults[1]);

    return {
      status: 200,
      body: { success: true, id: createdAcceptance.id },
    };
  } catch (error) {
    console.error("Acceptance route error", error);

    return {
      status: 500,
      body: { success: false, error: ACCEPTANCE_ERROR_MESSAGE },
    };
  }
}
