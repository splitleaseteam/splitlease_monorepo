/**
 * Business logic hook for DocumentChangeRequestModal
 * Follows Hollow Component Pattern
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabase.js';

export function useDocumentChangeRequestLogic({
  currentDocumentId,
  userId,
  userEmail,
  userName,
  userType,
  onSuccess,
}) {
  const [documents, setDocuments] = useState([]);
  const [selectedDocumentId, setSelectedDocumentId] = useState('');
  const [requestText, setRequestText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Fetch draft documents on mount
  useEffect(() => {
    async function fetchDocuments() {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch documents from documentssent table
        // Filter for draft/pending documents (adjust filter as needed)
        const { data, error: fetchError } = await supabase
          .from('documentssent')
          .select('_id, "Document sent title"')
          .order('Created Date', { ascending: false });

        if (fetchError) {
          throw new Error(`Failed to load documents: ${fetchError.message}`);
        }

        const formattedDocs = (data || []).map((doc) => ({
          id: doc._id,
          title: doc['Document sent title'] || 'Untitled Document',
        }));

        setDocuments(formattedDocs);

        // Auto-select current document if provided
        if (currentDocumentId && formattedDocs.find((d) => d.id === currentDocumentId)) {
          setSelectedDocumentId(currentDocumentId);
        }
      } catch (err) {
        console.error('[useDocumentChangeRequestLogic] Fetch error:', err);
        setError(err.message);
        window.showToast?.({ title: 'Error', content: 'Failed to load documents', type: 'error' });
      } finally {
        setIsLoading(false);
      }
    }

    fetchDocuments();
  }, [currentDocumentId]);

  const handleDocumentChange = useCallback((documentId) => {
    setSelectedDocumentId(documentId);
    setError(null);
  }, []);

  const handleRequestTextChange = useCallback((text) => {
    setRequestText(text);
    setError(null);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!selectedDocumentId) {
      setError('Please select a document');
      return false;
    }

    if (!requestText.trim()) {
      setError('Please enter your change request');
      return false;
    }

    if (!userId || !userEmail || !userType) {
      setError('Missing user information');
      return false;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Call Edge Function
      const { data: response, error: edgeFunctionError } = await supabase.functions.invoke(
        'document',
        {
          body: {
            action: 'request_change',
            payload: {
              document_id: selectedDocumentId,
              user_id: userId,
              user_email: userEmail,
              user_name: userName || null,
              user_type: userType,
              request_text: requestText.trim(),
            },
          },
        }
      );

      if (edgeFunctionError) {
        throw new Error(edgeFunctionError.message || 'Failed to submit request');
      }

      if (!response?.success) {
        throw new Error(response?.error || 'Request failed');
      }

      // Success
      console.log('[useDocumentChangeRequestLogic] Request submitted:', response.data.request_id);
      window.showToast?.({ title: 'Success', content: 'Change request submitted successfully', type: 'success' });

      if (onSuccess) {
        onSuccess(response.data.request_id);
      }

      return true;
    } catch (err) {
      console.error('[useDocumentChangeRequestLogic] Submit error:', err);
      setError(err.message);
      window.showToast?.({ title: 'Error', content: `Failed to submit request: ${err.message}`, type: 'error' });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedDocumentId, requestText, userId, userEmail, userName, userType, onSuccess]);

  const resetForm = useCallback(() => {
    setSelectedDocumentId(currentDocumentId || '');
    setRequestText('');
    setError(null);
  }, [currentDocumentId]);

  return {
    documents,
    selectedDocumentId,
    requestText,
    isLoading,
    isSubmitting,
    error,
    handleDocumentChange,
    handleRequestTextChange,
    handleSubmit,
    resetForm,
  };
}
