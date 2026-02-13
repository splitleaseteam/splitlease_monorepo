import { supabase } from '../../../../lib/supabase.js';

export interface Amenity {
  id: string;
  name: string;
  type_amenity_categories: string;
  icon?: string;
  pre_set?: boolean;
}

/**
 * Fetches ALL amenities from Supabase filtered by category type
 * Used to populate the checkbox list in Section2Features
 * @param type - The amenity type: "In Unit" or "In Building"
 * @returns Promise with array of amenity names
 */
export async function getAllAmenitiesByType(type: string): Promise<string[]> {
  if (!type || type.trim().length === 0) {
    console.warn('No amenity type provided');
    return [];
  }

  try {
    console.log('Fetching all amenities for type:', type);

    const { data, error } = await supabase
      .from('zat_features_amenity')
      .select('name, type_amenity_categories')
      .eq('type_amenity_categories', type)
      .eq('pending', false)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching amenities:', error);
      return [];
    }

    if (!data || data.length === 0) {
      console.warn(`No amenities found for type: ${type}`);
      return [];
    }

    const names = data.map((amenity) => amenity.name);
    console.log(`Fetched ${names.length} amenities for type "${type}":`, names);
    return names;
  } catch (err) {
    console.error('Unexpected error in getAllAmenitiesByType:', err);
    return [];
  }
}

/**
 * Fetches all In Unit amenities from the database
 * @returns Promise with array of amenity names
 */
export async function getAllInUnitAmenities(): Promise<string[]> {
  return getAllAmenitiesByType('In Unit');
}

/**
 * Fetches all In Building amenities from the database
 * @returns Promise with array of amenity names
 */
export async function getAllBuildingAmenities(): Promise<string[]> {
  return getAllAmenitiesByType('In Building');
}

/**
 * Fetches common amenities from Supabase filtered by type
 * @param type - The amenity type: "In Unit", "In Building", or "In Room"
 * @returns Promise with array of amenity names
 */
export async function getCommonAmenitiesByType(type: string): Promise<string[]> {
  if (!type || type.trim().length === 0) {
    console.warn('No amenity type provided');
    return [];
  }

  try {
    console.log('Fetching amenities for type:', type);

    const { data, error } = await supabase
      .from('zat_features_amenity')
      .select('name, pre_set, type_amenity_categories')
      .eq('pre_set', true)
      .eq('type_amenity_categories', type)
      .order('name', { ascending: true });

    console.log('Supabase response:', { data, error });

    if (error) {
      console.error('Error fetching common amenities:', error);
      return [];
    }

    if (!data || data.length === 0) {
      console.warn(`No common amenities found for type: ${type}`);
      return [];
    }

    // Extract just the names
    const names = data.map((amenity) => amenity.name);
    console.log('Fetched amenities:', names);
    return names;
  } catch (err) {
    console.error('Unexpected error in getCommonAmenitiesByType:', err);
    return [];
  }
}

/**
 * Fetches common amenities for inside unit
 * @returns Promise with array of amenity names
 */
export async function getCommonInUnitAmenities(): Promise<string[]> {
  return getCommonAmenitiesByType('In Unit');
}

/**
 * Fetches common amenities for building
 * @returns Promise with array of amenity names
 */
export async function getCommonBuildingAmenities(): Promise<string[]> {
  return getCommonAmenitiesByType('In Building');
}
