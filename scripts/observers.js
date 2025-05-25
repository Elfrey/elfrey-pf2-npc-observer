import { MODULE_ID } from './constants.js';
import {getNpcObservers, setNpcObservers} from './settings.js';

const {ApplicationV2, HandlebarsApplicationMixin} = foundry.applications.api;

/**
 * ObserverDialog Application class
 * @extends {ApplicationV2}
 */
class ObserverDialog extends HandlebarsApplicationMixin(ApplicationV2) {
  /**
   * @param {Actor} npc - The NPC actor
   * @param {Object} options - Additional options
   */
  constructor(npc, options = {}) {
    super(options);
    this.npc = npc;
    this.currentObservers = getNpcObservers(npc.id);
  }

  /** @override */

  static DEFAULT_OPTIONS = {
    id: 'observer-dialog',
    position: {
      width: 400,
      height: 'auto',
    },
    window: {
      resizable: true,
      minimizable: true,
    },
  };

  static PARTS = {
    form: {
      template: `modules/${MODULE_ID}/templates/observer-dialog.hbs`,
    },
  };

  async _prepareContext(options) {
    this.currentObservers = getNpcObservers(this.npc.id);

    const allPlayers = game.users.filter(user => !user.isGM);
    const observers = allPlayers.filter(player => this.currentObservers.includes(player.id));
    const availablePlayers = allPlayers.filter(player => !this.currentObservers.includes(player.id));

    return {
      players: availablePlayers, observers,
    };
  }

  _onRender(context, options) {
    super._onRender(context, options);
    const addButton = this.element.querySelector('#add-observer');
    if (addButton) {
      this.element.querySelector('#add-observer').addEventListener("click", (event) => {
        event.preventDefault();
        this._onAddObserver(event);
      });
    }
    for (const removeButton of this.element.querySelectorAll('.remove-observer')) {
      removeButton.addEventListener("click", (event) => {
        event.preventDefault();
        this._onRemoveObserver(event);
      })
    }
    this.element.querySelector('#close-dialog').addEventListener('click', this.close.bind(this));
  }

  get title() {
    return `${this.npc.name}: ${game.i18n.localize('PF2E-NPC-OBSERVER.Dialogs.ObserverTitle')}`;
  }

  async _onAddObserver(event) {
    event.preventDefault();

    const selectedPlayerId = this.element.querySelector('#player-select').value;
    if (!selectedPlayerId) return;

    if (!this.currentObservers.includes(selectedPlayerId)) {
      const newObservers = [...this.currentObservers, selectedPlayerId];
      await setNpcObservers(this.npc.id, newObservers, {
        action: 'add',
        userId: selectedPlayerId,
      });
      this.currentObservers = newObservers;

      this.render(true);
      ui.notifications.info(game.i18n.localize('PF2E-NPC-OBSERVER.Notifications.ObserverAdded'));
    }
  }

  /**
   * Handle removing an observer
   * @private
   */
  async _onRemoveObserver(event) {
    event.preventDefault();
    const userId = event.currentTarget.dataset.userId;

    const newObservers = this.currentObservers.filter(id => id !== userId);
    await setNpcObservers(this.npc.id, newObservers, {
      action: 'remove',
      userId,
    });
    this.currentObservers = newObservers;

    this.render(true);
    ui.notifications.info(game.i18n.localize('PF2E-NPC-OBSERVER.Notifications.ObserverRemoved'));
  }
}

/**
 * Setup NPC observers functionality
 */
export function setupNpcObservers() {
  if (!game.settings.get(MODULE_ID, 'enableModule')) return;

  Hooks.on('getActorSheetHeaderButtons', (sheet, buttons) => {
    const actor = sheet.actor;
    if (!actor || actor.type !== 'npc' || !game.user.isGM) return;

    buttons.unshift({
      label: game.i18n.localize('PF2E-NPC-OBSERVER.Buttons.ManageObservers'),
      class: 'manage-observers',
      icon: 'fas fa-eye',
      onclick: () => openObserverDialog(actor),
    });
  });
}

/**
 * Open the observer management dialog
 * @param {Actor} npc - The NPC actor
 */
async function openObserverDialog(npc) {
  const appId = `observer-dialog-${npc.id}`;
  const existingApp = Object.values(ui.windows).find(w => w.id === appId);

  if (existingApp) {
    existingApp.bringToTop();
    existingApp.render(true);
  } else {
    new ObserverDialog(npc, {id: appId}).render(true);
  }
}
