import vine from "@vinejs/vine"

export const updateProfileValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(3).maxLength(50),
    pseudo: vine.string().trim().minLength(3).maxLength(20),
    email: vine.string().email().trim(),
    bio: vine.string().trim().maxLength(160).optional(),
    address: vine.string().trim().optional(),
    password: vine.string().minLength(8).confirmed().optional(),
    avatar: vine.file({
      size: '2mb',
      extnames: ['jpg', 'jpeg', 'png', 'webp'],
    }).optional(),
  })
)
