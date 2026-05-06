# Déployer le site en ligne

Le projet est prêt pour la mise en production. Voici la voie la plus rapide : **Vercel**, gratuit, ~3 minutes, déploiement automatique à chaque `git push`.

---

## Option 1 — Vercel (recommandé, 3 minutes)

### Étape 1 — Créer le compte (1 fois pour la vie)

1. Aller sur **https://vercel.com/signup**
2. Cliquer **« Continue with GitHub »** → autoriser Vercel à accéder à ton compte GitHub.

### Étape 2 — Importer le projet

1. Sur le dashboard Vercel, cliquer **« Add New… » → « Project »**.
2. Choisir le repo `antoineplaton20/simulateur-vehicules` et cliquer **« Import »**.
3. Vercel détecte automatiquement Vite. **Ne rien changer** — le `vercel.json` à la racine fait le boulot.
4. (Optionnel) Si tu veux la branche de test plutôt que `main` : section *Git* → modifier la *Production Branch* en `claude/start-new-app-A88Ix`.
5. Cliquer **« Deploy »**.

⏳ Vercel build en 30–60 s puis te donne une URL du type `https://simulateur-vehicules-xxx.vercel.app`. C'est en ligne.

### Étape 3 (optionnelle) — Brancher Supabase

Si tu veux la vraie base ADEME au lieu des 20 voitures de démo :

1. Sur ton projet Vercel → onglet **Settings** → **Environment Variables**.
2. Ajouter :
   - `VITE_SUPABASE_URL` = `https://xxx.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = `eyJhbGc...`
3. Onglet **Deployments** → bouton **« Redeploy »** sur le dernier déploiement.

Sans ces variables, l'app utilise automatiquement les 20 voitures de démo (`src/demoData.js`).

### Étape 4 (optionnelle) — Domaine personnalisé

Onglet **Domains** → entrer ton domaine → suivre les instructions DNS. Vercel gère le HTTPS gratuitement.

---

## Option 2 — Netlify (alternative, ~3 minutes)

1. **https://app.netlify.com/signup** → continuer avec GitHub.
2. **« Add new site » → « Import an existing project »** → choisir GitHub → `simulateur-vehicules`.
3. Build settings (auto-détecté) :
   - Build command : `npm run build`
   - Publish directory : `dist`
4. Variables d'environnement (Site settings → Environment variables) si Supabase.
5. Deploy.

---

## Option 3 — Cloudflare Pages

Même principe : connecter le repo, build command `npm run build`, output `dist`. Gratuit, CDN mondial.

---

## Mettre à jour le site

Une fois connecté, **chaque `git push` redéploie automatiquement**. Pas de manipulation supplémentaire.

```
git add .
git commit -m "Mise à jour"
git push
```

Vercel/Netlify/Cloudflare détectent le push et reconstruisent dans la minute.

---

## Tester localement comme en prod

```
npm run build
npm run preview
```

Ouvre l'URL affichée (par défaut http://localhost:4173). C'est ce que verront les visiteurs.

---

## Et l'app mobile (`mobile/`) ?

Voir `mobile/README.md`. L'app mobile ne se déploie pas comme un site — soit on la teste via **Expo Go** (gratuit, 30 secondes), soit on publie sur l'**App Store / Play Store** via `eas build`.
