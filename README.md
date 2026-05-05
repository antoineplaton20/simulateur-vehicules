# Simulateur Véhicules — TCO 2026

Simulateur de coût total de possession (TCO) pour comparer thermique, hybride et électrique.

## 🚀 Démo

Le site est déployé sur Vercel : *(URL à venir)*

## 🛠️ Stack technique

- **Frontend** : React 18 + Vite
- **Base de données** : Supabase (PostgreSQL)
- **Hébergement** : Vercel
- **Données** : ADEME Carlabelling (Licence Ouverte 2.0 - Etalab)

## 📋 Variables d'environnement

À configurer dans Vercel (ou dans un fichier `.env` local) :

```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
```

## 🏠 Lancer en local

```bash
npm install
npm run dev
```

Puis ouvrir http://localhost:5173

## 📜 Licence

- Code : MIT
- Données : Licence Ouverte 2.0 (ADEME)
