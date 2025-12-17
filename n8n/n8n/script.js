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
  // NOUVEAU : éléments pour la liste des conversations
  const conversationList = document.getElementById('conversation-list');
  const newChatBtn = document.getElementById('new-chat-btn');
  // MICRO 
  const micButton = document.getElementById('mic-button');
  const micLangSelect = document.getElementById('mic-lang');
  // WORKFLOWS 
  const N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyNGY4OGQzZS1kZDdhLTRiMDgtOGEyYy01NWFjYjNhZjc3YzUiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzY1MTkwMTkzLCJleHAiOjE3Njc3NjIwMDB9.0duNGn6XiCnE2Qohy2cGydDNpH5CqTAzuIqHWaEvsVY'; // ⚠️ à ne pas commit si c'était en prod

  const sidebar = document.getElementById('sidebar');
  const toggleButton = document.getElementById('toggle-sidebar-btn');
  const modalContent = document.querySelector('.modal-content');
  toggleButton.addEventListener('click', () => {
    sidebar.classList.toggle('hidden');
    conversationList.classList.toggle('hidden');
    modalContent.classList.toggle('hidden');
  });

  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition || null;

  let recognition = null;
  if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.lang = 'en-US';       // langue de dictée
    recognition.continuous = false;   // un seul message à la fois
    recognition.interimResults = false;
  }

    // Langue micro : valeur mémorisée ou défaut
    const savedMicLang = localStorage.getItem('micLang') || 'en-US';
    recognition.lang = savedMicLang;

    if (micLangSelect) {
      micLangSelect.value = savedMicLang;
      micLangSelect.addEventListener('change', () => {
        const lang = micLangSelect.value;
        localStorage.setItem('micLang', lang);
        recognition.lang = lang;
      });
    }

  // Conversation stockée en local : chaque message est un objet
  // --- Gestion multi-conversations (style ChatGPT) ---

  const STORAGE_KEY = 'conversations_v1';

  // Liste de toutes les conversations
  // Liste de toutes les conversations
  let conversations = [];

  // Id de la conversation courante
  let currentConversationId = null;
  // Alias pratique : messages de la conversation courante
  let conversation = [];

  function getCurrentConversation() {
    return conversations.find(c => c.id === currentConversationId) || null;
  }
  
  function saveConversations() {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        currentConversationId,
        conversations,
      }),
    );
  }

  function loadConversations() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        conversations = parsed.conversations || [];
        currentConversationId =
          parsed.currentConversationId ||
          (conversations[0] && conversations[0].id) ||
          null;
      } catch (e) {
        conversations = [];
        currentConversationId = null;
      }
    } else {
      // Rétrocompatibilité : ancien format avec une seule "conversation"
      let legacy = [];
      try {
        legacy = JSON.parse(localStorage.getItem('conversation')) || [];
      } catch (e) {
        legacy = [];
      }
      const id = 'conv-' + Date.now();
      const conv = {
        id,
        title: 'Conversation',
        createdAt: new Date().toISOString(),
        messages: legacy,
      };
      conversations = [conv];
      currentConversationId = id;
      saveConversations();
    }

    const current = getCurrentConversation();
    conversation = current ? current.messages : [];
  }

  function renderConversationList() {
    if (!conversationList) return;
    conversationList.innerHTML = '';
    conversations.forEach((conv) => {
      const li = document.createElement('li');
      li.classList.add('conversation-item');
      if (conv.id === currentConversationId) {
        li.classList.add('active');
      }
      li.textContent = conv.title || 'Sans titre';
      li.addEventListener('click', () => {
        setCurrentConversation(conv.id);
      });
      conversationList.appendChild(li);
    });
  }

  function setCurrentConversation(id) {
    const conv = conversations.find((c) => c.id === id);
    if (!conv) return;
    currentConversationId = id;
    conversation = conv.messages;
    saveConversations();
    renderConversation();
    renderConversationList();
  }

  function createNewConversation(title = 'Nouvelle conversation') {
    const id = 'conv-' + Date.now();
    const conv = {
      id,
      title,
      createdAt: new Date().toISOString(),
      messages: [],
    };
    conversations.unshift(conv); // en haut de la liste
    currentConversationId = id;
    conversation = conv.messages;
    saveConversations();
    renderConversation();
    renderConversationList();
  }

  // Chargement des conversations au démarrage
  loadConversations();

  // Bouton + nouvelle conversation
  if (newChatBtn) {
    newChatBtn.addEventListener('click', () => {
      createNewConversation();
    });
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
  renderConversationList();


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

    // --- Gestion du bouton micro avec reconnaissance vocale ---
  if (micButton) {
    if (!recognition) {
      // API non supportée (ex: certains navigateurs)
      micButton.disabled = true;
      micButton.title = "La reconnaissance vocale n'est pas supportée sur ce navigateur.";
    } else {
      micButton.addEventListener('click', () => {
        // Si on est déjà en "enregistrement" : on stoppe
        if (micButton.classList.contains('recording')) {
          recognition.stop();
          return;
        }

        // On démarre l’écoute
        recognition.start();
        micButton.classList.add('recording');
        micButton.textContent = 'Mic';
      });

      recognition.addEventListener('result', (event) => {
        const transcript = Array.from(event.results)
          .map(r => r[0].transcript)
          .join(' ')
          .trim();

        if (!transcript) return;

        // On met le texte reconnu dans la zone de saisie
        userInput.value = transcript;

        // On envoie automatiquement le message
        sendMessage();
      });

      recognition.addEventListener('end', () => {
        micButton.classList.remove('recording');
        micButton.textContent = 'Mic';
      });

      recognition.addEventListener('error', (event) => {
        console.error('Erreur reconnaissance vocale :', event.error);
        micButton.classList.remove('recording');
        micButton.textContent = 'Mic';
      });
    }
  }

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

    // Mettre à jour le titre de la conversation (premier message = titre)
    const current = getCurrentConversation();
    if (current && (!current.title || current.title === 'Nouvelle conversation')) {
      current.title = text.slice(0, 30) || 'Nouvelle conversation';
    }

    renderConversation();
    renderConversationList();
    userInput.value = '';
    fileInput.value = '';

    // Sauvegarder toutes les conversations (new format)
    saveConversations();

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
      saveConversations();
      // Rafraîchir la liste des workflows
      fetchWorkflows();
    } catch (e) {
      conversation.pop();
      conversation.push({ role: 'bot', content: 'Erreur : ' + e.message, files: [] });
      renderConversation();
      saveConversations();
    }
  }

  // Appelle le webhook n8n : message + éventuels fichiers
