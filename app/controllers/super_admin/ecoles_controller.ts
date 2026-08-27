import type { HttpContext } from '@adonisjs/core/http'
import EcoleService from '#services/super_admin/ecole_service'
import { createEcoleValidator } from '#validators/super_admin/ecole/create_ecole'
import { updateEcoleValidator } from '#validators/super_admin/ecole/update_ecole'
import { indexEcoleValidator } from '#validators/super_admin/ecole/index_ecole'
export default class EcoleController {
  private service = new EcoleService()
  async index({ request, response }: HttpContext) { try { const filters = await request.validateUsing(indexEcoleValidator); return response.ok(await this.service.findAll(filters.page ?? 1, filters.limit ?? 10, filters)) } catch (error: any) { return response.badRequest({ success: false, message: error.message }) } }
  async store({ request, response }: HttpContext) { try { const payload = await request.validateUsing(createEcoleValidator); return response.created(await this.service.create(payload)) } catch (error: any) { return response.badRequest({ success: false, message: error.message }) } }
  async show({ params, response }: HttpContext) { try { return response.ok(await this.service.details(Number(params.id))) } catch (error: any) { return response.notFound({ success: false, message: error.message }) } }
  async update({ params, request, response }: HttpContext) { try { const payload = await request.validateUsing(updateEcoleValidator); return response.ok(await this.service.update(Number(params.id), payload)) } catch (error: any) { return response.badRequest({ success: false, message: error.message }) } }
  async suspend({ params, response }: HttpContext) { try { return response.ok(await this.service.suspend(Number(params.id))) } catch (error: any) { return response.badRequest({ success: false, message: error.message }) } }
  async activate({ params, response }: HttpContext) { try { return response.ok(await this.service.activate(Number(params.id))) } catch (error: any) { return response.badRequest({ success: false, message: error.message }) } }
  async archive({ params, response }: HttpContext) { try { return response.ok(await this.service.archive(Number(params.id))) } catch (error: any) { return response.badRequest({ success: false, message: error.message }) } }
  async destroy({ params, response }: HttpContext) { try { return response.ok(await this.service.delete(Number(params.id))) } catch (error: any) { return response.badRequest({ success: false, message: error.message }) } }
  async search({ request, response }: HttpContext) { try { return response.ok(await this.service.search(String(request.input('search', '')))) } catch (error: any) { return response.badRequest({ success: false, message: error.message }) } }
  async statistics({ params, response }: HttpContext) { try { return response.ok(await this.service.statistics(Number(params.id))) } catch (error: any) { return response.badRequest({ success: false, message: error.message }) } }
  async canDelete({ params, response }: HttpContext) { try { return response.ok({ success: true, data: await this.service.canDelete(Number(params.id)) }) } catch (error: any) { return response.badRequest({ success: false, message: error.message }) } }
  async exists({ params, response }: HttpContext) { try { return response.ok({ success: true, exists: await this.service.exists(Number(params.id)) }) } catch (error: any) { return response.badRequest({ success: false, message: error.message }) } }
}
