<p align="center">
    <a href="https://git.io/typing-svg">
        <img src="https://readme-typing-svg.demolab.com?font=Rubik+Medium&size=30&duration=1609&pause=3000&color=9F9F9F&width=140&lines=Narza_ay" alt="Typing SVG" />
    </a>
</p>

<div align="center"> <img src="https://img.shields.io/badge/Built%20with%20-JDA%20&%20LavaPlayer-0078D6?style=for-the-badge" alt="Libraries"> <img src="https://img.shields.io/badge/Language-Java-ED8B00?style=for-the-badge" alt="Java"> <img src="https://img.shields.io/badge/Platform-Discord-7289DA?style=for-the-badge" alt="Platform"> </div>

-----

# 🔮 Meagan Client API Gateway

Bienvenue sur le **Meagan Client API Gateway** \! Ce projet sert de point d'entrée central pour tous les services API destinés à Meagan Client. Il offre un routage dynamique, une gestion robuste des erreurs et une puissante interface en ligne de commande (CLI) pour une administration simplifiée des services.

-----

## ✨ Fonctionnalités Clés

  * **Chargement Dynamique des Services** : La passerelle découvre et enregistre automatiquement les services API situés dans le répertoire `services`. Plus besoin de configuration manuelle à chaque ajout de nouveau service \!
  * **Routage API Centralisé** : Elle redirige intelligemment les requêtes vers les microservices backend appropriés, assurant une communication fluide entre les clients et vos services.
  * **Interface en Ligne de Commande (CLI)** : Gérez et surveillez vos services directement depuis la console de la passerelle grâce à une interface interactive et conviviale.
  * **Vérifications de Santé (Health Checks)** : La passerelle surveille périodiquement le statut de tous les services enregistrés, mettant à jour leur disponibilité en temps réel.
  * **Support WebSocket** : Elle prend entièrement en charge les connexions WebSocket, ce qui est parfait pour les services en temps réel comme les jeux ou les applications de chat.
  * **Configuration par Variables d'Environnement** : Configurez facilement les ports et les URLs des services à l'aide d'un simple fichier `.env`.

-----

bientot

## 🕹️ Commandes CLI

Une fois la passerelle en cours d'exécution, vous pouvez interagir avec elle directement dans votre console en utilisant les commandes suivantes :

  * **`start all`** : Lance tous les services découverts qui ne sont pas déjà en cours d'exécution.
  * **`start <nomService>`** : Démarre un service spécifique (ex: `start auth`).
  * **`stop <nomService>`** : Arrête un service spécifique en cours d'exécution (ex: `stop economy`).
  * **`list services`** : Affiche une liste détaillée de tous les services découverts et leur statut actuel (en ligne, hors ligne, démarrage, erreur).
  * **`find <requête>`** : (Espace réservé) Conçue pour rechercher des utilisateurs ou des données au sein de vos services. Nécessite une implémentation backend dans vos services.
  * **`set role <rôle> <userId>`** : (Espace réservé) Attribue un rôle à un utilisateur spécifique. Nécessite une implémentation backend.
  * **`remove role <rôle> <userId>`** : (Espace réservé) Retire un rôle à un utilisateur spécifique. Nécessite une implémentation backend.
  * **`list roles`** : (Espace réservé) Liste tous les rôles disponibles ou les rôles pour un utilisateur spécifique. Nécessite une implémentation backend.
  * **`time`** : Affiche l'heure actuelle du serveur.
  * **`ping`** : Renvoie le temps de réponse du serveur.
  * **`help`** : Affiche une liste de toutes les commandes disponibles et leurs descriptions.
  * **`exit`** : Arrête l'API Gateway.

-----

## 🤝 Contribution

Les contributions sont les bienvenues \! Si vous avez des suggestions d'améliorations ou de nouvelles fonctionnalités, n'hésitez pas à ouvrir une issue ou à soumettre une pull request.

-----

## 📄 Licence

Ce projet est sous licence MIT. Veuillez consulter le fichier `LICENSE` (si vous en créez un) pour plus de détails.

-----
