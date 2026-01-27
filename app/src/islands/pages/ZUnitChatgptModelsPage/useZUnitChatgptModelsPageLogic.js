/**
 * Z-Unit ChatGPT Models Test Page Logic Hook
 *
 * Manages state for 4 independent test sections:
 * 1. Freeform 4o-mini test
 * 2. Freeform o1-mini test
 * 3. Freeform o1 test
 * 4. GPT-4.1-mini Image Parse test
 *
 * Each section has independent loading, response, and error states.
 * API calls go through the ai-gateway Edge Function.
 */

import { useState } from 'react';
import { supabase } from '../../../lib/supabase.js';

// Default image URL for Section 4 (GPT-4.1-mini Image Parse)
const DEFAULT_IMAGE_URL = 'https://m.media-amazon.com/images/I/518brvoz-bL.jpg';

/**
 * Creates initial state for a test section
 * @param {Object} options - Configuration options
 * @param {string} [options.prompt=''] - Initial prompt value
 * @param {string} [options.imageUrl=''] - Initial image URL (for image test section)
 * @returns {Object} Initial section state
 */
function createSectionState({ prompt = '', imageUrl = '' } = {}) {
  return {
    prompt,
    imageUrl,
    response: '',
    loading: false,
    error: null
  };
}

/**
 * Custom hook for Z-Unit ChatGPT Models Test Page
 * Follows Hollow Component Pattern - all logic lives here
 *
 * @returns {Object} State and handlers for the page component
 */
export function useZUnitChatgptModelsPageLogic() {
  // Section 1: Freeform 4o-mini
  const [section1, setSection1] = useState(() => createSectionState());

  // Section 2: Freeform o1-mini
  const [section2, setSection2] = useState(() => createSectionState());

  // Section 3: Freeform o1
  const [section3, setSection3] = useState(() => createSectionState());

  // Section 4: GPT-4.1-mini Image Parse
  const [section4, setSection4] = useState(() =>
    createSectionState({ imageUrl: DEFAULT_IMAGE_URL })
  );

  /**
   * Generic API call function for testing a model
   * @param {Object} params - API call parameters
   * @param {string} params.prompt - The user prompt
   * @param {string} params.model - The model to use
   * @param {string} [params.imageUrl] - Optional image URL for vision models
   * @returns {Promise<Object>} API response data
   */
  async function callAiGateway({ prompt, model, imageUrl }) {
    const payload = {
      prompt_key: 'echo-test',
      variables: {
        message: prompt
      },
      options: {
        model,
        max_tokens: 500
      }
    };

    // Add image URL if provided (for vision models)
    if (imageUrl) {
      payload.image_url = imageUrl;
    }

    const { data, error } = await supabase.functions.invoke('ai-gateway', {
      body: {
        action: 'complete',
        payload
      }
    });

    if (error) {
      throw error;
    }

    if (!data.success) {
      throw new Error(data.error || 'Request failed');
    }

    return data;
  }

  // ============================================
  // Section 1: Freeform 4o-mini handlers
  // ============================================

  function handleSection1PromptChange(value) {
    setSection1(prev => ({ ...prev, prompt: value }));
  }

  async function handleSection1Test() {
    if (!section1.prompt.trim() || section1.loading) {
      return;
    }

    setSection1(prev => ({ ...prev, loading: true, error: null, response: '' }));

    try {
      const data = await callAiGateway({
        prompt: section1.prompt,
        model: 'gpt-4o-mini'
      });

      setSection1(prev => ({
        ...prev,
        response: data.data?.content || JSON.stringify(data, null, 2),
        loading: false
      }));
    } catch (err) {
      setSection1(prev => ({
        ...prev,
        error: err.message || 'Unknown error occurred',
        loading: false
      }));
    }
  }

  // ============================================
  // Section 2: Freeform o1-mini handlers
  // ============================================

  function handleSection2PromptChange(value) {
    setSection2(prev => ({ ...prev, prompt: value }));
  }

  async function handleSection2Test() {
    if (!section2.prompt.trim() || section2.loading) {
      return;
    }

    setSection2(prev => ({ ...prev, loading: true, error: null, response: '' }));

    try {
      const data = await callAiGateway({
        prompt: section2.prompt,
        model: 'o1-mini'
      });

      setSection2(prev => ({
        ...prev,
        response: data.data?.content || JSON.stringify(data, null, 2),
        loading: false
      }));
    } catch (err) {
      setSection2(prev => ({
        ...prev,
        error: err.message || 'Unknown error occurred',
        loading: false
      }));
    }
  }

  // ============================================
  // Section 3: Freeform o1 handlers
  // ============================================

  function handleSection3PromptChange(value) {
    setSection3(prev => ({ ...prev, prompt: value }));
  }

  async function handleSection3Test() {
    if (!section3.prompt.trim() || section3.loading) {
      return;
    }

    setSection3(prev => ({ ...prev, loading: true, error: null, response: '' }));

    try {
      const data = await callAiGateway({
        prompt: section3.prompt,
        model: 'o1'
      });

      setSection3(prev => ({
        ...prev,
        response: data.data?.content || JSON.stringify(data, null, 2),
        loading: false
      }));
    } catch (err) {
      setSection3(prev => ({
        ...prev,
        error: err.message || 'Unknown error occurred',
        loading: false
      }));
    }
  }

  // ============================================
  // Section 4: GPT-4.1-mini Image Parse handlers
  // ============================================

  function handleSection4PromptChange(value) {
    setSection4(prev => ({ ...prev, prompt: value }));
  }

  function handleSection4ImageUrlChange(value) {
    setSection4(prev => ({ ...prev, imageUrl: value }));
  }

  async function handleSection4Test() {
    if (!section4.imageUrl.trim() || section4.loading) {
      return;
    }

    // Use default prompt if not provided
    const prompt = section4.prompt.trim() || 'Describe what you see in this image.';

    setSection4(prev => ({ ...prev, loading: true, error: null, response: '' }));

    try {
      const data = await callAiGateway({
        prompt,
        model: 'gpt-4.1-mini',
        imageUrl: section4.imageUrl
      });

      setSection4(prev => ({
        ...prev,
        response: data.data?.content || JSON.stringify(data, null, 2),
        loading: false
      }));
    } catch (err) {
      setSection4(prev => ({
        ...prev,
        error: err.message || 'Unknown error occurred',
        loading: false
      }));
    }
  }

  // Return all state and handlers for the component
  return {
    // Section states
    section1,
    section2,
    section3,
    section4,

    // Section 1 handlers
    handleSection1PromptChange,
    handleSection1Test,

    // Section 2 handlers
    handleSection2PromptChange,
    handleSection2Test,

    // Section 3 handlers
    handleSection3PromptChange,
    handleSection3Test,

    // Section 4 handlers
    handleSection4PromptChange,
    handleSection4ImageUrlChange,
    handleSection4Test
  };
}
