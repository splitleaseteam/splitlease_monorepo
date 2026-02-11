import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../../lib/supabase.js';
import { useAsyncOperation } from '../../../hooks/useAsyncOperation.js';

const FROM_EMAIL = 'tech@leasesplit.com';
const RECIPIENT_PLACEHOLDERS = ['$$to$$', '$$cc$$', '$$bcc$$'];
const JSON_FRAGMENT_PLACEHOLDERS = ['$$cc$$', '$$bcc$$', '$$reply_to$$'];

export default function useZEmailsUnitPageLogic() {
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);
  const [placeholderValues, setPlaceholderValues] = useState({});
  const [multiEmailValues, setMultiEmailValues] = useState({});
  const [previewHtml, setPreviewHtml] = useState('');
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState(null);

  // ===== ASYNC OPERATIONS =====
  const {
    data: templates,
    isLoading: loading,
    error: templateError,
    execute: executeLoadTemplates,
  } = useAsyncOperation(async () => {
    const { data, error: fetchError } = await supabase
      .schema('reference_table')
      .from('zat_email_html_template_eg_sendbasicemailwf_')
      .select('_id, Name, Description, Placeholder, "Email Template JSON", Logo, "Created Date"')
      .order('Created Date', { ascending: false });

    if (fetchError) throw new Error('Unable to load email templates. Please try again later.');
    return data || [];
  }, { initialData: [] });

  // Expose error as string for backward compatibility
  const error = templateError?.message || null;

  useEffect(() => {
    document.title = 'Email Unit Test | Admin';
  }, []);

  useEffect(() => {
    executeLoadTemplates().catch(() => {});
  }, []);

  const selectedTemplate = useMemo(() => {
    if (!selectedTemplateId) return null;
    return templates.find((template) => template._id === selectedTemplateId) || null;
  }, [templates, selectedTemplateId]);

  const placeholders = useMemo(() => {
    const extracted = extractPlaceholders(selectedTemplate?.Placeholder);
    return extracted.filter((placeholder) => !RECIPIENT_PLACEHOLDERS.includes(placeholder.key));
  }, [selectedTemplate]);

  const canSendEmail = useMemo(() => {
    if (!selectedTemplate) return false;
    const toEmails = multiEmailValues['$$to$$'] || [];
    return toEmails.some((email) => email && email.trim().length > 0);
  }, [selectedTemplate, multiEmailValues]);

  function handleTemplateChange(templateId) {
    setSelectedTemplateId(templateId || null);
    setPreviewHtml('');
    setSendResult(null);

    if (!templateId) {
      setPlaceholderValues({});
      setMultiEmailValues({});
      return;
    }

    const template = templates.find((item) => item._id === templateId);
    const extracted = extractPlaceholders(template?.Placeholder);
    const initialValues = {};

    extracted.forEach((placeholder) => {
      if (!RECIPIENT_PLACEHOLDERS.includes(placeholder.key)) {
        initialValues[placeholder.key] = placeholder.key
          .replace(/^\$\$/, '')
          .replace(/\$\$$/, '');
      }
    });

    const initialMultiEmails = RECIPIENT_PLACEHOLDERS.reduce((acc, key) => {
      acc[key] = [''];
      return acc;
    }, {});

    setPlaceholderValues(initialValues);
    setMultiEmailValues(initialMultiEmails);
  }

  function handlePlaceholderChange(key, value) {
    setPlaceholderValues((prev) => ({
      ...prev,
      [key]: value
    }));
  }

  function handleMultiEmailChange(key, index, value) {
    setMultiEmailValues((prev) => {
      const emails = [...(prev[key] || [''])];
      emails[index] = value;
      return { ...prev, [key]: emails };
    });
  }

  function addMultiEmail(key) {
    setMultiEmailValues((prev) => {
      const emails = [...(prev[key] || [''])];
      emails.push('');
      return { ...prev, [key]: emails };
    });
  }

  function removeMultiEmail(key, index) {
    setMultiEmailValues((prev) => {
      const emails = [...(prev[key] || [''])];
      if (emails.length > 1) {
        emails.splice(index, 1);
      } else {
        emails[0] = '';
      }
      return { ...prev, [key]: emails };
    });
  }

  function updatePreview() {
    if (!selectedTemplate) {
      setPreviewHtml('');
      return;
    }

    const html = generatePreviewHtml(
      selectedTemplate['Email Template JSON'],
      placeholderValues
    );
    setPreviewHtml(html);
  }

  async function sendEmail() {
    if (!canSendEmail || !selectedTemplate) return;

    setSending(true);
    setSendResult(null);

    try {
      const toEmails = (multiEmailValues['$$to$$'] || []).filter((email) => email && email.trim());
      const ccEmails = (multiEmailValues['$$cc$$'] || []).filter((email) => email && email.trim());
      const bccEmails = (multiEmailValues['$$bcc$$'] || []).filter((email) => email && email.trim());

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          action: 'send',
          payload: {
            template_id: selectedTemplate._id,
            to_email: toEmails[0],
            from_email: FROM_EMAIL,
            from_name: 'Split Lease',
            subject: placeholderValues['$$subject$$'] || 'Test Email',
            variables: { ...placeholderValues },
            ...(ccEmails.length > 0 && { cc_emails: ccEmails }),
            ...(bccEmails.length > 0 && { bcc_emails: bccEmails }),
            ...(toEmails.length > 1 && { additional_to: toEmails.slice(1) })
          }
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setSendResult({ success: true, message: 'Email sent successfully.' });
      } else {
        setSendResult({ success: false, message: result.error || 'Failed to send email.' });
      }
    } catch (err) {
      setSendResult({ success: false, message: err.message || 'Failed to send email.' });
    } finally {
      setSending(false);
    }
  }

  function clearSendResult() {
    setSendResult(null);
  }

  return {
    templates,
    selectedTemplateId,
    selectedTemplate,
    placeholders,
    placeholderValues,
    multiEmailValues,
    previewHtml,
    loading,
    error,
    canSendEmail,
    sending,
    sendResult,
    fromEmail: FROM_EMAIL,
    handleTemplateChange,
    handlePlaceholderChange,
    handleMultiEmailChange,
    addMultiEmail,
    removeMultiEmail,
    updatePreview,
    sendEmail,
    clearSendResult
  };
}

