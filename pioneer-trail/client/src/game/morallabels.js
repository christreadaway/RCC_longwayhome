/**
 * Moral Labels System
 *
 * Generates and manages moral label cards that appear after game events.
 * Labels provide moral/spiritual feedback tied to Catholic teaching,
 * calibrated for the student's grade band.
 *
 * Label text is stored in moral-labels.json. This module handles:
 * - Looking up the correct label for an event + choice + grade band
 * - Determining whether to show the label based on session mode
 * - Formatting labels with appropriate tone for the grade band
 *
 * CRITICAL: Labels for deceptive CWM events use the SAME label as
 * genuine events. Never reference recipient_genuine in label selection logic.
 *
 * @module morallabels
 */

import { GAME_CONSTANTS } from '@shared/types';

// ---------------------------------------------------------------------------
// Label data (loaded from JSON, but we provide a fallback structure)
// ---------------------------------------------------------------------------

/**
 * @type {Object|null}
 * Loaded label data from moral-labels.json. Set via setLabelData().
 */
let labelData = null;

/**
 * Sets the label data from the loaded JSON file.
 * Call this once at app initialization with the contents of moral-labels.json.
 *
 * @param {Object} data - Parsed moral-labels.json contents
 */
export function setLabelData(data) {
  labelData = data;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Retrieves the label for a specific event type, choice, and grade band.
 *
 * @param {string} eventType - Event type key (e.g., 'cwm_feed_hungry')
 * @param {string} choice - Player choice key (e.g., 'helped', 'declined')
 * @param {string} gradeBand - Grade band ('k2', '3_5', '6_8')
 * @returns {{
 *   valence: 'positive' | 'negative',
 *   title: string,
 *   body: string,
 *   scripture?: string,
 *   forward_prompt?: string
 * }|null}
 */
export function getLabelForEvent(eventType, choice, gradeBand) {
  if (!labelData) {
    return getFallbackLabel(eventType, choice, gradeBand);
  }

  // Build the lookup key: eventType_choice (e.g., 'cwm_feed_hungry_helped')
  const labelKey = `${eventType}_${choice}`;

  const labelEntry = labelData[labelKey];
  if (!labelEntry) {
    return getFallbackLabel(eventType, choice, gradeBand);
  }

  const bandLabel = labelEntry[gradeBand];
  if (!bandLabel) {
    // Try falling back to a different band
    return labelEntry['6_8'] || labelEntry['3_5'] || labelEntry['k2'] || null;
  }

  return { ...bandLabel };
}

/**
 * Determines whether a moral label should be shown based on the session's
 * moral_label_mode setting and the current event phase.
 *
 * Modes:
 * - 'full': Show labels immediately after choices
 * - 'post_choice': Show labels only after the choice is made (not during)
 * - 'discussion_only': Never show labels to students (teacher discusses later)
 *
 * @param {import('../../../shared/types.js').MoralLabelMode} moralLabelMode
 * @param {'immediate' | 'post_choice' | 'suppressed'} eventPhase
 * @returns {boolean}
 */
export function shouldShowLabel(moralLabelMode, eventPhase) {
  switch (moralLabelMode) {
    case 'full':
      // Show in all phases except suppressed
      return eventPhase !== 'suppressed';

    case 'post_choice':
      // Only show after the choice is made
      return eventPhase === 'post_choice';

    case 'discussion_only':
      // Never show to students
      return false;

    default:
      // Default to showing post-choice
      return eventPhase === 'post_choice';
  }
}

/**
 * Formats a label for display, adjusting tone and content based on grade band.
 *
 * @param {{ valence: string, title: string, body: string, scripture?: string, forward_prompt?: string }} label
 * @param {string} gradeBand - Grade band ('k2', '3_5', '6_8')
 * @returns {{
 *   valence: string,
 *   title: string,
 *   body: string,
 *   scripture: string|null,
 *   forwardPrompt: string|null,
 *   fadeSeconds: number,
 *   style: string
 * }}
 */
export function formatLabelForDisplay(label, gradeBand) {
  if (!label) {
    return null;
  }

  return {
    valence: label.valence,
    title: label.title,
    body: label.body,
    scripture: label.scripture || null,
    forwardPrompt: label.forward_prompt || null,
    fadeSeconds: GAME_CONSTANTS.LABEL_FADE_SECONDS,
    style: getLabelStyle(label.valence, gradeBand),
  };
}

/**
 * Returns a list of all label keys available in the loaded data.
 * Useful for validation and testing.
 *
 * @returns {string[]}
 */
export function getAvailableLabelKeys() {
  if (!labelData) return [];
  return Object.keys(labelData);
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Returns a visual style identifier based on valence and grade band.
 * Components use this to select CSS classes or color schemes.
 *
 * @param {'positive' | 'negative'} valence
 * @param {string} gradeBand
 * @returns {string}
 */
function getLabelStyle(valence, gradeBand) {
  if (gradeBand === 'k2') {
    return valence === 'positive' ? 'k2-positive' : 'k2-gentle-negative';
  }
  if (gradeBand === '3_5') {
    return valence === 'positive' ? 'standard-positive' : 'standard-negative';
  }
  // 6_8
  return valence === 'positive' ? 'detailed-positive' : 'detailed-negative';
}

/**
 * Provides a fallback label when moral-labels.json is not loaded
 * or when a specific label key is not found.
 *
 * @param {string} eventType
 * @param {string} choice
 * @param {string} gradeBand
 * @returns {{ valence: string, title: string, body: string }}
 */
function getFallbackLabel(eventType, choice, gradeBand) {
  const isPositive = ['helped', 'taken', 'fair', 'moderate', 'rest', 'pray'].includes(choice);
  const valence = isPositive ? 'positive' : 'negative';

  if (gradeBand === 'k2') {
    return {
      valence,
      title: isPositive ? 'GREAT JOB!' : 'THINK ABOUT IT',
      body: isPositive
        ? 'You made a kind choice! Jesus loves when we help others.'
        : 'Next time, think about how you can be kind to others.',
      forward_prompt: isPositive
        ? 'Keep being kind on the trail!'
        : 'You can always try again!',
    };
  }

  if (gradeBand === '3_5') {
    return {
      valence,
      title: isPositive ? 'A Good Choice' : 'A Missed Opportunity',
      body: isPositive
        ? 'Your kindness reflects the love of Christ. Helping others on the trail strengthens your whole party.'
        : 'Sometimes we miss chances to help. The trail offers many opportunities to do better.',
    };
  }

  // 6_8
  return {
    valence,
    title: isPositive ? 'Work of Mercy' : 'Examination of Conscience',
    body: isPositive
      ? 'By helping those in need, you practice the Corporal Works of Mercy that Jesus calls us to in Matthew 25.'
      : 'Consider how this choice aligns with the call to love your neighbor. The Sacrament of Reconciliation reminds us we can always turn back to God.',
  };
}
