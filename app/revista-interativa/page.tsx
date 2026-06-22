"use client";

import { FormEvent, useRef, useState } from "react";
import styles from "./revista-interativa.module.css";

const PIX_KEY = "05.904.375/0001-08";
const WHATSAPP_URL = "https://wa.me/551132807010";

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
  const formRef = useRef<HTMLFormElement>(null);
  const [values, setValues] = useState<FormValues>(initialValues);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copyLabel, setCopyLabel] = useState("Copiar chave PIX");

  function updateField<K extends keyof FormValues>(field: K, value: FormValues[K]) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  async function handleCopyPix() {
    try {
      await navigator.clipboard.writeText(PIX_KEY);
      setCopyLabel("Chave PIX copiada");
    } catch {
      setCopyLabel("Copie manualmente");
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = formRef.current;
    if (!form) return;

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    setCopyLabel("Copiar chave PIX");
    setIsModalOpen(true);
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
              <p className={styles.kicker}>Revista institucional</p>
              <h1 className={styles.title}>Revista Interativa Compras Municipais</h1>
              <p className={styles.subtitle}>
                Divulgacao institucional durante 12 meses para empresas que vendem
                para orgaos publicos.
              </p>

              <a className={styles.primaryButton} href={`#${formId}`}>
                ACEITAR PROPOSTA COMERCIAL
              </a>
            </div>

            <aside className={styles.priceCard}>
              <span className={styles.priceLabel}>Investimento mensal</span>
              <strong className={styles.priceValue}>R$ 500,00 / mes</strong>
              <p className={styles.priceMeta}>Contrato anual de 12 meses</p>
              <div className={styles.priceDivider} />
              <p className={styles.totalLabel}>Total</p>
              <p className={styles.totalValue}>R$ 6.000,00</p>
            </aside>
          </section>

          <section className={styles.contentGrid}>
            <article className={styles.card}>
              <h2 className={styles.sectionTitle}>O que esta incluso</h2>
              <ul className={styles.featureList}>
                <li>Pagina exclusiva na Revista Interativa</li>
                <li>Insercao de video institucional do YouTube</li>
                <li>Botao de contato direto personalizado</li>
                <li>Presenca durante 12 meses</li>
                <li>2 disparos de e-mail marketing por mes como bonificacao</li>
              </ul>
            </article>

            <article className={`${styles.card} ${styles.summaryCard}`}>
              <h2 className={styles.sectionTitle}>Resumo financeiro</h2>
              <dl className={styles.summaryList}>
                <div>
                  <dt>Investimento mensal</dt>
                  <dd>R$ 500,00</dd>
                </div>
                <div>
                  <dt>Vigencia</dt>
                  <dd>12 meses</dd>
                </div>
                <div>
                  <dt>Investimento total</dt>
                  <dd>R$ 6.000,00</dd>
                </div>
              </dl>
            </article>
          </section>

          <section className={`${styles.card} ${styles.formSection}`} id={formId}>
            <div className={styles.formIntro}>
              <p className={styles.kicker}>Aceite</p>
              <h2 className={styles.sectionTitle}>Formulario de aceite</h2>
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
                  <span>Responsavel</span>
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
                  Li e aceito a proposta comercial da Revista Interativa Compras
                  Municipais.
                </span>
              </label>

              <button className={styles.primaryButton} type="submit">
                ACEITAR PROPOSTA
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
              Apos o pagamento, envie o comprovante pelo WhatsApp:
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
