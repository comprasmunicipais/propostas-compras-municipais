import { NextResponse } from "next/server";

const ACCEPTANCE_ERROR_MESSAGE = "N\u00e3o foi poss\u00edvel registrar o aceite.";

type AcceptancePayload = {
  empresa?: string;
  cnpj?: string;
  responsavel?: string;
  cpf?: string;
  cargo?: string;
  whatsapp?: string;
  email?: string;
};

function sanitizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getClientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() ?? "";
  }

  return request.headers.get("x-real-ip")?.trim() ?? "";
}

function logNewAcceptance(acceptanceId: string) {
  console.log("NOVA PROPOSTA ACEITA");
  console.log("acceptanceId:", acceptanceId);
  console.log("proposalSlug:", "revista-interativa");
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as AcceptancePayload;

    const empresa = sanitizeText(body.empresa);
    const cnpj = sanitizeText(body.cnpj);
    const responsavel = sanitizeText(body.responsavel);
    const cpf = sanitizeText(body.cpf);
    const cargo = sanitizeText(body.cargo);
    const whatsapp = sanitizeText(body.whatsapp);
    const email = sanitizeText(body.email);

    if (!empresa || !cnpj || !responsavel || !cpf || !whatsapp || !email) {
      return NextResponse.json(
        { success: false, error: "Campos obrigatorios nao preenchidos." },
        { status: 400 },
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { success: false, error: ACCEPTANCE_ERROR_MESSAGE },
        { status: 500 },
      );
    }

    const ipAddress = getClientIp(request);
    const userAgent = request.headers.get("user-agent")?.trim() ?? "";
    const endpoint = `${supabaseUrl}/rest/v1/revista_proposal_acceptances`;

    const supabaseResponse = await fetch(endpoint, {
      method: "POST",
      headers: {
        apikey: serviceRoleKey,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        empresa,
        cnpj,
        responsavel,
        cpf,
        cargo,
        whatsapp,
        email,
        ip_address: ipAddress,
        user_agent: userAgent,
        proposal_slug: "revista-interativa",
        contract_version: "v1.0",
        status: "aguardando_pagamento",
      }),
    });

    if (!supabaseResponse.ok) {
      console.error("Supabase acceptance error", {
        status: supabaseResponse.status,
      });

      return NextResponse.json(
        { success: false, error: ACCEPTANCE_ERROR_MESSAGE },
        { status: 500 },
      );
    }

    const data = (await supabaseResponse.json()) as Array<{ id: string }>;
    const acceptanceId = data[0]?.id;

    if (!acceptanceId) {
      return NextResponse.json(
        { success: false, error: ACCEPTANCE_ERROR_MESSAGE },
        { status: 500 },
      );
    }

    logNewAcceptance(acceptanceId);

    return NextResponse.json({ success: true, id: acceptanceId });
  } catch (error) {
    console.error("Acceptance route error", error);

    return NextResponse.json(
      { success: false, error: ACCEPTANCE_ERROR_MESSAGE },
      { status: 500 },
    );
  }
}
