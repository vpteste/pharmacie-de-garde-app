# CAHIER DES CHARGES - Pharmacie de Garde

---
*Note pour l'IA : Ce document est la source de vérité pour le projet. Avant chaque session, charger ce document et la directive d'agir en tant qu'expert Code & UI/UX.* 
---

## Titre du Projet : Pharmacies de Garde – Côte d'Ivoire (et International)

### 1. Objectif Principal :
Développer une application web universelle et performante permettant de localiser instantanément les pharmacies de garde les plus proches. L'application vise à fournir une solution rapide, fiable et agréable à utiliser.

### 2. Public Cible :
- Résidents de Côte d'Ivoire
- Voyageurs et touristes
- Toute personne ayant un besoin urgent de trouver une pharmacie ouverte.

### 3. Fonctionnalités Clés et Flux Utilisateur :

- **Page d'Atterrissage (Écran d'Accueil) :**
  - Expérience immersive avec une esthétique "pharmacie" (thème de couleurs vert apaisant).
  - Logo de l'application mis en avant.
  - Un unique et gros bouton d'action central : **"Trouver une pharmacie de garde"**.
  - Slogan : "Votre santé, notre priorité, partout, tout le temps."
  - En cliquant sur le bouton, l'utilisateur est redirigé vers la page de la carte (`/pharmacies`).

- **Navigation Principale :**
  - La barre de navigation principale est visible sur toutes les pages *internes* de l'application, mais **absente** de la page d'atterrissage.
  - Liens : **Accueil** (revient à la page d'atterrissage), **Pharmacies**, **Rendez-vous**, **Médicaments**, et **Espace Pro** (lien dynamique).

- **Page Pharmacies (La Carte) :**
  - Demande de permission pour la géolocalisation au chargement.
  - Affiche les pharmacies sur une carte interactive et dans une liste triée par distance.
  - Informations par pharmacie : Nom, adresse, distance, statut de garde, téléphone (cliquable), bouton "Itinéraire" (ouvre Google/Apple Maps/Waze).

- **Espace Professionnel :**
  - Inscription et Connexion pour les pharmaciens.
  - Tableau de bord pour gérer les informations, notamment le calendrier des gardes.
  - Routes protégées : l'accès au dashboard nécessite d'être connecté.

### 4. Technologies Utilisées (pour la version Web) :

- **Développement Front-end :** Next.js / React (TypeScript).
- **Base de données / Back-end :** Firebase (Authentication, Firestore).
- **API de Localisation et Recherche :** Google Places API (New).
- **Styling :** React-Bootstrap & CSS personnalisé.

### 5. Design et Expérience Utilisateur (UX/UI) :

- **Interface Intuitive :** Design épuré, navigation simple, minimum de clics.
- **Identité Visuelle :**
    - **Chargement :** Utilisation d'un logo de pharmacie (croix verte) comme indicateur de chargement animé pour toute l'application (`SplashScreen`).
    - **Charte Graphique :** Thème de couleurs dominé par le vert, icônes claires et reconnaissables.
- **Performance :** Lancement instantané, chargement rapide des données et de la carte.
- **Mode Nuit :** Thème sombre pour le confort visuel.
- **Accessibilité :** Contraste des couleurs, polices lisibles.

### 6. Fonctionnalités Futures / Considérations :

- **Recherche Manuelle & Filtres Avancés.**
- **Fiabilité des Données :** Système de signalement d'erreur par les utilisateurs.
- **Monétisation :** Abonnements Premium (via RevenueCat ou équivalent), publicités non-intrusives.
- **Notifications Push.**
- **Support Multilingue.**

### 7. Vision à Long Terme :
Devenir l'application de référence pour la recherche de pharmacies de garde, en Côte d'Ivoire et pour les voyageurs internationaux.