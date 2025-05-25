// PF2e NPC Bio Observer Module
import { registerSettings } from './scripts/settings.js';
import { setupNpcObservers } from './scripts/observers.js';
import { setupBioView } from './scripts/bio-view.js';

Hooks.once('init', () => {
  console.log('PF2e NPC Bio Observer | Initializing module');
  registerSettings();
});

Hooks.once('ready', () => {
  console.log('PF2e NPC Bio Observer | Setting up module');
  setupNpcObservers();
  setupBioView();
});
