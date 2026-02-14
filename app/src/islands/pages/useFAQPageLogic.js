import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase.js';
import { sendFaqInquiry } from '../../lib/slackService.js';
import { useAsyncOperation } from '../../hooks/useAsyncOperation.js';

/**
 * Search FAQs using simple includes() matching.
 * No fuzzy matching. No external libraries.
 * Priority: question match (10) > keyword match (5) > answer match (2).
 */
function searchFAQs(query, faqs) {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return null;

  const terms = trimmed.split(/\s+/);
  const results = [];

  const tabEntries = [
    ['general', faqs.general],
    ['travelers', faqs.travelers],
    ['hosts', faqs.hosts],
  ];

  for (const [tab, tabFaqs] of tabEntries) {
    for (const faq of tabFaqs) {
      const questionLower = faq.Question.toLowerCase();
      const answerLower = faq.Answer.toLowerCase();
      const keywordsLower = (faq.Keywords || '').toLowerCase();

      let score = 0;
      let allMatch = true;

      for (const term of terms) {
        const inQuestion = questionLower.includes(term);
        const inKeywords = keywordsLower.includes(term);
        const inAnswer = answerLower.includes(term);

        if (!inQuestion && !inKeywords && !inAnswer) {
          allMatch = false;
          break;
        }

        if (inQuestion) score += 10;
        if (inKeywords) score += 5;
        if (inAnswer) score += 2;
      }

      if (allMatch && score > 0) {
        results.push({ ...faq, _tab: tab, _score: score });
      }
    }
  }

  if (results.length === 0) return {};

  results.sort((a, b) => b._score - a._score);

  const grouped = {};
  for (const result of results) {
    const tab = result._tab;
    if (!grouped[tab]) grouped[tab] = [];
    grouped[tab].push(result);
  }

  return grouped;
}

