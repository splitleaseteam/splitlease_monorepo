/**
 * Generate All Documents Handler
 * Split Lease - Supabase Edge Functions
 *
 * 1:1 compatible with PythonAnywhere API.
 * Orchestrates the generation of all 4 lease documents:
 * 1. Host Payout Schedule
 * 2. Supplemental Agreement
 * 3. Periodic Tenancy Agreement
 * 4. Credit Card Authorization (Prorated or Non-Prorated)
 *
 * Documents are generated sequentially to avoid overwhelming resources.
 * Partial failures are handled gracefully - each document result is returned individually.
 */

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import type { GenerateAllPayload as _GenerateAllPayload, GenerateAllResult, UserContext } from '../lib/types.ts';
import { validateGenerateAllPayload } from '../lib/validators.ts';
import { handleGenerateHostPayout } from './generateHostPayout.ts';
import { handleGenerateSupplemental } from './generateSupplemental.ts';
import { handleGeneratePeriodicTenancy } from './generatePeriodicTenancy.ts';
import { handleGenerateCreditCardAuth } from './generateCreditCardAuth.ts';
import { notifySlack } from '../lib/googleDrive.ts';

// ================================================
// HANDLER
// ================================================

export async function handleGenerateAll(
  payload: unknown,
  user: UserContext | null,
  supabase: SupabaseClient
): Promise<GenerateAllResult> {
  console.log('[generateAll] Starting orchestrated document generation...');
  console.log('[generateAll] 📷 INCOMING PAYLOAD IMAGE CHECK:');

  // Type guard for payload
  const typedPayload = payload as Record<string, Record<string, unknown>> | null;
  if (typedPayload?.periodicTenancy) {
    console.log('[generateAll] 📷 periodicTenancy.image1:', typedPayload.periodicTenancy['image1'] || '(not set)');
    console.log('[generateAll] 📷 periodicTenancy.image2:', typedPayload.periodicTenancy['image2'] || '(not set)');
    console.log('[generateAll] 📷 periodicTenancy.image3:', typedPayload.periodicTenancy['image3'] || '(not set)');
  } else {
    console.log('[generateAll] 📷 periodicTenancy payload not found');
  }
  if (typedPayload?.supplemental) {
    console.log('[generateAll] 📷 supplemental.image1:', typedPayload.supplemental['image1'] || '(not set)');
    console.log('[generateAll] 📷 supplemental.image2:', typedPayload.supplemental['image2'] || '(not set)');
    console.log('[generateAll] 📷 supplemental.image3:', typedPayload.supplemental['image3'] || '(not set)');
  } else {
    console.log('[generateAll] 📷 supplemental payload not found');
  }

  // Validate payload (Python-compatible format)
  let validatedPayload;
  let agreementNumber: string;
  try {
    validatedPayload = validateGenerateAllPayload(payload);
    agreementNumber = validatedPayload.hostPayout['Agreement Number'];
  } catch (validationError) {
    const errorMessage = validationError instanceof Error ? validationError.message : String(validationError);
    console.error('[generateAll] Validation error:', errorMessage);
    return {
      hostPayout: { success: false, error: errorMessage, returned_error: 'yes' },
      supplemental: { success: false, error: errorMessage, returned_error: 'yes' },
      periodicTenancy: { success: false, error: errorMessage, returned_error: 'yes' },
      creditCardAuth: { success: false, error: errorMessage, returned_error: 'yes' },
    };
  }
  console.log(`[generateAll] Agreement: ${agreementNumber}`);

  const results: GenerateAllResult = {
    hostPayout: { success: false },
    supplemental: { success: false },
    periodicTenancy: { success: false },
    creditCardAuth: { success: false },
  };

  let successCount = 0;
  let failureCount = 0;

  // 1. Generate Host Payout Schedule
  console.log('[generateAll] Generating Host Payout Schedule...');
  try {
    results.hostPayout = await handleGenerateHostPayout(
      validatedPayload.hostPayout,
      user,
      supabase
    );
    if (results.hostPayout.success) {
      successCount++;
    } else {
      failureCount++;
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[generateAll] Host Payout error:', errorMessage);
    results.hostPayout = { success: false, error: errorMessage, returned_error: 'yes' };
    failureCount++;
  }

  // 2. Generate Supplemental Agreement
  console.log('[generateAll] Generating Supplemental Agreement...');
  try {
    results.supplemental = await handleGenerateSupplemental(
      validatedPayload.supplemental,
      user,
      supabase
    );
    if (results.supplemental.success) {
      successCount++;
    } else {
      failureCount++;
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[generateAll] Supplemental error:', errorMessage);
    results.supplemental = { success: false, error: errorMessage, returned_error: 'yes' };
    failureCount++;
  }

  // 3. Generate Periodic Tenancy Agreement
  console.log('[generateAll] Generating Periodic Tenancy Agreement...');
  try {
    results.periodicTenancy = await handleGeneratePeriodicTenancy(
      validatedPayload.periodicTenancy,
      user,
      supabase
    );
    if (results.periodicTenancy.success) {
      successCount++;
    } else {
      failureCount++;
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[generateAll] Periodic Tenancy error:', errorMessage);
    results.periodicTenancy = { success: false, error: errorMessage, returned_error: 'yes' };
    failureCount++;
  }

  // 4. Generate Credit Card Authorization
  console.log('[generateAll] Generating Credit Card Authorization...');
  try {
    results.creditCardAuth = await handleGenerateCreditCardAuth(
      validatedPayload.creditCardAuth,
      user,
      supabase
    );
    if (results.creditCardAuth.success) {
      successCount++;
    } else {
      failureCount++;
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[generateAll] Credit Card Auth error:', errorMessage);
    results.creditCardAuth = { success: false, error: errorMessage, returned_error: 'yes' };
    failureCount++;
  }

  // Summary notification (non-blocking - don't fail orchestration on Slack errors)
  try {
    if (failureCount === 0) {
      await notifySlack(`All 4 documents generated successfully for Agreement ${agreementNumber}`);
    } else if (successCount === 0) {
      await notifySlack(`All 4 documents failed to generate for Agreement ${agreementNumber}`, true);
    } else {
      await notifySlack(
        `Generated ${successCount}/4 documents for Agreement ${agreementNumber} (${failureCount} failed)`,
        true
      );
    }
  } catch (slackError) {
    console.warn('[generateAll] Slack notification failed (non-blocking):', slackError instanceof Error ? slackError.message : slackError);
  }

  console.log(`[generateAll] Completed: ${successCount} success, ${failureCount} failures`);
  return results;
}
