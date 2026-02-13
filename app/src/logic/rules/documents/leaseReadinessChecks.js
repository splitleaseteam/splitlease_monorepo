/**
 * Lease Readiness Checks
 *
 * Defines validation rules for each document type and checks
 * if a lease has sufficient data for document generation.
 *
 * @module logic/rules/documents/leaseReadinessChecks
 */

// ============================================================================
// Document-Specific Requirements
// ============================================================================

/**
 * Requirements for Host Payout Schedule document
 */
export const HOST_PAYOUT_REQUIREMENTS = {
  documentType: 'hostPayout',
  documentName: 'Host Payout Schedule',
  blocking: [
    {
      key: 'agreementNumber',
      label: 'Agreement Number',
      check: (data) => !!data.lease?.agreement_number,
      source: 'lease',
    },
    {
      key: 'hostPayments',
      label: 'Host payment records',
      check: (data) => data.hostPayments?.length > 0,
      source: 'paymentrecords',
      suggestion: 'Use "Recreate Host Payouts" button to generate payment records',
    },
    {
      key: 'host',
      label: 'Host user linked',
      check: (data) => !!data.host?.id,
      source: 'user',
    },
  ],
  warnings: [
    {
      key: 'hostEmail',
      label: 'Host email',
      check: (data) => !!data.host?.email,
      source: 'user',
    },
    {
      key: 'hostPhone',
      label: 'Host phone number',
      check: (data) => !!data.host?.phone_number,
      source: 'user',
    },
    {
      key: 'listingAddress',
      label: 'Listing address',
      check: (data) => !!data.listing?.address_with_lat_lng_json || !!data.listing?.city,
      source: 'listing',
    },
  ],
};

/**
 * Requirements for Supplemental Agreement document
 */
export const SUPPLEMENTAL_REQUIREMENTS = {
  documentType: 'supplemental',
  documentName: 'Supplemental Agreement',
  blocking: [
    {
      key: 'agreementNumber',
      label: 'Agreement Number',
      check: (data) => !!data.lease?.agreement_number,
      source: 'lease',
    },
    {
      key: 'proposal',
      label: 'Proposal linked',
      check: (data) => !!data.proposal?.id,
      source: 'proposal',
      suggestion: 'Link a proposal to this lease or verify the Proposal field is set',
    },
    {
      key: 'listing',
      label: 'Listing linked',
      check: (data) => !!data.listing?.id,
      source: 'listing',
    },
    {
      key: 'host',
      label: 'Host user linked',
      check: (data) => !!data.host?.id,
      source: 'user',
    },
  ],
  warnings: [
    {
      key: 'moveInDate',
      label: 'Move-in date',
      check: (data) => !!data.proposal?.host_proposed_move_in_date || !!data.lease?.reservation_start_date,
      source: 'proposal',
    },
    {
      key: 'moveOutDate',
      label: 'Move-out date',
      check: (data) => !!data.proposal?.planned_move_out_date || !!data.lease?.reservation_end_date,
      source: 'proposal',
    },
    {
      key: 'listingPhotos',
      label: 'Listing photos (3 recommended)',
      check: (data) => data.listingPhotos?.length >= 3,
      source: 'listing',
    },
    {
      key: 'listingDescription',
      label: 'Listing description',
      check: (data) => !!data.listing?.listing_description,
      source: 'listing',
    },
  ],
};

/**
 * Requirements for Periodic Tenancy Agreement document
 */
export const PERIODIC_TENANCY_REQUIREMENTS = {
  documentType: 'periodicTenancy',
  documentName: 'Periodic Tenancy Agreement',
  blocking: [
    {
      key: 'agreementNumber',
      label: 'Agreement Number',
      check: (data) => !!data.lease?.agreement_number,
      source: 'lease',
    },
    {
      key: 'proposal',
      label: 'Proposal linked',
      check: (data) => !!data.proposal?.id,
      source: 'proposal',
      suggestion: 'Link a proposal to this lease or verify the Proposal field is set',
    },
    {
      key: 'listing',
      label: 'Listing linked',
      check: (data) => !!data.listing?.id,
      source: 'listing',
    },
    {
      key: 'guest',
      label: 'Guest user linked',
      check: (data) => !!data.guest?.id,
      source: 'user',
    },
    {
      key: 'host',
      label: 'Host user linked',
      check: (data) => !!data.host?.id,
      source: 'user',
    },
    {
      key: 'guestPayments',
      label: 'Guest payment records',
      check: (data) => data.guestPayments?.length > 0,
      source: 'paymentrecords',
      suggestion: 'Use "Recreate Guest Payments" button to generate payment records',
    },
  ],
  warnings: [
    {
      key: 'moveInDate',
      label: 'Move-in date',
      check: (data) => !!data.proposal?.host_proposed_move_in_date || !!data.lease?.reservation_start_date,
      source: 'proposal',
    },
    {
      key: 'moveOutDate',
      label: 'Move-out date',
      check: (data) => !!data.proposal?.planned_move_out_date || !!data.lease?.reservation_end_date,
      source: 'proposal',
    },
    {
      key: 'damageDeposit',
      label: 'Damage deposit amount',
      check: (data) => {
        const deposit = data.proposal?.host_proposed_damage_deposit ||
          data.proposal?.damage_deposit_amount;
        return deposit !== null && deposit !== undefined;
      },
      source: 'proposal',
    },
    {
      key: 'houseRules',
      label: 'House rules',
      check: (data) => {
        const rules = data.proposal?.host_proposed_house_rules_json ||
          data.proposal?.house_rules_reference_ids_json ||
          data.listing?.house_rule_reference_ids_json;
        return !!rules && (Array.isArray(rules) ? rules.length > 0 : true);
      },
      source: 'listing',
    },
    {
      key: 'listingPhotos',
      label: 'Listing photos (3 recommended)',
      check: (data) => data.listingPhotos?.length >= 3,
      source: 'listing',
    },
  ],
};

