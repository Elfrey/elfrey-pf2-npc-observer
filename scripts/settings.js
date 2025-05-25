import { MODULE_ID } from './constants.js';
// Module settings registration

/**
 * Register module settings
 */
export function registerSettings() {
  game.settings.register(MODULE_ID, 'enableModule', {
    name: game.i18n.localize('PF2E-NPC-OBSERVER.Settings.EnableModule'),
    hint: game.i18n.localize('PF2E-NPC-OBSERVER.Settings.EnableModuleHint'),
    scope: 'world',
    config: true,
    type: Boolean,
    default: true
  });

  // Create a storage for NPC observers
  game.settings.register(MODULE_ID, 'npcObservers', {
    name: 'NPC Observers',
    scope: 'world',
    config: false,
    type: Object,
    default: {}
  });
}

/**
 * Get the observers for a specific NPC
 * @param {string} npcId - The ID of the NPC
 * @returns {Array} - Array of user IDs who are observers
 */
export function getNpcObservers(npcId) {
  const observers = game.settings.get(MODULE_ID, 'npcObservers');
  return observers[npcId] || [];
}

/**
 * Set the observers for a specific NPC
 * @param {string} npcId - The ID of the NPC
 * @param {Array} userIds - Array of user IDs who are observers
 */
export function setNpcObservers(npcId, userIds, update) {
  const observers = game.settings.get(MODULE_ID, 'npcObservers');
  observers[npcId] = userIds;

  const npc = game.actors.get(npcId);
  if (npc && update && update.userId) {
    npc.update({
      [`ownership.${update.userId}`]: update.action === 'add' ? CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER : CONST.DOCUMENT_OWNERSHIP_LEVELS.INHERIT,
    });
  }

  return game.settings.set(MODULE_ID, 'npcObservers', observers);
}

/**
 * Check if a user is an observer for a specific NPC
 * @param {string} npcId - The ID of the NPC
 * @param {string} userId - The ID of the user
 * @returns {boolean} - Whether the user is an observer
 */
export function isNpcObserver(npcId, userId) {
  const observers = getNpcObservers(npcId);
  return observers.includes(userId);
}
