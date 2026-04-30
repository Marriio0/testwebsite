# PFE Manager — Frontend React

Interface React pour la gestion des projets de fin d'études.

## Installation

```bash
npm install
npm run dev
```

L'app démarre sur **http://localhost:3000**

> Le backend Laravel doit tourner sur **http://localhost:8000**

---

## Structure du projet

```
src/
  App.jsx      # Toute l'application (composants, auth, dashboard)
  main.jsx     # Point d'entrée
index.html
vite.config.js  # Proxy /api → localhost:8000
```

---

## Fonctionnalités

### 🔐 Authentification
- Connexion / Inscription avec les rôles : étudiant, encadrant, jury, admin
- Token JWT stocké en localStorage
- Déconnexion

### 📊 Dashboard
- Statistiques : total, soumis, en correction, validés
- Recherche par titre/description
- Filtrage par statut
- Vue carte pour chaque rapport

### 📁 Rapports
- **Étudiant** : soumettre un nouveau rapport (titre, description, lien PDF, encadrant)
- **Tous** : voir les détails, commentaires, versions, validations

### 💬 Commentaires
- Ajouter des commentaires sur chaque rapport

### ✅ Validations
- **Encadrant / Jury** : valider ou refuser un rapport

### 🔄 Statuts
| Statut | Description |
|--------|-------------|
| soumis | Nouvellement déposé |
| en_correction | En attente de corrections |
| resoumis | Resoumis après correction |
| valide | Approuvé |
| refuse | Rejeté |

---

## Rôles

| Rôle | Permissions |
|------|-------------|
| etudiant | Soumettre des rapports, commenter |
| encadrant | Commenter, changer statut, valider/refuser |
| jury | Commenter, changer statut, valider/refuser |
| admin | Tout |

---

## Configuration

Si le backend tourne sur un autre port, modifier `vite.config.js` :
```js
proxy: {
  '/api': 'http://localhost:VOTRE_PORT'
}
```
