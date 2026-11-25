import styles from "../landing.module.css";
import { ScrollReveal } from "./scroll-reveal";

const pageTypes = [
  {
    kind: "personal",
    title: "Personal",
    description: "Show your work, gather your links, and give collaborators a way to reach you.",
    example: "Jamie Park",
    subtitle: "Independent designer",
    initials: "JP",
    items: ["Selected projects", "Get in touch"],
  },
  {
    kind: "company",
    title: "Company",
    description: "Introduce your team, highlight your services, and collect inquiries on one page.",
    example: "Northline Studio",
    subtitle: "Design and strategy",
    initials: "NS",
    items: ["Explore our services", "Request a quote"],
  },
  {
    kind: "product",
    title: "Product",
    description: "Give a product its own spotlight with a gallery, details, and a place to ask questions.",
    example: "Fold Desk Lamp",
    subtitle: "Lighting collection",
    initials: "FL",
    items: ["View the collection", "Ask about this item"],
  },
];

const steps = [
  {
    title: "Choose a starting point",
    description: "Pick a personal, company, or product page and give it a name.",
  },
  {
    title: "Make it yours",
    description: "Add links, images, a gallery, or a contact form. Customize the theme and preview your draft.",
  },
  {
    title: "Publish and share",
    description: "Publish to your own Taplify link, then share it in your bio, emails, or anywhere people find you.",
  },
];

const sampleMetrics = [
  { label: "Page views", value: "248" },
  { label: "Link clicks", value: "86" },
  { label: "Inquiries", value: "12" },
];

const sampleActivity = [24, 38, 31, 44, 51, 36, 48, 62, 53, 67, 61, 74, 69, 88];
const sectionContent = [styles.container, styles.reveal].join(" ");

export function MarketingSections() {
  return (
    <>
      <section className={styles.section} aria-labelledby="examples-title">
        <ScrollReveal className={sectionContent}>
          <div className={styles.sectionHeading}>
            <h2 id="examples-title">A page for whatever you do.</h2>
            <p>Start with a layout that fits what you want to share.</p>
          </div>
          <div className={styles.exampleGrid}>
            {pageTypes.map(({ kind, title, description, example, subtitle, initials, items }) => (
              <article className={styles.exampleCard} data-page-kind={kind} key={kind}>
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
            ))}
          </div>
        </ScrollReveal>
      </section>

      <section className={styles.section} aria-labelledby="workflow-title">
        <ScrollReveal className={[sectionContent, styles.split].join(" ")}>
          <div className={styles.sectionHeading}>
            <h2 id="workflow-title">From draft to one shareable link.</h2>
            <p>Build in a draft and publish when the page is ready for visitors.</p>
          </div>
          <ol className={styles.steps} role="list">
            {steps.map(({ title, description }, index) => (
              <li key={title}>
                <span className={styles.stepNumber} aria-hidden="true">{index + 1}</span>
                <div>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </div>
              </li>
            ))}
          </ol>
        </ScrollReveal>
      </section>

      <section className={styles.section} aria-labelledby="inquiries-title">
        <ScrollReveal className={[sectionContent, styles.split].join(" ")}>
          <div className={styles.insightsCopy}>
            <div className={styles.sectionHeading}>
              <h2 id="inquiries-title">Give every visit a next step.</h2>
            </div>
            <div className={styles.feature}>
              <h3>Collect inquiries</h3>
              <p>Add a contact form with your own fields and manage submissions in a lead inbox for each page.</p>
            </div>
            <div className={styles.feature}>
              <h3>See what people do</h3>
              <p>Track page views, link clicks, and form submissions to see what brings visitors and what they respond to.</p>
            </div>
          </div>
          <figure className={styles.insightsPreview}>
            <figcaption>
              <strong>Page insights</strong>
              <span>Sample data</span>
            </figcaption>
            <dl className={styles.metrics}>
              {sampleMetrics.map(({ label, value }) => (
                <div key={label}>
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
      </section>
    </>
  );
}
