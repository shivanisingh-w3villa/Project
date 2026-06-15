import Layout from "../components/Layout";
import usePageMetadata from "../hooks/usePageMetadata";
import "./legal.css";

const LAST_UPDATED = "June 15, 2026";

export default function TermsOfService() {
  usePageMetadata(
    "Terms of Service | AppName",
    "Review the AppName Terms of Service, including account use, authentication options, responsibilities, and limitations.",
  );

  return (
    <Layout isPublic>
      <div className="legal-page">
        <div className="legal-hero card">
          <span className="legal-eyebrow">Facebook App Review</span>
          <h1>Terms of Service</h1>
          <p className="legal-summary">
            These Terms of Service govern your access to and use of AppName and
            its related features.
          </p>
          <p className="legal-updated">Last Updated: {LAST_UPDATED}</p>
        </div>

        <div className="legal-content card">
          <section className="legal-section">
            <h2>Acceptance of Terms</h2>
            <p>
              By creating an account, signing in, or using AppName, you agree to
              these Terms of Service. If you do not agree, you should not use
              the service.
            </p>
          </section>

          <section className="legal-section">
            <h2>User Accounts</h2>
            <p>
              You are responsible for maintaining accurate account information
              and for safeguarding access to your account. You are also
              responsible for activities that occur under your credentials.
            </p>
          </section>

          <section className="legal-section">
            <h2>Authentication via Email, Facebook, and Google</h2>
            <p>
              AppName may allow authentication using email and password, Facebook
              Login, or Google Sign-In. When you choose a social login provider,
              you authorize us to use the basic account details required to
              authenticate and manage your account.
            </p>
          </section>

          <section className="legal-section">
            <h2>User Responsibilities</h2>
            <p>Users agree to use AppName lawfully and responsibly, including:</p>
            <ul className="legal-list">
              <li>Providing truthful registration details</li>
              <li>Keeping credentials confidential</li>
              <li>Using the service in compliance with applicable laws</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>Prohibited Activities</h2>
            <p>Users may not:</p>
            <ul className="legal-list">
              <li>Attempt unauthorized access to accounts, systems, or data</li>
              <li>Use the service to violate laws or third-party rights</li>
              <li>Interfere with the security, performance, or availability of the platform</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>Intellectual Property</h2>
            <p>
              All platform content, branding, software, and related materials
              made available by AppName remain the property of AppName or its
              licensors unless otherwise stated.
            </p>
          </section>

          <section className="legal-section">
            <h2>Limitation of Liability</h2>
            <p>
              To the fullest extent permitted by law, AppName is not liable for
              indirect, incidental, special, consequential, or punitive damages
              arising from your use of the service.
            </p>
          </section>

          <section className="legal-section">
            <h2>Account Suspension or Termination</h2>
            <p>
              We may suspend or terminate access to the service if we believe a
              user has violated these terms, created security risks, or misused
              the platform.
            </p>
          </section>

          <section className="legal-section">
            <h2>Changes to Terms</h2>
            <p>
              We may update these Terms of Service from time to time. Continued
              use of AppName after updates become effective constitutes
              acceptance of the revised terms.
            </p>
          </section>

          <section className="legal-section">
            <h2>Contact Information</h2>
            <p>
              Questions about these terms can be sent to{" "}
              <a href="mailto:support@appname.com">support@appname.com</a>.
            </p>
          </section>
        </div>
      </div>
    </Layout>
  );
}
