import React from 'react';

export default function PrivacyPolicy() {
  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow-md rounded-md">
      <h1 className="text-3xl font-bold mb-6 text-center">The Sporty Way Privacy Policy</h1>
      <p className="text-gray-600 mb-4">
        At The Sporty Way, your privacy is of utmost importance to us. We are committed to protecting your personal data and ensuring transparency in how we collect, use, and safeguard it. This Privacy Policy explains what information we collect, how we use it, and your rights under the General Data Protection Regulation (GDPR). We do not sell or share your personal information with third parties, except as required by law or as outlined below.
      </p>

      <h2 className="text-2xl font-semibold mt-6 mb-4">1. Information We Collect</h2>
      <p className="text-gray-600 mb-2">We collect the following types of personal data to provide and improve our services:</p>
      <ul className="list-disc pl-6 mb-4 text-gray-600">
        <li><strong>User Information</strong>: Email address, name, given name, family name, profile picture (if provided via Google or other authentication), and account creation date. For non-Google users, we also collect a password (securely hashed).</li>
        <li><strong>Player Information</strong>: For players (including ringers), we collect name (for ringers), jersey number, position, team affiliations, and sports-related statistics (e.g., points, assists, fouls). Non-ringer players are linked to a user account.</li>
        <li><strong>Team Information</strong>: Team name, logo, season, and membership details (including player roles and activity status).</li>
        <li><strong>League Information</strong>: League name, sport type, season details, visibility (public/private), logo, location, established year, and settings (e.g., period type, duration, scoring rules).</li>
        <li><strong>Game Information</strong>: Game date, location, venue, team scores, player statistics, play-by-play data (including player names, stat types, timestamps, and periods), and optional YouTube video URLs.</li>
      </ul>

      <h2 className="text-2xl font-semibold mt-6 mb-4">2. How We Use Your Data</h2>
      <p className="text-gray-600 mb-2">We process your personal data for the following purposes:</p>
      <ul className="list-disc pl-6 mb-4 text-gray-600">
        <li><strong>Service Delivery</strong>: To manage user accounts, team rosters, player statistics, and game tracking functionalities.</li>
        <li><strong>Performance Tracking</strong>: To record and display sports statistics and game outcomes.</li>
        <li><strong>Communication</strong>: To send service-related notifications (e.g., game updates, account verification).</li>
        <li><strong>Improvement</strong>: To analyze usage patterns and improve our platform’s functionality.</li>
        <li><strong>Legal Compliance</strong>: To comply with legal obligations or respond to lawful requests.</li>
      </ul>
      <p className="text-gray-600 mb-4">
        <strong>Legal Basis for Processing</strong>: We process your data based on:
        <ul className="list-disc pl-6">
          <li><strong>Contract</strong>: To fulfill our agreement with you when you use our services.</li>
          <li><strong>Consent</strong>: For optional data (e.g., profile pictures) or for users under 16 (with parental consent).</li>
          <li><strong>Legitimate Interest</strong>: To improve our services and ensure platform security, provided it does not outweigh your rights.</li>
          <li><strong>Legal Obligation</strong>: To comply with applicable laws.</li>
        </ul>
      </p>

      <h2 className="text-2xl font-semibold mt-6 mb-4">3. Data Sharing and Disclosure</h2>
      <p className="text-gray-600 mb-4">
        We do not sell or share your personal data with third parties for marketing purposes. Data may be shared in the following cases:
        <ul className="list-disc pl-6">
          <li><strong>Public Leagues</strong>: If a league is set to “public,” team names, player statistics, and game data may be visible to other users or the public.</li>
          <li><strong>Service Providers</strong>: With trusted providers (e.g., hosting services) who adhere to GDPR and act as data processors under our instructions.</li>
          <li><strong>Legal Requirements</strong>: If required by law, such as responding to court orders or regulatory authorities.</li>
        </ul>
      </p>

      <h2 className="text-2xl font-semibold mt-6 mb-4">4. Your GDPR Rights</h2>
      <p className="text-gray-600 mb-4">As a data subject, you have the following rights under GDPR:</p>
      <ul className="list-disc pl-6 mb-4 text-gray-600">
        <li><strong>Access</strong>: Request a copy of your personal data.</li>
        <li><strong>Rectification</strong>: Correct inaccurate or incomplete data.</li>
        <li><strong>Erasure</strong>: Request deletion of your data (subject to legal obligations).</li>
        <li><strong>Restriction</strong>: Limit how we process your data in certain cases.</li>
        <li><strong>Data Portability</strong>: Receive your data in a structured, machine-readable format.</li>
        <li><strong>Object</strong>: Object to processing based on legitimate interests.</li>
        <li><strong>Withdraw Consent</strong>: Revoke consent at any time (where processing is based on consent).</li>
        <li><strong>Complaint</strong>: Lodge a complaint with a supervisory authority (e.g., your local Data Protection Authority).</li>
      </ul>
      {/* <p className="text-gray-600 mb-4">
        To exercise these rights, contact us at <a href="mailto:privacy@thesportyway.com" className="text-blue-600 hover:underline">privacy@thesportyway.com</a>.
      </p> */}

      <h2 className="text-2xl font-semibold mt-6 mb-4">5. Data Retention</h2>
      <p className="text-gray-600 mb-4">
        We retain personal data only as long as necessary for the purposes outlined above:
        <ul className="list-disc pl-6">
          <li><strong>User Data</strong>: Kept until you delete your account or request erasure, unless required for legal purposes.</li>
          <li><strong>Player and Game Data</strong>: Retained for the duration of the league/season, unless you request deletion.</li>
          <li><strong>Inactive Accounts</strong>: Deleted after 2 years of inactivity, unless otherwise required.</li>
        </ul>
        Anonymized data (e.g., aggregated statistics) may be retained indefinitely for analytical purposes.
      </p>

      <h2 className="text-2xl font-semibold mt-6 mb-4">6. Data Security</h2>
      <p className="text-gray-600 mb-4">
        We implement industry-standard security measures, including encryption (e.g., HTTPS, password hashing), access controls, and regular security audits, to protect your data from unauthorized access, loss, or alteration.
      </p>

      <h2 className="text-2xl font-semibold mt-6 mb-4">7. International Data Transfers</h2>
      <p className="text-gray-600 mb-4">
        Your data is stored within the European Economic Area (EEA). If data is transferred outside the EEA, we ensure GDPR-compliant safeguards, such as Standard Contractual Clauses, are in place.
      </p>

      <h2 className="text-2xl font-semibold mt-6 mb-4">8. Children’s Privacy</h2>
      <p className="text-gray-600 mb-4">
        The Sporty Way is not intended for children under 16 without parental consent. If we learn that we have collected data from a child under 16 without consent, we will delete it promptly. Contact us if you believe this has occurred.
      </p>

      <h2 className="text-2xl font-semibold mt-6 mb-4">9. Cookies and Tracking</h2>
      <p className="text-gray-600 mb-4">
        We use only essential cookies to maintain user sessions and ensure platform functionality. We do not use cookies for tracking or advertising purposes. You can manage cookie preferences through your browser settings.
      </p>

      <h2 className="text-2xl font-semibold mt-6 mb-4">10. Changes to This Privacy Policy</h2>
      <p className="text-gray-600 mb-4">
        We may update this Privacy Policy to reflect changes in our practices or legal requirements. We will notify you of significant changes via email or in-app notifications. The latest version is always available on our website.
      </p>

      {/* <h2 className="text-2xl font-semibold mt-6 mb-4">11. Contact Us</h2>
      <p className="text-gray-600 mb-4">
        For questions, concerns, or to exercise your GDPR rights, contact our Data Protection Officer at:
        <br />
        Email: <a href="mailto:privacy@thesportyway.com" className="text-blue-600 hover:underline">privacy@thesportyway.com</a>
        <br />
        Address: The Sporty Way, 123 Sport Avenue, Dublin, Ireland
      </p>
      <p className="text-gray-600 mb-4">
        You may also contact your local Data Protection Authority if you have concerns about our data practices.
      </p> */}

      <p className="text-gray-600 mt-6 italic">
        Last Updated: July 23, 2025
      </p>
    </div>
  );
}