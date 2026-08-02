import vine from '@vinejs/vine'

export const registerValidator = vine.compile(
  vine.object({
    nom: vine.string().trim().minLength(2).maxLength(100),
    postnom: vine.string().trim().maxLength(100).optional(),
    prenom: vine.string().trim().minLength(2).maxLength(100),
    pseudo: vine.string().trim().minLength(3).maxLength(50).optional(),
    email: vine.string().trim().email().normalizeEmail(),
    telephone: vine.string().trim().maxLength(20).optional(),
    password: vine.string().minLength(8),
    password_confirmation: vine.string().sameAs('password'),
    sexe: vine.enum(['HOMME', 'FEMME', 'AUTRE']).optional(),
  })
)