function extractPlaceholders(placeholderArray) {
  if (!placeholderArray || !Array.isArray(placeholderArray)) {
    return [];
  }

  return placeholderArray.map((placeholder) => ({
    key: placeholder,
    label: placeholder,
    defaultValue: ''
  }));
}

function generatePreviewHtml(templateJson, placeholderValues) {
  if (!templateJson) {
    return '';
  }

  try {
    const htmlMatch = templateJson.match(/"type"\s*:\s*"text\/html"\s*,\s*"value"\s*:\s*"((?:[^"\\]|\\.)*)"/);
    let htmlContent = '';

    if (htmlMatch && htmlMatch[1]) {
      htmlContent = htmlMatch[1]
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, '\r')
        .replace(/\\t/g, '\t')
        .replace(/\\"/g, '"')
        .replace(/\\\\/g, '\\');
    } else {
      const altMatch = templateJson.match(/"value"\s*:\s*"((?:[^"\\]|\\.)*)"\s*,\s*"type"\s*:\s*"text\/html"/);
      if (altMatch && altMatch[1]) {
        htmlContent = altMatch[1]
          .replace(/\\n/g, '\n')
          .replace(/\\r/g, '\r')
          .replace(/\\t/g, '\t')
          .replace(/\\"/g, '"')
          .replace(/\\\\/g, '\\');
      }
    }

    if (!htmlContent) {
      const plainMatch = templateJson.match(/"type"\s*:\s*"text\/plain"\s*,\s*"value"\s*:\s*"((?:[^"\\]|\\.)*)"/);
      if (plainMatch && plainMatch[1]) {
        const plainText = plainMatch[1]
          .replace(/\\n/g, '\n')
          .replace(/\\r/g, '\r')
          .replace(/\\t/g, '\t')
          .replace(/\\"/g, '"')
          .replace(/\\\\/g, '\\');
        htmlContent = `<pre style="white-space: pre-wrap; font-family: inherit;">${plainText}</pre>`;
      }
    }

    if (!htmlContent) {
      return '<p style="color: #dc2626; padding: 20px;">No HTML content found in this template.</p>';
    }

    let preview = htmlContent;
    Object.entries(placeholderValues).forEach(([key, value]) => {
      if (JSON_FRAGMENT_PLACEHOLDERS.includes(key)) {
        return;
      }
      const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escapedKey, 'g');
      preview = preview.replace(regex, value || key);
    });

    return preview;
  } catch (_error) {
    return `<p style="color: #dc2626; padding: 20px;">Error extracting template preview.</p>`;
  }
}
