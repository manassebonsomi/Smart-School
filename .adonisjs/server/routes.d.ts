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
    'home.accueil': { paramsTuple?: []; params?: {} }
    'home.prediction': { paramsTuple?: []; params?: {} }
    'predictions.predict': { paramsTuple?: []; params?: {} }
    'predictions.index': { paramsTuple?: []; params?: {} }
    'profile.edit': { paramsTuple?: []; params?: {} }
    'profile.show': { paramsTuple?: [ParamValue?]; params?: {'id'?: ParamValue} }
    'profile.update': { paramsTuple?: []; params?: {} }
    'profile.togglePrivacy': { paramsTuple?: []; params?: {} }
    'messages.index': { paramsTuple?: []; params?: {} }
    'messages.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'messages.store': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'session.logout': { paramsTuple?: []; params?: {} }
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
    'home.accueil': { paramsTuple?: []; params?: {} }
    'home.prediction': { paramsTuple?: []; params?: {} }
    'predictions.index': { paramsTuple?: []; params?: {} }
    'profile.edit': { paramsTuple?: []; params?: {} }
    'profile.show': { paramsTuple?: [ParamValue?]; params?: {'id'?: ParamValue} }
    'messages.index': { paramsTuple?: []; params?: {} }
    'messages.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
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
    'home.accueil': { paramsTuple?: []; params?: {} }
    'home.prediction': { paramsTuple?: []; params?: {} }
    'predictions.index': { paramsTuple?: []; params?: {} }
    'profile.edit': { paramsTuple?: []; params?: {} }
    'profile.show': { paramsTuple?: [ParamValue?]; params?: {'id'?: ParamValue} }
    'messages.index': { paramsTuple?: []; params?: {} }
    'messages.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  POST: {
    'session.login': { paramsTuple?: []; params?: {} }
    'session.process_step_3': { paramsTuple?: []; params?: {} }
    'new_account.register': { paramsTuple?: []; params?: {} }
    'forgot_passwords.process_step_1': { paramsTuple?: []; params?: {} }
    'forgot_passwords.process_step_2': { paramsTuple?: []; params?: {} }
    'forgot_passwords.process_step_3': { paramsTuple?: []; params?: {} }
    'predictions.predict': { paramsTuple?: []; params?: {} }
    'profile.togglePrivacy': { paramsTuple?: []; params?: {} }
    'messages.store': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'session.logout': { paramsTuple?: []; params?: {} }
  }
  PUT: {
    'profile.update': { paramsTuple?: []; params?: {} }
  }
}
declare module '@adonisjs/core/types/http' {
  export interface RoutesList extends ScannedRoutes {}
}