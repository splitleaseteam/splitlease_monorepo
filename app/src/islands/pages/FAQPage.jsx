import { useState, useEffect, useRef, useMemo } from 'react';
import Header from '../shared/Header.jsx';
import Footer from '../shared/Footer.jsx';
import { useFAQPageLogic } from './useFAQPageLogic.js';

const TAB_CONFIG = [
  { key: 'general', labelFull: 'General Questions', labelShort: 'General' },
  { key: 'travelers', labelFull: 'For Guests', labelShort: 'Guest' },
  { key: 'hosts', labelFull: 'For Hosts', labelShort: 'Host' },
];

/**
 * Find related questions within the same category using keyword overlap.
 * Returns max 2 results. Returns empty array if no good match (overlap < 2).
 */
function findRelatedQuestions(currentFaq, sameCategoryFaqs, maxResults = 2) {
  const currentKeywords = new Set(
    (currentFaq.Keywords || '')
      .toLowerCase()
      .split(',')
      .map(k => k.trim())
      .filter(Boolean)
  );

  if (currentKeywords.size === 0) return [];

  const scored = [];

  for (const faq of sameCategoryFaqs) {
    if (faq._id === currentFaq._id) continue;

    const faqKeywords = new Set(
      (faq.Keywords || '')
        .toLowerCase()
        .split(',')
        .map(k => k.trim())
        .filter(Boolean)
    );

    let overlap = 0;
    for (const kw of currentKeywords) {
      if (faqKeywords.has(kw)) overlap++;
    }

    if (overlap >= 2) {
      scored.push({ faq, overlap });
    }
  }

  scored.sort((a, b) => b.overlap - a.overlap);
  return scored.slice(0, maxResults).map(s => s.faq);
}

export default function FAQPage() {
  const logic = useFAQPageLogic();

  return (
    <>
      <Header />

      {/* Hero Section */}
      <section className="hero">
        <h1 className="hero-title">Hi there! How can we help you?</h1>
        {logic.searchOpen ? (
          <SearchInput
            query={logic.searchQuery}
            onChange={logic.handleSearchQueryChange}
            onClose={logic.handleSearchClose}
          />
        ) : (
          <p
            className="hero-subtitle hero-subtitle--clickable"
            onClick={logic.handleSearchOpen}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                logic.handleSearchOpen();
              }
            }}
          >
            Select one of our pre-sorted categories
          </p>
        )}
      </section>

      {/* Tab Navigation */}
      <div className="tabs-container" role="tablist" aria-label="FAQ categories">
        <div className="tabs">
          {TAB_CONFIG.map(({ key, labelFull, labelShort }) => (
            <button
              key={key}
              className={`tab ${logic.activeTab === key ? 'active' : ''}`}
              onClick={() => logic.handleTabClick(key)}
              role="tab"
              aria-selected={logic.activeTab === key}
              id={`tab-${key}`}
              aria-controls={`tabpanel-${key}`}
            >
              <span className="tab-text-full">{labelFull}</span>
              <span className="tab-text-short">{labelShort}</span>
            </button>
          ))}
        </div>
      </div>

      {/* FAQ Content */}
      <main className="faq-container">
        {/* Loading State */}
        {logic.loading && (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading FAQs...</p>
          </div>
        )}

        {/* Error State */}
        {logic.error && (
          <div className="error-container">
            <p className="error-message">{logic.error}</p>
            <button onClick={logic.loadFAQs} className="retry-btn">Retry</button>
          </div>
        )}

        {/* FAQ Content - Only show when not loading and no error */}
        {!logic.loading && !logic.error && (
          logic.searchOpen && logic.searchResults !== null ? (
            <SearchResults
              results={logic.searchResults}
              onResultClick={logic.handleSearchResultClick}
              onAskClick={logic.openInquiryModal}
            />
          ) : (
            TAB_CONFIG.map(({ key }) => (
              <div
                key={key}
                className={`tab-content ${logic.activeTab === key ? 'active' : ''}`}
                role="tabpanel"
                id={`tabpanel-${key}`}
                aria-labelledby={`tab-${key}`}
              >
                <FAQContent
                  faqs={logic.faqs[key]}
                  activeTab={key}
                  openQuestionId={logic.activeTab === key ? logic.openQuestionId : null}
                  onShowToast={logic.showToast}
                />
              </div>
            ))
          )
        )}
      </main>

      {/* Bottom CTA */}
      <section className="bottom-cta">
        <a href="#" className="cta-link" onClick={logic.openInquiryModal}>
          Can&apos;t find the answer to your question?
        </a>
      </section>

      {/* Inquiry Modal */}
      {logic.showInquiryModal && (
        <InquiryModal
          form={logic.inquiryForm}
          submitting={logic.submitting}
          submitError={logic.submitError}
          submitSuccess={logic.submitSuccess}
          onSubmit={logic.handleInquirySubmit}
          onFormChange={logic.handleFormChange}
          onClose={logic.closeInquiryModal}
        />
      )}

      {/* Toast */}
      {logic.toast && (
        <div className="faq-toast" role="status" aria-live="polite">
          {logic.toast}
        </div>
      )}

      <Footer />
    </>
  );
}

