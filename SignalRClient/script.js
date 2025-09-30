class SignalRClient {
    constructor() {
        this.connection = null;
        this.isConnected = false;
        
        this.initializeElements();
        this.bindEvents();
        this.updateUI();
    }

    initializeElements() {
        this.elements = {
            status: document.getElementById('status'),
            serverUrl: document.getElementById('serverUrl'),
            connectBtn: document.getElementById('connectBtn'),
            disconnectBtn: document.getElementById('disconnectBtn'),
            username: document.getElementById('username'),
            message: document.getElementById('message'),
            sendBtn: document.getElementById('sendBtn'),
            messages: document.getElementById('messages')
        };
    }

    bindEvents() {
        this.elements.connectBtn.addEventListener('click', () => this.connect());
        this.elements.disconnectBtn.addEventListener('click', () => this.disconnect());
        this.elements.sendBtn.addEventListener('click', () => this.sendMessage());
        
        this.elements.message.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !this.elements.sendBtn.disabled) {
                this.sendMessage();
            }
        });

        this.elements.serverUrl.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !this.elements.connectBtn.disabled) {
                this.connect();
            }
        });
    }

    async connect() {
        const serverUrl = this.elements.serverUrl.value.trim();
        if (!serverUrl) {
            this.addSystemMessage('Please enter a server URL');
            return;
        }

        try {
            this.updateStatus('connecting', 'Connecting...');
            this.elements.connectBtn.disabled = true;

            this.connection = new signalR.HubConnectionBuilder()
                .withUrl(serverUrl)
                .withAutomaticReconnect()
                .build();

            this.setupConnectionHandlers();

            await this.connection.start();
            
            this.isConnected = true;
            this.updateStatus('connected', 'Connected');
            this.addSystemMessage(`Connected to ${serverUrl}`);
            this.updateUI();
            
        } catch (error) {
            console.error('Connection failed:', error);
            this.updateStatus('disconnected', 'Connection Failed');
            this.addSystemMessage(`Connection failed: ${error.message}`);
            this.elements.connectBtn.disabled = false;
        }
    }

    async disconnect() {
        if (this.connection) {
            try {
                await this.connection.stop();
            } catch (error) {
                console.error('Disconnect error:', error);
            }
        }
    }

    setupConnectionHandlers() {
        this.connection.onclose((error) => {
            this.isConnected = false;
            this.updateStatus('disconnected', 'Disconnected');
            this.addSystemMessage('Connection closed');
            this.updateUI();
            
            if (error) {
                console.error('Connection closed with error:', error);
                this.addSystemMessage(`Connection error: ${error.message}`);
            }
        });

        this.connection.onreconnecting((error) => {
            this.updateStatus('connecting', 'Reconnecting...');
            this.addSystemMessage('Attempting to reconnect...');
            console.log('Reconnecting:', error);
        });

        this.connection.onreconnected((connectionId) => {
            this.updateStatus('connected', 'Connected');
            this.addSystemMessage('Reconnected successfully');
            console.log('Reconnected with connection ID:', connectionId);
        });

        // Listen for messages from the server
        this.connection.on('ReceiveMessage', (user, message) => {
            this.addMessage(user, message);
        });

        // Listen for system messages
        this.connection.on('SystemMessage', (message) => {
            this.addSystemMessage(message);
        });

        // Listen for user joined/left events
        this.connection.on('UserJoined', (username) => {
            this.addSystemMessage(`${username} joined the chat`);
        });

        this.connection.on('UserLeft', (username) => {
            this.addSystemMessage(`${username} left the chat`);
        });
    }

    async sendMessage() {
        const username = this.elements.username.value.trim();
        const message = this.elements.message.value.trim();

        if (!username) {
            this.addSystemMessage('Please enter a username');
            this.elements.username.focus();
            return;
        }

        if (!message) {
            this.addSystemMessage('Please enter a message');
            this.elements.message.focus();
            return;
        }

        try {
            // Try common SignalR hub method names
            const methods = ['SendMessage', 'SendMessageAsync', 'BroadcastMessage'];
            
            for (const method of methods) {
                try {
                    await this.connection.invoke(method, username, message);
                    this.elements.message.value = '';
                    this.elements.message.focus();
                    return;
                } catch (error) {
                    if (error.message.includes('Unknown hub method')) {
                        continue;
                    }
                    throw error;
                }
            }
            
            // If none of the common methods work, show error
            this.addSystemMessage('Unable to send message: No compatible hub method found');
            
        } catch (error) {
            console.error('Send message error:', error);
            this.addSystemMessage(`Failed to send message: ${error.message}`);
        }
    }

    updateStatus(statusClass, statusText) {
        this.elements.status.className = `status ${statusClass}`;
        this.elements.status.textContent = statusText;
    }

    updateUI() {
        this.elements.connectBtn.disabled = this.isConnected;
        this.elements.disconnectBtn.disabled = !this.isConnected;
        this.elements.sendBtn.disabled = !this.isConnected;
        this.elements.serverUrl.disabled = this.isConnected;
    }

    addMessage(username, content) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message';
        
        const timestamp = new Date().toLocaleTimeString();
        
        messageDiv.innerHTML = `
            <div class="timestamp">${timestamp}</div>
            <div class="username">${this.escapeHtml(username)}:</div>
            <div class="content">${this.escapeHtml(content)}</div>
        `;
        
        this.elements.messages.appendChild(messageDiv);
        this.scrollToBottom();
    }

    addSystemMessage(content) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message system-message';
        
        const timestamp = new Date().toLocaleTimeString();
        
        messageDiv.innerHTML = `
            <div class="timestamp">${timestamp}</div>
            <div class="content">${this.escapeHtml(content)}</div>
        `;
        
        this.elements.messages.appendChild(messageDiv);
        this.scrollToBottom();
    }

    scrollToBottom() {
        this.elements.messages.scrollTop = this.elements.messages.scrollHeight;
    }

    escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
}

// Initialize the client when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new SignalRClient();
});