# Interface web d’agent IA connecté à n8n

Ce projet fournit une interface web légère qui reproduit l’expérience de type ChatGPT : conversation persistante avec une IA, ergonomie travaillée, ajout de fichiers et intégration étroite avec une instance auto‑hébergée de n8n.

## Fonctionnalités principales

- **Conversation contextuelle** : les messages sont stockés localement (dans le stockage du navigateur) afin de préserver l’historique lorsque la page est rechargée.
- **Ajout de fichiers** : joignez un ou plusieurs fichiers à vos messages. Les pièces jointes sont envoyées au webhook n8n sous forme de formulaire `multipart/form-data`.
- **Design inspiré de ChatGPT** : l’interface reprend un agencement clair avec des bulles de texte, une section de saisie et une zone latérale.
- **Connexion à n8n configurable** : à la première utilisation, l’interface demande l’URL de votre instance n8n (par exemple `http://localhost:5678`). Ce paramètre est mémorisé et peut être modifié à tout moment.
- **Visualisation en direct des workflows** : après chaque interaction, la liste des workflows disponibles dans n8n est récupérée via l’API interne (`/api/v1/workflows`) et affichée dans la barre latérale. Cela permet de voir immédiatement les créations ou modifications déclenchées par l’IA.

## Prérequis

Cette interface est 100 % client : aucun serveur n’est nécessaire pour l’exécuter. Assurez‑vous simplement :

- d’avoir un navigateur moderne (Chrome, Firefox, Edge, etc.) ;
- d’avoir une instance de [n8n](https://n8n.io/) accessible depuis le poste local. Dans un contexte de développement, cela correspond généralement à `http://localhost:5678`.

## Installation et lancement

1. Téléchargez ou clonez ce dossier (`n8n_chat_frontend`) dans un répertoire de votre choix.
2. Servez ces fichiers via un serveur local (par exemple avec l’extension **Live Server** de VS Code) afin d’éviter les restrictions du protocole `file://`. Ouvrez ensuite `index.html` depuis l’URL fournie par le serveur (ex : `http://127.0.0.1:5500/index.html`).
3. Lors du premier chargement, une fenêtre de configuration apparaîtra. Indiquez l’URL de base de votre instance n8n (par ex. `http://localhost:5678`) **ainsi que le chemin exact de votre webhook** (par ex. `/webhook/chat`), puis cliquez sur **Enregistrer**.
4. Vous pouvez maintenant converser avec l’IA. Chaque message sera envoyé au chemin que vous avez indiqué et la réponse sera affichée dans l’interface. La liste des workflows se mettra à jour automatiquement dans la partie droite (si votre instance le permet).

## Adaptation du workflow n8n

Pour que cette interface fonctionne, vous devez créer dans n8n un workflow comportant :

1. **Un nœud Webhook** configuré en `POST`, avec un chemin unique (par exemple `/ai-agent`).
2. **Un nœud “AI Agent”** (ou toute logique métier souhaitée) qui prendra en entrée le message (`message`) et les fichiers (`files`). Ce nœud devra générer la réponse du chatbot et éventuellement interagir avec l’API interne de n8n pour créer/modifier des workflows.
3. **Un nœud “Respond to Webhook”** afin de retourner la réponse textuelle à l’interface.

Le schéma de base peut ressembler à ceci :

```
Webhook (POST /ai-agent) ──▶ AI Agent ──▶ Respond to Webhook
                            ▲
                            └─ (logic métiers sur n8n)
```

Si l’IA crée ou modifie des workflows via les nœuds internes (HTTP Request vers `/api/v1/workflows`), ces changements seront visibles en direct dans l’interface côté client grâce à la mise à jour automatique de la liste.

## Personnalisation

- **Chemin du webhook** : par défaut, le script envoie les messages à l’URL `/webhook/ai-agent` de votre instance. Si votre workflow utilise un autre chemin, modifiez la constante correspondante dans le fichier `script.js` (`const url = …`).
- **Affichage des workflows** : le rendu actuel affiche simplement le nom, l’ID et l’état (actif/inactif). Vous pouvez enrichir cette vue en récupérant des informations supplémentaires depuis l’API n8n (par exemple `createdAt`, `updatedAt`, etc.).
- **Intégration avec un modèle de langage** : l’interface ne réalise pas de génération elle‑même. Elle relaie le message au webhook. C’est dans n8n que se trouve la logique d’appel à un modèle (OpenAI, Hugging Face, etc.) via un nœud “AI Agent” ou un nœud HTTP personnalisé.

## Dépannage

- **Le chat reste bloqué sur “…”** : vérifiez dans n8n que le workflow lié au webhook répond correctement et qu’il renvoie bien une réponse dans le nœud “Respond to Webhook”.
- **La liste des workflows n’affiche rien** : assurez‑vous que votre instance n8n est accessible sans authentification sur le port spécifié et que l’endpoint `/api/v1/workflows` répond. Dans un environnement sécurisé, vous devrez peut‑être configurer l’authentification ou ajuster les appels dans `script.js`.

## Execution dans Visual Studio Code

Pour exécuter ce projet via Visual Studio Code :

1. Installez [Visual Studio Code](https://code.visualstudio.com/).
2. Ouvrez le dossier `n8n_chat_frontend` dans Visual Studio Code (`Fichier → Ouvrir un dossier…`).
3. Lancez une prévisualisation Live Server (extension “Live Server” recommandée) ou utilisez le raccourci `Ctrl+Shift+P` → “Open with Live Server”.
4. L’interface s’ouvrira dans un onglet de votre navigateur par défaut. Vous pouvez y entrer l’URL n8n et commencer à tester.

---

Cette interface constitue un point de départ simple pour intégrer une expérience chat IA avec n8n. N’hésitez pas à l’étendre, à personnaliser son style et à enrichir la logique n8n pour répondre à vos besoins !