/**
 * Requirements for Credit Card Authorization document
 */
export const CREDIT_CARD_AUTH_REQUIREMENTS = {
  documentType: 'creditCardAuth',
  documentName: 'Credit Card Authorization',
  blocking: [
    {
      key: 'agreementNumber',
      label: 'Agreement Number',
      check: (data) => !!data.lease?.agreement_number,
      source: 'lease',
    },
    {
      key: 'proposal',
      label: 'Proposal linked',
      check: (data) => !!data.proposal?.id,
      source: 'proposal',
      suggestion: 'Link a proposal to this lease or verify the Proposal field is set',
    },
    {
      key: 'guest',
      label: 'Guest user linked',
      check: (data) => !!data.guest?.id,
      source: 'user',
    },
    {
      key: 'host',
      label: 'Host user linked',
      check: (data) => !!data.host?.id,
      source: 'user',
    },
    {
      key: 'guestPayments',
      label: 'Guest payment records',
      check: (data) => data.guestPayments?.length > 0,
      source: 'paymentrecords',
      suggestion: 'Use "Recreate Guest Payments" button to generate payment records',
    },
    {
      key: 'fourWeekRent',
      label: 'Four week rent amount',
      check: (data) => {
        const rent = data.proposal?.host_proposed_four_week_rent || data.proposal?.four_week_rent_amount;
        return rent !== null && rent !== undefined && rent > 0;
      },
      source: 'proposal',
      suggestion: 'Set the 4-week rent amount in the proposal',
    },
  ],
  warnings: [
    {
      key: 'maintenanceFee',
      label: 'Maintenance/cleaning fee',
      check: (data) => {
        const fee = data.proposal?.host_proposed_cleaning_fee || data.proposal?.cleaning_fee_amount;
        return fee !== null && fee !== undefined;
      },
      source: 'proposal',
    },
    {
      key: 'damageDeposit',
      label: 'Damage deposit amount',
      check: (data) => {
        const deposit = data.proposal?.host_proposed_damage_deposit || data.proposal?.damage_deposit_amount;
        return deposit !== null && deposit !== undefined;
      },
      source: 'proposal',
    },
    {
      key: 'listingDescription',
      label: 'Listing description',
      check: (data) => !!data.listing?.listing_description || !!data.listing?.listing_title,
      source: 'listing',
    },
  ],
};

/**
 * All document requirements
 */
export const ALL_DOCUMENT_REQUIREMENTS = [
  HOST_PAYOUT_REQUIREMENTS,
  SUPPLEMENTAL_REQUIREMENTS,
  PERIODIC_TENANCY_REQUIREMENTS,
  CREDIT_CARD_AUTH_REQUIREMENTS,
];

// ============================================================================
// Readiness Check Functions
// ============================================================================

/**
 * Check readiness for a single document type
 *
 * @param {object} requirements - Document requirements definition
 * @param {object} data - Lease data including related records
 * @returns {object} Readiness result for this document
 */
export function checkDocumentReadiness(requirements, data) {
  const blockingIssues = [];
  const warningIssues = [];

  // Check blocking requirements
  for (const req of requirements.blocking) {
    if (!req.check(data)) {
      blockingIssues.push({
        key: req.key,
        label: req.label,
        source: req.source,
        suggestion: req.suggestion || null,
        severity: 'BLOCKING',
      });
    }
  }

  // Check warning requirements
  for (const req of requirements.warnings) {
    if (!req.check(data)) {
      warningIssues.push({
        key: req.key,
        label: req.label,
        source: req.source,
        suggestion: req.suggestion || null,
        severity: 'WARNING',
      });
    }
  }

  const canGenerate = blockingIssues.length === 0;

  return {
    documentType: requirements.documentType,
    documentName: requirements.documentName,
    canGenerate,
    blockingIssues,
    warningIssues,
    totalIssues: blockingIssues.length + warningIssues.length,
  };
}

/**
 * Check readiness for all document types
 *
 * @param {object} data - Lease data including all related records
 * @returns {object} Complete readiness report
 */
