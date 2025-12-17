# <a name="header"></a><a name="content"></a><a name="aipowered-n8n-assistant"></a>AI‑Powered n8n Assistant
This project provides a **browser‑based chat interface** connected to an **n8n automation workflow**. The goal is to help users build, modify or understand n8n workflows through natural language. When a message is sent from the web page, it is forwarded to an n8n instance where several AI agents decide which model to use and how to respond. The conversation flows back to the browser, giving you a friendly and intuitive way to automate tasks.
## <a name="what-this-project-does"></a>1. What this project does
- **Interactive chat UI** – The index.html file renders a clean chat interface with a sidebar for previous conversations, an input area for messages, file attachments, microphone support and buttons to send messages. The header shows the status of your n8n instance and lets you configure the webhook URL.
- **AI agents on n8n** – Behind the chat interface is a complex n8n workflow (included in My workflow n8n automation.json). It uses the **AI Agent** node to orchestrate tools: an AI agent is an autonomous system that receives data, makes decisions and uses external APIs to achieve a goal[\[1\]](https://docs.n8n.io/integrations/builtin/cluster-nodes/root-nodes/n8n-nodes-langchain.agent/#:~:text=An%20AI%20agent%20%20is,use%20depending%20on%20the%20task). Each agent is connected to at least one sub‑node that provides the actual language model or API call[\[2\]](https://docs.n8n.io/integrations/builtin/cluster-nodes/root-nodes/n8n-nodes-langchain.agent/#:~:text=Connect%20a%20tool).
- **OpenRouter chat models** – The workflow uses the **OpenRouter Chat Model** node. This node allows you to select one of the language models available in your OpenRouter account and configure options such as frequency penalty, maximum tokens, presence penalty or temperature[\[3\]](https://docs.n8n.io/integrations/builtin/cluster-nodes/sub-nodes/n8n-nodes-langchain.lmchatopenrouter/#:~:text=Model)[\[4\]](https://docs.n8n.io/integrations/builtin/cluster-nodes/sub-nodes/n8n-nodes-langchain.lmchatopenrouter/#:~:text=Frequency%20Penalty)[\[5\]](https://docs.n8n.io/integrations/builtin/cluster-nodes/sub-nodes/n8n-nodes-langchain.lmchatopenrouter/#:~:text=Sampling%20Temperature). Higher temperature yields more varied responses but may produce hallucinations[\[5\]](https://docs.n8n.io/integrations/builtin/cluster-nodes/sub-nodes/n8n-nodes-langchain.lmchatopenrouter/#:~:text=Sampling%20Temperature).
- **Mission classifier** – When a message is received, a classifier node labels it as guide, create, modify or delete. This routing determines which agent should answer: a *guide* agent explains n8n features, while a *creator* agent generates new workflows, a *developer* agent modifies existing ones, and a *delete* agent removes workflows.
- **Conversation memory and multi‑chat** – The web app stores conversations in localStorage. You can create multiple chats, switch between them, and the assistant remembers context within each chat. Messages and attachments are kept locally so that refreshing the page does not lose your history.

This README walks you through the file structure, installation, configuration, and gives tips on how to customise and troubleshoot your AI assistant.
## <a name="file-structure"></a>2. File structure
The project consists of a small number of files. The table below lists the important ones.

|File|Purpose|
| :- | :- |
|index.html|Defines the HTML structure of the chat interface. It includes a header with the AI Chat logo and status display, a sidebar for the conversation list, and a chat section with message history and input controls.|
|style.css|Provides styles for light and dark modes, responsive layout and custom components. Classes style the sidebar, chat bubbles, input area, buttons, file attachments and microphone state.|
|script.js|Contains all the client‑side logic. It manages conversations, stores them in localStorage, sends messages to n8n via a webhook, receives and renders responses, supports multiple conversations, microphone input (using the SpeechRecognition API when available), file uploads and workflow listing.|
|My workflow n8n automation.json|Exports an n8n workflow with more than a hundred nodes. It includes a chat trigger, mission classifier, multiple AI agent nodes (guide, creator, developer, updater and deleter agents), OpenRouter chat model nodes, code nodes to parse JSON, HTTP request nodes to create/update/delete workflows, and memory nodes. Import this file into n8n to install the automation.|
|ai\_logo.png|A simple bear‑shaped logo for the chat UI header.|
|tab.png|Icon used for toggling the sidebar open or closed.|
## <a name="prerequisites"></a>3. Prerequisites
1. **Install n8n** – You need a self‑hosted n8n instance with AI features enabled. You can run it via Docker, npm or the desktop app. For local testing you can start an instance with:

n8n start --tunnel

This makes the instance accessible at http://localhost:5678. Make sure that your environment allows incoming webhooks.

1. **Get OpenRouter credentials** – Sign up for an OpenRouter account and create an API key. In the n8n UI, go to **Credentials** → **New Credential** → **OpenRouter**, paste your API key and save. When importing the workflow you will need to update the credential assignments.
1. **Download and import the workflow** – Open the n8n editor UI, click **Workflows** in the left menu, then click **Import workflow**. Choose My workflow n8n automation.json from this repository. After importing, edit each **OpenRouter Chat Model** node to select your credential and preferred model. You can pick models available in your account; n8n dynamically loads them[\[3\]](https://docs.n8n.io/integrations/builtin/cluster-nodes/sub-nodes/n8n-nodes-langchain.lmchatopenrouter/#:~:text=Model). Higher‑end models produce better responses but may incur cost.
1. **Serve the web UI** – You can simply open index.html in a modern browser. For cross‑origin webhook calls it is better to serve the files via a local web server:

\# From the project directory\
python3 -m http.server 8080\
\# or use any static file server of your choice

Then visit http://localhost:8080.
## <a name="configuring-the-chat-interface"></a>4. Configuring the chat interface
1. **Set the n8n URL and webhook path** – When you first open the page, a dialog prompts you to enter the base URL of your n8n instance (for example http://localhost:5678) and the webhook path. The workflow uses /webhook/chat by default. After saving, the status in the header updates and the settings are stored in localStorage so you do not need to re‑enter them.
1. **Multiple conversations** – Use the **New chat** button in the sidebar to start a fresh conversation. Conversations are labelled with the first few words of your initial message. You can click on any conversation in the list to switch context.
1. **Voice input** – If your browser supports the SpeechRecognition API, you can dictate messages. Select your preferred language (French, English, Chinese) from the dropdown, click **Mic**, speak your question, and the transcript will be inserted automatically. The message is sent when you stop speaking.
1. **Attachments** – Use the **File** button to attach one or more files. File names and sizes are displayed in your outgoing message. The files are sent to the webhook using FormData. Make sure your n8n instance can handle binary data.
1. **Listing workflows** – After each interaction the client requests the list of workflows from the /api/v1/workflows endpoint. The names and IDs of your workflows appear in the sidebar under the settings form. This helps you confirm that creations, updates or deletions happened successfully.
## <a name="understanding-the-n8n-workflow"></a>5. Understanding the n8n workflow
The workflow imported from My workflow n8n automation.json orchestrates several AI agents and utilities. A high‑level overview is provided here to help you adapt it.
### <a name="mission-classification"></a>Mission classification
The **When chat message received** trigger node fires whenever the webhook endpoint receives a request. The message text is passed to the **mission classifier** agent. This classifier uses a system prompt written in French to categorise the request as one of four missions: guide, create, modify or delete. The classification is based on whether the user is asking for help, creating a workflow, modifying an existing workflow or deleting one.
### <a name="guide-agent"></a>Guide agent
If the mission is guide, the workflow routes the message to a **Guide Agent**. This agent has a system prompt telling it to act as an expert n8n assistant, giving step‑by‑step explanations and referencing official documentation where possible. The agent can call external tools; for example, it may use an HTTP Request node to fetch documentation or sample workflow templates. The agent’s response is sent back through the chat model node and returned to the browser.
### <a name="creator-and-conceptor-agents"></a>Creator and conceptor agents
For a create mission, the workflow invokes several agents:

- **Workflow conceptor** – Generates a conceptual outline of the workflow that the user wants to build. It analyses requirements, lists the necessary nodes and their connections, and prepares a description.
- **Creator agents** – Use the conceptual outline to call n8n’s REST API and create a new workflow. They utilise **HTTP Request** nodes authenticated with your n8n API key to send POST /api/v1/workflows requests. After creation, the workflow’s ID and status are returned and displayed in the browser.
### <a name="developer-and-update-agents"></a>Developer and update agents
For a modify mission, the message goes to the **developer agent**. This agent reads the current workflow structure (using an HTTP Request to fetch the workflow by ID) and then uses an OpenRouter chat model to generate updated nodes or code. The **update prompter** asks clarifying questions if needed. Once the modifications are ready, an **Update Workflow** node sends a PATCH /api/v1/workflows/{id} request to apply the changes. The **update saver** confirms the result.
### <a name="delete-agent"></a>Delete agent
When the classifier labels a message as delete, the **delete agent** asks for confirmation and, if approved, sends an HTTP Request to DELETE /api/v1/workflows/{id}. The workflow includes a **Parse LLM JSON** node to extract the ID from the language model output. A **Reporting agent** summarises the deletion and sends the final response back to the user.
### <a name="memory-and-simple-memory-nodes"></a>Memory and simple memory nodes
Throughout the workflow there are multiple **Simple Memory** nodes. These store the state of each agent between invocations, enabling the agents to keep track of context across messages. The memory nodes prevent repeated prompts and allow for more coherent conversations.
## <a name="customising-the-models-and-settings"></a>6. Customising the models and settings
Within the n8n editor, open each **OpenRouter Chat Model** node to tune the behaviour:

- **Model** – Choose the model that will generate responses. n8n shows only the models available in your OpenRouter account[\[3\]](https://docs.n8n.io/integrations/builtin/cluster-nodes/sub-nodes/n8n-nodes-langchain.lmchatopenrouter/#:~:text=Model).
- **Frequency penalty** – Increases or decreases the likelihood of the model repeating itself[\[4\]](https://docs.n8n.io/integrations/builtin/cluster-nodes/sub-nodes/n8n-nodes-langchain.lmchatopenrouter/#:~:text=Frequency%20Penalty).
- **Maximum tokens** – Limits the length of the completion. A higher value allows longer answers but may incur more cost.
- **Response format** – Choose JSON when you need structured output; choose Text for free‑form answers[\[6\]](https://docs.n8n.io/integrations/builtin/cluster-nodes/sub-nodes/n8n-nodes-langchain.lmchatopenrouter/#:~:text=Response%20Format).
- **Presence penalty** – Encourages the model to talk about new topics; higher values increase exploration[\[7\]](https://docs.n8n.io/integrations/builtin/cluster-nodes/sub-nodes/n8n-nodes-langchain.lmchatopenrouter/#:~:text=Presence%20Penalty).
- **Temperature** – Controls randomness. A higher temperature makes the model more creative but increases the risk of hallucinations[\[5\]](https://docs.n8n.io/integrations/builtin/cluster-nodes/sub-nodes/n8n-nodes-langchain.lmchatopenrouter/#:~:text=Sampling%20Temperature).
- **Timeout and retries** – Set limits for response time and the number of retries if a request fails[\[8\]](https://docs.n8n.io/integrations/builtin/cluster-nodes/sub-nodes/n8n-nodes-langchain.lmchatopenrouter/#:~:text=Timeout).

To change the prompts of the agents, edit the **systemMessage** and **text** fields of the corresponding AI Agent nodes. Make sure to keep the JSON structure correct. You can also add new agents for other tasks by duplicating existing ones and adjusting their prompts.
## <a name="running-your-assistant"></a>7. Running your assistant
1. **Start n8n** and ensure your workflow is active.
1. **Serve the front‑end** and open it in a browser.
1. **Configure the webhook URL** via the settings dialog.
1. **Start chatting!** Type a question like “How do I connect Google Sheets in n8n?” and press **Send**. The mission classifier will detect that you need guidance and the Guide agent will reply with detailed instructions.
1. **Create a workflow** by saying “Create a workflow that watches a Google Drive folder and sends me an email when a file is added.” The conceptor and creator agents will draft and deploy a new workflow, and you will see it appear in the workflow list.
1. **Modify or delete** by referencing an existing workflow ID. For example: “Update workflow 12 to add a delay after the webhook” or “Delete workflow 12.” Always check the workflow list for confirmation.
## <a name="troubleshooting-and-tips"></a>8. Troubleshooting and tips
- **No configuration or connection errors** – If the header shows “No configuration,” open the settings and enter your n8n base URL and webhook path. Ensure that your server is reachable from the browser and that CORS rules permit POST requests.
- **Invalid or empty responses** – The OpenRouter Chat Model node may return empty text if the model is unavailable or your API key is invalid. Verify your credentials and model selection in n8n.
- **Agent errors** – Each AI agent uses external tools. If you see errors about missing tools, make sure the required sub‑nodes are connected. According to the documentation, the AI Agent node must be connected to at least one tool sub‑node[\[2\]](https://docs.n8n.io/integrations/builtin/cluster-nodes/root-nodes/n8n-nodes-langchain.agent/#:~:text=Connect%20a%20tool).
- **Large messages or files** – Extremely long prompts or large attachments may exceed the limits of your n8n deployment. Reduce the size or adjust the Max tokens and Timeout settings.
- **Updating tokens** – The sample workflow includes an API key in script.js. Never commit secrets in production. Store them securely in environment variables or n8n credentials.
## <a name="next-steps"></a>9. Next steps
This assistant provides a framework for building AI‑driven n8n workflows. You can extend it by adding more agents (e.g., for research, summarisation or data analysis), integrating external services, or refining the UI. For more information on AI nodes and agents in n8n, refer to the official documentation: the **AI Agent node** page explains what an AI agent is and how it uses tools[\[1\]](https://docs.n8n.io/integrations/builtin/cluster-nodes/root-nodes/n8n-nodes-langchain.agent/#:~:text=An%20AI%20agent%20%20is,use%20depending%20on%20the%20task); the **OpenRouter Chat Model node** page describes available parameters and how to tune them[\[3\]](https://docs.n8n.io/integrations/builtin/cluster-nodes/sub-nodes/n8n-nodes-langchain.lmchatopenrouter/#:~:text=Model)[\[4\]](https://docs.n8n.io/integrations/builtin/cluster-nodes/sub-nodes/n8n-nodes-langchain.lmchatopenrouter/#:~:text=Frequency%20Penalty)[\[5\]](https://docs.n8n.io/integrations/builtin/cluster-nodes/sub-nodes/n8n-nodes-langchain.lmchatopenrouter/#:~:text=Sampling%20Temperature).

Happy automating!

-----
<a name="citations"></a>[\[1\]](https://docs.n8n.io/integrations/builtin/cluster-nodes/root-nodes/n8n-nodes-langchain.agent/#:~:text=An%20AI%20agent%20%20is,use%20depending%20on%20the%20task) [\[2\]](https://docs.n8n.io/integrations/builtin/cluster-nodes/root-nodes/n8n-nodes-langchain.agent/#:~:text=Connect%20a%20tool) AI Agent node documentation | n8n Docs 

<https://docs.n8n.io/integrations/builtin/cluster-nodes/root-nodes/n8n-nodes-langchain.agent/>

[\[3\]](https://docs.n8n.io/integrations/builtin/cluster-nodes/sub-nodes/n8n-nodes-langchain.lmchatopenrouter/#:~:text=Model) [\[4\]](https://docs.n8n.io/integrations/builtin/cluster-nodes/sub-nodes/n8n-nodes-langchain.lmchatopenrouter/#:~:text=Frequency%20Penalty) [\[5\]](https://docs.n8n.io/integrations/builtin/cluster-nodes/sub-nodes/n8n-nodes-langchain.lmchatopenrouter/#:~:text=Sampling%20Temperature) [\[6\]](https://docs.n8n.io/integrations/builtin/cluster-nodes/sub-nodes/n8n-nodes-langchain.lmchatopenrouter/#:~:text=Response%20Format) [\[7\]](https://docs.n8n.io/integrations/builtin/cluster-nodes/sub-nodes/n8n-nodes-langchain.lmchatopenrouter/#:~:text=Presence%20Penalty) [\[8\]](https://docs.n8n.io/integrations/builtin/cluster-nodes/sub-nodes/n8n-nodes-langchain.lmchatopenrouter/#:~:text=Timeout) OpenRouter Chat Model node documentation | n8n Docs 

<https://docs.n8n.io/integrations/builtin/cluster-nodes/sub-nodes/n8n-nodes-langchain.lmchatopenrouter/>
