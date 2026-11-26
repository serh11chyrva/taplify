import type { Metadata } from "next";
import styles from "../legal.module.css";
import catalog from "./dependency-licenses.json";

export const metadata: Metadata = {
  title: "Licenses",
  description: "Licenses and attribution for the third-party packages and assets used by Taplify.",
};

export default function LicensesPage() {
  return (
    <>
      <h1>Licenses</h1>
      <p>Third-party licenses for the packages used to run, build, and test Taplify, including optional packages for other platforms.</p>
      <p><a href="/third-party-notices.txt" download>Download third-party notices</a></p>

      <section>
        <h2>Bundled assets</h2>
        <dl className={styles.assets}>
          {catalog.assets.map(({ name, license, author }) => (
            <div key={name}>
              <dt>{name}</dt>
              <dd>{license} · {author}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="dependency-licenses">
        <h2 id="dependency-licenses">Dependencies</h2>
        <table className={styles.dependencies} aria-labelledby="dependency-licenses">
          <thead>
            <tr>
              <th scope="col">Package</th>
              <th scope="col">Version</th>
              <th scope="col">License</th>
            </tr>
          </thead>
          <tbody>
            {catalog.packages.map(({ name, version, license }) => (
              <tr key={`${name}@${version}`}>
                <td>{name}</td>
                <td>{version}</td>
                <td>{license}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
