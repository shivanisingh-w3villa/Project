import Layout from "../components/Layout";
import usePageMetadata from "../hooks/usePageMetadata";
import "./legal.css";

const LAST_UPDATED = "June 15, 2026";

export default function PrivacyPolicy() {
  usePageMetadata(
    "Privacy Policy | AppName",
    "Read the AppName Privacy Policy covering data collection, social login handling, user rights, and security practices.",
  );

  return (
    <Layout isPublic>
      <div className="legal-page">
        <div className="legal-hero card">
          <span className="legal-eyebrow">Facebook App Review</span>
          <h1>Privacy Policy</h1>
          <p className="legal-summary">
            This Privacy Policy explains how AppName collects, uses, protects,
            and shares personal information when you use our web application.
          </p>
          <p className="legal-updated">Last Updated: {LAST_UPDATED}</p>
        </div>

        <div className="legal-content card">
          <section className="legal-section">
            <h2>Introduction</h2>
            <p>
              AppName is a SaaS-style web application that offers account-based
              services and secure sign-in options. We are committed to handling
              your information responsibly and in a way that supports
              authentication, account access, and service reliability.
            </p>
          </section>

          <section className="legal-section">
            <h2>Information We Collect</h2>
            <p>We may collect the following information when you use AppName:</p>
            <ul className="legal-list">
              <li>Name</li>
              <li>Email address</li>
              <li>Social login identifiers from Facebook or Google</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>How We Use Information</h2>
            <p>We use collected information to:</p>
            <ul className="legal-list">
              <li>Authenticate users and support secure sign-in</li>
              <li>Manage user accounts and maintain profile access</li>
              <li>Improve the performance, reliability, and usability of our service</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>Data Sharing Policy</h2>
            <ul className="legal-list">
              <li>We do not sell personal information.</li>
              <li>
                We only share information when required by law, regulation, or a
                valid legal process.
              </li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>Data Security</h2>
            <p>
              We use reasonable administrative, technical, and organizational
              safeguards to protect personal information against unauthorized
              access, disclosure, alteration, or loss. No online service can
              guarantee absolute security, but we work to apply appropriate
              protections for the data we store.
            </p>
          </section>

          <section className="legal-section">
            <h2>User Rights</h2>
            <p>
              Users may request access to their account information, ask for
              corrections to inaccurate information, or request account deletion
              where applicable. We may need to verify identity before completing
              certain requests.
            </p>
          </section>

          <section className="legal-section">
            <h2>Contact Information</h2>
            <p>
              For privacy questions or data-related requests, contact us at{" "}
              <a href="mailto:support@appname.com">support@appname.com</a>.
            </p>
          </section>
        </div>
      </div>
    </Layout>
  );
}