export function checkAllDocumentsReadiness(data) {
  const results = ALL_DOCUMENT_REQUIREMENTS.map(req =>
    checkDocumentReadiness(req, data)
  );

  const documentsReady = results.filter(r => r.canGenerate);
  const documentsNotReady = results.filter(r => !r.canGenerate);

  // Aggregate all unique blocking issues
  const allBlockingIssues = [];
  const seenKeys = new Set();

  for (const result of results) {
    for (const issue of result.blockingIssues) {
      if (!seenKeys.has(issue.key)) {
        seenKeys.add(issue.key);
        allBlockingIssues.push({
          ...issue,
          affectedDocuments: results
            .filter(r => r.blockingIssues.some(i => i.key === issue.key))
            .map(r => r.documentName),
        });
      }
    }
  }

  return {
    canGenerateAny: documentsReady.length > 0,
    canGenerateAll: documentsNotReady.length === 0,
    readyCount: documentsReady.length,
    totalCount: results.length,
    documents: results,
    documentsReady: documentsReady.map(r => r.documentType),
    documentsNotReady: documentsNotReady.map(r => r.documentType),
    allBlockingIssues,
    summary: generateReadinessSummary(results, allBlockingIssues),
  };
}

/**
 * Generate human-readable summary of readiness status
 */
function generateReadinessSummary(results, blockingIssues) {
  const readyCount = results.filter(r => r.canGenerate).length;
  const totalCount = results.length;

  if (readyCount === totalCount) {
    return {
      status: 'READY',
      message: 'All 4 documents are ready to generate',
      color: 'green',
    };
  }

  if (readyCount === 0) {
    return {
      status: 'BLOCKED',
      message: `Cannot generate any documents. ${blockingIssues.length} issue(s) need to be resolved.`,
      color: 'red',
    };
  }

  return {
    status: 'PARTIAL',
    message: `${readyCount} of ${totalCount} documents can be generated. ${blockingIssues.length} issue(s) blocking others.`,
    color: 'orange',
  };
}

/**
 * Format readiness report for logging/alerting
 *
 * @param {object} readinessReport - Result from checkAllDocumentsReadiness
 * @param {object} lease - Lease record for identification
 * @returns {string} Formatted report string
 */
export function formatReadinessReport(readinessReport, lease) {
  const lines = [];
  const agreementNumber = lease?.agreement_number || 'Unknown';
  const leaseId = lease?.id || 'Unknown';

  lines.push(`📋 Lease Readiness Report`);
  lines.push(`Agreement: ${agreementNumber} (${leaseId})`);
  lines.push(`Status: ${readinessReport.summary.status}`);
  lines.push(`Documents Ready: ${readinessReport.readyCount}/${readinessReport.totalCount}`);
  lines.push('');

  if (readinessReport.allBlockingIssues.length > 0) {
    lines.push('❌ BLOCKING ISSUES:');
    for (const issue of readinessReport.allBlockingIssues) {
      lines.push(`  • ${issue.label} (${issue.source})`);
      if (issue.suggestion) {
        lines.push(`    → ${issue.suggestion}`);
      }
      lines.push(`    Affects: ${issue.affectedDocuments.join(', ')}`);
    }
    lines.push('');
  }

  // Per-document status
  lines.push('📄 DOCUMENT STATUS:');
  for (const doc of readinessReport.documents) {
    const icon = doc.canGenerate ? '✅' : '❌';
    lines.push(`  ${icon} ${doc.documentName}`);
    if (!doc.canGenerate && doc.blockingIssues.length > 0) {
      for (const issue of doc.blockingIssues) {
        lines.push(`     Missing: ${issue.label}`);
      }
    }
  }

  return lines.join('\n');
}

/**
 * Format readiness report for Slack alert
 *
 * @param {object} readinessReport - Result from checkAllDocumentsReadiness
 * @param {object} lease - Lease record for identification
 * @returns {object} Slack-formatted message
 */
export function formatReadinessForSlack(readinessReport, lease) {
  const agreementNumber = lease?.agreement_number || 'Unknown';
  const leaseId = lease?.id || 'Unknown';

  const missingFields = readinessReport.allBlockingIssues
    .map(issue => `• ${issue.label} (${issue.source})`)
    .join('\n');

  const affectedDocs = readinessReport.documentsNotReady
    .map(type => {
      const doc = readinessReport.documents.find(d => d.documentType === type);
      return doc?.documentName || type;
    })
    .join(', ');

  return {
    text: `⚠️ Document Generation Blocked`,
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '⚠️ Document Generation Blocked',
        },
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Agreement:*\n${agreementNumber}`,
          },
          {
            type: 'mrkdwn',
            text: `*Lease ID:*\n${leaseId}`,
          },
        ],
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Missing Data:*\n${missingFields || 'None'}`,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Affected Documents:*\n${affectedDocs || 'None'}`,
        },
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `Ready: ${readinessReport.readyCount}/${readinessReport.totalCount} documents`,
          },
        ],
      },
    ],
  };
}
