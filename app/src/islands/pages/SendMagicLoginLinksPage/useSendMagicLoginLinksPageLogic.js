/**
 * useSendMagicLoginLinksPageLogic - Business logic for Send Magic Login Links admin tool
 *
 * Pure business logic layer following Split Lease's hollow component pattern.
 * All state, side effects, and API calls contained here.
 */

import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase.js';
// NOTE: Auth imports removed - admin check disabled for testing
// Original: import { getUserId, getUserType } from '../../../lib/auth.js';
import { useToast } from '../../shared/Toast';

// Supabase credentials - anon key required for edge function gateway
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing required env vars: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set');
}

export function useSendMagicLoginLinksPageLogic() {
  const { showToast } = useToast();

  // Page state
  const [isLoading, setIsLoading] = useState(true);

  // Step state
  const [currentStep, setCurrentStep] = useState(1); // 1-5

  // Step 1: User selection
  const [searchText, setSearchText] = useState('');
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Step 2: Phone override
  const [phoneOverride, setPhoneOverride] = useState('');

  // Step 3: Page selection
  const [destinationPages, setDestinationPages] = useState([]);
  const [selectedPage, setSelectedPage] = useState(null);

  // Step 4: Data attachment
  const [userData, setUserData] = useState(null);
  const [attachedData, setAttachedData] = useState({});
  const [loadingUserData, setLoadingUserData] = useState(false);

  // Step 5: Send
  const [generatedLink, setGeneratedLink] = useState('');
  const [sending, setSending] = useState(false);

  // Initialize page data
  useEffect(() => {
    const init = async () => {
      setIsLoading(false);
      await loadDestinationPages();
    };

    init();
  }, []);

  // Load users when search text changes (debounced)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadUsers();
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchText]);

  /**
   * Call Edge Function action
   * Soft headers pattern: apikey always required, Authorization optional
   * If no valid session, skip Authorization header (backend handles unauthenticated)
   */
  const callEdgeFunction = async (action, payload) => {
    const { data: { session } } = await supabase.auth.getSession();

    // Build headers - apikey always required, Authorization only with valid session
    const headers = {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
    };

    // Only add Authorization if there's a valid Supabase session
    // (no localStorage/sessionStorage fallback - those tokens may be invalid)
    if (session?.access_token) {
      headers.Authorization = `Bearer ${session.access_token}`;
    }

    const response = await fetch(`${SUPABASE_URL}/functions/v1/magic-login-links`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ action, payload }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Request failed');
    }

    const result = await response.json();
    return result.data;
  };

  /**
   * Step 1: Load users
   */
  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const data = await callEdgeFunction('list_users', {
        searchText,
        limit: 50
      });
      setUsers(data.users || []);
    } catch (error) {
      showToast(`Failed to load users: ${error.message}`, 'error');
      setUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  /**
   * Step 3: Load destination pages
   */
  const loadDestinationPages = async () => {
    try {
      const data = await callEdgeFunction('get_destination_pages', {});
      setDestinationPages(data.pages || []);
    } catch (error) {
      showToast(`Failed to load destination pages: ${error.message}`, 'error');
    }
  };

  /**
   * Step 4: Load user data for selected user
   */
  const loadUserData = async (userId) => {
    setLoadingUserData(true);
    try {
      const data = await callEdgeFunction('get_user_data', { userId });
      setUserData(data);
    } catch (error) {
      showToast(`Failed to load user data: ${error.message}`, 'error');
      setUserData(null);
    } finally {
      setLoadingUserData(false);
    }
  };

  /**
   * Step 5: Send magic link
   */
  const sendMagicLink = async () => {
    if (!selectedUser || !selectedPage) {
      showToast('Please select a user and destination page', 'error');
      return;
    }

    setSending(true);
    try {
      // Build destination path with userId if needed
      let destinationPath = selectedPage.path;
      if (selectedPage.path.includes(':userId')) {
        destinationPath = selectedPage.path.replace(':userId', selectedUser.id);
      }
      if (selectedPage.path.includes(':id') && attachedData.id) {
        destinationPath = selectedPage.path.replace(':id', attachedData.id);
      }

      const data = await callEdgeFunction('send_magic_link', {
        userId: selectedUser.id,
        destinationPage: destinationPath,
        phoneOverride: phoneOverride || undefined,
        attachedData: Object.keys(attachedData).length > 0 ? attachedData : undefined,
      });

      setGeneratedLink(data.link);
      showToast(
        data.sentViaSms
          ? 'Magic link generated and sent via SMS!'
          : 'Magic link generated successfully!',
        'success'
      );
      setCurrentStep(5);
    } catch (error) {
      showToast(`Failed to send magic link: ${error.message}`, 'error');
    } finally {
      setSending(false);
    }
  };

  /**
   * Navigation handlers
   */
  const handleSelectUser = (user) => {
    setSelectedUser(user);
    setCurrentStep(2);
  };

  const handleContinueToPageSelection = () => {
    setCurrentStep(3);
  };

  const handleSelectPage = (page) => {
    setSelectedPage(page);
    if (page.requiresData && selectedUser) {
      loadUserData(selectedUser.id);
    }
    setCurrentStep(4);
  };

  const handleContinueToSend = () => {
    sendMagicLink();
  };

  const handleReset = () => {
    setCurrentStep(1);
    setSelectedUser(null);
    setPhoneOverride('');
    setSelectedPage(null);
    setAttachedData({});
    setGeneratedLink('');
    setUserData(null);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(generatedLink);
    showToast('Link copied to clipboard!', 'success');
  };

  return {
    // Page
    isLoading,

    // Step navigation
    currentStep,
    setCurrentStep,

    // Step 1: User Search
    searchText,
    setSearchText,
    users,
    selectedUser,
    loadingUsers,
    handleSelectUser,

    // Step 2: Phone Override
    phoneOverride,
    setPhoneOverride,
    handleContinueToPageSelection,

    // Step 3: Page Selection
    destinationPages,
    selectedPage,
    handleSelectPage,

    // Step 4: Data Attachment
    userData,
    attachedData,
    setAttachedData,
    loadingUserData,
    handleContinueToSend,

    // Step 5: Send
    generatedLink,
    sending,
    handleCopyLink,
    handleReset,
  };
}
