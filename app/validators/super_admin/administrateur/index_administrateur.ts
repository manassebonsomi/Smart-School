import vine from '@vinejs/vine'

export const indexAdministrateurValidator = vine.compile(
  vine.object({
    page: vine.number().min(1).optional(),
    limit: vine.number().min(1).max(100).optional(),
    search: vine.string().trim().optional(),
    statut: vine.enum(['ACTIF', 'SUSPENDU', 'ARCHIVE',]).optional(),
    sortBy: vine.enum(['nom', 'code', 'created_at',]).optional(),
    order: vine.enum(['asc', 'desc',]).optional(),
  })
)