import User from '#models/user'
import { SystemRole } from '../../app/enums/system_role.ts'
export default class SuperAdminSeeder {

  async run() {

    const email = 'prod@gmail.com'

    const password = '34383438'

    const existingUser = await User.findBy('email', email)


    if (existingUser) {

      existingUser.systemRole = SystemRole.SUPER_ADMIN

      existingUser.statut = 'ACTIF'

      existingUser.isVerified = true

      existingUser.password = password

      await existingUser.save()


      console.log(
        `Super Admin déjà existant : ${email}`
      )

      console.log(
        `Mot de passe : ${password}`
      )

      return

    }


    const user = await User.create({

      nom: 'Super',

      postnom: 'Administrateur',

      prenom: 'Système',

      email,

      password,

      systemRole: SystemRole.SUPER_ADMIN,

      statut: 'ACTIF',

      isVerified: true,

      pseudo: 'bmm-admin-1',

    })


    console.log(
      `Super Admin créé avec succès : ${user.email}`
    )

    console.log(
      `Mot de passe initial : ${password}`
    )

  }

}
