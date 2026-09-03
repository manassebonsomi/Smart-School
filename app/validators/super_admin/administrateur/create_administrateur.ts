import vine from '@vinejs/vine'

export const createAdministrateurValidator =
  vine.compile(
    vine.object({
      /**
       * =========================================================================
       * ÉCOLE
       * =========================================================================
       */
      ecoleId:
        vine.number().positive(),

      /**
       * =========================================================================
       * MODE
       * =========================================================================
       *
       * new      => création d'un compte
       * existing => association d'un compte existant
       *
       * Par défaut, le service considère l'absence de mode comme "new".
       */
      mode:
        vine
          .enum([
            'new',
            'existing',
          ])
          .optional(),

      /**
       * =========================================================================
       * UTILISATEUR EXISTANT
       * =========================================================================
       */
      userId:
        vine
          .number()
          .positive()
          .optional(),

      /**
       * =========================================================================
       * INFORMATIONS DU NOUVEL ADMINISTRATEUR
       * =========================================================================
       */
      prenom:
        vine
          .string()
          .trim()
          .optional(),

      nom:
        vine
          .string()
          .trim()
          .optional(),

      postnom:
        vine
          .string()
          .trim()
          .optional(),

      pseudo:
        vine
          .string()
          .trim()
          .optional(),

      email:
        vine
          .string()
          .email()
          .trim()
          .optional(),

      telephone:
        vine
          .string()
          .trim()
          .optional(),

      sexe:
        vine
          .string()
          .trim()
          .optional(),

      password:
        vine
          .string()
          .minLength(8)
          .optional(),

      password_confirmation:
        vine
          .string()
          .minLength(8)
          .optional(),
    })
  )
