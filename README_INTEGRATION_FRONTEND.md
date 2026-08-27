# Smart School — intégration frontend Super Admin + authentification
Cette version intègre les vues frontend du Super Admin et le parcours d'authentification directement dans `resources/views` afin que l'application AdonisJS puisse servir les pages directement.
## Démarrage
1. Copier `.env.example` vers `.env` et renseigner la configuration de la base de données, `APP_KEY` et la messagerie.
2. Installer les dépendances avec `npm install`.
3. Exécuter les migrations avec `node ace migration:run`.
4. Créer le Super Admin avec le seeder prévu ou votre mécanisme de provisioning.
5. Lancer le serveur avec `npm run dev`.
## Pages intégrées
- `/`
- `/password/reset`
- `/password/reset/verify`
- `/password/reset/new`
- `/password/reset/success`
- `/super-admin/dashboard`
- `/super-admin/ecoles`
- `/super-admin/ecoles/create`
- `/super-admin/ecoles/:id`
- `/super-admin/ecoles/:id/edit`
- `/super-admin/utilisateurs`
- `/super-admin/utilisateurs/create`
- `/super-admin/utilisateurs/:id`
- `/super-admin/utilisateurs/:id/edit`
- `/super-admin/statistiques`
- `/super-admin/rapports`
## Assets
Les CSS et JavaScript du frontend intégré sont servis depuis `public/assets`.
## Authentification
Les pages web utilisent le guard de session `web`. Les endpoints API conservent le guard `api` et acceptent aussi le guard web pour les appels AJAX du frontend hébergé sur le même domaine.
## Sécurité
Le fichier `.env` n'est pas distribué. Utiliser des secrets propres à l'environnement de déploiement.
