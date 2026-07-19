import vine from '@vinejs/vine'


export const validation = vine.compile(
  vine.object({
    contenu: vine.string().trim().minLength(1).maxLength(280)
  })
)
