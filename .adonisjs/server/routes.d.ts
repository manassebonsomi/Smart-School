import '@adonisjs/core/types/http'

type ParamValue = string | number | bigint | boolean

export type ScannedRoutes = {
  ALL: {
    'session.show': { paramsTuple?: []; params?: {} }
    'session.login': { paramsTuple?: []; params?: {} }
    'session.show_step_3': { paramsTuple?: []; params?: {} }
    'session.process_step_3': { paramsTuple?: []; params?: {} }
    'new_account.show': { paramsTuple?: []; params?: {} }
    'new_account.register': { paramsTuple?: []; params?: {} }
    'google.redirect': { paramsTuple?: []; params?: {} }
    'google_auth.callback': { paramsTuple?: []; params?: {} }
    'password.reset.step1': { paramsTuple?: []; params?: {} }
    'forgot_passwords.process_step_1': { paramsTuple?: []; params?: {} }
    'password.reset.step2': { paramsTuple?: []; params?: {} }
    'forgot_passwords.process_step_2': { paramsTuple?: []; params?: {} }
    'password.reset.step3': { paramsTuple?: []; params?: {} }
    'forgot_passwords.process_step_3': { paramsTuple?: []; params?: {} }
    'auth.register': { paramsTuple?: []; params?: {} }
    'auth.login': { paramsTuple?: []; params?: {} }
    'auth.verify_email': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'auth.forgot_password': { paramsTuple?: []; params?: {} }
    'auth.reset_password': { paramsTuple?: []; params?: {} }
    'auth.me': { paramsTuple?: []; params?: {} }
    'auth.logout': { paramsTuple?: []; params?: {} }
    'auth.switch_school': { paramsTuple?: []; params?: {} }
    'auth.change_password': { paramsTuple?: []; params?: {} }
    'dashboard.index': { paramsTuple?: []; params?: {} }
    'dashboard.statistics': { paramsTuple?: []; params?: {} }
    'dashboard.schools': { paramsTuple?: []; params?: {} }
    'dashboard.users': { paramsTuple?: []; params?: {} }
    'dashboard.recent_schools': { paramsTuple?: []; params?: {} }
    'dashboard.recent_administrators': { paramsTuple?: []; params?: {} }
    'dashboard.top_schools': { paramsTuple?: []; params?: {} }
    'dashboard.schools_statistics': { paramsTuple?: []; params?: {} }
    'dashboard.activities': { paramsTuple?: []; params?: {} }
    'dashboard.monthly_schools': { paramsTuple?: []; params?: {} }
    'dashboard.monthly_users': { paramsTuple?: []; params?: {} }
    'dashboard.system_health': { paramsTuple?: []; params?: {} }
    'ecole.index': { paramsTuple?: []; params?: {} }
    'ecole.store': { paramsTuple?: []; params?: {} }
    'ecole.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'ecole.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'ecole.suspend': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'ecole.activate': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'ecole.archive': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'ecole.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'ecole.search': { paramsTuple?: []; params?: {} }
    'ecole.statistics': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'ecole.can_delete': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'ecole.exists': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'administrateur.index': { paramsTuple?: []; params?: {} }
    'administrateur.store': { paramsTuple?: []; params?: {} }
    'administrateur.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'administrateur.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'administrateur.suspend': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'administrateur.activate': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'administrateur.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'administrateur.force_delete': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'administrateur.statistics': { paramsTuple?: []; params?: {} }
    'administrateur.exists': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'administrateur.get_by_school': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'administrateur.switch_school': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'administrateur.belongs_to_school': { paramsTuple: [ParamValue,ParamValue]; params: {'id': ParamValue,'ecoleId': ParamValue} }
    'super_admin.profile': { paramsTuple?: []; params?: {} }
    'super_admin.check_access': { paramsTuple?: []; params?: {} }
  }
  GET: {
    'session.show': { paramsTuple?: []; params?: {} }
    'session.show_step_3': { paramsTuple?: []; params?: {} }
    'new_account.show': { paramsTuple?: []; params?: {} }
    'google.redirect': { paramsTuple?: []; params?: {} }
    'google_auth.callback': { paramsTuple?: []; params?: {} }
    'password.reset.step1': { paramsTuple?: []; params?: {} }
    'password.reset.step2': { paramsTuple?: []; params?: {} }
    'password.reset.step3': { paramsTuple?: []; params?: {} }
    'auth.verify_email': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'auth.me': { paramsTuple?: []; params?: {} }
    'dashboard.index': { paramsTuple?: []; params?: {} }
    'dashboard.statistics': { paramsTuple?: []; params?: {} }
    'dashboard.schools': { paramsTuple?: []; params?: {} }
    'dashboard.users': { paramsTuple?: []; params?: {} }
    'dashboard.recent_schools': { paramsTuple?: []; params?: {} }
    'dashboard.recent_administrators': { paramsTuple?: []; params?: {} }
    'dashboard.top_schools': { paramsTuple?: []; params?: {} }
    'dashboard.schools_statistics': { paramsTuple?: []; params?: {} }
    'dashboard.activities': { paramsTuple?: []; params?: {} }
    'dashboard.monthly_schools': { paramsTuple?: []; params?: {} }
    'dashboard.monthly_users': { paramsTuple?: []; params?: {} }
    'dashboard.system_health': { paramsTuple?: []; params?: {} }
    'ecole.index': { paramsTuple?: []; params?: {} }
    'ecole.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'ecole.search': { paramsTuple?: []; params?: {} }
    'ecole.statistics': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'ecole.can_delete': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'ecole.exists': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'administrateur.index': { paramsTuple?: []; params?: {} }
    'administrateur.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'administrateur.statistics': { paramsTuple?: []; params?: {} }
    'administrateur.exists': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'administrateur.get_by_school': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'administrateur.belongs_to_school': { paramsTuple: [ParamValue,ParamValue]; params: {'id': ParamValue,'ecoleId': ParamValue} }
    'super_admin.profile': { paramsTuple?: []; params?: {} }
    'super_admin.check_access': { paramsTuple?: []; params?: {} }
  }
  HEAD: {
    'session.show': { paramsTuple?: []; params?: {} }
    'session.show_step_3': { paramsTuple?: []; params?: {} }
    'new_account.show': { paramsTuple?: []; params?: {} }
    'google.redirect': { paramsTuple?: []; params?: {} }
    'google_auth.callback': { paramsTuple?: []; params?: {} }
    'password.reset.step1': { paramsTuple?: []; params?: {} }
    'password.reset.step2': { paramsTuple?: []; params?: {} }
    'password.reset.step3': { paramsTuple?: []; params?: {} }
    'auth.verify_email': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'auth.me': { paramsTuple?: []; params?: {} }
    'dashboard.index': { paramsTuple?: []; params?: {} }
    'dashboard.statistics': { paramsTuple?: []; params?: {} }
    'dashboard.schools': { paramsTuple?: []; params?: {} }
    'dashboard.users': { paramsTuple?: []; params?: {} }
    'dashboard.recent_schools': { paramsTuple?: []; params?: {} }
    'dashboard.recent_administrators': { paramsTuple?: []; params?: {} }
    'dashboard.top_schools': { paramsTuple?: []; params?: {} }
    'dashboard.schools_statistics': { paramsTuple?: []; params?: {} }
    'dashboard.activities': { paramsTuple?: []; params?: {} }
    'dashboard.monthly_schools': { paramsTuple?: []; params?: {} }
    'dashboard.monthly_users': { paramsTuple?: []; params?: {} }
    'dashboard.system_health': { paramsTuple?: []; params?: {} }
    'ecole.index': { paramsTuple?: []; params?: {} }
    'ecole.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'ecole.search': { paramsTuple?: []; params?: {} }
    'ecole.statistics': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'ecole.can_delete': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'ecole.exists': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'administrateur.index': { paramsTuple?: []; params?: {} }
    'administrateur.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'administrateur.statistics': { paramsTuple?: []; params?: {} }
    'administrateur.exists': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'administrateur.get_by_school': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'administrateur.belongs_to_school': { paramsTuple: [ParamValue,ParamValue]; params: {'id': ParamValue,'ecoleId': ParamValue} }
    'super_admin.profile': { paramsTuple?: []; params?: {} }
    'super_admin.check_access': { paramsTuple?: []; params?: {} }
  }
  POST: {
    'session.login': { paramsTuple?: []; params?: {} }
    'session.process_step_3': { paramsTuple?: []; params?: {} }
    'new_account.register': { paramsTuple?: []; params?: {} }
    'forgot_passwords.process_step_1': { paramsTuple?: []; params?: {} }
    'forgot_passwords.process_step_2': { paramsTuple?: []; params?: {} }
    'forgot_passwords.process_step_3': { paramsTuple?: []; params?: {} }
    'auth.register': { paramsTuple?: []; params?: {} }
    'auth.login': { paramsTuple?: []; params?: {} }
    'auth.forgot_password': { paramsTuple?: []; params?: {} }
    'auth.reset_password': { paramsTuple?: []; params?: {} }
    'auth.logout': { paramsTuple?: []; params?: {} }
    'ecole.store': { paramsTuple?: []; params?: {} }
    'administrateur.store': { paramsTuple?: []; params?: {} }
  }
  PATCH: {
    'auth.switch_school': { paramsTuple?: []; params?: {} }
    'auth.change_password': { paramsTuple?: []; params?: {} }
    'ecole.suspend': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'ecole.activate': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'ecole.archive': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'administrateur.suspend': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'administrateur.activate': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'administrateur.switch_school': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  PUT: {
    'ecole.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'administrateur.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  DELETE: {
    'ecole.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'administrateur.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'administrateur.force_delete': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
}
declare module '@adonisjs/core/types/http' {
  export interface RoutesList extends ScannedRoutes {}
}