import vine from '@vinejs/vine'

export const updateEcoleValidator = vine.compile(
  vine.object({
    nom: vine.string().trim().minLength(3).maxLength(150).optional(),
    code: vine.string().trim().minLength(2).maxLength(20).optional(),
    adresse: vine.string().trim().maxLength(255).optional(),
    telephone: vine.string().trim().maxLength(20).optional(),
    email: vine.string().trim().email().optional(),
    statut: vine.enum(['ACTIF', 'SUSPENDU', 'ARCHIVE']).optional(),
  })
)