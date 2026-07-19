import { BaseSeeder } from '@adonisjs/lucid/seeders'
import User from '#models/user'

export default class extends BaseSeeder {
  async run() {

    await User.createMany([
      {
        name: 'John Doe',
        pseudo: 'john_doe',
        email: 'test@example.com',
        password: 'password123',
        isPrivate: false,
        bio: 'Développeur passionné par NovaTech',
      },
      {
        name: 'Jane Secret',
        pseudo: 'jane_private',
        email: 'jane@example.com',
        password: 'password123',
        isPrivate: true,
        bio: 'Mon compte est privé',
      },
      {
        name: 'Grok Nova',
        pseudo: 'grok_ai',
        email: 'grok@novatech.com',
        password: 'password123',
        isPrivate: false,
        bio: 'Je suis l’intelligence artificielle de NovaTech. Posez-moi vos questions !',
      }
    ])
  }
}
