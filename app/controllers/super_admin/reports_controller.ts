import type { HttpContext } from '@adonisjs/core/http'
import ReportService from '#services/super_admin/report_service'
export default class ReportsController {
  private service = new ReportService()
  async index({ request, response }: HttpContext) { return response.ok(await this.service.list({ type: request.input('type') })) }
  async store({ request, response }: HttpContext) { try { return response.created(await this.service.generate(String(request.input('type')))) } catch (error: any) { return response.badRequest({ success: false, message: error.message }) } }
  async download({ params, response }: HttpContext) { try { const content = await this.service.download(String(params.type)); response.header('Content-Type', 'text/csv; charset=utf-8'); response.header('Content-Disposition', `attachment; filename="smart-school-${String(params.type)}.csv"`); return response.send(`\ufeff${content}`) } catch (error: any) { return response.badRequest({ success: false, message: error.message }) } }
}
