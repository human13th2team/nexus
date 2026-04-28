import { Client } from '@stomp/stompjs';

export class ChatService {
  constructor() {
    this.client = null;
    this.onMessageReceived = null;
    this.onConnected = null;
  }

  connect(onMessageReceived, roomId, onConnected) {
    this.onMessageReceived = onMessageReceived;
    this.onConnected = onConnected;

    this.client = new Client({
      brokerURL: 'ws://localhost:8080/ws-nexus',
      debug: (str) => console.log(str),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    this.client.onConnect = () => {
      console.log('Connected to STOMP Broker');
      if (this.onConnected) this.onConnected();
      if (roomId) {
        this.subscribe(roomId);
      }
    };

    this.client.onStompError = (frame) => {
      console.error('Broker reported error: ' + frame.headers['message']);
      console.error('Additional details: ' + frame.body);
    };

    this.client.activate();
  }

  subscribe(roomId) {
    if (this.client && this.client.connected) {
      const destination = `/topic/chat/${roomId}`;
      this.client.subscribe(destination, (message) => {
        if (message.body && this.onMessageReceived) {
          const parsed = JSON.parse(message.body);
          this.onMessageReceived(parsed);
        }
      });
    }
  }

  sendMessage(roomId, senderId, message, type = 'TALK', fileUrl = null, fileName = null) {
    if (this.client && this.client.connected) {
      const payload = {
        roomId: roomId,
        senderId: senderId,
        message: message,
        type: type,
        fileUrl: fileUrl,
        fileName: fileName
      };
      
      this.client.publish({
        destination: '/app/chat/send',
        body: JSON.stringify(payload),
      });
    } else {
      console.error('Cannot send message: Not connected');
    }
  }

  disconnect() {
    if (this.client) {
      this.client.deactivate();
    }
  }
}

export default ChatService;
