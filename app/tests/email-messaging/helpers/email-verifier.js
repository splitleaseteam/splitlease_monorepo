/**
 * Email Verifier Helper
 *
 * Utility class for verifying emails via Gmail MCP during automated testing.
 * Designed to work with Gmail aliases (e.g., user+test1@gmail.com).
 *
 * Usage:
 *   const verifier = new EmailVerifier(gmailMcpClient);
 *   const email = await verifier.waitForEmail({
 *     to: 'splitleasefrederick+test123@gmail.com',
 *     subject: 'Login to Split Lease',
 *     timeout: 30000
 *   });
 */

class EmailVerifier {
  /**
   * @param {Object} gmailMcp - Gmail MCP client instance
   */
  constructor(gmailMcp) {
    this.gmail = gmailMcp;
    this.POLL_INTERVAL = 2000; // Check every 2 seconds
  }

  /**
   * Wait for an email matching criteria to arrive
   *
   * @param {Object} options
   * @param {string} options.to - Recipient email address
   * @param {string} options.subject - Subject (partial match)
   * @param {string} options.from - Sender (optional)
   * @param {number} options.timeout - Max wait time in ms (default: 30000)
   * @returns {Promise<Object>} Email object with id, subject, body, etc.
   */
  async waitForEmail({ to, subject, from, timeout = 30000 }) {
    const startTime = Date.now();

    // Build Gmail search query
    let query = `to:${to}`;
    if (subject) query += ` subject:${subject}`;
    if (from) query += ` from:${from}`;

    console.log(`🔍 Waiting for email: ${query}`);

    while (Date.now() - startTime < timeout) {
      try {
        const emails = await this.gmail.search({ query });

        if (emails && emails.length > 0) {
          const latestEmail = emails[0]; // Gmail returns newest first
          const fullEmail = await this.gmail.get_message({ id: latestEmail.id });

          console.log(`✅ Email received: ${fullEmail.subject}`);
          return fullEmail;
        }
      } catch (error) {
        console.log(`⚠️  Search attempt failed: ${error.message}`);
      }

      // Wait before next poll
      await this._sleep(this.POLL_INTERVAL);
    }

    throw new Error(
      `Email not received within ${timeout}ms. Query: ${query}`
    );
  }

  /**
   * Extract magic login link from email body
   *
   * @param {string} emailBody - HTML or plain text email body
   * @returns {string|null} Magic link URL
   */
  extractMagicLink(emailBody) {
    // Match URLs containing 'magic' or 'login'
    const patterns = [
      /https?:\/\/[^\s<>"]+magic[^\s<>"]+/i,
      /https?:\/\/[^\s<>"]+login[^\s<>"]+/i,
      /https?:\/\/[^\s<>"]+verify[^\s<>"]+/i,
    ];

    for (const pattern of patterns) {
      const match = emailBody.match(pattern);
      if (match) {
        // Clean up any trailing punctuation
        return match[0].replace(/[.,;)]$/, '');
      }
    }

    return null;
  }

  /**
   * Extract 6-digit verification code from email
   *
   * @param {string} emailBody - Email body text
   * @returns {string|null} 6-digit code
   */
  extractVerificationCode(emailBody) {
    const match = emailBody.match(/\b\d{6}\b/);
    return match ? match[0] : null;
  }

  /**
   * Extract proposal ID from email body
   *
   * @param {string} emailBody - Email body text
   * @returns {string|null} Proposal ID
   */
  extractProposalId(emailBody) {
    // Match various ID formats
    const patterns = [
      /proposal[_\s-]?id[:\s]+([a-z0-9_-]+)/i,
      /proposal\/([a-z0-9_-]+)/i,
      /proposal[_\s-]?([a-z0-9_-]{10,})/i,
    ];

    for (const pattern of patterns) {
      const match = emailBody.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    return null;
  }

  /**
   * Extract thread ID from email body
   *
   * @param {string} emailBody - Email body text
   * @returns {string|null} Thread ID
   */
  extractThreadId(emailBody) {
    const patterns = [
      /thread[_\s-]?id[:\s]+([a-z0-9_-]+)/i,
      /messages\/([a-z0-9_-]+)/i,
      /thread[:\s]+([a-z0-9_-]{10,})/i,
    ];

    for (const pattern of patterns) {
      const match = emailBody.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    return null;
  }

  /**
   * Verify email contains expected content
   *
   * @param {Object} email - Email object from Gmail
   * @param {Object} expectations
   * @param {string} expectations.subjectContains - Expected subject fragment
   * @param {string} expectations.bodyContains - Expected body fragment
   * @param {string} expectations.from - Expected sender
   * @returns {Object} Verification result with pass/fail
   */
  verifyEmailContents(email, { subjectContains, bodyContains, from }) {
    const results = {
      passed: true,
      checks: {},
    };

    if (subjectContains) {
      results.checks.subject = email.subject?.includes(subjectContains);
      if (!results.checks.subject) results.passed = false;
    }

    if (bodyContains) {
      const body = this._extractTextBody(email);
      results.checks.body = body?.includes(bodyContains);
      if (!results.checks.body) results.passed = false;
    }

    if (from) {
      results.checks.from = email.from?.includes(from);
      if (!results.checks.from) results.passed = false;
    }

    return results;
  }

  /**
   * Get all recent emails for a test account
   *
   * @param {string} email - Test email address
   * @param {number} limit - Max number of emails (default: 10)
   * @returns {Promise<Array>} Array of email objects
   */
  async getRecentEmails(email, limit = 10) {
    const query = `to:${email}`;
    const emails = await this.gmail.search({ query });
    return emails.slice(0, limit);
  }

  /**
   * Clear all emails for a test account (move to trash)
   *
   * @param {string} email - Test email address
   * @returns {Promise<number>} Number of emails deleted
   */
  async clearTestEmails(email) {
    const emails = await this.getRecentEmails(email, 50);
    let deleted = 0;

    for (const email of emails) {
      await this.gmail.trash_message({ id: email.id });
      deleted++;
    }

    console.log(`🗑️  Cleared ${deleted} test emails`);
    return deleted;
  }

  /**
   * Extract plain text from email (strip HTML)
   *
   * @private
   * @param {Object} email - Email object
   * @returns {string} Plain text body
   */
  _extractTextBody(email) {
    if (email.body) {
      // If HTML, strip tags
      if (email.body.includes('<')) {
        return email.body.replace(/<[^>]*>/g, '').trim();
      }
      return email.body;
    }
    return '';
  }

  /**
   * Sleep helper
   *
   * @private
   * @param {number} ms - Milliseconds to sleep
   * @returns {Promise<void>}
   */
  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = EmailVerifier;
