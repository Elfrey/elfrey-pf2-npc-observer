// Bio view functionality
import { MODULE_ID } from './constants.js';
import { isNpcObserver } from './settings.js';

/**
 * Setup bio view functionality
 */
export function setupBioView() {
  // Only proceed if the module is enabled
  if (!game.settings.get(MODULE_ID, 'enableModule')) return;

  // Modify NPC sheet permissions for observers
  Hooks.on('renderActorSheet', (app, html, data) => {
    const actor = app.actor;

    // Only apply to NPC sheets
    if (!actor || actor.type !== 'npc') return;

    // If the user is a GM, no need to modify
    if (game.user.isGM) return;

    // Check if the current user is an observer for this NPC
    const isObserver = isNpcObserver(actor.id, game.user.id);

    // If not an observer, and the user doesn't have permission to the actor, do nothing
    if (!isObserver && !actor.testUserPermission(game.user, 'OBSERVER')) return;

    // If the user is an observer but doesn't have OBSERVER permission, add a button to view bio
    if (isObserver && !actor.testUserPermission(game.user, 'OBSERVER')) {
      // Add a button to the header
      const header = html.find('.window-header');
      const title = header.find('.window-title');

      const viewBioButton = $(`<a class="view-bio"><i class="fas fa-book-open"></i> ${game.i18n.localize('PF2E-NPC-OBSERVER.Buttons.ViewBio')}</a>`);
      viewBioButton.insertAfter(title);

      // Add click handler
      viewBioButton.click(() => {
        openBioView(actor);
      });
    }
  });

  // Add a directory context menu option for players to view NPC bio
  Hooks.on('getActorDirectoryEntryContext', (html, options) => {
    // Only add for non-GM users
    if (game.user.isGM) return;

    options.push({
      name: game.i18n.localize('PF2E-NPC-OBSERVER.Buttons.ViewBio'),
      icon: '<i class="fas fa-book-open"></i>',
      condition: li => {
        const actorId = li.data('document-id');
        const actor = game.actors.get(actorId);

        // Only show for NPCs that the user is an observer for
        return actor && actor.type === 'npc' && isNpcObserver(actorId, game.user.id);
      },
      callback: li => {
        const actorId = li.data('document-id');
        const actor = game.actors.get(actorId);
        openBioView(actor);
      }
    });
  });

  // Override permission checks for NPC sheets
  const originalTestUserPermission = Actor.prototype.testUserPermission;
  Actor.prototype.testUserPermission = function(user, permission, { exact = false } = {}) {
    // If it's not an NPC or the user is a GM, use the original method
    if (this.type !== 'npc' || user.isGM) {
      return originalTestUserPermission.call(this, user, permission, { exact });
    }

    // If the user is an observer for this NPC, grant LIMITED permission
    if (isNpcObserver(this.id, user.id)) {
      // For LIMITED permission or lower, return true
      if (permission === 'LIMITED' || permission === 'NONE') return true;

      // For higher permissions, use the original method
      return originalTestUserPermission.call(this, user, permission, { exact });
    }

    // Otherwise, use the original method
    return originalTestUserPermission.call(this, user, permission, { exact });
  };
}

/**
 * Open the bio view dialog
 * @param {Actor} npc - The NPC actor
 */
async function openBioView(npc) {
  // Check if the current user is an observer for this NPC
  const isObserver = isNpcObserver(npc.id, game.user.id);

  // If not an observer and doesn't have permission, show error
  if (!isObserver && !npc.testUserPermission(game.user, 'OBSERVER')) {
    ui.notifications.error(game.i18n.localize('PF2E-NPC-OBSERVER.Notifications.NoPermission'));
    return;
  }

  await updateBioView(npc);
}

/**
 * Update the bio view dialog content
 * @param {Actor} npc - The NPC actor
 */
async function updateBioView(npc) {

  // Render the bio view
  const content = await renderTemplate(`modules/${MODULE_ID}/templates/bio-view.hbs`, {
    npc
  });

  // Check if dialog already exists
  const existingDialog = Object.values(ui.windows).find(
    w => w.id?.includes("dialog") && w.title === npc.name
  );

  if (existingDialog) {
    // Update existing dialog content
    const element = existingDialog.element;
    const dialogContent = element.find('.pf2-npc-bio-view').parent();

    dialogContent.html(content);
  } else {
    // Create new dialog
    new Dialog({
      title: npc.name,
      content,
      buttons: {
        close: {
          label: game.i18n.localize('PF2E-NPC-OBSERVER.Dialogs.Cancel'),
          callback: () => {}
        }
      },
      default: 'close'
    }).render(true);
  }
}
