import vine from '@vinejs/vine'


export const changePasswordValidator = vine.compile(

  vine.object({
    oldPassword: vine.string().minLength(8),
    password: vine.string().minLength(8),
    password_confirmation: vine.string().sameAs('password')
  })

)