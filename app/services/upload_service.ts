import app from '@adonisjs/core/services/app'
import { MultipartFile } from '@adonisjs/core/bodyparser'
import { randomUUID } from 'node:crypto'
import fs from 'node:fs/promises'

export default class UploadService {

  async uploadAvatar(file: MultipartFile): Promise<string> {
    const fileName = `${randomUUID()}_${file.clientName}`

    await file.move(app.makePath('public/uploads/avatars'), {
      name: fileName,
      overwrite: true,
    })

    return fileName
  }

  async deleteAvatar(fileName: string) {
    const filePath = app.makePath('public/uploads/avatars', fileName)
    try {
      await fs.unlink(filePath)
    } catch (error) {
    }
  }
}