// Search Input — renders inline in the hero area
function SearchInput({ query, onChange, onClose }) {
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div className="hero-search" role="search">
      <input
        ref={inputRef}
        type="text"
        className="hero-search-input"
        placeholder="Search FAQs..."
        value={query}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') onClose();
        }}
        aria-label="Search frequently asked questions"
      />
      <button
        className="hero-search-close"
        onClick={onClose}
        aria-label="Close search"
      >
        &times;
      </button>
    </div>
  );
}

// Search Results — renders in place of tab content when search is active
const MAX_SEARCH_RESULTS = 8;

function SearchResults({ results, onResultClick, onAskClick }) {
  const TAB_LABELS = { general: 'General', travelers: 'For Guests', hosts: 'For Hosts' };
  const entries = Object.entries(results);

  if (entries.length === 0) {
    return (
      <div className="search-no-results">
        <p>No matching questions found.</p>
        <a
          href="#"
          className="search-ask-link"
          onClick={(e) => { e.preventDefault(); onAskClick(e); }}
        >
          Ask us instead &rarr;
        </a>
      </div>
    );
  }

  // Cap total displayed results at MAX_SEARCH_RESULTS
  const totalCount = entries.reduce((sum, [, fqs]) => sum + fqs.length, 0);
  let remaining = MAX_SEARCH_RESULTS;
  const cappedEntries = [];
  for (const [tab, tabResults] of entries) {
    if (remaining <= 0) break;
    const capped = tabResults.slice(0, remaining);
    cappedEntries.push([tab, capped]);
    remaining -= capped.length;
  }
  const isCapped = totalCount > MAX_SEARCH_RESULTS;

  return (
    <div className="search-results" aria-live="polite">
      <p className="search-results-count">
        {isCapped
          ? `Showing ${MAX_SEARCH_RESULTS} of ${totalCount} results`
          : `${totalCount} results found`}
      </p>
      {cappedEntries.map(([tab, tabResults]) => (
        <section key={tab} className="search-result-group">
          <h3 className="search-group-title">
            {TAB_LABELS[tab]} ({tabResults.length})
          </h3>
          {tabResults.map((faq) => (
            <button
              key={faq._id}
              className="search-result-item"
              onClick={() => onResultClick(faq)}
            >
              <strong className="search-result-question">{faq.Question}</strong>
              <span className="search-result-preview">
                {faq.Answer.length > 120 ? faq.Answer.substring(0, 120) + '...' : faq.Answer}
              </span>
            </button>
          ))}
        </section>
      ))}
    </div>
  );
}

