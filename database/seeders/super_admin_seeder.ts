// import hash from '@adonisjs/core/services/hash'
import User from '#models/user'
import { SystemRole } from '../../app/enums/system_role.ts'

export default class SuperAdminSeeder {

  async run() {

    const email = 'bmm.superadmin@smart-school.com'
    const existingUser = await User.findBy('email', email)

    if (existingUser) {

      if (existingUser.systemRole !== SystemRole.SUPER_ADMIN) {

        existingUser.systemRole = SystemRole.SUPER_ADMIN

        await existingUser.save()
      }

      console.log(
        `Super Admin déjà existant : ${email}`
      )

      return
    }

    const password = "343877" //await hash.make('343877')

    const user = await User.create({

      nom: 'Super',
      postnom: 'Administrateur',
      prenom: 'Système',
      email,
      password,
      systemRole: SystemRole.SUPER_ADMIN,
      statut: 'ACTIF',
      isVerified: true,
      pseudo: 'bmm-superadmin',

    })

    console.log(
      `Super Admin créé avec succès : ${user.email}`
    )

    console.log(
      'Mot de passe initial : 343877'
    )
  }
}