export function useFAQPageLogic() {
  const [activeTab, setActiveTab] = useState('general');
  const [faqs, setFaqs] = useState({ general: [], travelers: [], hosts: [] });
  const [openQuestionId, setOpenQuestionId] = useState(null);
  const [showInquiryModal, setShowInquiryModal] = useState(false);
  const [inquiryForm, setInquiryForm] = useState({ name: '', email: '', inquiry: '' });
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Phase 5 — search, toast
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [toast, setToast] = useState(null);

  // ===== ASYNC OPERATIONS =====
  const {
    isLoading: loading,
    error: faqLoadError,
    execute: executeLoadFAQs,
  } = useAsyncOperation(async () => {
    const { data, error: fetchError } = await supabase
      .schema('reference_table')
      .from('zat_faq')
      .select('_id, Question, Answer, Category, sub-category, Keywords')
      .order('Category', { ascending: true })
      .order('sub-category', { ascending: true });

    if (fetchError) throw fetchError;

    // Map tab names to database Category values
    const categoryMapping = {
      'general': 'General',
      'travelers': 'Guest',
      'hosts': 'Host'
    };

    // Group FAQs by category
    const grouped = {
      general: [],
      travelers: [],
      hosts: []
    };

    data.forEach(faq => {
      for (const [tabName, dbCategory] of Object.entries(categoryMapping)) {
        if (faq.Category === dbCategory) {
          grouped[tabName].push(faq);
          break;
        }
      }
    });

    setFaqs(grouped);
  });

  // Expose error as string for backward compatibility
  const error = faqLoadError ? 'Unable to load FAQs. Please try again later.' : null;

  const {
    isLoading: submitting,
    error: inquiryError,
    execute: executeInquirySubmit,
    reset: resetInquiry,
  } = useAsyncOperation(async ({ name, email, inquiry }) => {
    // Validate form
    if (!name || !email || !inquiry) {
      throw new Error('Please fill in all fields');
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Please enter a valid email address');
    }

    // Send inquiry via Slack Edge Function
    await sendFaqInquiry({ name, email, inquiry });
  });

  // Expose submit error as string for backward compatibility
  const submitError = inquiryError?.message || null;

  // ===== EFFECTS =====

  // Mount: parse URL + load FAQs
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const section = params.get('section');
    const question = params.get('question');

    if (section) {
      const sectionMap = {
        'travelers': 'travelers',
        'hosts': 'hosts',
        'general': 'general',
        'guest': 'travelers',
        'host': 'hosts'
      };
      const mappedSection = sectionMap[section.toLowerCase()];
      if (mappedSection) {
        setActiveTab(mappedSection);
      }
    }

    if (question) {
      setOpenQuestionId(question.toLowerCase());
    }

    loadFAQs();
  }, []);

  // Debounced search
  useEffect(() => {
    if (!searchOpen) return;
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }
    const timer = setTimeout(() => {
      setSearchResults(searchFAQs(searchQuery, faqs));
    }, 150);
    return () => clearTimeout(timer);
  }, [searchQuery, faqs, searchOpen]);

  // Toast auto-clear
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(timer);
  }, [toast]);

  // Back/forward URL sync
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);

      const section = params.get('section');
      const sectionMap = {
        'travelers': 'travelers',
        'hosts': 'hosts',
        'general': 'general',
        'guest': 'travelers',
        'host': 'hosts',
      };
      if (section && sectionMap[section.toLowerCase()]) {
        setActiveTab(sectionMap[section.toLowerCase()]);
      }

      const question = params.get('question');
      setOpenQuestionId(question ? question.toLowerCase() : null);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      const tag = e.target.tagName;
      const isTyping = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';

      // `/` opens search (only when not typing)
      if (e.key === '/' && !isTyping) {
        e.preventDefault();
        setSearchOpen(true);
        return;
      }

      // Escape cascade: search → modal → nothing
      if (e.key === 'Escape') {
        if (searchOpen) {
          setSearchOpen(false);
          setSearchQuery('');
          setSearchResults(null);
          return;
        }
        if (showInquiryModal) {
          closeInquiryModal();
          return;
        }
      }
    };

    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, [searchOpen, showInquiryModal]);

  // ===== HANDLERS =====
  function loadFAQs() {
    executeLoadFAQs().catch((err) => {
      console.error('Error loading FAQs:', err);
    });
  }

  const handleTabClick = (tabName) => {
    setActiveTab(tabName);

    // Sync tab to URL (replaceState — tab switching isn't "navigation")
    const params = new URLSearchParams(window.location.search);
    params.set('section', tabName);
    params.delete('question');
    window.history.replaceState(null, '', `?${params.toString()}`);
  };

  const handleInquirySubmit = async (e) => {
    e.preventDefault();

    try {
      await executeInquirySubmit(inquiryForm);
      setSubmitSuccess(true);
      setInquiryForm({ name: '', email: '', inquiry: '' });
    } catch (err) {
      console.error('Error sending inquiry:', err);
    }
  };

  const handleFormChange = (field, value) => {
    setInquiryForm(prev => ({ ...prev, [field]: value }));
  };

  const openInquiryModal = (e) => {
    e.preventDefault();
    setShowInquiryModal(true);
    setSubmitSuccess(false);
    resetInquiry();
  };

  const closeInquiryModal = () => {
    setShowInquiryModal(false);
    setInquiryForm({ name: '', email: '', inquiry: '' });
    resetInquiry();
    setSubmitSuccess(false);
  };

  // Search handlers
  const handleSearchOpen = () => {
    setSearchOpen(true);
  };

  const handleSearchClose = () => {
    setSearchOpen(false);
    setSearchQuery('');
    setSearchResults(null);
  };

  const handleSearchQueryChange = (query) => {
    setSearchQuery(query);
  };

  const handleSearchResultClick = (faq) => {
    setSearchOpen(false);
    setSearchQuery('');
    setSearchResults(null);
    setActiveTab(faq._tab);
    setOpenQuestionId(faq._id.toString());

    // Update URL to match navigation
    const params = new URLSearchParams(window.location.search);
    params.set('section', faq._tab);
    params.set('question', faq._id);
    window.history.replaceState(null, '', `?${params.toString()}`);
  };

  // Toast handler
  const showToast = (message) => {
    setToast(message);
  };

  return {
    // State
    activeTab,
    faqs,
    openQuestionId,
    loading,
    error,

    // Inquiry modal
    showInquiryModal,
    inquiryForm,
    submitting,
    submitError,
    submitSuccess,

    // Search
    searchOpen,
    searchQuery,
    searchResults,

    // Toast
    toast,

    // Handlers
    handleTabClick,
    loadFAQs,
    handleInquirySubmit,
    handleFormChange,
    openInquiryModal,
    closeInquiryModal,
    handleSearchOpen,
    handleSearchClose,
    handleSearchQueryChange,
    handleSearchResultClick,
    showToast,
  };
}