// Inquiry Modal — with focus trap and Escape handling
function InquiryModal({ form, submitting, submitError, submitSuccess, onSubmit, onFormChange, onClose }) {
  const modalRef = useRef(null);
  const previousFocusRef = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    previousFocusRef.current = document.activeElement;

    // Focus first input (or close button if in success state)
    const focusTarget = modalRef.current?.querySelector('input:not(:disabled), button');
    if (focusTarget) focusTarget.focus();

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab') return;

      const focusable = modalRef.current?.querySelectorAll(
        'button:not(:disabled), input:not(:disabled), textarea:not(:disabled), [href], [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable || focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previousFocusRef.current?.focus();
    };
  }, []);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" ref={modalRef} onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close modal">
          &times;
        </button>

        <h2 className="modal-title">Ask Us a Question</h2>
        <p className="modal-subtitle">We&apos;ll get back to you as soon as possible</p>

        {submitSuccess ? (
          <div className="success-message">
            <div className="success-icon">&#10003;</div>
            <p>Thank you! Your inquiry has been sent successfully.</p>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="inquiry-form">
            <div className="form-group">
              <label htmlFor="inquiry-name">Name *</label>
              <input
                type="text"
                id="inquiry-name"
                value={form.name}
                onChange={(e) => onFormChange('name', e.target.value)}
                placeholder="Enter your name"
                required
                disabled={submitting}
              />
            </div>

            <div className="form-group">
              <label htmlFor="inquiry-email">Email *</label>
              <input
                type="email"
                id="inquiry-email"
                value={form.email}
                onChange={(e) => onFormChange('email', e.target.value)}
                placeholder="Enter your email"
                required
                disabled={submitting}
              />
            </div>

            <div className="form-group">
              <label htmlFor="inquiry-text">Your Question *</label>
              <textarea
                id="inquiry-text"
                value={form.inquiry}
                onChange={(e) => onFormChange('inquiry', e.target.value)}
                placeholder="Tell us what you'd like to know..."
                rows="5"
                required
                disabled={submitting}
              />
            </div>

            {submitError && (
              <div className="error-message-form">{submitError}</div>
            )}

            <button
              type="submit"
              className="submit-btn"
              disabled={submitting}
            >
              {submitting ? 'Sending...' : 'Send'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

// FAQ Content Component - Renders grouped FAQs with accordion
function FAQContent({ faqs, activeTab, openQuestionId, onShowToast }) {
  const [activeAccordion, setActiveAccordion] = useState(null);

  // Group FAQs by sub-category
  const faqsBySubCategory = useMemo(() => {
    if (!faqs || faqs.length === 0) return {};
    const grouped = {};
    faqs.forEach(faq => {
      const subCat = faq['sub-category'] || 'General';
      if (!grouped[subCat]) grouped[subCat] = [];
      grouped[subCat].push(faq);
    });
    return grouped;
  }, [faqs]);

  // Flat FAQ list for index-to-FAQ lookup (URL sync + copy link + related questions)
  const flatFaqs = useMemo(() => {
    const flat = [];
    Object.values(faqsBySubCategory).forEach(subCatFaqs => {
      subCatFaqs.forEach(faq => flat.push(faq));
    });
    return flat;
  }, [faqsBySubCategory]);

  // Open specific question when openQuestionId is provided
  useEffect(() => {
    if (openQuestionId && faqs && faqs.length > 0) {
      const questionIndex = flatFaqs.findIndex(faq =>
        (faq._id && faq._id.toString() === openQuestionId) ||
        faq.Question.toLowerCase().includes(openQuestionId) ||
        faq.Question.toLowerCase().replace(/[^a-z0-9]/g, '').includes(openQuestionId.replace(/[^a-z0-9]/g, ''))
      );

      if (questionIndex !== -1) {
        setActiveAccordion(questionIndex);
        setTimeout(() => {
          const element = document.querySelector(`[data-question-index="${questionIndex}"]`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 300);
      }
    }
  }, [openQuestionId, faqs, flatFaqs]);

  if (!faqs || faqs.length === 0) {
    return <p style={{ textAlign: 'center', padding: '40px', color: '#666' }}>No FAQs available in this category.</p>;
  }

  const toggleAccordion = (index) => {
    const newActive = activeAccordion === index ? null : index;
    setActiveAccordion(newActive);

    // Sync question to URL
    const params = new URLSearchParams(window.location.search);
    if (newActive !== null && flatFaqs[newActive]) {
      params.set('question', flatFaqs[newActive]._id);
    } else {
      params.delete('question');
    }
    if (!params.get('section')) {
      params.set('section', activeTab);
    }
    window.history.replaceState(null, '', `?${params.toString()}`);
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleAccordion(index);
    }
    // Arrow key navigation between accordion headers
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = document.querySelector(`[data-question-index="${index + 1}"] .accordion-header`);
      if (next) next.focus();
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (index > 0) {
        const prev = document.querySelector(`[data-question-index="${index - 1}"] .accordion-header`);
        if (prev) prev.focus();
      }
    }
    // Escape closes the active accordion
    if (e.key === 'Escape' && activeAccordion !== null) {
      e.preventDefault();
      setActiveAccordion(null);
      // Remove question from URL
      const params = new URLSearchParams(window.location.search);
      params.delete('question');
      window.history.replaceState(null, '', `?${params.toString()}`);
    }
  };

  let globalIndex = 0;

  return (
    <>
      {Object.entries(faqsBySubCategory).map(([subCategory, subCategoryFaqs]) => (
        <section key={subCategory} className="faq-section" role="region" aria-label={subCategory}>
          <h2 className="section-title">{subCategory}</h2>
          {subCategoryFaqs.map((faq) => {
            const currentIndex = globalIndex++;
            const isActive = activeAccordion === currentIndex;
            const panelId = `accordion-panel-${activeTab}-${currentIndex}`;

            return (
              <div
                key={currentIndex}
                className={`accordion-item ${isActive ? 'active' : ''}`}
                data-question-index={currentIndex}
              >
                <div
                  className="accordion-header"
                  tabIndex="0"
                  role="button"
                  aria-expanded={isActive}
                  aria-controls={panelId}
                  onClick={() => toggleAccordion(currentIndex)}
                  onKeyDown={(e) => handleKeyDown(e, currentIndex)}
                >
                  <span className="accordion-icon"></span>
                  <h3>{faq.Question}</h3>
                  {isActive && (
                    <button
                      className="copy-link-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        const url = `${window.location.origin}/faq?section=${activeTab}&question=${faq._id}`;
                        navigator.clipboard.writeText(url).then(() => {
                          onShowToast('Link copied to clipboard!');
                        });
                      }}
                      aria-label="Copy link to this question"
                      title="Copy link"
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                        <path d="M6.5 10.5L9.5 7.5M7 5.5H5.5A2 2 0 003.5 7.5v1A2 2 0 005.5 10.5H7M9 10.5h1.5a2 2 0 002-2v-1a2 2 0 00-2-2H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                    </button>
                  )}
                </div>
                <div className="accordion-content" id={panelId}>
                  <div className="accordion-content-inner">
                    <p>{faq.Answer}</p>
                    {isActive && (() => {
                      const related = findRelatedQuestions(faq, faqs);
                      if (related.length === 0) return null;
                      return (
                        <div className="related-questions" aria-label="Related questions">
                          <h4 className="related-title">Related Questions</h4>
                          {related.map(relFaq => (
                            <button
                              key={relFaq._id}
                              className="related-question-link"
                              onClick={(e) => {
                                e.stopPropagation();
                                const targetIndex = flatFaqs.findIndex(f => f._id === relFaq._id);
                                if (targetIndex !== -1) {
                                  toggleAccordion(targetIndex);
                                  setTimeout(() => {
                                    const el = document.querySelector(`[data-question-index="${targetIndex}"]`);
                                    if (el) {
                                      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                    }
                                  }, 350);
                                }
                              }}
                            >
                              &rarr; {relFaq.Question}
                            </button>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            );
          })}
        </section>
      ))}
    </>
  );
}
