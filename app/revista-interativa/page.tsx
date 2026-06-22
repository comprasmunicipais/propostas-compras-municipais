"use client";

import { FormEvent, useRef, useState } from "react";
import styles from "./revista-interativa.module.css";

const PIX_KEY = "05.904.375/0001-08";
const WHATSAPP_URL = "https://wa.me/551132807010";
const CONTACT_EMAIL = "fernando.damico@comprasmunicipais.com.br";
const ACCEPTANCE_ERROR_MESSAGE =
  "N\u00e3o foi poss\u00edvel registrar o aceite. Tente novamente.";

const audienceItems = [
  "Prefeitos e vice-prefeitos",
  "Secretários municipais",
  "Diretores e gestores públicos",
  "Equipes técnicas",
  "Compras e licitações",
  "Chefes de gabinete",
];

const includedItems = [
  {
    title: "Página institucional exclusiva",
    description:
      "Espaço dedicado à apresentação da sua empresa, dos seus diferenciais, produtos e serviços.",
  },
  {
    title: "Vídeo institucional",
    description:
      "Inserção de vídeos hospedados no YouTube para apresentar sua empresa de forma mais completa e dinâmica.",
  },
  {
    title: "Destaque de produtos e soluções",
    description:
      "Apresentação das soluções que sua empresa oferece para prefeituras e órgãos públicos.",
  },
  {
    title: "CTA personalizado",
    description:
      "Botão direcionando o leitor para WhatsApp, site, catálogo, formulário ou outro canal comercial definido pela empresa.",
  },
  {
    title: "Presença durante 12 meses",
    description:
      "Participação nas edições da Revista Compras Municipais ao longo de 12 meses consecutivos.",
  },
];

const bonusHighlights = [
  "2 disparos por mês",
  "24 disparos durante o ano",
  "Valor comercial da bonificação: R$ 6.000,00",
];

const emailBaseItems = [
  {
    title: "Base institucional",
    description:
      "Aproximadamente 10 mil e-mails institucionais de prefeituras de todo o Brasil.",
  },
  {
    title: "Decisores públicos",
    description:
      "Envio direcionado a contatos de prefeitos, secretários, chefes de gabinete, compras e outros setores municipais.",
  },
  {
    title: "Execução pela nossa equipe",
    description:
      "A preparação técnica e o disparo são realizados pela equipe da Compras Municipais.",
  },
  {
    title: "Apoio de conteúdo",
    description:
      "Sua empresa recebe orientações para organizar o conteúdo, a chamada comercial e a apresentação visual da campanha.",
  },
];

const steps = [
  {
    title: "Confirmação e pagamento inicial",
    description:
      "Após o aceite, você recebe os dados para pagamento da primeira parcela.",
  },
  {
    title: "Envio dos materiais",
    description:
      "Nossa equipe solicitará logotipo, textos institucionais, imagens, links de vídeos, produtos, serviços e canais de contato.",
  },
  {
    title: "Montagem da página",
    description:
      "A página institucional será preparada com base nos materiais enviados pela empresa.",
  },
  {
    title: "Validação",
    description:
      "Antes da publicação, o conteúdo será encaminhado para conferência e aprovação.",
  },
  {
    title: "Publicação e campanhas",
    description:
      "Após a aprovação, a empresa passa a participar da Revista Interativa e do cronograma de campanhas de e-mail marketing.",
  },
];

const materials = [
  "Logotipo em boa qualidade",
  "Apresentação institucional",
  "Descrição dos principais produtos ou serviços",
  "Imagens dos produtos, projetos ou soluções",
  "Links dos vídeos institucionais no YouTube",
  "Site, WhatsApp ou canal de contato comercial",
  "Material ou briefing para as campanhas de e-mail marketing",
];

const annualSummary = [
  "Presença institucional na Revista Interativa por 12 meses",
  "Página exclusiva com vídeos e CTA comercial",
  "Divulgação de produtos, serviços e soluções",
  "24 campanhas de e-mail marketing",
  "Apoio da equipe da Compras Municipais",
  "Comunicação direcionada ao setor público municipal",
];

const importantInfo = [
  "A publicação depende do envio e da aprovação dos materiais.",
  "Os materiais devem ser fornecidos pela empresa contratante.",
  "Alterações e readequações devem ser solicitadas formalmente.",
  "A manutenção das bonificações está vinculada ao cumprimento do contrato anual.",
  "A inadimplência poderá suspender temporariamente as divulgações.",
  "O aceite eletrônico registra data, hora, IP e identificação do navegador.",
];

