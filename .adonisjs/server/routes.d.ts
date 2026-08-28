import '@adonisjs/core/types/http'

type ParamValue = string | number | bigint | boolean

export type ScannedRoutes = {
  ALL: {
    'home': { paramsTuple?: []; params?: {} }
    'google.redirect': { paramsTuple?: []; params?: {} }
    'google.callback': { paramsTuple?: []; params?: {} }
    'password.reset.step1': { paramsTuple?: []; params?: {} }
    'password.reset.step1.submit': { paramsTuple?: []; params?: {} }
    'password.reset.step2': { paramsTuple?: []; params?: {} }
    'password.reset.step2.submit': { paramsTuple?: []; params?: {} }
    'password.reset.step3': { paramsTuple?: []; params?: {} }
    'password.reset.step3.submit': { paramsTuple?: []; params?: {} }
    'password.reset.success': { paramsTuple?: []; params?: {} }
    'api.auth.register': { paramsTuple?: []; params?: {} }
    'api.auth.login': { paramsTuple?: []; params?: {} }
    'api.auth.verifyEmail': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'api.auth.forgotPassword': { paramsTuple?: []; params?: {} }
    'api.auth.resendResetCode': { paramsTuple?: []; params?: {} }
    'api.auth.verifyResetCode': { paramsTuple?: []; params?: {} }
    'api.auth.resetPassword': { paramsTuple?: []; params?: {} }
    'api.auth.me': { paramsTuple?: []; params?: {} }
    'api.auth.logout': { paramsTuple?: []; params?: {} }
    'api.auth.switchSchool': { paramsTuple?: []; params?: {} }
    'api.auth.changePassword': { paramsTuple?: []; params?: {} }
    'login': { paramsTuple?: []; params?: {} }
    'verify-email': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'super-admin.dashboard': { paramsTuple?: []; params?: {} }
    'super-admin.ecoles': { paramsTuple?: []; params?: {} }
    'super-admin.ecoles.create': { paramsTuple?: []; params?: {} }
    'super-admin.ecoles.edit': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'super-admin.ecoles.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'super-admin.profil': { paramsTuple?: []; params?: {} }
    'super-admin.utilisateurs': { paramsTuple?: []; params?: {} }
    'super-admin.utilisateurs.create': { paramsTuple?: []; params?: {} }
    'super-admin.utilisateurs.edit': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'super-admin.utilisateurs.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'super-admin.statistiques': { paramsTuple?: []; params?: {} }
    'super-admin.rapports': { paramsTuple?: []; params?: {} }
    'dashboard.index': { paramsTuple?: []; params?: {} }
    'dashboard.statistics': { paramsTuple?: []; params?: {} }
    'dashboard.schools': { paramsTuple?: []; params?: {} }
    'dashboard.users': { paramsTuple?: []; params?: {} }
    'dashboard.recentSchools': { paramsTuple?: []; params?: {} }
    'dashboard.recentAdministrators': { paramsTuple?: []; params?: {} }
    'dashboard.topSchools': { paramsTuple?: []; params?: {} }
    'dashboard.schoolsStatistics': { paramsTuple?: []; params?: {} }
    'dashboard.activities': { paramsTuple?: []; params?: {} }
    'dashboard.monthlySchools': { paramsTuple?: []; params?: {} }
    'dashboard.monthlyUsers': { paramsTuple?: []; params?: {} }
    'dashboard.systemHealth': { paramsTuple?: []; params?: {} }
    'ecoles.index': { paramsTuple?: []; params?: {} }
    'ecoles.store': { paramsTuple?: []; params?: {} }
    'ecoles.search': { paramsTuple?: []; params?: {} }
    'ecoles.statistics': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'ecoles.canDelete': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'ecoles.exists': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'ecoles.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'ecoles.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'ecoles.suspend': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'ecoles.activate': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'ecoles.archive': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'ecoles.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'administrateurs.statistics': { paramsTuple?: []; params?: {} }
    'administrateurs.index': { paramsTuple?: []; params?: {} }
    'administrateurs.store': { paramsTuple?: []; params?: {} }
    'administrateurs.exists': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'administrateurs.belongsToSchool': { paramsTuple: [ParamValue,ParamValue]; params: {'id': ParamValue,'ecoleId': ParamValue} }
    'administrateurs.switchSchool': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'administrateurs.suspend': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'administrateurs.activate': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'administrateurs.forceDelete': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'administrateurs.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'administrateurs.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'administrateurs.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'ecoles.administrateurs': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'statistics.index': { paramsTuple?: []; params?: {} }
    'statistics.overview': { paramsTuple?: []; params?: {} }
    'statistics.schools': { paramsTuple?: []; params?: {} }
    'statistics.users': { paramsTuple?: []; params?: {} }
    'statistics.monthly': { paramsTuple?: []; params?: {} }
    'statistics.activities': { paramsTuple?: []; params?: {} }
    'reports.index': { paramsTuple?: []; params?: {} }
    'reports.store': { paramsTuple?: []; params?: {} }
    'reports.download': { paramsTuple: [ParamValue]; params: {'type': ParamValue} }
    'superAdmin.profile': { paramsTuple?: []; params?: {} }
    'superAdmin.profile.update': { paramsTuple?: []; params?: {} }
  }
  GET: {
    'home': { paramsTuple?: []; params?: {} }
    'google.redirect': { paramsTuple?: []; params?: {} }
    'google.callback': { paramsTuple?: []; params?: {} }
    'password.reset.step1': { paramsTuple?: []; params?: {} }
    'password.reset.step2': { paramsTuple?: []; params?: {} }
    'password.reset.step3': { paramsTuple?: []; params?: {} }
    'password.reset.success': { paramsTuple?: []; params?: {} }
    'api.auth.verifyEmail': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'api.auth.me': { paramsTuple?: []; params?: {} }
    'login': { paramsTuple?: []; params?: {} }
    'verify-email': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'super-admin.dashboard': { paramsTuple?: []; params?: {} }
    'super-admin.ecoles': { paramsTuple?: []; params?: {} }
    'super-admin.ecoles.create': { paramsTuple?: []; params?: {} }
    'super-admin.ecoles.edit': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'super-admin.ecoles.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'super-admin.profil': { paramsTuple?: []; params?: {} }
    'super-admin.utilisateurs': { paramsTuple?: []; params?: {} }
    'super-admin.utilisateurs.create': { paramsTuple?: []; params?: {} }
    'super-admin.utilisateurs.edit': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'super-admin.utilisateurs.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'super-admin.statistiques': { paramsTuple?: []; params?: {} }
    'super-admin.rapports': { paramsTuple?: []; params?: {} }
    'dashboard.index': { paramsTuple?: []; params?: {} }
    'dashboard.statistics': { paramsTuple?: []; params?: {} }
    'dashboard.schools': { paramsTuple?: []; params?: {} }
    'dashboard.users': { paramsTuple?: []; params?: {} }
    'dashboard.recentSchools': { paramsTuple?: []; params?: {} }
    'dashboard.recentAdministrators': { paramsTuple?: []; params?: {} }
    'dashboard.topSchools': { paramsTuple?: []; params?: {} }
    'dashboard.schoolsStatistics': { paramsTuple?: []; params?: {} }
    'dashboard.activities': { paramsTuple?: []; params?: {} }
    'dashboard.monthlySchools': { paramsTuple?: []; params?: {} }
    'dashboard.monthlyUsers': { paramsTuple?: []; params?: {} }
    'dashboard.systemHealth': { paramsTuple?: []; params?: {} }
    'ecoles.index': { paramsTuple?: []; params?: {} }
    'ecoles.search': { paramsTuple?: []; params?: {} }
    'ecoles.statistics': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'ecoles.canDelete': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'ecoles.exists': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'ecoles.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'administrateurs.statistics': { paramsTuple?: []; params?: {} }
    'administrateurs.index': { paramsTuple?: []; params?: {} }
    'administrateurs.exists': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'administrateurs.belongsToSchool': { paramsTuple: [ParamValue,ParamValue]; params: {'id': ParamValue,'ecoleId': ParamValue} }
    'administrateurs.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'ecoles.administrateurs': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'statistics.index': { paramsTuple?: []; params?: {} }
    'statistics.overview': { paramsTuple?: []; params?: {} }
    'statistics.schools': { paramsTuple?: []; params?: {} }
    'statistics.users': { paramsTuple?: []; params?: {} }
    'statistics.monthly': { paramsTuple?: []; params?: {} }
    'statistics.activities': { paramsTuple?: []; params?: {} }
    'reports.index': { paramsTuple?: []; params?: {} }
    'reports.download': { paramsTuple: [ParamValue]; params: {'type': ParamValue} }
    'superAdmin.profile': { paramsTuple?: []; params?: {} }
  }
  HEAD: {
    'home': { paramsTuple?: []; params?: {} }
    'google.redirect': { paramsTuple?: []; params?: {} }
    'google.callback': { paramsTuple?: []; params?: {} }
    'password.reset.step1': { paramsTuple?: []; params?: {} }
    'password.reset.step2': { paramsTuple?: []; params?: {} }
    'password.reset.step3': { paramsTuple?: []; params?: {} }
    'password.reset.success': { paramsTuple?: []; params?: {} }
    'api.auth.verifyEmail': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'api.auth.me': { paramsTuple?: []; params?: {} }
    'login': { paramsTuple?: []; params?: {} }
    'verify-email': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'super-admin.dashboard': { paramsTuple?: []; params?: {} }
    'super-admin.ecoles': { paramsTuple?: []; params?: {} }
    'super-admin.ecoles.create': { paramsTuple?: []; params?: {} }
    'super-admin.ecoles.edit': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'super-admin.ecoles.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'super-admin.profil': { paramsTuple?: []; params?: {} }
    'super-admin.utilisateurs': { paramsTuple?: []; params?: {} }
    'super-admin.utilisateurs.create': { paramsTuple?: []; params?: {} }
    'super-admin.utilisateurs.edit': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'super-admin.utilisateurs.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'super-admin.statistiques': { paramsTuple?: []; params?: {} }
    'super-admin.rapports': { paramsTuple?: []; params?: {} }
    'dashboard.index': { paramsTuple?: []; params?: {} }
    'dashboard.statistics': { paramsTuple?: []; params?: {} }
    'dashboard.schools': { paramsTuple?: []; params?: {} }
    'dashboard.users': { paramsTuple?: []; params?: {} }
    'dashboard.recentSchools': { paramsTuple?: []; params?: {} }
    'dashboard.recentAdministrators': { paramsTuple?: []; params?: {} }
    'dashboard.topSchools': { paramsTuple?: []; params?: {} }
    'dashboard.schoolsStatistics': { paramsTuple?: []; params?: {} }
    'dashboard.activities': { paramsTuple?: []; params?: {} }
    'dashboard.monthlySchools': { paramsTuple?: []; params?: {} }
    'dashboard.monthlyUsers': { paramsTuple?: []; params?: {} }
    'dashboard.systemHealth': { paramsTuple?: []; params?: {} }
    'ecoles.index': { paramsTuple?: []; params?: {} }
    'ecoles.search': { paramsTuple?: []; params?: {} }
    'ecoles.statistics': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'ecoles.canDelete': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'ecoles.exists': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'ecoles.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'administrateurs.statistics': { paramsTuple?: []; params?: {} }
    'administrateurs.index': { paramsTuple?: []; params?: {} }
    'administrateurs.exists': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'administrateurs.belongsToSchool': { paramsTuple: [ParamValue,ParamValue]; params: {'id': ParamValue,'ecoleId': ParamValue} }
    'administrateurs.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'ecoles.administrateurs': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'statistics.index': { paramsTuple?: []; params?: {} }
    'statistics.overview': { paramsTuple?: []; params?: {} }
    'statistics.schools': { paramsTuple?: []; params?: {} }
    'statistics.users': { paramsTuple?: []; params?: {} }
    'statistics.monthly': { paramsTuple?: []; params?: {} }
    'statistics.activities': { paramsTuple?: []; params?: {} }
    'reports.index': { paramsTuple?: []; params?: {} }
    'reports.download': { paramsTuple: [ParamValue]; params: {'type': ParamValue} }
    'superAdmin.profile': { paramsTuple?: []; params?: {} }
  }
  POST: {
    'password.reset.step1.submit': { paramsTuple?: []; params?: {} }
    'password.reset.step2.submit': { paramsTuple?: []; params?: {} }
    'password.reset.step3.submit': { paramsTuple?: []; params?: {} }
    'api.auth.register': { paramsTuple?: []; params?: {} }
    'api.auth.login': { paramsTuple?: []; params?: {} }
    'api.auth.forgotPassword': { paramsTuple?: []; params?: {} }
    'api.auth.resendResetCode': { paramsTuple?: []; params?: {} }
    'api.auth.verifyResetCode': { paramsTuple?: []; params?: {} }
    'api.auth.resetPassword': { paramsTuple?: []; params?: {} }
    'api.auth.logout': { paramsTuple?: []; params?: {} }
    'ecoles.store': { paramsTuple?: []; params?: {} }
    'administrateurs.store': { paramsTuple?: []; params?: {} }
    'reports.store': { paramsTuple?: []; params?: {} }
  }
  PATCH: {
    'api.auth.switchSchool': { paramsTuple?: []; params?: {} }
    'api.auth.changePassword': { paramsTuple?: []; params?: {} }
    'ecoles.suspend': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'ecoles.activate': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'ecoles.archive': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'administrateurs.switchSchool': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'administrateurs.suspend': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'administrateurs.activate': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  PUT: {
    'ecoles.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'administrateurs.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'superAdmin.profile.update': { paramsTuple?: []; params?: {} }
  }
  DELETE: {
    'ecoles.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'administrateurs.forceDelete': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'administrateurs.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
}
declare module '@adonisjs/core/types/http' {
  export interface RoutesList extends ScannedRoutes {}
}