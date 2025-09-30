import React, { useState, useEffect, useRef } from 'react';
import * as signalR from '@microsoft/signalr';

function App() {
  const [connection, setConnection] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('Disconnected');
  const [messages, setMessages] = useState([]);
  const [user, setUser] = useState('');
  const [message, setMessage] = useState('');
  const [groupName, setGroupName] = useState('');
  const [groupMessage, setGroupMessage] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const connectToHub = async () => {
    try {
      setConnectionStatus('Connecting');
      
      const newConnection = new signalR.HubConnectionBuilder()
        .withUrl('http://localhost:5000/chathub')
        .withAutomaticReconnect()
        .build();

      newConnection.on('ReceiveMessage', (user, message) => {
        setMessages(prev => [...prev, {
          id: Date.now(),
          user,
          message,
          timestamp: new Date().toLocaleTimeString(),
          type: 'message'
        }]);
      });

      newConnection.on('UserConnected', (connectionId) => {
        setMessages(prev => [...prev, {
          id: Date.now(),
          message: `User connected: ${connectionId}`,
          timestamp: new Date().toLocaleTimeString(),
          type: 'system'
        }]);
      });

      newConnection.on('UserDisconnected', (connectionId) => {
        setMessages(prev => [...prev, {
          id: Date.now(),
          message: `User disconnected: ${connectionId}`,
          timestamp: new Date().toLocaleTimeString(),
          type: 'system'
        }]);
      });

      newConnection.on('UserJoined', (connectionId, groupName) => {
        setMessages(prev => [...prev, {
          id: Date.now(),
          message: `User ${connectionId} joined group: ${groupName}`,
          timestamp: new Date().toLocaleTimeString(),
          type: 'system'
        }]);
      });

      newConnection.on('UserLeft', (connectionId, groupName) => {
        setMessages(prev => [...prev, {
          id: Date.now(),
          message: `User ${connectionId} left group: ${groupName}`,
          timestamp: new Date().toLocaleTimeString(),
          type: 'system'
        }]);
      });

      newConnection.onreconnecting(() => {
        setConnectionStatus('Reconnecting');
      });

      newConnection.onreconnected(() => {
        setConnectionStatus('Connected');
        setMessages(prev => [...prev, {
          id: Date.now(),
          message: 'Reconnected to server',
          timestamp: new Date().toLocaleTimeString(),
          type: 'system'
        }]);
      });

      newConnection.onclose(() => {
        setConnectionStatus('Disconnected');
        setMessages(prev => [...prev, {
          id: Date.now(),
          message: 'Disconnected from server',
          timestamp: new Date().toLocaleTimeString(),
          type: 'system'
        }]);
      });

      await newConnection.start();
      setConnection(newConnection);
      setConnectionStatus('Connected');
      
      setMessages(prev => [...prev, {
        id: Date.now(),
        message: 'Connected to server',
        timestamp: new Date().toLocaleTimeString(),
        type: 'system'
      }]);

    } catch (error) {
      console.error('Connection failed: ', error);
      setConnectionStatus('Failed');
      setMessages(prev => [...prev, {
        id: Date.now(),
        message: `Connection failed: ${error.message}`,
        timestamp: new Date().toLocaleTimeString(),
        type: 'system'
      }]);
    }
  };

  const disconnectFromHub = async () => {
    if (connection) {
      await connection.stop();
      setConnection(null);
      setConnectionStatus('Disconnected');
    }
  };

  const sendMessage = async () => {
    if (connection && user && message) {
      try {
        await connection.invoke('SendMessage', user, message);
        setMessage('');
      } catch (error) {
        console.error('Send message failed: ', error);
        setMessages(prev => [...prev, {
          id: Date.now(),
          message: `Send message failed: ${error.message}`,
          timestamp: new Date().toLocaleTimeString(),
          type: 'system'
        }]);
      }
    }
  };

  const joinGroup = async () => {
    if (connection && groupName) {
      try {
        await connection.invoke('JoinGroup', groupName);
        setMessages(prev => [...prev, {
          id: Date.now(),
          message: `You joined group: ${groupName}`,
          timestamp: new Date().toLocaleTimeString(),
          type: 'system'
        }]);
      } catch (error) {
        console.error('Join group failed: ', error);
      }
    }
  };

  const leaveGroup = async () => {
    if (connection && groupName) {
      try {
        await connection.invoke('LeaveGroup', groupName);
        setMessages(prev => [...prev, {
          id: Date.now(),
          message: `You left group: ${groupName}`,
          timestamp: new Date().toLocaleTimeString(),
          type: 'system'
        }]);
      } catch (error) {
        console.error('Leave group failed: ', error);
      }
    }
  };

  const sendGroupMessage = async () => {
    if (connection && groupName && user && groupMessage) {
      try {
        await connection.invoke('SendMessageToGroup', groupName, user, groupMessage);
        setGroupMessage('');
      } catch (error) {
        console.error('Send group message failed: ', error);
      }
    }
  };

  const getStatusClass = () => {
    switch (connectionStatus.toLowerCase()) {
      case 'connected': return 'connected';
      case 'connecting': case 'reconnecting': return 'connecting';
      default: return 'disconnected';
    }
  };

  return (
    <div className="container">
      <h1>SignalR React Client</h1>
      
      <div className={`connection-status ${getStatusClass()}`}>
        Status: {connectionStatus}
      </div>

      <div style={{ marginBottom: '20px' }}>
        {connectionStatus === 'Disconnected' || connectionStatus === 'Failed' ? (
          <button onClick={connectToHub}>Connect</button>
        ) : (
          <button onClick={disconnectFromHub}>Disconnect</button>
        )}
      </div>

      <div className="chat-container">
        <h3>Chat Messages</h3>
        <div className="messages">
          {messages.map((msg) => (
            <div key={msg.id} className={`message ${msg.type}`}>
              <span style={{ fontSize: '0.8em', color: '#666' }}>
                [{msg.timestamp}]
              </span>
              {msg.user && <strong> {msg.user}: </strong>}
              {msg.message}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="input-group">
          <input
            type="text"
            placeholder="Your name"
            value={user}
            onChange={(e) => setUser(e.target.value)}
          />
          <input
            type="text"
            placeholder="Type a message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          />
          <button 
            onClick={sendMessage} 
            disabled={!connection || !user || !message}
          >
            Send
          </button>
        </div>
      </div>

      <div className="groups-section">
        <h3>Group Management</h3>
        <div className="input-group">
          <input
            type="text"
            placeholder="Group name"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
          />
          <button onClick={joinGroup} disabled={!connection || !groupName}>
            Join Group
          </button>
          <button onClick={leaveGroup} disabled={!connection || !groupName}>
            Leave Group
          </button>
        </div>

        <div className="input-group">
          <input
            type="text"
            placeholder="Group message..."
            value={groupMessage}
            onChange={(e) => setGroupMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendGroupMessage()}
          />
          <button 
            onClick={sendGroupMessage} 
            disabled={!connection || !groupName || !user || !groupMessage}
          >
            Send to Group
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;