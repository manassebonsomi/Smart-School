import vine from '@vinejs/vine'

export const switchSchoolValidator = vine.compile(
  vine.object({
    ecoleId: vine.number().positive()
  })
)