async function callN8n(message, files) {
  if (!n8nBaseUrl) {
    throw new Error('URL n8n non configurée');
  }

  const url = n8nBaseUrl.replace(/\/$/, '') + webhookPath;
  const hasFiles = files && files.length;

  let resp;

  if (hasFiles) {
    // Envoi avec fichiers (FormData)
    const formData = new FormData();
    formData.append('message', message || '');
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i], files[i].name);
    }
    resp = await fetch(url, { method: 'POST', body: formData });
  } else {
    // Envoi classique JSON
    resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    });
  }

  if (!resp.ok) {
    throw new Error(resp.status + ' ' + resp.statusText);
  }

  const contentType = resp.headers.get('content-type') || '';
  const text = await resp.text(); // on lit toujours en texte

  // Si n8n renvoie carrément rien
  if (!text) {
    return '[Réponse vide de n8n]';
  }

  // Si n8n prétend renvoyer du JSON
  if (contentType.includes('application/json')) {
    try {
      const data = JSON.parse(text);
      // Si le JSON est juste une string
      if (typeof data === 'string') return data;
      // Si tu as une clé message
      if (data && typeof data.message === 'string') return data.message;
      // sinon on prettify
      return JSON.stringify(data, null, 2);
    } catch (e) {
      // JSON cassé → on renvoie le texte brut
      return text;
    }
  }

  // Réponse texte classique
  return text;
}

async function fetchWorkflows() {
    if (!n8nBaseUrl) return;
    const apiUrl = n8nBaseUrl.replace(/\/$/, '') + '/api/v1/workflows';
    try {
      const resp = await fetch(apiUrl);
      if (!resp.ok) throw new Error(resp.status + ' ' + resp.statusText);
      const json = await resp.json();
      renderWorkflows(json);
    } catch (e) {
      workflowList.innerHTML = '<p style="color: red;">Impossible de récupérer les workflows : ' + escapeHtml(e.message) + '</p>';
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
      meta.textContent = 'ID : ' + wf.id + (wf.active ? ' (actif)' : ' (inactif)');
      div.appendChild(meta);
      workflowList.appendChild(div);
    });
  }

  // Mise à jour initiale de la liste des workflows
  fetchWorkflows();
});