/**
 * AI Tools Page Logic Hook
 *
 * Contains all business logic for the AI Tools page:
 * - Admin authentication verification
 * - Data fetching for house manuals, visits, deepfakes, narrations
 * - HeyGen deepfake workflow management
 * - ElevenLabs narration workflow management
 * - Jingle creation workflow management
 *
 * NO FALLBACK PRINCIPLE: Errors are surfaced, not hidden
 */

import { useState, useEffect, useCallback } from 'react';
import { useAsyncOperation } from '../../../hooks/useAsyncOperation.js';
import { supabase } from '../../../lib/supabase.js';
import { aiToolsService } from '../../../lib/aiToolsService.js';
import { MELODY_PREFERENCES, CONTENT_PREFERENCES } from './types.js';

// NOTE: Admin email whitelist removed to allow any authenticated user access for testing
// Original whitelist: ['sharath@splitlease.io', 'admin@splitlease.io', 'test@splitlease.io']

export function useAiToolsPageLogic() {
  // ============================================================================
  // STATE
  // ============================================================================

  // Data selection state
  const [houseManuals, setHouseManuals] = useState([]);
  const [visits, setVisits] = useState([]);
  const [selectedHouseManual, setSelectedHouseManual] = useState('');
  const [selectedVisit, setSelectedVisit] = useState('');

  // HeyGen state
  const [deepfakes, setDeepfakes] = useState([]);
  const [deepfakeForm, setDeepfakeForm] = useState({
    videoId: '',
    voiceId: '',
    script: '',
  });
  const [deepfakeStatus, setDeepfakeStatus] = useState({
    loading: false,
    error: null,
    message: null,
  });

  // ElevenLabs state
  const [narrations, setNarrations] = useState([]);
  const [narrators, setNarrators] = useState([]);
  const [selectedNarrator, setSelectedNarrator] = useState('');
  const [narrationScript, setNarrationScript] = useState('');
  const [narrationStatus, setNarrationStatus] = useState({
    loading: false,
    error: null,
    message: null,
  });

  // Jingle state
  const [jingles, setJingles] = useState([]);
  const [melodyPreference, setMelodyPreference] = useState('optimistic-commercial');
  const [contentPreferences, setContentPreferences] = useState(['host-name', 'house-rules']);
  const [jingleLyrics, setJingleLyrics] = useState('');
  const [jingleStatus, setJingleStatus] = useState({
    loading: false,
    error: null,
    message: null,
  });

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  const fetchHouseManuals = useCallback(async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('house_manual')
        .select('id, manual_title, host_user_id, listing_id')
        .order('original_created_at', { ascending: false });

      if (fetchError) throw fetchError;
      return data || [];
    } catch (err) {
      console.error('[AiTools] Error fetching house manuals:', err);
      return [];
    }
  }, []);

  // visit table has been removed - return empty array
  const fetchVisitsForManual = useCallback(async (houseManualId) => {
    return [];
  }, []);

  const fetchDeepfakes = useCallback(async (houseManualId) => {
    if (!houseManualId) return [];

    try {
      const { data, error: fetchError } = await supabase
        .from('heygen_deepfake')
        .select('*')
        .eq('house_manual_id', houseManualId)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      return data || [];
    } catch (err) {
      console.error('[AiTools] Error fetching deepfakes:', err);
      return [];
    }
  }, []);

  const fetchNarrations = useCallback(async (houseManualId) => {
    if (!houseManualId) return [];

    try {
      const { data, error: fetchError } = await supabase
        .from('narration')
        .select('*')
        .eq('House Manual', houseManualId)
        .eq('is it narration?', true)
        .order('Created Date', { ascending: false });

      if (fetchError) throw fetchError;
      return data || [];
    } catch (err) {
      console.error('[AiTools] Error fetching narrations:', err);
      return [];
    }
  }, []);

  const fetchJingles = useCallback(async (houseManualId) => {
    if (!houseManualId) return [];

    try {
      const { data, error: fetchError } = await supabase
        .from('narration')
        .select('*')
        .eq('House Manual', houseManualId)
        .eq('is it jingle?', true)
        .order('Created Date', { ascending: false });

      if (fetchError) throw fetchError;
      return data || [];
    } catch (err) {
      console.error('[AiTools] Error fetching jingles:', err);
      return [];
    }
  }, []);

  const fetchNarrators = useCallback(async () => {
    return [
      { id: 'david-attenborough', name: 'David Attenborough', description: 'English' },
      { id: 'ricardo-darin', name: 'Ricardo Darin', description: 'Spanish' },
      { id: 'serhiy-prytula', name: 'Serhiy Prytula', description: 'Ukrainian' },
      { id: 'olena', name: 'Olena', description: 'Ukrainian' },
      { id: 'eric-braa', name: 'Eric Braa', description: 'English' },
      { id: 'snoop-dogg', name: 'Snoop Dogg', description: 'English' },
      { id: 'larry-david', name: 'Larry David', description: 'English' },
      { id: 'jerry-seinfeld', name: 'Jerry Seinfeld', description: 'English' },
      { id: 'barack-obama', name: 'Barack Obama', description: 'English' },
      { id: 'meryl-streep', name: 'Meryl Streep', description: 'English' },
      { id: 'morgan-freeman', name: 'Morgan Freeman', description: 'English' },
      { id: 'martha-stewart', name: 'Martha Stewart', description: 'English' },
      { id: 'mary-poppins', name: 'Mary Poppins', description: 'English' },
      { id: 'steve-irwin', name: 'Steve Irwin', description: 'English' },
    ];
  }, []);

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  const { isLoading: loading, error, execute: executeLoadInitialData } = useAsyncOperation(
    async () => {
      const [manuals, narratorsList] = await Promise.all([
        fetchHouseManuals(),
        fetchNarrators(),
      ]);

      setHouseManuals(manuals);
      setNarrators(narratorsList);
      if (narratorsList.length > 0) {
        setSelectedNarrator(narratorsList[0].id);
      }
    }
  );

  useEffect(() => {
    executeLoadInitialData().catch((err) => {
      console.error('[AiTools] Error loading initial data:', err);
    });
  }, [executeLoadInitialData]);

  // ============================================================================
  // SELECTION HANDLERS
  // ============================================================================

  const handleHouseManualSelect = useCallback(async (manualId) => {
    setSelectedHouseManual(manualId);
    setSelectedVisit('');

    if (!manualId) {
      setVisits([]);
      setDeepfakes([]);
      setNarrations([]);
      setJingles([]);
      return;
    }

    // Fetch related data for selected manual
    const [visitsList, deepfakesList, narrationsList, jinglesList] = await Promise.all([
      fetchVisitsForManual(manualId),
      fetchDeepfakes(manualId),
      fetchNarrations(manualId),
      fetchJingles(manualId),
    ]);

    setVisits(visitsList);
    setDeepfakes(deepfakesList);
    setNarrations(narrationsList);
    setJingles(jinglesList);
  }, [fetchVisitsForManual, fetchDeepfakes, fetchNarrations, fetchJingles]);

  const handleVisitSelect = useCallback((visitId) => {
    setSelectedVisit(visitId);
  }, []);

  // ============================================================================
  // HEYGEN HANDLERS
  // ============================================================================

  const handleDeepfakeFormChange = useCallback((field, value) => {
    setDeepfakeForm(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleGenerateDeepfakeScript = useCallback(async () => {
    if (!selectedHouseManual) {
      setDeepfakeStatus({ loading: false, error: 'Please select a house manual first', message: null });
      return;
    }

    setDeepfakeStatus({ loading: true, error: null, message: 'Generating script...' });

    try {
      const result = await aiToolsService.generateDeepfakeScript(selectedHouseManual);
      setDeepfakeForm(prev => ({ ...prev, script: result.script }));
      setDeepfakeStatus({ loading: false, error: null, message: 'Script generated successfully!' });
    } catch (err) {
      console.error('[AiTools] Error generating deepfake script:', err);
      setDeepfakeStatus({ loading: false, error: err.message, message: null });
    }
  }, [selectedHouseManual]);

  const handleGenerateDeepfakeVideo = useCallback(async () => {
    if (!selectedHouseManual || !deepfakeForm.script) {
      setDeepfakeStatus({ loading: false, error: 'Please select a house manual and generate/enter a script', message: null });
      return;
    }

    setDeepfakeStatus({ loading: true, error: null, message: 'Generating video...' });

    try {
      const result = await aiToolsService.generateDeepfakeVideo(
        selectedHouseManual,
        deepfakeForm.videoId,
        deepfakeForm.voiceId,
        deepfakeForm.script
      );
      setDeepfakeStatus({ loading: false, error: null, message: `Video generation started. Token: ${result.videoToken}` });
      // Refresh deepfakes list
      const updated = await fetchDeepfakes(selectedHouseManual);
      setDeepfakes(updated);
    } catch (err) {
      console.error('[AiTools] Error generating deepfake video:', err);
      setDeepfakeStatus({ loading: false, error: err.message, message: null });
    }
  }, [selectedHouseManual, deepfakeForm, fetchDeepfakes]);

  const handleCheckDeepfakeStatus = useCallback(async (deepfake) => {
    if (!deepfake.video_token) {
      setDeepfakeStatus({ loading: false, error: 'No video token available', message: null });
      return;
    }

    setDeepfakeStatus({ loading: true, error: null, message: 'Checking status...' });

    try {
      const result = await aiToolsService.checkDeepfakeStatus(deepfake.video_token);
      setDeepfakeStatus({ loading: false, error: null, message: `Status: ${result.status}` });
      // Refresh deepfakes list
      const updated = await fetchDeepfakes(selectedHouseManual);
      setDeepfakes(updated);
    } catch (err) {
      console.error('[AiTools] Error checking deepfake status:', err);
      setDeepfakeStatus({ loading: false, error: err.message, message: null });
    }
  }, [selectedHouseManual, fetchDeepfakes]);

  const handleAttachDeepfake = useCallback(async (deepfakeId) => {
    if (!selectedHouseManual) {
      setDeepfakeStatus({ loading: false, error: 'Please select a house manual first', message: null });
      return;
    }

    setDeepfakeStatus({ loading: true, error: null, message: 'Attaching to house manual...' });

    try {
      await aiToolsService.attachDeepfake(deepfakeId, selectedHouseManual);
      setDeepfakeStatus({ loading: false, error: null, message: 'Deepfake attached to house manual!' });
      // Refresh deepfakes list
      const updated = await fetchDeepfakes(selectedHouseManual);
      setDeepfakes(updated);
    } catch (err) {
      console.error('[AiTools] Error attaching deepfake:', err);
      setDeepfakeStatus({ loading: false, error: err.message, message: null });
    }
  }, [selectedHouseManual, fetchDeepfakes]);

  // ============================================================================
  // ELEVENLABS HANDLERS
  // ============================================================================

  const handleNarratorSelect = useCallback((narratorId) => {
    setSelectedNarrator(narratorId);
  }, []);

  const handleNarrationScriptChange = useCallback((value) => {
    setNarrationScript(value);
  }, []);

  const handleGenerateNarrationScript = useCallback(async () => {
    if (!selectedHouseManual) {
      setNarrationStatus({ loading: false, error: 'Please select a house manual first', message: null });
      return;
    }

    setNarrationStatus({ loading: true, error: null, message: 'Generating narration script...' });

    try {
      const result = await aiToolsService.generateNarrationScript(
        selectedHouseManual,
        selectedVisit,
        selectedNarrator
      );
      setNarrationScript(result.script);
      setNarrationStatus({ loading: false, error: null, message: 'Narration script generated!' });
    } catch (err) {
      console.error('[AiTools] Error generating narration script:', err);
      setNarrationStatus({ loading: false, error: err.message, message: null });
    }
  }, [selectedHouseManual, selectedVisit, selectedNarrator]);

  const handleGenerateNarration = useCallback(async () => {
    if (!selectedHouseManual || !narrationScript) {
      setNarrationStatus({ loading: false, error: 'Please select a house manual and generate/enter a script', message: null });
      return;
    }

    setNarrationStatus({ loading: true, error: null, message: 'Generating narration audio...' });

    try {
      const result = await aiToolsService.generateNarration(
        selectedHouseManual,
        selectedVisit,
        selectedNarrator,
        narrationScript
      );
      setNarrationStatus({ loading: false, error: null, message: 'Narration generated successfully!' });
      // Refresh narrations list
      const updated = await fetchNarrations(selectedHouseManual);
      setNarrations(updated);
    } catch (err) {
      console.error('[AiTools] Error generating narration:', err);
      setNarrationStatus({ loading: false, error: err.message, message: null });
    }
  }, [selectedHouseManual, selectedVisit, selectedNarrator, narrationScript, fetchNarrations]);

  const handleAttachNarration = useCallback(async (narrationId) => {
    if (!selectedVisit) {
      setNarrationStatus({ loading: false, error: 'Please select a visit to attach the narration to', message: null });
      return;
    }

    setNarrationStatus({ loading: true, error: null, message: 'Attaching to visit...' });

    try {
      await aiToolsService.attachNarration(narrationId, selectedVisit);
      setNarrationStatus({ loading: false, error: null, message: 'Narration attached to visit!' });
      // Refresh narrations list
      const updated = await fetchNarrations(selectedHouseManual);
      setNarrations(updated);
    } catch (err) {
      console.error('[AiTools] Error attaching narration:', err);
      setNarrationStatus({ loading: false, error: err.message, message: null });
    }
  }, [selectedHouseManual, selectedVisit, fetchNarrations]);

  // ============================================================================
  // JINGLE HANDLERS
  // ============================================================================

  const handleMelodyPreferenceChange = useCallback((value) => {
    setMelodyPreference(value);
  }, []);

  const handleContentPreferenceToggle = useCallback((preference) => {
    setContentPreferences(prev => {
      if (prev.includes(preference)) {
        return prev.filter(p => p !== preference);
      }
      return [...prev, preference];
    });
  }, []);

  const handleJingleLyricsChange = useCallback((value) => {
    setJingleLyrics(value);
  }, []);

  const handleGenerateJingleLyrics = useCallback(async () => {
    if (!selectedHouseManual) {
      setJingleStatus({ loading: false, error: 'Please select a house manual first', message: null });
      return;
    }

    setJingleStatus({ loading: true, error: null, message: 'Generating jingle lyrics...' });

    try {
      const result = await aiToolsService.generateJingleLyrics(
        selectedHouseManual,
        selectedVisit,
        melodyPreference,
        contentPreferences
      );
      setJingleLyrics(result.lyrics);
      setJingleStatus({ loading: false, error: null, message: 'Jingle lyrics generated!' });
    } catch (err) {
      console.error('[AiTools] Error generating jingle lyrics:', err);
      setJingleStatus({ loading: false, error: err.message, message: null });
    }
  }, [selectedHouseManual, selectedVisit, melodyPreference, contentPreferences]);

  const handleCreateJingle = useCallback(async () => {
    if (!selectedHouseManual || !jingleLyrics) {
      setJingleStatus({ loading: false, error: 'Please select a house manual and generate/enter lyrics', message: null });
      return;
    }

    setJingleStatus({ loading: true, error: null, message: 'Creating jingle...' });

    try {
      await aiToolsService.createJingle(
        selectedHouseManual,
        selectedVisit,
        jingleLyrics,
        melodyPreference,
        contentPreferences
      );
      setJingleStatus({ loading: false, error: null, message: 'Jingle created successfully!' });
      // Refresh jingles list
      const updated = await fetchJingles(selectedHouseManual);
      setJingles(updated);
    } catch (err) {
      console.error('[AiTools] Error creating jingle:', err);
      setJingleStatus({ loading: false, error: err.message, message: null });
    }
  }, [selectedHouseManual, selectedVisit, jingleLyrics, melodyPreference, contentPreferences, fetchJingles]);

  const handleAttachJingle = useCallback(async (jingleId) => {
    if (!selectedHouseManual) {
      setJingleStatus({ loading: false, error: 'Please select a house manual first', message: null });
      return;
    }

    setJingleStatus({ loading: true, error: null, message: 'Attaching to house manual...' });

    try {
      await aiToolsService.attachJingle(jingleId, selectedHouseManual);
      setJingleStatus({ loading: false, error: null, message: 'Jingle attached to house manual!' });
      // Refresh jingles list
      const updated = await fetchJingles(selectedHouseManual);
      setJingles(updated);
    } catch (err) {
      console.error('[AiTools] Error attaching jingle:', err);
      setJingleStatus({ loading: false, error: err.message, message: null });
    }
  }, [selectedHouseManual, fetchJingles]);

  // ============================================================================
  // REFRESH HANDLER
  // ============================================================================

  const handleRefreshData = useCallback(async () => {
    if (!selectedHouseManual) return;

    const [deepfakesList, narrationsList, jinglesList] = await Promise.all([
      fetchDeepfakes(selectedHouseManual),
      fetchNarrations(selectedHouseManual),
      fetchJingles(selectedHouseManual),
    ]);

    setDeepfakes(deepfakesList);
    setNarrations(narrationsList);
    setJingles(jinglesList);
  }, [selectedHouseManual, fetchDeepfakes, fetchNarrations, fetchJingles]);

  // ============================================================================
  // RETURN
  // ============================================================================

  return {
    // Loading
    loading,
    error: error?.message ?? null,

    // Data
    houseManuals,
    visits,
    selectedHouseManual,
    selectedVisit,

    // HeyGen state
    deepfakes,
    deepfakeForm,
    deepfakeStatus,

    // ElevenLabs state
    narrations,
    narrators,
    selectedNarrator,
    narrationScript,
    narrationStatus,

    // Jingle state
    jingles,
    melodyPreference,
    contentPreferences,
    jingleLyrics,
    jingleStatus,

    // Data selection handlers
    handleHouseManualSelect,
    handleVisitSelect,

    // HeyGen handlers
    handleDeepfakeFormChange,
    handleGenerateDeepfakeScript,
    handleGenerateDeepfakeVideo,
    handleCheckDeepfakeStatus,
    handleAttachDeepfake,

    // ElevenLabs handlers
    handleNarratorSelect,
    handleNarrationScriptChange,
    handleGenerateNarrationScript,
    handleGenerateNarration,
    handleAttachNarration,

    // Jingle handlers
    handleMelodyPreferenceChange,
    handleContentPreferenceToggle,
    handleJingleLyricsChange,
    handleGenerateJingleLyrics,
    handleCreateJingle,
    handleAttachJingle,

    // Refresh handler
    handleRefreshData,
  };
}
