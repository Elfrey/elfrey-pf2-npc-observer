// PF2e NPC Bio Observer Module
import { registerSettings } from './settings.js';
import { setupNpcObservers } from './observers.js';
import { setupBioView } from './bio-view.js';

Hooks.once('init', () => {
  console.log('PF2e NPC Bio Observer | Initializing module');
  registerSettings();
});

Hooks.once('ready', () => {
  console.log('PF2e NPC Bio Observer | Setting up module');
  setupNpcObservers();
  setupBioView();
});
