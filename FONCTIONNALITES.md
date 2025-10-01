# Fonctionnalités et Capacités Techniques

Ce document liste les fonctionnalités notables et les capacités techniques intégrées dans le projet.

## Capacités Techniques

### Scraper de Sites Complexes (avec JavaScript)

Le projet intègre la capacité de scraper des sites web qui dépendent fortement du JavaScript pour afficher leur contenu.

- **Outil :** L'intégration se fait via le service externe [ScraperAPI](https://www.scraperapi.com/).
- **Statut :** **En veille.** Le code est présent dans le script de peuplement (`scripts/populatePharmacies.ts`) mais n'est pas actif par défaut.
- **Activation :** Pour utiliser cette fonctionnalité sur un site cible, il faut définir la variable d'environnement suivante dans le fichier `.env.local` :
  ```
  USE_SCRAPER_API=true
  ```
- **Prérequis :** Une clé d'API valide de ScraperAPI doit également être présente dans le fichier `.env.local` :
  ```
  SCRAPER_API_KEY=VOTRE_CLE_API
  ```

Cette fonctionnalité a été mise en place pour tenter de contourner des protections anti-bot, mais peut être réutilisée pour tout site nécessitant un rendu JavaScript complet.
