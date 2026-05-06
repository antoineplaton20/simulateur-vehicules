# Coût voiture — Application mobile

Application iOS / Android construite avec **Expo** (React Native). Même logique que le site web `/src`, interface adaptée au tactile.

---

## 🧪 Tester sur ton iPhone (sans Mac, depuis Windows)

1. **Sur Windows**, installe Node.js 20+ depuis https://nodejs.org
2. **Sur ton iPhone**, installe l'app **Expo Go** depuis l'App Store (gratuite)
3. Dans un terminal Windows (PowerShell ou cmd), à la racine du projet :
   ```
   cd mobile
   npm install
   npx expo start
   ```
4. Un QR code s'affiche. **Ouvre l'app Caméra** de ton iPhone et vise le QR code.
5. Une notification apparaît pour ouvrir le projet dans Expo Go → tape dessus.
6. L'app charge sur ton téléphone. À chaque modification de fichier, l'app se recharge automatiquement.

> ⚠️ **Important** : ton ordinateur Windows et ton iPhone doivent être sur **le même réseau Wi-Fi**. Si ça ne marche pas, lance `npx expo start --tunnel` (utilise un tunnel internet, plus lent mais fonctionne partout).

---

## 📦 Construire un vrai .ipa (pour l'App Store)

Pour publier sur l'App Store, il te faut :

1. Un compte **Apple Developer** (99 $/an) → https://developer.apple.com
2. Un compte **Expo** gratuit → https://expo.dev/signup

Ensuite, depuis Windows, **sans Mac** :

```
npm install -g eas-cli
eas login
eas build --platform ios
```

Expo construit l'app dans son cloud Mac et te renvoie un fichier `.ipa` que tu peux soumettre à l'App Store via :

```
eas submit --platform ios
```

**Pour Android** (Google Play, frais unique de 25 $) :

```
eas build --platform android
eas submit --platform android
```

---

## 📁 Structure

```
mobile/
├── App.js                       # Racine
├── index.js                     # Point d'entrée Expo
├── app.json                     # Config Expo (nom, icône, identifiant)
├── package.json                 # Dépendances
├── babel.config.js              # Babel preset Expo
└── src/
    ├── constants.js             # Prix, valeurs par défaut, libellés
    ├── calc.js                  # Calcul du coût total + crédit
    ├── demoData.js              # 20 véhicules de démo (mêmes que web)
    ├── theme.js                 # Couleurs, tailles
    ├── components/
    │   ├── Stepper.js           # Boutons −/+ accessibles
    │   ├── SelectField.js       # Liste déroulante (modal)
    │   ├── InfoButton.js        # Infobulles (?)
    │   └── VehiculeCard.js      # Carte de résultat
    └── screens/
        └── HomeScreen.js        # Écran principal
```

---

## 🔌 Connecter à Supabase (optionnel)

L'app utilise actuellement les données de démo. Pour la brancher sur Supabase :

```
npx expo install @supabase/supabase-js
```

Puis dans `src/screens/HomeScreen.js`, remplacer l'import de `DEMO_VEHICULES` par un appel à Supabase, en passant l'URL et la clé via `app.json` → `extra` puis `expo-constants`.
