/**
 * BBCode Parser for Message Rendering
 *
 * Parses BBCode-style formatting tags and returns React elements.
 * Supports:
 * - [b]bold[/b] → <strong>bold</strong>
 * - [i]italic[/i] → <em>italic</em>
 * - [color=#RRGGBB]text[/color] → <span style="color: #RRGGBB">text</span>
 *
 * Security: Only supports a whitelist of tags, no arbitrary HTML injection.
 */

import { createElement, Fragment } from 'react';

/**
 * Regex patterns for BBCode tags
 * Using non-greedy matching (.*?) to handle nested content correctly
 */
const BBCODE_PATTERNS = [
  // Bold: [b]text[/b]
  {
    pattern: /\[b\](.*?)\[\/b\]/gi,
    replace: (match, content, key) =>
      createElement('strong', { key }, parseBBCode(content)),
  },
  // Italic: [i]text[/i]
  {
    pattern: /\[i\](.*?)\[\/i\]/gi,
    replace: (match, content, key) =>
      createElement('em', { key }, parseBBCode(content)),
  },
  // Color: [color=#RRGGBB]text[/color] or [color=colorname]text[/color]
  {
    pattern: /\[color=(#?[a-zA-Z0-9]+)\](.*?)\[\/color\]/gi,
    replace: (match, color, content, key) =>
      createElement('span', { key, style: { color } }, parseBBCode(content)),
  },
];

/**
 * Parse BBCode string and return React elements
 *
 * @param {string} text - Raw text with BBCode tags
 * @returns {React.ReactNode} - Parsed React elements or original string
 */
export function parseBBCode(text) {
  if (!text || typeof text !== 'string') {
    return text;
  }

  // Track if any BBCode was found
  let hasMatch = false;
  const result = text;

  // Try each pattern to see if we have any BBCode
  for (const { pattern } of BBCODE_PATTERNS) {
    if (pattern.test(text)) {
      hasMatch = true;
      // Reset lastIndex since we used test()
      pattern.lastIndex = 0;
      break;
    }
  }

  // If no BBCode found, return plain text
  if (!hasMatch) {
    return text;
  }

  // Process the text with all patterns
  return parseWithPatterns(text, BBCODE_PATTERNS, 0);
}

/**
 * Recursively parse text with BBCode patterns
 *
 * @param {string} text - Text to parse
 * @param {Array} patterns - BBCode patterns to apply
 * @param {number} keyBase - Base key for React elements
 * @returns {React.ReactNode[]} - Array of React elements and strings
 */
function parseWithPatterns(text, patterns, keyBase) {
  const elements = [];
  let lastIndex = 0;
  let keyCounter = keyBase;

  // Combined regex to find any BBCode tag
  const combinedPattern = /\[(b|i|color=[^[\]]+)\](.*?)\[\/\1?\]/gi;

  // Special handling for color tags which have different closing
  const colorPattern = /\[color=(#?[a-zA-Z0-9]+)\](.*?)\[\/color\]/gi;
  const boldPattern = /\[b\](.*?)\[\/b\]/gi;
  const italicPattern = /\[i\](.*?)\[\/i\]/gi;

  // Find all matches and their positions
  const matches = [];

  // Find bold matches
  let match;
  while ((match = boldPattern.exec(text)) !== null) {
    matches.push({
      type: 'bold',
      fullMatch: match[0],
      content: match[1],
      index: match.index,
      length: match[0].length,
    });
  }

  // Find italic matches
  while ((match = italicPattern.exec(text)) !== null) {
    matches.push({
      type: 'italic',
      fullMatch: match[0],
      content: match[1],
      index: match.index,
      length: match[0].length,
    });
  }

  // Find color matches
  while ((match = colorPattern.exec(text)) !== null) {
    matches.push({
      type: 'color',
      fullMatch: match[0],
      color: match[1],
      content: match[2],
      index: match.index,
      length: match[0].length,
    });
  }

  // Sort matches by position
  matches.sort((a, b) => a.index - b.index);

  // Filter out overlapping matches (keep the first one)
  const filteredMatches = [];
  let lastEnd = 0;
  for (const m of matches) {
    if (m.index >= lastEnd) {
      filteredMatches.push(m);
      lastEnd = m.index + m.length;
    }
  }

  // Build elements array
  for (const m of filteredMatches) {
    // Add text before this match
    if (m.index > lastIndex) {
      elements.push(text.slice(lastIndex, m.index));
    }

    // Add the formatted element
    const key = `bbcode-${keyCounter++}`;
    switch (m.type) {
      case 'bold':
        elements.push(
          createElement('strong', { key }, parseBBCode(m.content))
        );
        break;
      case 'italic':
        elements.push(
          createElement('em', { key }, parseBBCode(m.content))
        );
        break;
      case 'color':
        elements.push(
          createElement(
            'span',
            { key, style: { color: m.color } },
            parseBBCode(m.content)
          )
        );
        break;
    }

    lastIndex = m.index + m.length;
  }

  // Add remaining text after last match
  if (lastIndex < text.length) {
    elements.push(text.slice(lastIndex));
  }

  // If no matches were processed, return original text
  if (elements.length === 0) {
    return text;
  }

  // Return array wrapped in Fragment if multiple elements
  return elements.length === 1 ? elements[0] : elements;
}

export default parseBBCode;
