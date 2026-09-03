import vine from '@vinejs/vine'

export const indexEcoleValidator = vine.compile(
  vine.object({
    page: vine.number().positive().optional(),
    limit: vine.number().positive().max(100).optional(),
    search: vine.string().trim().optional(),
    statut: vine.string().trim().optional(),
    province: vine.string().trim().optional(),
    sortBy: vine.string().trim().optional(),
    order: vine.enum(['asc', 'desc']).optional(),
  })
)
