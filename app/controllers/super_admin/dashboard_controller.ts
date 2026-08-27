import type { HttpContext } from '@adonisjs/core/http'
import DashboardService from '#services/super_admin/dashboard_service'
export default class DashboardController {
  private service = new DashboardService()
  async index({ response }: HttpContext) { return response.ok(await this.service.getFullDashboard()) }
  async statistics({ response }: HttpContext) { return response.ok({ success: true, data: await this.service.getStatistics() }) }
  async schools({ response }: HttpContext) { return response.ok({ success: true, data: await this.service.getSchoolsByStatus() }) }
  async users({ response }: HttpContext) { return response.ok({ success: true, data: await this.service.getUsersByRole() }) }
  async recentSchools({ request, response }: HttpContext) { return response.ok({ success: true, data: await this.service.getRecentSchools(Number(request.input('limit', 5))) }) }
  async recentAdministrators({ request, response }: HttpContext) { return response.ok({ success: true, data: await this.service.getRecentAdministrators(Number(request.input('limit', 5))) }) }
  async topSchools({ request, response }: HttpContext) { return response.ok({ success: true, data: await this.service.getTopSchools(Number(request.input('limit', 5))) }) }
  async schoolsStatistics({ response }: HttpContext) { return response.ok({ success: true, data: await this.service.getSchoolsWithStatistics() }) }
  async activities({ request, response }: HttpContext) { return response.ok({ success: true, data: await this.service.getRecentActivities(Number(request.input('limit', 10))) }) }
  async monthlySchools({ request, response }: HttpContext) { return response.ok({ success: true, data: await this.service.getMonthlySchools(Number(request.input('year', new Date().getFullYear()))) }) }
  async monthlyUsers({ request, response }: HttpContext) { return response.ok({ success: true, data: await this.service.getMonthlyUsers(Number(request.input('year', new Date().getFullYear()))) }) }
  async systemHealth({ response }: HttpContext) { return response.ok({ success: true, data: await this.service.getSystemHealth() }) }
}
