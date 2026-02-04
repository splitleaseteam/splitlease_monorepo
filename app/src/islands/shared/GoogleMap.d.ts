/**
 * Type definitions for GoogleMap component
 */

import { ForwardedRef } from 'react';

export interface GoogleMapProps {
  listings?: GoogleMapListing[];
  filteredListings?: GoogleMapListing[];
  selectedListing?: GoogleMapListing | null;
  onMarkerClick?: (listing: GoogleMapListing) => void;
  selectedBorough?: string | null;
  simpleMode?: boolean;
  initialZoom?: number | null;
  disableAutoZoom?: boolean;
  onAIResearchClick?: () => void;
  onMessageClick?: (listing: GoogleMapListing) => void;
  isLoggedIn?: boolean;
  favoritedListingIds?: Set<string>;
  onToggleFavorite?: (listingId: string, listingTitle: string, newState: boolean) => void;
  userId?: string | null;
  onRequireAuth?: () => void;
  selectedNightsCount?: number;
  showMessageButton?: boolean;
}

export interface GoogleMapListing {
  id: string;
  title: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  price?: {
    starting: number;
  };
  location?: string;
  type?: string;
  bedrooms?: number;
  bathrooms?: number;
  images?: any[];
  borough?: string;
}

export interface GoogleMapRef {
  highlightListing: (listingId: string) => void;
  stopPulse: () => void;
  zoomToListing: (listingId: string) => void;
}

declare const GoogleMapWithRef: React.ForwardRefExoticComponent<GoogleMapProps & React.RefAttributes<GoogleMapRef>>;

export default GoogleMapWithRef;
