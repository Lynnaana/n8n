
# Installation de n8n en local (Windows & WSL)

Ce guide explique comment installer et lancer **n8n** en local sur :

- **Windows (PowerShell / CMD) – recommandé**
- **WSL (Ubuntu)** si tu préfères le terminal Linux

---

## 1. Prérequis

- Windows 10 ou 11
- Navigateur web (Chrome / Edge / Firefox…)
- Droits pour installer des logiciels

---

## 2. Installation sur Windows (PowerShell / CMD) – RECOMMANDÉ

### 2.1 Installer Node.js

1. Va sur : https://nodejs.org  
2. Télécharge la version **LTS (Recommended)** pour Windows.
3. Installe en laissant les options par défaut.
4. Ouvre **PowerShell** ou **Invite de commandes** et vérifie :

   ```bash
   node -v
   npm -v
   ```

   Si des versions s’affichent, c’est bon.

---

### 2.2 Installer n8n globalement

Dans **PowerShell** ou **CMD** :

```bash
npm install -g n8n
```

À la fin de l’installation, lance :

```bash
n8n
```

Puis ouvre ton navigateur sur :

```text
http://localhost:5678
```

> Pour arrêter n8n : `Ctrl + C` dans le terminal.

---

## 3. Utilisation dans WSL (Ubuntu) – si tu préfères Linux

Si tu travailles dans **WSL** et que tu as installé n8n **localement dans un projet** (comme dans ton dossier `installation n8n`), tu peux le lancer avec **npx**.

### 3.1 Depuis un projet avec n8n installé localement

1. Va dans ton dossier de projet

2. Lance n8n avec :

   ```bash
   npx n8n
   ```

3. Ouvre le navigateur sur :

   ```text
   http://localhost:5678
   ```

Garde le terminal WSL ouvert pendant que tu utilises n8n.

---

### 3.2 Installer n8n globalement dans WSL (optionnel)

Si tu veux pouvoir taper `n8n` directement dans WSL :

1. Installer Node.js dans WSL (si ce n’est pas déjà fait) :

   ```bash
   sudo apt update
   sudo apt install -y nodejs npm
   ```

2. Installer n8n globalement :

   ```bash
   sudo npm install -g n8n
   ```

3. Lancer :

   ```bash
   n8n
   ```

Puis, comme toujours :

```text
http://localhost:5678
```

---

## 4. Dépannage rapide

### 4.1 `Command 'n8n' not found`

- **Solution 1 (projet local)** : utiliser `npx n8n` *dans le dossier du projet*.
- **Solution 2 (installation globale)** :  
  - Sous Windows → `npm install -g n8n` dans PowerShell  
  - Sous WSL → `sudo npm install -g n8n`

### 4.2 Beaucoup de `npm warn` pendant l’installation

- Ce sont des **warnings de dépendances** (versions différentes, paquets dépréciés).
- Tant que tu vois un message du style `added XXXX packages` et **pas d’erreur `ERR!` bloquante**, l’installation est OK pour un usage perso.

---

## 5. Résumé ultra-court

- **Windows (simple)**  
  ```bash
  npm install -g n8n
  n8n
  # puis aller sur http://localhost:5678
  ```

- **WSL avec installation locale**  
  ```bash
  cd /chemin/vers/ton/projet
  npx n8n
  # puis http://localhost:5678
  ```
