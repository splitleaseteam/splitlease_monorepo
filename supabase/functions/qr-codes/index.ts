/**
 * QR Codes Edge Function
 * Split Lease - Supabase Edge Functions
 *
 * Handles QR code data retrieval and scan recording with SMS notifications.
 *
 * Actions:
 *   - get: Retrieve QR code data by ID
 *   - record_scan: Record a scan and trigger SMS notifications
 *   - health: Health check
 *
 * NO FALLBACK PRINCIPLE: All errors fail fast without fallback logic
 *
 * FP ARCHITECTURE:
 * - Pure functions for validation, routing, and response formatting
 * - Immutable data structures
 * - Side effects isolated to boundaries (entry/exit of handler)
 */

import "jsr:@supabase/functions-js@2/edge-runtime.d.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { ValidationError } from "../_shared/errors.ts";
import { Result as _Result, ok as _ok, err as _err } from "../_shared/functional/result.ts";
import {
  parseRequest,
  validateAction,
  routeToHandler,
  formatSuccessResponse,
  formatErrorResponseHttp,
  formatCorsResponse,
  CorsPreflightSignal,
  getSupabaseConfig,
} from "../_shared/functional/orchestration.ts";
import { createErrorLog, addError, setAction, ErrorLog } from "../_shared/functional/errorLog.ts";
import { reportErrorLog } from "../_shared/slack.ts";
import { validateRequired } from "../_shared/validation.ts";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface QrCodeRecord {
  readonly id: string;
  readonly use_case: string;
  readonly display_text: string | null;
  readonly information_content: string | null;
  readonly visit_id: string | null;
  readonly listing_id: string | null;
  readonly property_id: string | null;
  readonly property_name: string | null;
  readonly host_name: string | null;
  readonly guest_name: string | null;
  readonly host_phone: string | null;
  readonly guest_phone: string | null;
  readonly is_active: boolean;
  readonly scan_count: number;
}

interface QrCodeResponse {
  readonly id: string;
  readonly useCase: string;
  readonly displayText: string | null;
  readonly informationContent: string | null;
  readonly visitId: string | null;
  readonly listingId: string | null;
  readonly propertyId: string | null;
  readonly propertyName: string | null;
  readonly hostName: string | null;
  readonly guestName: string | null;
}

interface GetPayload {
  readonly qrCodeId: string;
}

interface RecordScanPayload {
  readonly qrCodeId: string;
}

interface NotificationResult {
  readonly host: boolean;
  readonly guest: boolean;
}

interface RecordScanResponse {
  readonly qrCode: QrCodeResponse;
  readonly notificationsSent: NotificationResult;
}

// ─────────────────────────────────────────────────────────────
// Configuration (Immutable)
// ─────────────────────────────────────────────────────────────

const ALLOWED_ACTIONS = ["get", "record_scan", "health"] as const;
type Action = (typeof ALLOWED_ACTIONS)[number];

// Phone number that can send SMS without user authentication
const PUBLIC_SMS_NUMBER = "+14155692985";

// ─────────────────────────────────────────────────────────────
// Pure Functions - Data Transformation
// ─────────────────────────────────────────────────────────────

/**
 * Transform database record to API response format
 */
const transformQrCodeToResponse = (record: QrCodeRecord): QrCodeResponse => ({
  id: record.id,
  useCase: record.use_case,
  displayText: record.display_text,
  informationContent: record.information_content,
  visitId: record.visit_id,
  listingId: record.listing_id,
  propertyId: record.property_id,
  propertyName: record.property_name,
  hostName: record.host_name,
  guestName: record.guest_name,
});

/**
 * Get notification messages based on use case
 */
