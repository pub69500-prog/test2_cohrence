# Cohérence Cardiaque - Version Optimisée

## 🎯 Modifications principales

Cette version a été entièrement repensée pour offrir une expérience optimale sur mobile et desktop, sans scroll nécessaire.

### ✅ Ce qui a été supprimé
- **Historique des séances** : Toute la fonctionnalité d'historique et de statistiques a été retirée
- **Panneau des statistiques** : Suppression des tuiles de statistiques journalières, hebdomadaires, mensuelles et annuelles
- **Bouton historique** : Le bouton et le panneau déroulant associé ont été retirés
- **Stockage des sessions** : Plus de sauvegarde des sessions dans localStorage

### 🎨 Design repensé

#### Layout optimisé
- **Design sans scroll** : Toute l'interface tient dans l'écran, même sur mobile
- **Layout flex responsive** : Organisation horizontale sur desktop, verticale sur mobile
- **Composants compacts** : Tous les éléments ont été redimensionnés pour optimiser l'espace

#### Nouvelles fonctionnalités
- **Thème clair/sombre** : Bouton de bascule en haut à droite avec icône ☀️/🌙
- **Section sons expandable** : Les contrôles de sons et musiques se déplient/replient pour gagner de l'espace
- **Grille de paramètres** : Durée, Inspiration et Expiration organisés en grille de 3 colonnes
- **Design méticuleux** : 
  - Bordures subtiles avec transparence
  - Backdrop blur pour effet de profondeur
  - Animations douces et élégantes
  - Transitions fluides
  - Palette de couleurs harmonieuse
  - Typographie soignée (Cormorant Garamond + Montserrat)

#### Améliorations UX
- **Inputs inline** : Les champs nombre + unité sont groupés visuellement
- **Icônes contextuelles** : Emojis pour identifier rapidement chaque paramètre (⏱️, ↗️, ↘️, 🔊)
- **Sliders de volume compacts** : Taille réduite et intégration harmonieuse
- **Boutons optimisés** : Tailles et espacements adaptés au tactile

### 📱 Responsive parfait

#### Desktop (> 968px)
- Layout horizontal (zone respiration + panneau contrôle côte à côte)
- Zone de respiration spacieuse
- Tous les contrôles visibles sans scroll

#### Tablette (968px - 480px)
- Layout vertical automatique
- Éléments redimensionnés intelligemment
- Navigation fluide

#### Mobile (< 480px)
- **Optimisation maximale** : Tout tient dans l'écran
- **Position fixe** : Pas de scroll du body
- **Éléments ultra-compacts** : Chaque pixel compte
- **Grille de sons adaptative** : Passe en colonne unique
- **Touch-friendly** : Zones tactiles optimisées

### 🎵 Fonctionnalités audio préservées

Toutes les fonctionnalités audio sont intactes :
- Sons d'inspiration et expiration personnalisables
- Upload de sons personnalisés
- Musiques d'ambiance avec upload multiple
- Contrôles de volume individuels
- Détection automatique des sons bundlés (manifest.json)
- Support iOS et Android

### 🌈 Thème sombre

Le nouveau thème sombre offre :
- Palette de couleurs inversée élégante
- Conservation de l'identité visuelle
- Transitions douces entre thèmes
- Sauvegarde de la préférence

### 💾 Sauvegarde des préférences

Même sans historique, l'application sauvegarde :
- Durée de session
- Temps d'inspiration/expiration
- Sons sélectionnés
- Volumes configurés
- Thème choisi (clair/sombre)

### 🚀 Performance

- **Code allégé** : Suppression de ~400 lignes de code lié à l'historique
- **Bundle plus léger** : Moins de logique = chargement plus rapide
- **Meilleure fluidité** : Moins de calculs = animations plus fluides
- **Mémoire optimisée** : Pas de stockage massif de données

### 📦 Structure des fichiers

```
coherence-optimized/
├── index.html           # HTML optimisé
├── css/
│   └── style.css       # CSS repensé avec thème dark
├── js/
│   └── app.js          # JS simplifié sans historique
├── manifest.json       # PWA manifest
├── sw.js              # Service Worker
├── icons/             # Icônes PWA
├── sounds/            # Sons de respiration
│   ├── inhale/
│   └── exhale/
├── music/             # Musiques d'ambiance
└── assets/
    └── audio-manifest.json
```

### 🎯 Utilisation

1. Ouvrez `index.html` dans un navigateur
2. Configurez vos paramètres (durée, rythme respiratoire)
3. Ajoutez des sons et musiques si souhaité (section dépliable)
4. Cliquez sur "Commencer" pour démarrer votre séance
5. Profitez de l'expérience sans distraction !

### ⚡ Compatibilité

- ✅ Chrome/Edge (desktop & mobile)
- ✅ Firefox (desktop & mobile)
- ✅ Safari (desktop & iOS)
- ✅ Samsung Internet
- ✅ Mode PWA installable

### 🎨 Personnalisation du design

Le fichier CSS utilise des variables CSS pour une personnalisation facile :

```css
:root {
    --primary: #2d4654;      /* Couleur principale */
    --secondary: #7fa99b;    /* Couleur secondaire */
    --accent: #e8d5b5;       /* Couleur d'accent */
    --light: #f5f1e8;        /* Fond clair */
    --dark: #1a2930;         /* Texte sombre */
}
```

### 🙏 Crédits

Développé avec ❤️ par Chris

---

**Note** : Cette version est une optimisation de l'application originale avec focus sur l'essentiel : la pratique de la cohérence cardiaque. L'historique et les statistiques ont été volontairement retirés pour offrir une expérience plus épurée et concentrée.
