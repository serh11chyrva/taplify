import type { SiteMessages } from "@/lib/i18n/en";
import styles from "../landing.module.css";
import { ScrollReveal } from "./scroll-reveal";

const sampleActivity = [24, 38, 31, 44, 51, 36, 48, 62, 53, 67, 61, 74, 69, 88];
const splitSection = [styles.container, styles.split].join(" ");

export function MarketingSections({ copy }: { copy: SiteMessages["landing"] }) {
  const pageTypes = [
    {
      kind: "personal",
      title: copy.personalTitle,
      description: copy.personalDescription,
      example: "Jamie Park",
      subtitle: copy.personalRole,
      initials: "JP",
      items: [copy.personalProjects, copy.personalContact],
    },
    {
      kind: "company",
      title: copy.companyTitle,
      description: copy.companyDescription,
      example: "Northline Studio",
      subtitle: copy.companyRole,
      initials: "NS",
      items: [copy.companyServices, copy.companyQuote],
    },
    {
      kind: "product",
      title: copy.productTitle,
      description: copy.productDescription,
      example: copy.productExample,
      subtitle: copy.productRole,
      initials: "FL",
      items: [copy.productCollection, copy.productInquiry],
    },
  ];

  const steps = [
    { id: "start", title: copy.startTitle, description: copy.startDescription },
    { id: "customize", title: copy.customizeTitle, description: copy.customizeDescription },
    { id: "publish", title: copy.publishTitle, description: copy.publishDescription },
  ];

  const sampleMetrics = [
    { label: copy.pageViews, value: "248" },
    { label: copy.linkClicks, value: "86" },
    { label: copy.inquiries, value: "12" },
  ];

  return (
    <>
      <section className={styles.section} aria-labelledby="examples-title">
        <div className={styles.container}>
          <ScrollReveal className={styles.sectionHeading}>
            <h2 id="examples-title">{copy.examplesTitle}</h2>
            <p>{copy.examplesDescription}</p>
          </ScrollReveal>
          <div className={styles.exampleGrid}>
            {pageTypes.map(({ kind, title, description, example, subtitle, initials, items }) => (
              <ScrollReveal key={kind}>
                <article className={styles.exampleCard} data-page-kind={kind}>
                  <div className={styles.exampleStage} aria-hidden="true">
                    <div className={styles.examplePage}>
                      <div className={styles.exampleMonogram}>{initials}</div>
                      <strong>{example}</strong>
                      <span>{subtitle}</span>
                      <ul className={styles.exampleLinks}>
                        {items.map((item) => <li key={item}>{item}</li>)}
                      </ul>
                    </div>
                  </div>
                  <div className={styles.exampleCopy}>
                    <h3>{title}</h3>
                    <p>{description}</p>
                  </div>
                </article>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="workflow-title">
        <div className={splitSection}>
          <ScrollReveal className={styles.sectionHeading}>
            <h2 id="workflow-title">{copy.workflowTitle}</h2>
            <p>{copy.workflowDescription}</p>
          </ScrollReveal>
          <ScrollReveal>
            <ol className={styles.steps} role="list">
              {steps.map(({ id, title, description }, index) => (
                <li key={id}>
                  <span className={styles.stepNumber} aria-hidden="true">{index + 1}</span>
                  <div>
                    <h3>{title}</h3>
                    <p>{description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </ScrollReveal>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="inquiries-title">
        <div className={splitSection}>
          <div className={styles.insightsCopy}>
            <ScrollReveal className={styles.sectionHeading}>
              <h2 id="inquiries-title">{copy.insightsTitle}</h2>
            </ScrollReveal>
            <ScrollReveal className={styles.feature}>
              <h3>{copy.inquiriesTitle}</h3>
              <p>{copy.inquiriesDescription}</p>
            </ScrollReveal>
            <ScrollReveal className={styles.feature}>
              <h3>{copy.analyticsTitle}</h3>
              <p>{copy.analyticsDescription}</p>
            </ScrollReveal>
          </div>
          <ScrollReveal>
            <figure className={styles.insightsPreview}>
              <figcaption>
                <strong>{copy.pageInsights}</strong>
                <span>{copy.sampleData}</span>
              </figcaption>
              <dl className={styles.metrics}>
                {sampleMetrics.map(({ label, value }) => (
                  <div key={value}>
                    <dt>{label}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
              <div className={styles.activity} aria-hidden="true">
                {sampleActivity.map((height, index) => (
                  <span key={index} style={{ height: height + "%" }} />
                ))}
              </div>
            </figure>
          </ScrollReveal>
        </div>
      </section>
    </>
  );
}
