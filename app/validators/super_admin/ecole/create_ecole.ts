import vine from '@vinejs/vine'

export const createEcoleValidator =
  vine.compile(
    vine.object({
      /**
       * =========================================================================
       * INFORMATIONS DE L'ÉCOLE
       * =========================================================================
       */
      nom:
        vine
          .string()
          .trim(),

      code:
        vine
          .string()
          .trim()
          .optional(),

      description:
        vine
          .string()
          .trim()
          .optional(),

      adresse:
        vine
          .string()
          .trim()
          .optional(),

      telephone:
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

      ville:
        vine
          .string()
          .trim()
          .optional(),

      pays:
        vine
          .string()
          .trim()
          .optional(),

      province:
        vine
          .string()
          .trim()
          .optional(),

      commune:
        vine
          .string()
          .trim()
          .optional(),

      quartier:
        vine
          .string()
          .trim()
          .optional(),

      siteWeb:
        vine
          .string()
          .trim()
          .optional(),

      type:
        vine
          .string()
          .trim()
          .optional(),

      anneeCreation:
        vine
          .number()
          .optional(),

      logo:
        vine
          .string()
          .trim()
          .optional(),

      statut:
        vine
          .enum([
            'ACTIF',
            'SUSPENDU',
            'ARCHIVE',
          ])
          .optional(),

      /**
       * =========================================================================
       * ADMINISTRATEUR DE L'ÉCOLE
       * =========================================================================
       *
       * Deux possibilités :
       *
       * mode = "new"
       *    Création d'un nouveau compte administrateur.
       *
       * mode = "existing"
       *    Association d'un utilisateur déjà présent dans la plateforme.
       *
       * Tous les champs restent structurellement optionnels car leur
       * obligation dépend du mode choisi.
       */
      admin:
        vine
          .object({
            mode:
              vine
                .enum([
                  'new',
                  'existing',
                ])
                .optional(),

            userId:
              vine
                .number()
                .positive()
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

            prenom:
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
          .optional(),
    })
  )
