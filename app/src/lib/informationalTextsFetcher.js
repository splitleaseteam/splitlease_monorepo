/**
 * Informational Texts Data Fetcher
 *
 * Infrastructure layer for fetching informational text content from Supabase.
 * This is NOT business logic - it's a data access utility.
 *
 * @module lib/informationalTextsFetcher
 * @category Infrastructure
 */

import { supabase } from './supabase.js'

/**
 * Fetch informational texts from Supabase.
 *
 * Infrastructure layer - not business logic. Fetches CMS-style content
 * that provides contextual help and information throughout the application.
 *
 * @returns {Promise<Object>} Map of informational texts keyed by tag title.
 *   Each entry contains: { desktop, mobile, desktopPlus, showMore }
 *
 * @example
 * const texts = await fetchInformationalTexts()
 * const howItWorksText = texts['How It Works']
 * console.log(howItWorksText.desktop) // Desktop copy
 * console.log(howItWorksText.mobile)  // Mobile copy
 */
export async function fetchInformationalTexts() {
  try {
    const { data, error } = await supabase
      .from('informationaltexts')
      .select(
        'id, information_tag_title, desktop_copy, mobile_copy, desktop_copy_legacy, show_more_available'
      )

    if (error) throw error

    // Transform data into a map keyed by tag title
    const textsMap = {}
    data.forEach((item) => {
      textsMap[item.information_tag_title] = {
        desktop: item.desktop_copy,
        mobile: item.mobile_copy,
        desktopPlus: item.desktop_copy_legacy,
        showMore: item.show_more_available
      }
    })

    return textsMap
  } catch (error) {
    console.error('Failed to fetch informational texts:', error)
    return {}
  }
}
