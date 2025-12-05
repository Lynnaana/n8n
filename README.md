# n8n
Projet IA n8n

• Permet de cloner une repository GIT publique à un emplacement local de votre machine (remplacer <url> par le lien de partage).
Si vous êtes l'auteur de cette repository, cela se trouve dans "<> Code" -> "HTTP" -> "copy to clipboard"
  > git clone <url>

• Permet d'afficher la liste de toutes les branches
  # Affichage des branches locales uniquement
  > git branch
  # Affichage des branches locales et publiques
  > git branch --all

• Permet de changer de branche courante (remplacer <branchName> avec le nom d'une branche existante)
  > git switch <branchName>
  # variante pour créer une nouvelle branche (non-existante), puis la définir courante
  > git switch -c <branchName>

• Permet d'afficher le statut de la branche courante vis-à-vis du dernier commit en date (fichiers ajoutés/modifiés/supprimés, fichiers pris en compte pour le prochain commit ou non, etc...)
  > git status

• Permet d'ajouter un fichier en particulier pour le prochain commit (remplacer <file> par le nom du fichier)
  > git add <file>
  # variante pour ajouter tous les fichiers d'un seul coup
  > git add .

• Permet de commit les modifications sur votre branche localement (remplacer <message> par une petite description indiquant les modifications faite depuis le dernier commit)
  > git commit -m <message>

• Permet de push les commits de votre branche locale sur la repository GIT (remote) pour que les autres puisse avoir accès à vos modifications
  > git push

• Permet de mettre à jour la repository GIT (remote) pour voir les nouvelles modifications (= resync avec le dépôt GIT remote)
  > git fetch
  # si vous avez un doute
  > git fetch --all

• Permet de récupérer les modifications du dépôt GIT (remote) sur votre branche locale (/!\ RISQUES DE CONFLITS)
  > git pull