type FormValues = {
  empresa: string;
  cnpj: string;
  responsavel: string;
  cpf: string;
  cargo: string;
  whatsapp: string;
  email: string;
  accepted: boolean;
};

const initialValues: FormValues = {
  empresa: "",
  cnpj: "",
  responsavel: "",
  cpf: "",
  cargo: "",
  whatsapp: "",
  email: "",
  accepted: false,
};

export default function RevistaInterativaPage() {
  const formId = "formulario-aceite";
  const benefitsId = "beneficios";
  const formRef = useRef<HTMLFormElement>(null);
  const [values, setValues] = useState<FormValues>(initialValues);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [copyLabel, setCopyLabel] = useState("Copiar chave PIX");

  function updateField<K extends keyof FormValues>(field: K, value: FormValues[K]) {
    setValues((current) => ({ ...current, [field]: value }));
    if (submitError) {
      setSubmitError("");
    }
  }

  function scrollToBenefits() {
    const section = document.getElementById(benefitsId);
    section?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function handleCopyPix() {
    try {
      await navigator.clipboard.writeText(PIX_KEY);
      setCopyLabel("Chave PIX copiada");
    } catch {
      setCopyLabel("Copie manualmente");
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = formRef.current;
    if (!form) return;

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");

    try {
      const response = await fetch("/api/revista-interativa/acceptance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          empresa: values.empresa,
          cnpj: values.cnpj,
          responsavel: values.responsavel,
          cpf: values.cpf,
          cargo: values.cargo,
          whatsapp: values.whatsapp,
          email: values.email,
        }),
      });

      const payload = (await response.json()) as { success?: boolean };

      if (!response.ok || !payload.success) {
        setSubmitError(ACCEPTANCE_ERROR_MESSAGE);
        return;
      }

      setCopyLabel("Copiar chave PIX");
      setIsModalOpen(true);
    } catch {
      setSubmitError(ACCEPTANCE_ERROR_MESSAGE);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <main className={styles.pageShell}>
        <section className={styles.page}>
          <header className={styles.header}>
            <div>
              <span className={styles.brand}>COMPRAS MUNICIPAIS</span>
              <p className={styles.eyebrow}>Proposta Comercial Anual</p>
            </div>
          </header>

          <section className={styles.hero}>
            <div className={styles.heroCopy}>
              <p className={styles.kicker}>Divulgação institucional e editorial</p>
              <h1 className={styles.title}>
                Sua empresa presente diante de quem decide nas prefeituras
              </h1>
              <p className={styles.subtitle}>
                Divulgação institucional durante 12 meses na Revista Interativa
                Compras Municipais, com página exclusiva, vídeos, contato direto e
                campanhas mensais de e-mail marketing.
              </p>

              <div className={styles.heroHighlights}>
                <span>Presença por 12 meses</span>
                <span>Página institucional exclusiva</span>
                <span>24 disparos de e-mail marketing</span>
                <span>Comunicação direcionada ao setor público municipal</span>
              </div>

              <button className={styles.primaryButton} type="button" onClick={scrollToBenefits}>
                CONHECER A PROPOSTA
              </button>
            </div>

            <aside className={styles.priceCard}>
              <span className={styles.priceLabel}>Prestação anual</span>
              <strong className={styles.priceValue}>12 parcelas de R$ 500,00</strong>
              <p className={styles.priceMeta}>
                Revista Interativa, divulgação institucional e bonificação de
                campanhas ao longo de 12 meses.
              </p>
              <div className={styles.priceDivider} />
              <p className={styles.totalLabel}>Investimento total</p>
              <p className={styles.totalValue}>R$ 6.000,00</p>
            </aside>
          </section>

          <section className={`${styles.card} ${styles.audienceSection}`}>
            <div className={styles.sectionIntro}>
              <p className={styles.kicker}>Público alcançado</p>
              <h2 className={styles.sectionTitle}>
                Comunicação direcionada aos decisores públicos
              </h2>
              <p className={styles.sectionBody}>
                A Revista Interativa Compras Municipais aproxima sua empresa de
                profissionais que participam diretamente da pesquisa, avaliação e
                contratação de produtos e serviços para o setor público.
              </p>
            </div>

            <ul className={styles.audienceGrid}>
              {audienceItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section className={styles.sectionBlock} id={benefitsId}>
            <div className={styles.sectionIntro}>
              <p className={styles.kicker}>Benefícios</p>
              <h2 className={styles.sectionTitle}>
                Uma estrutura de divulgação para manter sua empresa presente
                durante todo o ano
              </h2>
            </div>

            <div className={styles.cardGrid}>
              {includedItems.map((item) => (
                <article className={styles.detailCard} key={item.title}>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </article>
              ))}
            </div>
          </section>

          <section className={styles.bonusSection}>
            <div className={styles.bonusHeader}>
              <p className={styles.kicker}>Bonificação</p>
              <h2 className={styles.sectionTitle}>
                Além da Revista: 24 campanhas de e-mail marketing incluídas
              </h2>
              <p className={styles.sectionBody}>
                Durante o contrato anual, sua empresa recebe como bonificação dois
                disparos de e-mail marketing por mês.
              </p>
            </div>

            <div className={styles.bonusHighlights}>
              {bonusHighlights.map((item) => (
                <div className={styles.bonusMetric} key={item}>
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <p className={styles.bonusNote}>
              Considerando o valor avulso de R$ 250,00 por disparo, a bonificação
              representa R$ 6.000,00 em campanhas durante o período anual.
            </p>
          </section>

          <section className={styles.sectionBlock}>
            <div className={styles.sectionIntro}>
              <p className={styles.kicker}>Base institucional</p>
              <h2 className={styles.sectionTitle}>
                Comunicação para uma base institucional de prefeituras
              </h2>
            </div>

            <div className={styles.cardGrid}>
              {emailBaseItems.map((item) => (
                <article className={styles.detailCard} key={item.title}>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </article>
              ))}
            </div>
          </section>

          <section className={`${styles.card} ${styles.stepsSection}`}>
            <div className={styles.sectionIntro}>
              <p className={styles.kicker}>Como funciona</p>
              <h2 className={styles.sectionTitle}>
                O que acontece depois que você aceita a proposta
              </h2>
            </div>

            <div className={styles.stepsGrid}>
              {steps.map((step, index) => (
                <article className={styles.stepCard} key={step.title}>
                  <span className={styles.stepNumber}>{index + 1}</span>
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </article>
              ))}
            </div>
          </section>

          <section className={styles.contentGrid}>
            <article className={styles.card}>
              <p className={styles.kicker}>Materiais necessários</p>
              <h2 className={styles.sectionTitle}>O que sua empresa precisará enviar</h2>
              <ul className={styles.featureList}>
                {materials.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>

            <article className={`${styles.card} ${styles.summaryCard}`}>
              <p className={styles.kicker}>Investimento</p>
              <h2 className={styles.sectionTitle}>Investimento anual</h2>
              <strong className={styles.investmentHighlight}>12 parcelas de R$ 500,00</strong>
              <ul className={styles.featureList}>
                <li>Contrato com duração de 12 meses</li>
                <li>Investimento total de R$ 6.000,00</li>
                <li>Primeira parcela no ato da contratação</li>
                <li>Demais parcelas com vencimento no dia 10 dos meses subsequentes</li>
                <li>Pagamento inicial por PIX</li>
              </ul>
            </article>
          </section>

          <section className={`${styles.card} ${styles.summarySection}`}>
            <div className={styles.sectionIntro}>
              <p className={styles.kicker}>Resumo final</p>
              <h2 className={styles.sectionTitle}>
                Em um único contrato anual, sua empresa recebe:
              </h2>
            </div>

            <div className={styles.summaryColumns}>
              <ul className={styles.featureList}>
                {annualSummary.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>

              <div className={styles.contactCard}>
                <p className={styles.contactLabel}>Contato comercial</p>
                <a className={styles.contactLink} href={WHATSAPP_URL} target="_blank" rel="noreferrer">
                  WhatsApp: +55 11 3280-7010
                </a>
                <a className={styles.contactLink} href={`mailto:${CONTACT_EMAIL}`}>
                  E-mail: {CONTACT_EMAIL}
                </a>
              </div>
            </div>
          </section>

          <details className={styles.infoBox} open>
            <summary>Informações importantes</summary>
            <ul className={styles.infoList}>
              {importantInfo.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </details>

          <section className={`${styles.card} ${styles.formSection}`} id={formId}>
            <div className={styles.formIntro}>
              <p className={styles.kicker}>Aceite</p>
              <h2 className={styles.sectionTitle}>Formulário de aceite</h2>
              <p className={styles.sectionBody}>
                Ao aceitar, você confirma a contratação anual no valor total de
                R$ 6.000,00, pagos em 12 parcelas mensais de R$ 500,00.
              </p>
            </div>

            <form className={styles.form} onSubmit={handleSubmit} ref={formRef}>
              <div className={styles.fieldGrid}>
                <label className={styles.field}>
                  <span>Empresa</span>
                  <input
                    required
                    type="text"
                    value={values.empresa}
                    onChange={(event) => updateField("empresa", event.target.value)}
                  />
                </label>

                <label className={styles.field}>
                  <span>CNPJ</span>
                  <input
                    required
                    type="text"
                    value={values.cnpj}
                    onChange={(event) => updateField("cnpj", event.target.value)}
                  />
                </label>

                <label className={styles.field}>
                  <span>Responsável</span>
                  <input
                    required
                    type="text"
                    value={values.responsavel}
                    onChange={(event) => updateField("responsavel", event.target.value)}
                  />
                </label>

                <label className={styles.field}>
                  <span>CPF</span>
                  <input
                    required
                    type="text"
                    value={values.cpf}
                    onChange={(event) => updateField("cpf", event.target.value)}
                  />
                </label>

                <label className={styles.field}>
                  <span>Cargo</span>
                  <input
                    required
                    type="text"
                    value={values.cargo}
                    onChange={(event) => updateField("cargo", event.target.value)}
                  />
                </label>

                <label className={styles.field}>
                  <span>WhatsApp</span>
                  <input
                    required
                    type="tel"
                    value={values.whatsapp}
                    onChange={(event) => updateField("whatsapp", event.target.value)}
                  />
                </label>

                <label className={`${styles.field} ${styles.fullWidth}`}>
                  <span>E-mail</span>
                  <input
                    required
                    type="email"
                    value={values.email}
                    onChange={(event) => updateField("email", event.target.value)}
                  />
                </label>
              </div>

              <label className={styles.checkbox}>
                <input
                  required
                  type="checkbox"
                  checked={values.accepted}
                  onChange={(event) => updateField("accepted", event.target.checked)}
                />
                <span>
                  Li, compreendi e aceito as condições comerciais da participação
                  anual na Revista Interativa Compras Municipais.
                </span>
              </label>

              {submitError ? <p className={styles.errorMessage}>{submitError}</p> : null}

              <button className={styles.primaryButton} type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? "ENVIANDO..."
                  : "ACEITAR PROPOSTA E RECEBER DADOS DE PAGAMENTO"}
              </button>
            </form>
          </section>
        </section>
      </main>

      {isModalOpen ? (
        <div
          className={styles.modalOverlay}
          role="presentation"
          onClick={() => setIsModalOpen(false)}
        >
          <section
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 className={styles.modalTitle} id="modal-title">
              Proposta aceita com sucesso!
            </h2>
            <p className={styles.modalText}>Obrigado pelo aceite.</p>
            <p className={styles.modalText}>Dados para pagamento da primeira parcela:</p>

            <dl className={styles.paymentList}>
              <div>
                <dt>PIX CNPJ</dt>
                <dd>{PIX_KEY}</dd>
              </div>
              <div>
                <dt>Favorecido</dt>
                <dd>D&apos;AMICO EDITORA LTDA</dd>
              </div>
              <div>
                <dt>Banco</dt>
                <dd>Bradesco</dd>
              </div>
              <div>
                <dt>Valor</dt>
                <dd>R$ 500,00</dd>
              </div>
            </dl>

            <p className={styles.modalHighlight}>
              Após o pagamento, envie o comprovante pelo WhatsApp:
              <br />
              +55 11 3280-7010
            </p>

            <div className={styles.modalActions}>
              <button className={styles.secondaryButton} type="button" onClick={handleCopyPix}>
                {copyLabel}
              </button>
              <a
                className={styles.primaryButton}
                href={WHATSAPP_URL}
                target="_blank"
                rel="noreferrer"
              >
                Enviar comprovante pelo WhatsApp
              </a>
              <button
                className={styles.ghostButton}
                type="button"
                onClick={() => setIsModalOpen(false)}
              >
                Fechar
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
