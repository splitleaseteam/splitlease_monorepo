/**
 * EMAIL NOTIFICATION TEMPLATES
 * Gap 9: Pattern-specific email templates for all 5 patterns
 *
 * Provides SendGrid-compatible email templates with variable substitution
 *
 * PRODUCTION-READY: HTML and text versions with pattern-specific messaging
 * FUTURE ENHANCEMENT: Multi-language support, A/B test templates
 */

/**
 * Template variable substitution
 * Simple {{ variable }} replacement
 */
function renderTemplate(template: string, variables: Record<string, any>): string {
  let rendered = template;

  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
    rendered = rendered.replace(regex, String(value ?? ''));
  }

  // Handle conditional blocks {{#if variable}}...{{/if}}
  rendered = rendered.replace(/\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (match, variable, content) => {
    return variables[variable] ? content : '';
  });

  return rendered;
}

// ============================================================================
// PATTERN 1: ARCHETYPE-AWARE REQUEST CREATED
// ============================================================================

export const TEMPLATE_ARCHETYPE_REQUEST_CREATED = {
  subject: 'Date Change Request Submitted - {{archetype_label}}',

  html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .archetype-badge { display: inline-block; background: rgba(255,255,255,0.2); padding: 8px 16px; border-radius: 20px; font-size: 14px; }
    .cta-button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Date Change Request Submitted</h1>
      <div class="archetype-badge">{{archetype_label}}</div>
    </div>

    <div class="content">
      <p>Hi {{user_name}},</p>

      <p>Your date change request has been submitted successfully!</p>

      <h3>Request Details</h3>
      <ul>
        <li><strong>Request Type:</strong> {{archetype_label}}</li>
        <li><strong>New Dates:</strong> {{new_start_date}} to {{new_end_date}}</li>
        <li><strong>Urgency Level:</strong> {{urgency_band}}</li>
        <li><strong>Processing Tier:</strong> {{tier_name}}</li>
      </ul>

      <p>{{archetype_explanation}}</p>

      <p>Because of your booking history ({{archetype}}), we've optimized this request for faster processing.</p>

      <p><strong>Expected Response:</strong> {{expected_response_time}}</p>

      <a href="{{request_url}}" class="cta-button">Track Your Request</a>

      <p>You'll receive notifications when there are updates to your request.</p>

      <div class="footer">
        <p>Best regards,<br>Split Lease Team</p>
        <p><a href="{{support_email}}">Need help? Contact Support</a></p>
      </div>
    </div>
  </div>
</body>
</html>
  `,

  text: `
Hi {{user_name}},

Your date change request has been submitted!

Request Type: {{archetype_label}}
{{archetype_explanation}}

New Dates: {{new_start_date}} to {{new_end_date}}

Because of your booking history ({{archetype}}), we've optimized this request for faster processing.

Expected Response: {{expected_response_time}}

Track your request: {{request_url}}

Best,
Split Lease Team
  `
};

// ============================================================================
// PATTERN 2: URGENCY ALERT TO RECEIVER
// ============================================================================

export const TEMPLATE_URGENCY_ALERT = {
  subject: '{{urgency_icon}} {{urgency_level}} Date Change Request Needs Your Response',

  html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .urgency-header { padding: 30px; border-radius: 8px 8px 0 0; color: white; }
    .urgency-red { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); }
    .urgency-orange { background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); }
    .urgency-yellow { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); }
    .urgency-green { background: linear-gradient(135deg, #10b981 0%, #059669 100%); }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .price-highlight { background: #eff6ff; padding: 16px; border-left: 4px solid #3b82f6; margin: 20px 0; }
    .cta-button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .warning-box { background: #fef2f2; border: 1px solid #fecaca; padding: 16px; border-radius: 6px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="urgency-header urgency-{{urgency_band}}">
      <h1>{{urgency_icon}} {{urgency_level}} Urgency Request</h1>
      <p style="margin: 0;">From: {{requestor_name}}</p>
    </div>

    <div class="content">
      <p>Hi {{receiver_name}},</p>

      <p>You have a <strong>{{urgency_level}}</strong> urgency date change request.</p>

      <div class="price-highlight">
        <h3 style="margin-top: 0;">Request Details</h3>
        <p><strong>New Dates:</strong> {{new_start_date}} to {{new_end_date}}</p>
        <p><strong>Offered Price:</strong> ${{offered_price}}</p>
        <p><strong>Urgency Multiplier:</strong> {{urgency_multiplier}}x pricing</p>
      </div>

      <p>{{urgency_message}}</p>

      {{#if urgency_critical}}
      <div class="warning-box">
        <p style="margin: 0;"><strong>⚠️ URGENT:</strong> Please respond within 24 hours to avoid automatic expiration.</p>
      </div>
      {{/if}}

      <a href="{{request_url}}" class="cta-button">Review Request</a>

      <p><em>This urgent request includes premium pricing to reflect the short timeline.</em></p>

      <div style="text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px;">
        <p>Best regards,<br>Split Lease Team</p>
      </div>
    </div>
  </div>
</body>
</html>
  `,

  text: `
Hi {{receiver_name}},

You have a {{urgency_level}} urgency date change request from {{requestor_name}}.

Urgency Level: {{urgency_band}} ({{urgency_multiplier}}x pricing)
{{urgency_message}}

New Dates: {{new_start_date}} to {{new_end_date}}
Offered Price: ${{offered_price}}

{{#if urgency_critical}}
⚠️ URGENT: Please respond within 24 hours to avoid automatic expiration.
{{/if}}

Review request: {{request_url}}

Best,
Split Lease Team
  `
};

