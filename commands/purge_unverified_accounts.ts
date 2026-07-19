import { BaseCommand } from '@adonisjs/core/ace'
import User from '#models/user'
import { DateTime } from 'luxon'

export default class PurgeUnverifiedAccounts extends BaseCommand {
  static commandName = 'purge:accounts'

  async run() {
    const limitDate = DateTime.now().minus({ hours: 1 }).toSQL()

    // Supprimer les comptes non vérifiés créés il y a plus de 1h
    await User.query()
      .where('is_verified', false)
      .where('created_at', '<', limitDate)
      .delete()

    this.logger.info('Nettoyage des comptes non vérifiés terminé.')
  }
}
