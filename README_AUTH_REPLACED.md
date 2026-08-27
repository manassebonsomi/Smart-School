# Smart School - Authentification remplacée

La version d'authentification fournie dans `auth.zip` remplace les anciennes vues d'authentification dans `resources/views/pages/auth`.

Points importants :
- `login/login.edge` provient de la nouvelle authentification.
- `forgotmdp/*` provient de la nouvelle authentification.
- Le parcours d'inscription existant est conservé.
- `tsconfig.json` est configuré pour AdonisJS 7 avec `@adonisjs/tsconfig/tsconfig.app.json`, `module: NodeNext` et `rootDir` explicite.
- Aucun `.env` avec secrets n'est inclus.
