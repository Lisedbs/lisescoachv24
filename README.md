# Lise's Coach ✨ — Web/PWA iPhone

Version web pensée pour être utilisée directement depuis Safari sur iPhone et ajoutée à l'écran d'accueil.

## Déploiement recommandé
Vercel + Next.js. Vercel déploie automatiquement les applications Next.js et fournit une URL HTTPS. Voir la documentation officielle Vercel : https://vercel.com/frameworks/nextjs

### Variables à renseigner
- `STRAVA_CLIENT_ID`
- `STRAVA_CLIENT_SECRET`
- `STRAVA_REDIRECT_URI=https://VOTRE-DOMAINE/api/strava/callback`
- `SESSION_SECRET`

Dans Strava, définir le domaine de callback autorisé correspondant au domaine public de l'application. Strava utilise OAuth2 et fournit des access tokens de courte durée ainsi que des refresh tokens ; le serveur gère le renouvellement. Documentation officielle : https://developers.strava.com/docs/authentication/

## iPhone
Ouvrir l'URL publique dans Safari → Partager → « Sur l'écran d'accueil ». L'app fonctionne ensuite comme une PWA.

## Données incluses
Le fichier `data/SeedData.json` vient du programme/historique fourni. Les trois séances du 1er, 2 et 5 septembre sont considérées comme déjà réalisées. Les données réellement plus récentes peuvent être ajoutées automatiquement après connexion Strava.

## Important
Le code ne contient aucun secret Strava. Il faut créer/configurer l'application Strava et fournir ses variables d'environnement sur l'hébergeur.
