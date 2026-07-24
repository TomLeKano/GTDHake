# GTDHack v3 — Déploiement avec intégration Notion complète

Cette version ajoute :
- ✅ Écran de revue **éditable** (modifier/supprimer avant envoi)
- ✅ Typologie : **Tâche / Idée / Rangement**
- ✅ **Consolidation automatique** des tâches liées (ex: plusieurs questions pour la même personne → une seule tâche avec sous-éléments)
- ✅ Bouton **"Envoyer à Notion"** qui pousse réellement les données

---

## 📁 Structure du projet

```
gtdhack/
├── index.html          ← l'app (capture + revue)
└── api/
    └── create-tasks.js ← fonction serveur qui parle à Notion
```

**Important** : cette fois, ce n'est plus un seul fichier HTML — c'est un vrai petit projet avec un dossier `api/`. Il faut le déployer en entier (pas juste glisser un fichier).

---

## 🔑 Étape 1 : Créer ton intégration Notion (3 min)

1. Va sur **notion.so/my-integrations**
2. Clique **"+ New integration"**
3. Nom : `GTDHack` → choisis ton workspace
4. Capacités : laisse **Read/Insert/Update content** cochées
5. Clique **Submit**
6. **Copie le token** qui commence par `secret_...` ou `ntn_...` (tu en auras besoin à l'étape 3)

### Partager ta database avec l'intégration
1. Ouvre ta database **"Tâches & Idées - Inbox Personnel"** dans Notion
2. Clique **"•••"** (en haut à droite) → **"Connexions"** → cherche **"GTDHack"** → connecte-la

Sans cette étape, l'intégration n'aura pas accès à ta database même avec le bon token.

### Récupérer l'ID de la database
Dans l'URL de ta database Notion :
```
https://notion.so/tonworkspace/7c867daaa5364e20a2e63ac6a835f565?v=...
                                └──────────── ID (32 caractères) ────────────┘
```
Copie cette partie (sans tirets, c'est normal).

---

## 🚀 Étape 2 : Déployer sur Vercel (5 min)

### Via GitHub (recommandé — permet des mises à jour faciles)

1. Crée un repo GitHub, uploade les fichiers `index.html` et `api/create-tasks.js` en gardant la structure de dossiers
2. Va sur **vercel.com** → **"Add New"** → **"Project"**
3. **"Import Git Repository"** → sélectionne ton repo
4. Vercel détecte automatiquement le dossier `api/` comme fonctions serverless
5. **Avant de cliquer Deploy**, ajoute les variables d'environnement (voir étape 3)
6. Clique **Deploy**

### Via Vercel CLI (si tu préfères sans GitHub)

```bash
npm install -g vercel
cd gtdhack
vercel
```
Suis les instructions à l'écran. Ajoute les variables d'environnement quand demandé, ou via le dashboard après.

---

## 🔐 Étape 3 : Variables d'environnement (crucial)

Dans le dashboard Vercel de ton projet :
1. **Settings** → **Environment Variables**
2. Ajoute :

| Nom | Valeur |
|-----|--------|
| `NOTION_TOKEN` | Le token copié à l'étape 1 (`secret_...` ou `ntn_...`) |
| `NOTION_DATABASE_ID` | L'ID de ta database (32 caractères) |

3. Clique **Save**
4. **Redéploie** le projet (Deployments → "..." → Redeploy) pour que les variables prennent effet

**Pourquoi ça, et pas dans le code ?** Le token Notion ne doit **jamais** apparaître dans le HTML/JS envoyé au navigateur — n'importe qui pourrait le voir et écrire dans ta database. En le mettant en variable d'environnement Vercel, il reste **uniquement côté serveur**.

---

## ✅ Étape 4 : Tester

1. Ouvre ton lien Vercel (`https://gtdhack-xyz.vercel.app`)
2. Colle une liste de notes, clique **"Structurer"**
3. Tu arrives sur l'écran de **revue** — vérifie/modifie/supprime ce qui ne va pas
4. Clique **"📤 Envoyer à Notion"**
5. Va checker ta database Notion → les tâches doivent apparaître

---

## 🧠 Comment fonctionne la consolidation

Quand tu colles plusieurs notes liées au même sujet (même personne, même événement), l'IA les regroupe automatiquement en **une seule tâche** avec les détails en **sous-éléments**.

**Exemple** — tu colles :
```
Mariage elo - Possible d'avoir 2 pupitres
Ou se trouve le point électrique pour le son ?
Écran avec diffuseur?
```

**Résultat dans l'écran de revue** — une seule carte :
```
Titre: Appeler organisateur mariage Elo
Type: Tâche
Sous-éléments:
  • Vérifier si 2 pupitres possibles
  • Trouver le point électrique pour le son
  • Écran avec diffuseur ?
```

Tu peux ensuite **éditer**, **ajouter** ou **supprimer** des sous-éléments avant d'envoyer.

**Si la consolidation se trompe** (regroupe des choses qui n'ont rien à voir, ou sépare des choses qui devraient être ensemble) : tu corriges directement dans l'écran de revue — supprime la carte et recrée-la, ou ajuste les sous-éléments manuellement.

---

## 🩹 Troubleshooting

**"Configuration manquante: NOTION_TOKEN..."**
→ Les variables d'environnement ne sont pas configurées ou tu n'as pas redéployé après les avoir ajoutées.

**"Erreur Notion inconnue" / 401**
→ Le token est invalide, ou l'intégration n'est pas connectée à la database (voir étape 1, section "Partager").

**"Erreur Notion inconnue" / 404**
→ L'ID de database est incorrect. Revérifie-le dans l'URL Notion.

**Le bouton "Envoyer à Notion" échoue toujours**
→ Ouvre la console du navigateur (F12) pour voir l'erreur exacte, ou regarde les **Logs** de la fonction dans le dashboard Vercel (Deployments → ta fonction → Logs).

**Ça marchait en local mais pas déployé**
→ Les fonctions serverless (`/api/...`) ne fonctionnent QUE une fois déployées sur Vercel (ou en utilisant `vercel dev` en local). Ouvrir juste le fichier `index.html` dans le navigateur sans serveur ne fera pas fonctionner le bouton Notion.

---

## 🔒 Sécurité récapitulative

```
✓ Le token Notion ne quitte jamais le serveur Vercel
✓ Le navigateur ne parle qu'à ta propre fonction /api/create-tasks
✓ Cette fonction seule parle à l'API Notion, avec le token en variable d'env
✓ Tes notes brutes vont à Claude pour structuration (anonyme, non stocké)
✓ Zéro logging, zéro tracking, zéro tiers additionnel
```

---

*GTDHack v3 — Notion integration guide*
