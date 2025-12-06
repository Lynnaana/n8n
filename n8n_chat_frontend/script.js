// script.js
// Ce fichier contient toute la logique de l’interface : mémorisation
// des conversations, envoi des messages via un webhook n8n, et
// récupération des workflows pour visualisation.

document.addEventListener('DOMContentLoaded', () => {
  // Sélection des éléments du DOM
  const modal = document.getElementById('settings-modal');
  const saveSettingsBtn = document.getElementById('save-settings');
  const n8nUrlInput = document.getElementById('n8n-url-input');
  const webhookPathInput = document.getElementById('webhook-path-input');
  const n8nUrlDisplay = document.getElementById('n8n-url-display');
  const editSettingsBtn = document.getElementById('edit-settings');
  const chatWindow = document.getElementById('chat-window');
  const sendButton = document.getElementById('send-button');
  const userInput = document.getElementById('user-input');
  const fileInput = document.getElementById('file-input');
  const workflowList = document.getElementById('workflow-list');

  // Conversation stockée en local : chaque message est un objet
  let conversation = [];
  try {
    conversation = JSON.parse(localStorage.getItem('conversation')) || [];
  } catch (e) {
    conversation = [];
  }

  // URL de base n8n sauvegardée
  let n8nBaseUrl = localStorage.getItem('n8nBaseUrl') || '';
  // Chemin du webhook sauvegardé (par défaut /webhook/ai-agent)
  let webhookPath = localStorage.getItem('webhookPath') || '/webhook-test/chat';

  function updateStatus() {
    if (n8nBaseUrl) {
      n8nUrlDisplay.textContent = n8nBaseUrl;
    } else {
      n8nUrlDisplay.textContent = 'Non configurée';
    }
  }

  function openModal() {
    // Pré-remplir avec la valeur actuelle ou une valeur par défaut
    n8nUrlInput.value = n8nBaseUrl || 'http://localhost:5678';
    webhookPathInput.value = webhookPath || '/webhook-test/chat';
    modal.classList.remove('hidden');
  }

  function closeModal() {
    modal.classList.add('hidden');
  }

  // Sauvegarde de l’URL n8n définie par l’utilisateur
  saveSettingsBtn.addEventListener('click', () => {
    const url = n8nUrlInput.value.trim();
    const pathValue = webhookPathInput.value.trim();
    if (url) {
      n8nBaseUrl = url;
      localStorage.setItem('n8nBaseUrl', url);
      // Enregistrer le chemin du webhook uniquement s’il commence par '/'
      if (pathValue) {
        webhookPath = pathValue.startsWith('/') ? pathValue : '/' + pathValue;
        localStorage.setItem('webhookPath', webhookPath);
      }
      updateStatus();
      closeModal();
      fetchWorkflows();
    }
  });

  // Ouvrir la fenêtre de configuration à la demande
  editSettingsBtn.addEventListener('click', () => {
    openModal();
  });

  // Au premier chargement, si aucune URL n’est définie, on affiche le modal
  if (!n8nBaseUrl) {
    openModal();
  }
  updateStatus();

  // Rendu des messages existants
  function renderConversation() {
    chatWindow.innerHTML = '';
    conversation.forEach((msg) => {
      const div = document.createElement('div');
      div.classList.add('message', msg.role);
      // On échappe le contenu pour éviter les injections HTML
      div.innerHTML = '<div>' + escapeHtml(msg.content).replace(/\n/g, '<br>') + '</div>';
      if (msg.files && msg.files.length) {
        const att = document.createElement('div');
        att.classList.add('file-attachments');
        att.textContent = 'Pièces jointes : ' + msg.files.map((f) => f.name).join(', ');
        div.appendChild(att);
      }
      chatWindow.appendChild(div);
    });
    // Scroll au bas de la conversation
    chatWindow.scrollTop = chatWindow.scrollHeight;
  }

  // Fonction utilitaire pour échapper le HTML dans les messages
  function escapeHtml(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  }

  renderConversation();

  // Gestion de l’envoi des messages
  sendButton.addEventListener('click', () => {
    sendMessage();
  });
  // Possibilité d’envoyer avec Enter (sans Shift)
  userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  async function sendMessage() {
    const text = userInput.value.trim();
    const selectedFiles = fileInput.files;
    if (!text && selectedFiles.length === 0) return;
    // Enregistrer le message utilisateur
    const userMsg = { role: 'user', content: text, files: [] };
    if (selectedFiles.length) {
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        userMsg.files.push({ name: file.name, size: file.size });
      }
    }
    conversation.push(userMsg);
    renderConversation();
    userInput.value = '';
    fileInput.value = '';
    localStorage.setItem('conversation', JSON.stringify(conversation));
    // Ajouter un indicateur de frappe
    const typingMsg = { role: 'bot', content: '...', files: [] };
    conversation.push(typingMsg);
    renderConversation();
    try {
      const responseText = await callN8n(text, selectedFiles);
      // Remplacer l’indicateur par la vraie réponse
      conversation.pop();
      conversation.push({ role: 'bot', content: responseText, files: [] });
      renderConversation();
      localStorage.setItem('conversation', JSON.stringify(conversation));
      // Rafraîchir la liste des workflows
      fetchWorkflows();
    } catch (e) {
      conversation.pop();
      conversation.push({ role: 'bot', content: 'Erreur : ' + e.message, files: [] });
      renderConversation();
    }
  }

  // Appelle le webhook n8n : message + éventuels fichiers
  async function callN8n(message, files) {
    if (!n8nBaseUrl) {
      throw new Error('URL n8n non configurée');
    }
    // On construit l’URL du webhook. Ce chemin doit correspondre au nœud Webhook de votre workflow n8n.
    const url = n8nBaseUrl.replace(/\/$/, '') + webhookPath;
    // S’il y a des fichiers, on utilise FormData
    if (files && files.length) {
      const formData = new FormData();
      formData.append('message', message);
      for (let i = 0; i < files.length; i++) {
        formData.append('files', files[i], files[i].name);
      }
      const resp = await fetch(url, { method: 'POST', body: formData });
      if (!resp.ok) {
        throw new Error(resp.status + ' ' + resp.statusText);
      }
      // On suppose que le webhook renvoie du texte ou JSON
      const contentType = resp.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await resp.json();
        return JSON.stringify(data, null, 2);
      } else {
        return await resp.text();
      }
    } else {
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });
      if (!resp.ok) {
        throw new Error(resp.status + ' ' + resp.statusText);
      }
      const contentType = resp.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await resp.json();
        return JSON.stringify(data, null, 2);
      } else {
        return await resp.text();
      }
    }
  }

  // Récupère la liste des workflows via l’API interne n8n
  async function fetchWorkflows() {
    if (!n8nBaseUrl) return;
    const apiUrl = n8nBaseUrl.replace(/\/$/, '') + '/api/v1/workflows';
    try {
      const resp = await fetch(apiUrl);
      if (!resp.ok) throw new Error(resp.status + ' ' + resp.statusText);
      const json = await resp.json();
      renderWorkflows(json);
    } catch (e) {
      workflowList.innerHTML = '<p style="color: red;">Impossible de récupérer les workflows : ' + escapeHtml(e.message) + '</p>';
    }
  }

  // Affiche la liste des workflows dans la section latérale
  function renderWorkflows(data) {
    if (!data || (Array.isArray(data) && data.length === 0)) {
      workflowList.innerHTML = '<p>Aucun workflow trouvé.</p>';
      return;
    }
    // Si le serveur renvoie un objet contenant un tableau
    const workflows = Array.isArray(data) ? data : data.data || data.workflows || [];
    workflowList.innerHTML = '';
    workflows.forEach((wf) => {
      const div = document.createElement('div');
      div.classList.add('workflow-item');
      const title = document.createElement('h3');
      title.textContent = wf.name || 'Workflow sans nom';
      div.appendChild(title);
      const meta = document.createElement('div');
      meta.classList.add('meta');
      meta.textContent = 'ID : ' + wf.id + (wf.active ? ' (actif)' : ' (inactif)');
      div.appendChild(meta);
      workflowList.appendChild(div);
    });
  }

  // Mise à jour initiale de la liste des workflows
  fetchWorkflows();
});