const getNotificationMessages = (
  useCase: string,
  propertyName: string | null,
  guestName: string | null
): { host: string | null; guest: string | null } => {
  const property = propertyName || "the property";
  const guest = guestName || "A guest";

  switch (useCase) {
    case "check_in":
      return {
        host: `🏠 ${guest} has checked in at ${property}`,
        guest: `Welcome to ${property}! Your check-in has been recorded.`,
      };
    case "check_out":
      return {
        host: `👋 ${guest} has checked out of ${property}`,
        guest: `Thank you for staying at ${property}! Safe travels.`,
      };
    case "emergency":
      return {
        host: `🚨 EMERGENCY: QR scanned at ${property} by ${guest}`,
        guest: `Emergency services have been notified. Stay calm and call 911 if needed.`,
      };
    case "general_info":
    default:
      return { host: null, guest: null };
  }
};

// ─────────────────────────────────────────────────────────────
// Handlers
// ─────────────────────────────────────────────────────────────

/**
 * Health check handler
 */
const handleHealth = (): {
  status: string;
  timestamp: string;
  actions: readonly string[];
} => ({
  status: "healthy",
  timestamp: new Date().toISOString(),
  actions: ALLOWED_ACTIONS,
});

/**
 * Get QR code data by ID
 */
const handleGet = async (
  supabase: SupabaseClient,
  payload: GetPayload
): Promise<QrCodeResponse> => {
  console.log("[qr-codes] Processing get request...");

  validateRequired(payload.qrCodeId, "payload.qrCodeId");

  const { data, error } = await supabase
    .from("qr_codes")
    .select(
      `
      id,
      use_case,
      display_text,
      information_content,
      visit_id,
      listing_id,
      property_id,
      property_name,
      host_name,
      guest_name,
      is_active
    `
    )
    .eq("id", payload.qrCodeId)
    .eq("is_active", true)
    .single();

  if (error) {
    console.error("[qr-codes] QR code fetch error:", error);
    throw new ValidationError("QR code not found");
  }

  return transformQrCodeToResponse(data as QrCodeRecord);
};

/**
 * Send SMS notification
 * Non-blocking - logs errors but doesn't throw
 */
const sendSmsNotification = async (
  supabaseUrl: string,
  anonKey: string,
  to: string,
  body: string
): Promise<boolean> => {
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/send-sms`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${anonKey}`,
      },
      body: JSON.stringify({
        action: "send",
        payload: {
          to,
          from: PUBLIC_SMS_NUMBER,
          body,
        },
      }),
    });

    const result = await response.json();
    return result.success === true;
  } catch (error) {
    console.error("[qr-codes] SMS send error:", error);
    return false;
  }
};

/**
 * Send notifications based on use case
 */
const sendNotifications = async (
  supabaseUrl: string,
  anonKey: string,
  qrCode: QrCodeRecord
): Promise<NotificationResult> => {
  const result: NotificationResult = { host: false, guest: false };

  // Skip notifications for general_info use case
  if (qrCode.use_case === "general_info") {
    return result;
  }

  const messages = getNotificationMessages(
    qrCode.use_case,
    qrCode.property_name,
    qrCode.guest_name
  );

  // Send to host (parallel with guest)
  const hostPromise =
    qrCode.host_phone && messages.host
      ? sendSmsNotification(supabaseUrl, anonKey, qrCode.host_phone, messages.host)
      : Promise.resolve(false);

  // Send to guest (parallel with host)
  const guestPromise =
    qrCode.guest_phone && messages.guest
      ? sendSmsNotification(supabaseUrl, anonKey, qrCode.guest_phone, messages.guest)
      : Promise.resolve(false);

  const [hostResult, guestResult] = await Promise.all([hostPromise, guestPromise]);

  return {
    host: hostResult,
    guest: guestResult,
  };
};

/**
 * Record a QR code scan and send notifications
 */
