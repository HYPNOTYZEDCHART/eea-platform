# 🎓 Étudiant Entrepreneuriat Afrique (EEA)
### *Plateforme Numérique Officielle & Réseau Panafricain d'Incubation*

[![Next.js](https://img.shields.io/badge/Next.js-16.3-black?style=flat&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue?style=flat&logo=react)](https://react.dev/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind-v4-38bdf8?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-3ecf8e?style=flat&logo=supabase)](https://supabase.com/)
[![Certification](https://img.shields.io/badge/Certification-Officielle_EEA-D4AF37?style=flat)](#histoire--genèse)

---

## 🏛️ Histoire & Genèse : *2008 — 2026*

> **« Une vision forgée en 2008, un démarrage opérationnel historique en 2026. »**

L’initiative **Étudiant Entrepreneuriat Afrique (EEA)** a vu le jour en **2008** sur les marches de la prestigieuse **Bibliothèque Centrale de l’Université Cheikh Anta Diop (UCAD)** à Dakar (Sénégal), portée par une communauté d'étudiants pionniers convaincus que la souveraineté de l'Afrique passera par l'entrepreneuriat des jeunes diplômés.

Après des années de maturation, de structuration institutionnelle et de reconnaissance auprès des autorités publiques, l'organisation **démarre officiellement ses activités opérationnelles et son grand déploiement panafricain en 2026** avec le lancement de cette plateforme numérique moderne, unifiant les étudiants du continent et de la diaspora autour de deux piliers majeurs :
1. **L’Agro-business moderne & la souveraineté alimentaire**
2. **Les Nouvelles Technologies, le Numérique et l’Intelligence Artificielle**

---

## ⚡ Fonctionnalités Clés de la Plateforme

- **Tunnel d'Adhésion Structuré :** Inscription en 4 étapes simples avec capture directe par webcam (HTML5 MediaStream) ou import de fichier, recadrage photo intégré (Canvas 4x4) et options de paiement (Wave, Orange Money, Carte Bancaire, Transfert Assisté).
- **Génération Automatique de Matricule Infalsifiable :** Attribution instantanée d'un identifiant normalisé unique (ex : `EEA-2026-SN-2693`) combiné à un jeton cryptographique (`qr_code_token`).
- **Cartes Officielles de Membre en Format PDF (.pdf) & PNG HD :** Export haute résolution au standard international CR80 (format carte plastique portefeuille 85.6 mm × 54 mm) généré dynamiquement via `jspdf` et intégrant le sceau officiel, la photo de l'étudiant et le QR Code de validation.
- **Portail de Vérification Publique (`/verify/[token]`) :** Scan en temps réel du QR Code par les universités, banques partenaires, incubateurs et ambassades confirmant instantanément l'authenticité de l'adhérent sans divulguer de données privées.
- **Tableau de Bord Administrateur (`/admin`) :** Back-office sécurisé permettant de visualiser les membres, exporter la liste officielle en CSV, générer/télécharger les badges PDF et transmettre directement les cartes par email.
- **Design Institutionnel & Académique :** Palette prestigieuse Bleu Nuit Impérial (`#060d1d`, `#0F224A`) et Or Académique (`#D4AF37`), typographie soignée et défilement fluide Lenis. **Aucun néon ni esthétique cyberpunk.**

---

## 🛡️ Architecture de Sécurité & Conformité GitHub

Ce projet a été conçu selon les standards de sécurité les plus stricts pour être déployé en production et partagé sur GitHub en toute sérénité :

| Pilier de Sécurité | Implémentation |
| :--- | :--- |
| **Authentification Zero-Trust** | L'accès admin est protégé par une route serveur `/api/admin/auth` avec validation en temps constant du code `ADMIN_SECRET_PIN` et cookie sécurisé signé `httpOnly` / `sameSite=strict`. Aucun secret n'est exposé côté client. |
| **En-têtes HTTP de Protection** | Configuration dans `next.config.ts` incluant `X-Frame-Options: DENY` (anti-clickjacking), `X-Content-Type-Options: nosniff` (anti-MIME sniffing), `Strict-Transport-Security` et `Permissions-Policy` stricte. |
| **Protection Anti-Injection CSV** | L'export Excel/CSV neutralise automatiquement les tentatives de *Formula Injection* (OWASP CSV Injection) en échappant les caractères déclencheurs (`=`, `+`, `-`, `@`). |
| **Sanitisation des Paramètres** | La route `/verify/[token]` valide rigoureusement le format du jeton par expression régulière stricte avant toute requête en base de données. |
| **Row Level Security (RLS) Supabase** | Politiques SQL et fonction RPC `get_verified_badge(token)` interdisant le scraping public de la table des membres. |
| **Isolation des Secrets Git** | Le fichier `.gitignore` bloque rigoureusement tout fichier `.env`, `.env.local` et clés privées. Seul le modèle `.env.local.example` est public. |

---

## 🚀 Installation & Démarrage Local

### Prérequis
- [Node.js](https://nodejs.org/) (version 18+ ou 20+ recommandée)
- `npm`, `yarn` ou `pnpm`

### 1. Cloner le Dépôt
```bash
git clone https://github.com/votre-compte/eea-platform.git
cd eea-platform
```

### 2. Installer les Dépendances
```bash
npm install
```

### 3. Configurer l'Environnement
Dupliquez le fichier d'exemple pour créer votre fichier local :
```bash
cp .env.local.example .env.local
```

Renseignez vos variables dans `.env.local` :
```env
# Supabase (optionnel en mode local hybride)
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre-cle-anonyme
SUPABASE_SERVICE_ROLE_KEY=votre-cle-service-role

# Code PIN de l'espace administrateur
ADMIN_SECRET_PIN=2008

# URL et Contact
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_WHATSAPP_NUMBER=221785425345
```

### 4. Lancer le Serveur de Développement
```bash
npm run dev
```
Accédez à l'application sur [http://localhost:3000](http://localhost:3000).

---

## 🗄️ Initialisation de la Base Supabase (Optionnel)

Si vous souhaitez connecter une base de données cloud Supabase :
1. Créez un projet sur [supabase.com](https://supabase.com).
2. Ouvrez l'éditeur SQL de votre projet (**SQL Editor**).
3. Copiez et exécutez le script sécurisé complet fourni dans [`supabase/schema.sql`](./supabase/schema.sql).
4. Renseignez vos identifiants dans `.env.local`.

*Note : L'application fonctionne également de manière autonome en mode hybride local avec persistance `localStorage` pour les tests sans base cloud.*

---

## 📂 Structure du Répertoire

```text
eea-platform/
├── public/                     # Ressources statiques (logo officiel, visuel UCAD)
├── src/
│   ├── app/
│   │   ├── admin/page.tsx      # Tableau de bord d'administration certifié
│   │   ├── api/admin/auth/     # Route API d'authentification serveur (cookies httpOnly)
│   │   ├── verify/[token]/     # Portail officiel de vérification publique des badges
│   │   ├── layout.tsx          # Layout institutionnel avec Lenis SmoothScroll
│   │   └── page.tsx            # Landing page principale (Hero, Piliers, FAQ, etc.)
│   ├── components/
│   │   ├── Navbar.tsx          # Navigation institutionnelle avec sceau officiel
│   │   ├── HeroSection.tsx     # En-tête avec visuel historique de l'UCAD Dakar
│   │   ├── HistorySection.tsx  # Timeline 2008 - 2026 & Berceau UCAD
│   │   ├── RegistrationTunnel  # Tunnel d'inscription, webcam et paiement 3 000 FCFA
│   │   ├── MemberCardBadge.tsx # Moteur de génération des cartes (Canvas, PNG HD, jsPDF)
│   │   └── Footer.tsx          # Certification Officielle & coordonnées UCAD
│   └── lib/
│       └── supabase.ts         # Client Supabase typé et gestion des types TypeScript
├── supabase/
│   └── schema.sql              # Schéma PostgreSQL officiel, RLS et fonctions RPC
├── next.config.ts              # Headers HTTP de sécurité avancés (anti-clickjacking)
└── README.md                   # Documentation officielle du projet
```

---

## 📜 Mentions Légales & Droits

- **Organisation :** Étudiant Entrepreneuriat Afrique (EEA)
- **Fondation :** Idée et initiative nées en 2008 à l'Université Cheikh Anta Diop (UCAD) de Dakar, Sénégal.
- **Lancement Opérationnel :** Déploiement officiel et entrée en activité en 2026.
- **Certification :** Organisation certifiée avec registre officiel des membres.
- **Tous droits réservés © 2008 — 2026.**