// ============================================================================
// PATTERN 3: TIER SELECTION CONFIRMATION
// ============================================================================

export const TEMPLATE_TIER_SELECTED = {
  subject: 'Request Submitted - {{tier_name}} Processing',

  html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #3b82f6; color: white; padding: 30px; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .tier-badge { display: inline-block; background: #10b981; color: white; padding: 8px 16px; border-radius: 20px; font-size: 14px; }
    .tier-details { background: white; padding: 20px; border-radius: 6px; margin: 20px 0; }
    .cta-button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Request Submitted</h1>
      <div class="tier-badge">{{tier_name}} Processing</div>
    </div>

    <div class="content">
      <p>Hi {{user_name}},</p>

      <p>Your date change request is being processed with <strong>{{tier_name}}</strong> speed.</p>

      <div class="tier-details">
        <h3 style="margin-top: 0;">{{tier_name}} Tier Details</h3>
        <p><strong>Processing Speed:</strong> {{tier_speed}}</p>
        <p><strong>Price:</strong> ${{tier_price}}</p>
        <p><strong>Features:</strong></p>
        <ul>
          {{#each tier_features}}
          <li>{{this}}</li>
          {{/each}}
        </ul>
      </div>

      {{#if tier_is_premium}}
      <p>As a premium request, you'll receive priority handling and faster responses from the landlord.</p>
      {{/if}}

      <p>You'll be notified when {{receiver_name}} responds to your request.</p>

      <a href="{{request_url}}" class="cta-button">Track Request</a>

      <div style="text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px;">
        <p>Best regards,<br>Split Lease Team</p>
      </div>
    </div>
  </div>
</body>
</html>
  `,

  text: `
Hi {{user_name}},

Your date change request is being processed with {{tier_name}} speed.

Selected Tier: {{tier_name}}
Processing Speed: {{tier_speed}}
Price: ${{tier_price}}

{{#if tier_is_premium}}
As a premium request, you'll receive priority handling and faster responses.
{{/if}}

You'll be notified when {{receiver_name}} responds.

Track request: {{request_url}}

Best,
Split Lease Team
  `
};

// ============================================================================
// PATTERN 4: COMPETITIVE BIDDING ALERT
// ============================================================================

export const TEMPLATE_COMPETITIVE_BIDDING = {
  subject: '🔥 Multiple Offers for Your Date Change Request',

  html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .offers-list { background: white; padding: 20px; border-radius: 6px; margin: 20px 0; }
    .offer-item { padding: 12px; border-bottom: 1px solid #e5e7eb; }
    .offer-item:last-child { border-bottom: none; }
    .premium-badge { background: #fbbf24; color: #78350f; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; }
    .cta-button { display: inline-block; background: #f97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔥 Multiple Offers Received!</h1>
      <p style="margin: 0;">Your listing is in demand</p>
    </div>

    <div class="content">
      <p>Hi {{receiver_name}},</p>

      <p>Great news! Your listing has received <strong>{{offer_count}}</strong> date change requests for similar dates.</p>

      <div class="offers-list">
        <h3 style="margin-top: 0;">Current Offers</h3>
        {{#each offers}}
        <div class="offer-item">
          <p><strong>${{this.price}}</strong> from {{this.requestor_name}} ({{this.tier}}) {{#if this.is_premium}}<span class="premium-badge">PREMIUM</span>{{/if}}</p>
        </div>
        {{/each}}
      </div>

      <p>This is a great opportunity to choose the offer that works best for you.</p>

      {{#if has_premium_offers}}
      <p><strong>💎 You have {{premium_count}} premium offers with faster processing and higher prices.</strong></p>
      {{/if}}

      <a href="{{dashboard_url}}" class="cta-button">Review All Offers</a>

      <p><em>Remember: Higher-priced offers often indicate more urgency and flexibility from the requester.</em></p>

      <div style="text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px;">
        <p>Best regards,<br>Split Lease Team</p>
      </div>
    </div>
  </div>
</body>
</html>
  `,

  text: `
Hi {{receiver_name}},

Your listing has received multiple date change requests for similar dates!

Current Offers:
{{#each offers}}
- ${{this.price}} from {{this.requestor_name}} ({{this.tier}})
{{/each}}

This is a great opportunity to choose the offer that works best for you.

{{#if has_premium_offers}}
💎 You have {{premium_count}} premium offers with faster processing.
{{/if}}

Review all offers: {{dashboard_url}}

Best,
Split Lease Team
  `
};

// ============================================================================
// PATTERN 5: FEE BREAKDOWN CONFIRMATION
// ============================================================================

export const TEMPLATE_FEE_BREAKDOWN_CONFIRMATION = {
  subject: 'Payment Confirmation - Date Change Request',

  html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #10b981; color: white; padding: 30px; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .fee-table { background: white; padding: 20px; border-radius: 6px; margin: 20px 0; width: 100%; }
    .fee-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
    .fee-row.total { border-top: 2px solid #374151; border-bottom: none; font-weight: bold; font-size: 18px; margin-top: 8px; }
    .savings-box { background: #ecfdf5; border: 1px solid #a7f3d0; padding: 16px; border-radius: 6px; margin: 20px 0; }
    .cta-button { display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✅ Payment Confirmed</h1>
      <p style="margin: 0;">Your date change request is complete</p>
    </div>

    <div class="content">
      <p>Hi {{user_name}},</p>

      <p>Your payment has been processed for the date change request.</p>

      <div class="fee-table">
        <h3 style="margin-top: 0;">Payment Breakdown</h3>
        <div class="fee-row">
          <span>Base Price:</span>
          <span>${{base_price}}</span>
        </div>
        <div class="fee-row">
          <span>Platform Fee (0.75%):</span>
          <span>${{platform_fee}}</span>
        </div>
        <div class="fee-row">
          <span>Processing (0.75%):</span>
          <span>${{landlord_share}}</span>
        </div>
        <div class="fee-row total">
          <span>Total Paid:</span>
          <span>${{total_price}}</span>
        </div>
      </div>

      <div class="savings-box">
        <p style="margin: 0;"><strong>🎉 You saved ${{savings_vs_traditional}} compared to traditional 17% markup!</strong></p>
      </div>

      <p><strong>Transaction Details:</strong></p>
      <ul>
        <li>Transaction ID: <code>{{stripe_transaction_id}}</code></li>
        <li>Date: {{payment_date}}</li>
        <li>New lease dates: {{new_start_date}} to {{new_end_date}}</li>
      </ul>

      <a href="{{receipt_url}}" class="cta-button">Download Receipt</a>

      <p><em>Questions? Contact <a href="mailto:{{support_email}}">{{support_email}}</a></em></p>

      <div style="text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px;">
        <p>Best regards,<br>Split Lease Team</p>
      </div>
    </div>
  </div>
</body>
</html>
  `,

  text: `
Hi {{user_name}},

Your payment has been processed for the date change request.

PAYMENT BREAKDOWN:
────────────────────────────────
Base Price:         ${{base_price}}
Platform Fee (0.75%): ${{platform_fee}}
Processing (0.75%):   ${{landlord_share}}
────────────────────────────────
Total Paid:         ${{total_price}}

You saved ${{savings_vs_traditional}} compared to traditional 17% markup!

Transaction ID: {{stripe_transaction_id}}
Date: {{payment_date}}

New lease dates: {{new_start_date}} to {{new_end_date}}

Receipt: {{receipt_url}}

Questions? Contact {{support_email}}

Best,
Split Lease Team
  `
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Render email template with variables
 *
 * @param templateName Template identifier
 * @param variables Variable map
 * @returns Rendered email (subject, html, text)
 */
export function renderEmailTemplate(
  templateName: string,
  variables: Record<string, any>
): { subject: string; html: string; text: string } {
  const templates: Record<string, any> = {
    archetype_request_created: TEMPLATE_ARCHETYPE_REQUEST_CREATED,
    urgency_alert: TEMPLATE_URGENCY_ALERT,
    tier_selected: TEMPLATE_TIER_SELECTED,
    competitive_bidding: TEMPLATE_COMPETITIVE_BIDDING,
    fee_breakdown_confirmation: TEMPLATE_FEE_BREAKDOWN_CONFIRMATION
  };

  const template = templates[templateName];

  if (!template) {
    throw new Error(`Unknown email template: ${templateName}`);
  }

  return {
    subject: renderTemplate(template.subject, variables),
    html: renderTemplate(template.html, variables),
    text: renderTemplate(template.text, variables)
  };
}

// Export all templates
export default {
  TEMPLATE_ARCHETYPE_REQUEST_CREATED,
  TEMPLATE_URGENCY_ALERT,
  TEMPLATE_TIER_SELECTED,
  TEMPLATE_COMPETITIVE_BIDDING,
  TEMPLATE_FEE_BREAKDOWN_CONFIRMATION,
  renderEmailTemplate
};
