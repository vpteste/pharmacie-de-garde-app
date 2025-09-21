# Fonctionnalités Futures

Ce document liste les améliorations et nouvelles fonctionnalités potentielles pour les futures versions de l'application.

## Axe 0 : Stratégie et Plateforme (Haute Priorité)

### 0.1. Comptes Utilisateurs et Base de Données
- **Description :** Mettre en place Firebase Authentication (connexion par email/Google) et Firestore (base de données NoSQL).
- **Objectifs :**
    - Transformer l'application d'un simple outil à une plateforme.
    - Permettre la sauvegarde permanente des signalements d'erreurs.
    - Débloquer les fonctionnalités de rétention : pharmacies favorites, historique, préférences.
    - Préparer le terrain pour la monétisation et la personnalisation.

## Axe 1 : Fiabilité et Données

### 1.1. Stockage Permanent des Signalements
- **Description :** Migrer le système de signalement d'erreurs (actuellement un simple log serveur) vers une base de données NoSQL comme Firestore.
- **Objectifs :**
    - Conserver un historique des signalements pour analyse.
    - Identifier les pharmacies les plus fréquemment signalées.
    - Potentiellement, afficher un avertissement sur une pharmacie si elle a été signalée plusieurs fois récemment.

## Axe 2 : Expérience Utilisateur et Interface

### 2.1. Interface Adaptative pour Mobile (Responsive UI)
- **Description :** Adapter l'interface pour les écrans mobiles en utilisant un panneau inférieur (bottom sheet) qui glisse vers le haut, au lieu du panneau latéral actuel, conformément à la maquette initiale.
- **Objectif :** Offrir une expérience utilisateur optimale et native sur mobile.

### 2.2. Squelettes de Chargement (Loading Skeletons)
- **Description :** Remplacer les indicateurs de chargement textuels par des animations de "squelettes" (formes grisées qui imitent le contenu final).
- **Objectif :** Améliorer la perception de vitesse et moderniser l'interface.

## Axe 3 : Espace Professionnel (Backend & Dashboard)

L'interface d'inscription est créée. Pour la rendre fonctionnelle, les étapes suivantes sont nécessaires :

1.  **Intégration Firebase :**
    *   Utiliser **Firebase Authentication** pour créer un compte utilisateur sécurisé lors de la soumission du formulaire d'inscription.
    *   Utiliser **Cloud Firestore** pour sauvegarder les détails de l'établissement (infos, horaires, services) et les lier au compte utilisateur correspondant.

2.  **File de Modération (Admin) :**
    *   Mettre en place un système où les nouvelles inscriptions sont en attente d'approbation par un administrateur avant d'être visibles publiquement. Cela garantit la fiabilité des données.

3.  **Développement du Tableau de Bord Pro :**
    *   Créer une nouvelle section (protégée par connexion) où les pharmaciens peuvent se connecter.
    *   Fonctionnalités du tableau de bord :
        *   Mise à jour des informations de leur établissement.
        *   Gestion et déclaration des périodes de garde.
        *   Consultation de statistiques de base.

## Axe 4 : Fonctionnalités Premium

### 4.1. Intégration de l'API Aerial View
- **Description :** Ajouter un bouton "Vue Aérienne" qui affiche une vidéo cinématique 3D de la pharmacie et de ses environs.
- **Objectifs :**
    - Offrir une expérience "wow" et différenciante.
    - Aider les utilisateurs à reconnaître et s'orienter vers la pharmacie.
    - Idéal comme fonctionnalité pour une future version "premium".