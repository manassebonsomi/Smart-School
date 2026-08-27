# Smart School — Intégration Backend / Frontend Super Admin
Cette livraison aligne le frontend statique Super Admin avec l'API AdonisJS existante, sans remplacer inutilement l'architecture déjà en place.
## Backend
- Authentification API par access token.
- Flux mot de passe oublié: demande, renvoi du code OTP, vérification du code, réinitialisation.
- CRUD écoles avec recherche, pagination, statistiques, suspension, activation et archivage.
- CRUD administrateurs scolaires avec recherche, pagination, suspension, activation et suppression logique.
- Dashboard Super Admin avec statistiques et agrégations.
- Rapports Super Admin avec génération et export CSV.
- Middleware CORS pour le développement frontend séparé.
- Protection CSRF exclue uniquement pour les routes `/api/*`, conformément au mode API.
- Seeder Super Admin corrigé pour ne jamais conserver le mot de passe en clair.
- Migration d'alignement du statut des écoles et des nouveaux champs.
## Frontend
- `assets/js/smart-school-api.js` centralise les appels API et la gestion du token.
- Les pages Super Admin chargent leurs données depuis l'API.
- Recherche et pagination des écoles et administrateurs sont côté serveur.
- Création/modification/suspension/suppression sont connectées aux endpoints API.
- Authentification et récupération de mot de passe connectées aux endpoints API.
## Démarrage
1. Copier `.env.example` en `.env` et renseigner la base de données et le service mail.
2. Utiliser Node.js 24+ conformément aux contraintes du projet.
3. Installer les dépendances avec `npm install`.
4. Exécuter les migrations puis le seeder Super Admin.
5. Démarrer l'API avec `npm run dev`.
6. Le frontend statique utilise par défaut `http://localhost:3333/api`. Pour changer cette adresse, définir `window.SMART_SCHOOL_API_BASE` avant le chargement de `smart-school-api.js` ou utiliser `localStorage.setItem('smart_school_api_base', 'https://.../api')`.
