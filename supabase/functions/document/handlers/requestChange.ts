/**
 * Handle document change request submission
 * Creates a database record and sends Slack notification
 */

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { ValidationError } from '../../_shared/errors.ts';
import { sendToSlack } from '../../_shared/slack.ts';

interface RequestChangePayload {
  document_id: string;
  user_id: string;
  user_email: string;
  user_name?: string;
  user_type: 'Host' | 'Guest';
  request_text: string;
}

interface UserContext {
  id: string;
  email: string;
}

export async function handleRequestChange(
  payload: unknown,
  supabase: SupabaseClient,
  user: UserContext | null
): Promise<{ success: boolean; request_id: string }> {
  console.log('[document/requestChange] Starting request change handler');

  // Validate payload
  const {
    document_id,
    user_id,
    user_email,
    user_name,
    user_type,
    request_text,
  } = payload as RequestChangePayload;

  if (!document_id || typeof document_id !== 'string') {
    throw new ValidationError('document_id is required and must be a string');
  }

  if (!user_id || typeof user_id !== 'string') {
    throw new ValidationError('user_id is required and must be a string');
  }

  if (!user_email || typeof user_email !== 'string') {
    throw new ValidationError('user_email is required and must be a string');
  }

  if (!user_type || !['Host', 'Guest'].includes(user_type)) {
    throw new ValidationError('user_type must be "Host" or "Guest"');
  }

  if (!request_text || typeof request_text !== 'string' || !request_text.trim()) {
    throw new ValidationError('request_text is required and cannot be empty');
  }

  // Verify document exists
  const { data: document, error: docError } = await supabase
    .from('documentssent')
    .select('id, document_sent_title')
    .eq('id', document_id)
    .single();

  if (docError || !document) {
    console.error('[document/requestChange] Document not found:', docError);
    throw new ValidationError('Document not found');
  }

  const documentTitle = document.document_sent_title || 'Untitled Document';

  // Create change request record
  const now = new Date().toISOString();
  const changeRequest = {
    document_id,
    user_id,
    user_email,
    user_name: user_name || null,
    user_type,
    request_text: request_text.trim(),
    status: 'pending',
    created_at: now,
    updated_at: now,
  };

  const { data: createdRequest, error: createError } = await supabase
    .from('document_change_request')
    .insert(changeRequest)
    .select('id')
    .single();

  if (createError) {
    console.error('[document/requestChange] Failed to create request:', createError);
    throw new Error(`Failed to create change request: ${createError.message}`);
  }

  const requestId = createdRequest.id;

  console.log('[document/requestChange] Created request:', requestId);

  // Send Slack notification (fire-and-forget)
  const truncatedText = request_text.length > 300
    ? request_text.substring(0, 297) + '...'
    : request_text;

  const slackMessage = {
    text: [
      `📝 Document Change Request`,
      ``,
      `User: ${user_name || user_email} (${user_type})`,
      `Email: ${user_email}`,
      `Document: ${documentTitle}`,
      ``,
      `Request:`,
      truncatedText,
      ``,
      `Request ID: ${requestId}`,
      `Document ID: ${document_id}`,
    ].join('\n'),
  };

  sendToSlack('database', slackMessage);

  console.log('[document/requestChange] Slack notification sent');

  return {
    success: true,
    request_id: requestId,
  };
}
