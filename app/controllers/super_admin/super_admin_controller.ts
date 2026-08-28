import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import SuperAdminService from '#services/super_admin/super_admin_service'

export default class SuperAdminController {

   private superAdminService = new SuperAdminService()

  /**
   * ==========================================================================
   * PROFIL DU SUPER ADMIN
   * ==========================================================================
   */
  async profile({
    auth,
    response,
  }: HttpContext) {

    try {

      const user = auth.user

      if (!user) {

        return response.unauthorized({
          success: false,
          message: 'Utilisateur non authentifié.',
        })

      }

      return response.ok({

        success: true,

        data: {

          id: user.id,

          nom: user.nom,

          postnom: user.postnom,

          prenom: user.prenom,

          pseudo: user.pseudo,

          email: user.email,

          telephone: user.telephone,

          sexe: user.sexe,

          statut: user.statut,

          systemRole: user.systemRole,

          isVerified: user.isVerified,

          createdAt: user.createdAt,

          updatedAt: user.updatedAt,

          lastLoginAt: user.lastLoginAt,

        },

      })

    } catch (error: any) {

      console.error(
        'SuperAdminController.profile:',
        error
      )

      return response.internalServerError({

        success: false,

        message:
          error.message ||
          'Impossible de récupérer le profil.',

      })

    }

  }


  /**
   * ==========================================================================
   * VÉRIFICATION DES DROITS
   * GET /api/super-admin/check-access
   * ==========================================================================
   */
  async checkAccess({ auth, response }: HttpContext) {

    try {

      const user = await auth.authenticate()

      const result =
        await this.superAdminService.checkAccess(user)

      return response.ok(result)

    } catch (error: any) {

      return response.forbidden({
        success: false,
        message: error.message,
      })

    }
  }


  /**
   * ==========================================================================
   * MODIFIER LE PROFIL
   * ==========================================================================
   */
  async updateProfile({
    auth,
    request,
    response,
  }: HttpContext) {

    try {

      const user = auth.user

      if (!user) {

        return response.unauthorized({
          success: false,
          message: 'Utilisateur non authentifié.',
        })

      }


      const payload =
        request.only([
          'nom',
          'postnom',
          'prenom',
          'pseudo',
          'email',
          'telephone',
          'sexe',
        ])


      const email =
        payload.email
          ? String(payload.email)
              .trim()
              .toLowerCase()
          : user.email


      /*
       * ----------------------------------------------------------------------
       * Vérification unicité email
       * ----------------------------------------------------------------------
       */
      if (
        email &&
        email !== user.email
      ) {

        const existingEmail =
          await User.query()
            .where(
              'email',
              email
            )
            .whereNot(
              'id',
              user.id
            )
            .first()


        if (existingEmail) {

          return response.badRequest({

            success: false,

            message:
              'Cette adresse email est déjà utilisée.',

          })

        }

      }


      /*
       * ----------------------------------------------------------------------
       * Vérification unicité téléphone
       * ----------------------------------------------------------------------
       */
      if (
        payload.telephone &&
        payload.telephone !==
          user.telephone
      ) {

        const existingPhone =
          await User.query()
            .where(
              'telephone',
              payload.telephone
            )
            .whereNot(
              'id',
              user.id
            )
            .first()


        if (existingPhone) {

          return response.badRequest({

            success: false,

            message:
              'Ce numéro de téléphone est déjà utilisé.',

          })

        }

      }


      /*
       * ----------------------------------------------------------------------
       * Mise à jour
       * ----------------------------------------------------------------------
       */
      user.merge({

        nom:
          payload.nom ??
          user.nom,

        postnom:
          payload.postnom ??
          user.postnom,

        prenom:
          payload.prenom ??
          user.prenom,

        pseudo:
          payload.pseudo ??
          user.pseudo,

        email,

        telephone:
          payload.telephone ??
          user.telephone,

        sexe:
          payload.sexe ??
          user.sexe,

      })


      await user.save()


      return response.ok({

        success: true,

        message:
          'Profil mis à jour avec succès.',

        data: {

          id: user.id,

          nom: user.nom,

          postnom: user.postnom,

          prenom: user.prenom,

          pseudo: user.pseudo,

          email: user.email,

          telephone: user.telephone,

          sexe: user.sexe,

          statut: user.statut,

          systemRole: user.systemRole,

          isVerified: user.isVerified,

          createdAt: user.createdAt,

          updatedAt: user.updatedAt,

          lastLoginAt: user.lastLoginAt,

        },

      })

    } catch (error: any) {

      console.error(
        'SuperAdminController.updateProfile:',
        error
      )

      return response.badRequest({

        success: false,

        message:
          error.message ||
          'Impossible de mettre à jour le profil.',

      })

    }

  }

}
