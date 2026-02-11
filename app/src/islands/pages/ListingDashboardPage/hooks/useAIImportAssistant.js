import { useState, useCallback, useEffect, useRef } from 'react';
import { logger } from '../../../../lib/logger';
import { generateListingDescription, generateListingTitle, generateNeighborhoodDescription } from '../../../../lib/aiService';
import { getCommonHouseRules } from '../../../shared/EditListingDetails/services/houseRulesService';
import { getCommonSafetyFeatures } from '../../../shared/EditListingDetails/services/safetyFeaturesService';
import { getCommonInUnitAmenities, getCommonBuildingAmenities } from '../../../shared/EditListingDetails/services/amenitiesService';
import { getNeighborhoodByZipCode, getNeighborhoodByName } from '../../../shared/EditListingDetails/services/neighborhoodService';

/**
 * Hook for AI Import Assistant workflow
 * Handles AI generation for listing title, description, amenities, rules, and neighborhood
 */
export function useAIImportAssistant(listing, updateListing, setListing, fetchListing, listingId) {
  const [showAIImportAssistant, setShowAIImportAssistant] = useState(false);
  const [aiGenerationStatus, setAiGenerationStatus] = useState({
    name: 'pending',
    description: 'pending',
    neighborhood: 'pending',
    inUnitAmenities: 'pending',
    buildingAmenities: 'pending',
    houseRules: 'pending',
    safetyFeatures: 'pending',
  });
  const [isAIGenerating, setIsAIGenerating] = useState(false);
  const [isAIComplete, setIsAIComplete] = useState(false);
  const [aiGeneratedData, setAiGeneratedData] = useState({});
  const [highlightedFields, setHighlightedFields] = useState(new Set());
  const listingRef = useRef(listing);
  const highlightTimeoutRef = useRef(null);
  const refetchTimeoutRef = useRef(null);

  useEffect(() => {
    listingRef.current = listing;
  }, [listing]);

  useEffect(() => {
    return () => {
      if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current);
      }
      if (refetchTimeoutRef.current) {
        clearTimeout(refetchTimeoutRef.current);
      }
    };
  }, []);

  const handleAIAssistant = useCallback(() => {
    setAiGenerationStatus({
      name: 'pending',
      description: 'pending',
      neighborhood: 'pending',
      inUnitAmenities: 'pending',
      buildingAmenities: 'pending',
      houseRules: 'pending',
      safetyFeatures: 'pending',
    });
    setIsAIGenerating(false);
    setIsAIComplete(false);
    setAiGeneratedData({});
    setShowAIImportAssistant(true);
    logger.debug('ðŸ¤– AI Import Assistant opened');
  }, []);

  const handleCloseAIImportAssistant = useCallback(() => {
    setShowAIImportAssistant(false);
  }, []);

  const handleAIImportComplete = useCallback((generatedData) => {
    logger.debug('âœ… AI Import complete, updating local state instantly...');
    logger.debug('ðŸ“‹ Generated data:', generatedData);

    const changedFields = new Set();

    setListing(prev => {
      if (!prev) return prev;

      const updates = { ...prev };

      if (generatedData.name && generatedData.name !== prev.title) {
        updates.title = generatedData.name;
        updates.Name = generatedData.name;
        changedFields.add('name');
      }

      if (generatedData.description && generatedData.description !== prev.description) {
        updates.description = generatedData.description;
        updates.Description = generatedData.description;
        changedFields.add('description');
      }

      if (generatedData.neighborhood && generatedData.neighborhood !== prev.descriptionNeighborhood) {
        updates.descriptionNeighborhood = generatedData.neighborhood;
        updates.neighborhood_description_by_host = generatedData.neighborhood;
        changedFields.add('neighborhood');
      }

      if (generatedData.inUnitAmenitiesCount > 0 || generatedData.buildingAmenitiesCount > 0) {
        changedFields.add('amenities');
      }
      if (generatedData.houseRulesCount > 0) {
        changedFields.add('rules');
      }
      if (generatedData.safetyFeaturesCount > 0) {
        changedFields.add('safety');
      }

      return updates;
    });

    setHighlightedFields(changedFields);
    logger.debug('âœ¨ Highlighting changed fields:', [...changedFields]);

    if (highlightTimeoutRef.current) {
      clearTimeout(highlightTimeoutRef.current);
    }
    highlightTimeoutRef.current = setTimeout(() => {
      setHighlightedFields(new Set());
    }, 8000);

    if (listingId) {
      if (refetchTimeoutRef.current) {
        clearTimeout(refetchTimeoutRef.current);
      }
      refetchTimeoutRef.current = setTimeout(() => {
        fetchListing(true);
      }, 500);
    }
  }, [setListing, listingId, fetchListing]);

  const handleStartAIGeneration = useCallback(async () => {
    const currentListing = listingRef.current;

    if (!currentListing) {
      logger.error('âŒ No listing data available for AI generation');
      return;
    }

    setIsAIGenerating(true);
    const generatedResults = {};

    const enrichedAmenities = {
      inUnit: currentListing.inUnitAmenities?.map(a => a.name) || [],
      building: currentListing.buildingAmenities?.map(a => a.name) || [],
    };
    let enrichedNeighborhood = currentListing.location?.hoodsDisplay || '';

    try {
      logger.debug('ðŸ¤– Starting AI Import Assistant generation...');
      logger.debug('ðŸ“‹ Step 1: Loading common features and data first...');

      // PHASE 1: Load all data first

      // 1. Load Common In-Unit Amenities
      setAiGenerationStatus(prev => ({ ...prev, inUnitAmenities: 'loading' }));
      try {
        const commonAmenities = await getCommonInUnitAmenities();
        if (commonAmenities.length > 0) {
          const currentAmenities = currentListing.inUnitAmenities?.map(a => a.name) || [];
          const newAmenities = [...new Set([...currentAmenities, ...commonAmenities])];
          enrichedAmenities.inUnit = newAmenities;
          generatedResults.inUnitAmenities = newAmenities;
          generatedResults.inUnitAmenitiesCount = commonAmenities.length;
          await updateListing({ 'Features - Amenities In-Unit': newAmenities });
        }
        setAiGenerationStatus(prev => ({ ...prev, inUnitAmenities: 'complete' }));
      } catch (err) {
        logger.error('âŒ Error loading in-unit amenities:', err);
        setAiGenerationStatus(prev => ({ ...prev, inUnitAmenities: 'complete' }));
      }

      // 2. Load Common Building Amenities
      setAiGenerationStatus(prev => ({ ...prev, buildingAmenities: 'loading' }));
      try {
        const commonAmenities = await getCommonBuildingAmenities();
        if (commonAmenities.length > 0) {
          const currentAmenities = currentListing.buildingAmenities?.map(a => a.name) || [];
          const newAmenities = [...new Set([...currentAmenities, ...commonAmenities])];
          enrichedAmenities.building = newAmenities;
          generatedResults.buildingAmenities = newAmenities;
          generatedResults.buildingAmenitiesCount = commonAmenities.length;
          await updateListing({ 'Features - Amenities In-Building': newAmenities });
        }
        setAiGenerationStatus(prev => ({ ...prev, buildingAmenities: 'complete' }));
      } catch (err) {
        logger.error('âŒ Error loading building amenities:', err);
        setAiGenerationStatus(prev => ({ ...prev, buildingAmenities: 'complete' }));
      }

      // 3. Load Neighborhood Description
      setAiGenerationStatus(prev => ({ ...prev, neighborhood: 'loading' }));
      try {
        let neighborhoodResult = null;

        const hoodName = currentListing.location?.hoodsDisplay;
        if (hoodName) {
          logger.debug('ðŸ˜ï¸ Trying neighborhood lookup by name:', hoodName);
          neighborhoodResult = await getNeighborhoodByName(hoodName);
          if (neighborhoodResult?.description) {
            logger.debug('âœ… Found neighborhood by name:', hoodName);
          }
        }

        if (!neighborhoodResult?.description) {
          const zipCode = currentListing.location?.zipCode;
          if (zipCode) {
            logger.debug('ðŸ˜ï¸ Trying neighborhood lookup by ZIP:', zipCode);
            neighborhoodResult = await getNeighborhoodByZipCode(zipCode);
            if (neighborhoodResult?.description) {
              logger.debug('âœ… Found neighborhood by ZIP:', zipCode);
            }
          }
        }

        if (!neighborhoodResult?.description) {
          logger.debug('ðŸ˜ï¸ No database match, trying AI generation...');
          const addressData = {
              fullAddress: currentListing.location?.address || '',
              city: currentListing.location?.city || '',
              state: currentListing.location?.state || '',
              zip: currentListing.location?.zipCode || '',
          };

          if (addressData.city || addressData.fullAddress) {
            const aiDescription = await generateNeighborhoodDescription(addressData);
            if (aiDescription) {
              neighborhoodResult = {
                description: aiDescription,
                neighborhoodName: hoodName || '',
              };
              logger.debug('âœ… Generated neighborhood via AI');
            }
          }
        }

        if (neighborhoodResult?.description) {
          generatedResults.neighborhood = neighborhoodResult.description;
          generatedResults.neighborhoodName = neighborhoodResult.neighborhoodName;
          enrichedNeighborhood = neighborhoodResult.neighborhoodName || enrichedNeighborhood;
          await updateListing({ 'Description - Neighborhood': neighborhoodResult.description });
        } else {
          logger.warn('âš ï¸ No neighborhood description found via any method');
        }

        setAiGenerationStatus(prev => ({ ...prev, neighborhood: 'complete' }));
      } catch (err) {
        logger.error('âŒ Error loading neighborhood:', err);
        setAiGenerationStatus(prev => ({ ...prev, neighborhood: 'complete' }));
      }

      // 4. Load Common House Rules
      setAiGenerationStatus(prev => ({ ...prev, houseRules: 'loading' }));
      try {
        const commonRules = await getCommonHouseRules();
        if (commonRules.length > 0) {
          const currentRules = currentListing.houseRules?.map(r => r.name) || [];
          const newRules = [...new Set([...currentRules, ...commonRules])];
          generatedResults.houseRules = newRules;
          generatedResults.houseRulesCount = commonRules.length;
          await updateListing({ 'Features - House Rules': newRules });
        }
        setAiGenerationStatus(prev => ({ ...prev, houseRules: 'complete' }));
      } catch (err) {
        logger.error('âŒ Error loading house rules:', err);
        setAiGenerationStatus(prev => ({ ...prev, houseRules: 'complete' }));
      }

      // 5. Load Common Safety Features
      setAiGenerationStatus(prev => ({ ...prev, safetyFeatures: 'loading' }));
      try {
        const commonFeatures = await getCommonSafetyFeatures();
        if (commonFeatures.length > 0) {
          const currentFeatures = currentListing.safetyFeatures?.map(s => s.name) || [];
          const newFeatures = [...new Set([...currentFeatures, ...commonFeatures])];
          generatedResults.safetyFeatures = newFeatures;
          generatedResults.safetyFeaturesCount = commonFeatures.length;
          await updateListing({ 'Features - Safety': newFeatures });
        }
        setAiGenerationStatus(prev => ({ ...prev, safetyFeatures: 'complete' }));
      } catch (err) {
        logger.error('âŒ Error loading safety features:', err);
        setAiGenerationStatus(prev => ({ ...prev, safetyFeatures: 'complete' }));
      }

      // PHASE 2: Generate AI content with enriched data

      logger.debug('ðŸ“‹ Step 2: Generating AI content with enriched data...');

      const enrichedListingData = {
        listingName: currentListing.title || '',
        address: `${currentListing.location?.city || ''}, ${currentListing.location?.state || ''}`,
        neighborhood: enrichedNeighborhood,
        typeOfSpace: currentListing.features?.typeOfSpace?.label || '',
        bedrooms: currentListing.features?.bedrooms ?? 0,
        beds: currentListing.features?.bedrooms ?? 0,
        bathrooms: currentListing.features?.bathrooms ?? 0,
        kitchenType: currentListing.features?.kitchenType?.display || '',
        amenitiesInsideUnit: enrichedAmenities.inUnit,
        amenitiesOutsideUnit: enrichedAmenities.building,
      };

      logger.debug('ðŸ¤– Generating AI content with enriched data:', enrichedListingData);

      // 6. Generate Description
      setAiGenerationStatus(prev => ({ ...prev, description: 'loading' }));
      try {
        const generatedDescription = await generateListingDescription(enrichedListingData);
        if (generatedDescription) {
          generatedResults.description = generatedDescription;
          await updateListing({ Description: generatedDescription });
        }
        setAiGenerationStatus(prev => ({ ...prev, description: 'complete' }));
      } catch (err) {
        logger.error('âŒ Error generating description:', err);
        setAiGenerationStatus(prev => ({ ...prev, description: 'complete' }));
      }

      // 7. Generate Listing Name
      setAiGenerationStatus(prev => ({ ...prev, name: 'loading' }));
      try {
        const generatedName = await generateListingTitle(enrichedListingData);
        if (generatedName) {
          generatedResults.name = generatedName;
          await updateListing({ Name: generatedName });
        }
        setAiGenerationStatus(prev => ({ ...prev, name: 'complete' }));
      } catch (err) {
        logger.error('âŒ Error generating name:', err);
        setAiGenerationStatus(prev => ({ ...prev, name: 'complete' }));
      }

      logger.debug('âœ… AI Import Assistant generation complete:', generatedResults);
      setAiGeneratedData(generatedResults);
      setIsAIComplete(true);
    } catch (err) {
      logger.error('âŒ AI generation error:', err);
    } finally {
      setIsAIGenerating(false);
    }
  }, [updateListing]);

  return {
    showAIImportAssistant,
    aiGenerationStatus,
    isAIGenerating,
    isAIComplete,
    aiGeneratedData,
    highlightedFields,
    handleAIAssistant,
    handleCloseAIImportAssistant,
    handleAIImportComplete,
    handleStartAIGeneration
  };
}