const handleRecordScan = async (
  supabase: SupabaseClient,
  supabaseUrl: string,
  anonKey: string,
  payload: RecordScanPayload
): Promise<RecordScanResponse> => {
  console.log("[qr-codes] Processing record_scan request...");

  validateRequired(payload.qrCodeId, "payload.qrCodeId");

  // Fetch QR code data
  const { data: qrCode, error: fetchError } = await supabase
    .from("qr_codes")
    .select("*")
    .eq("id", payload.qrCodeId)
    .eq("is_active", true)
    .single();

  if (fetchError || !qrCode) {
    console.error("[qr-codes] QR code fetch error:", fetchError);
    throw new ValidationError("QR code not found");
  }

  const typedQrCode = qrCode as QrCodeRecord;

  // Update scan count and timestamp (non-blocking)
  const updatePromise = supabase
    .from("qr_codes")
    .update({
      scan_count: (typedQrCode.scan_count || 0) + 1,
      last_scanned_at: new Date().toISOString(),
    })
    .eq("id", payload.qrCodeId);

  // Send notifications (parallel with update)
  const notificationsPromise = sendNotifications(supabaseUrl, anonKey, typedQrCode);

  const [updateResult, notificationsSent] = await Promise.all([
    updatePromise,
    notificationsPromise,
  ]);

  if (updateResult.error) {
    console.error("[qr-codes] Scan count update error:", updateResult.error);
    // Non-blocking - continue with response
  }

  console.log("[qr-codes] Scan recorded. Notifications sent:", notificationsSent);

  return {
    qrCode: transformQrCodeToResponse(typedQrCode),
    notificationsSent,
  };
};

// ─────────────────────────────────────────────────────────────
// Handler Map
// ─────────────────────────────────────────────────────────────

type HandlerFn = (
  supabase: SupabaseClient,
  supabaseUrl: string,
  anonKey: string,
  payload: Record<string, unknown>
) => Promise<unknown>;

const handlers: Readonly<Record<Action, HandlerFn | (() => unknown)>> = {
  get: (supabase, _url, _key, payload) =>
    handleGet(supabase, payload as GetPayload),
  record_scan: (supabase, url, key, payload) =>
    handleRecordScan(supabase, url, key, payload as RecordScanPayload),
  health: handleHealth,
};

// ─────────────────────────────────────────────────────────────
// Effect Boundary (Side Effects Isolated Here)
// ─────────────────────────────────────────────────────────────

console.log("[qr-codes] Edge Function started (FP mode)");

Deno.serve(async (req: Request) => {
  const correlationId = crypto.randomUUID().slice(0, 8);
  let errorLog: ErrorLog = createErrorLog("qr-codes", "unknown", correlationId);

  try {
    console.log(`[qr-codes] ========== REQUEST ==========`);
    console.log(`[qr-codes] Method: ${req.method}`);

    const parseResult = await parseRequest(req);

    if (!parseResult.ok) {
      if (parseResult.error instanceof CorsPreflightSignal) {
        return formatCorsResponse();
      }
      throw parseResult.error;
    }

    const { action, payload } = parseResult.value;
    errorLog = setAction(errorLog, action);
    console.log(`[qr-codes] Action: ${action}`);

    const actionResult = validateAction(ALLOWED_ACTIONS, action);
    if (!actionResult.ok) {
      throw actionResult.error;
    }

    // Get Supabase configuration
    const configResult = getSupabaseConfig();
    if (!configResult.ok) {
      throw configResult.error;
    }

    const { supabaseUrl, supabaseServiceKey, supabaseAnonKey } = configResult.value;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const handlerResult = routeToHandler(handlers, action);
    if (!handlerResult.ok) {
      throw handlerResult.error;
    }

    const handler = handlerResult.value;
    const result =
      action === "health"
        ? (handler as () => unknown)()
        : await (handler as HandlerFn)(supabase, supabaseUrl, supabaseAnonKey, payload);

    console.log(`[qr-codes] ========== SUCCESS ==========`);

    return formatSuccessResponse(result);
  } catch (error) {
    console.error(`[qr-codes] ========== ERROR ==========`);
    console.error(`[qr-codes]`, error);

    errorLog = addError(errorLog, error as Error, "Fatal error in main handler");
    reportErrorLog(errorLog);

    return formatErrorResponseHttp(error as Error);
  }
});
