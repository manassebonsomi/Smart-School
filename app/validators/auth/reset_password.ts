import vine from '@vinejs/vine'


export const resetPasswordValidator = vine.compile(

  vine.object({
    token: vine.string().trim(),
    password: vine.string().minLength(8),
    password_confirmation: vine.string().sameAs('password')
  })

)