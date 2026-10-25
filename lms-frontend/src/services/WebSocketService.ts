import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080/api';
// SockJS requires http:// (not ws://) — it handles the protocol upgrade internally
const WS_URL = BASE_URL.replace('/api', '/ws-announcement');

class WebSocketService {
    private client: Client | null = null;
    private subscriptions: Map<string, any> = new Map();
    private pendingTopics: Map<string, { destination: string; callback: (data: any) => void }> = new Map();
    // Registry persists across reconnects (unlike pendingTopics which is drained on connect)
    private topicRegistry: Map<string, { destination: string; callback: (data: any) => void }> = new Map();
    private msgCallback: ((msg: any) => void) | null = null;
    private notifCallback: ((notif: any) => void) | null = null;
    private connectedUsername: string | null = null;

    connect(username: string, token: string, onMessageReceived: (message: any) => void, onNotificationReceived: (notification: any) => void) {
        if (this.client && this.client.active) return;

        this.connectedUsername = username;
        this.msgCallback = onMessageReceived;
        this.notifCallback = onNotificationReceived;

        this.client = new Client({
            webSocketFactory: () => new WebSocket(WS_URL),
            debug: (str) => {
                // console.log('STOMP Debug:', str);
            },
            reconnectDelay: 5000,
            heartbeatIncoming: 10000,
            heartbeatOutgoing: 10000,
            connectHeaders: {
                username: username,
                Authorization: `Bearer ${token}`,
            },
        });

        this.client.onConnect = () => {
            console.log('[WS] Connected as', username);

            // Re-subscribe to private message queue
            const msgSub = this.client?.subscribe(`/user/${username}/queue/messages`, (message) => {
                if (message.body) onMessageReceived(JSON.parse(message.body));
            });
            if (msgSub) this.subscriptions.set('messages', msgSub);

            // Re-subscribe to private notification queue
            const notifSub = this.client?.subscribe(`/user/${username}/queue/notifications`, (notification) => {
                if (notification.body) onNotificationReceived(JSON.parse(notification.body));
            });
            if (notifSub) this.subscriptions.set('notifications', notifSub);

            // Re-subscribe ALL registered topics (handles reconnect correctly)
            this.topicRegistry.forEach(({ destination, callback }, topicId) => {
                const sub = this.client?.subscribe(destination, (msg) => {
                    if (msg.body) callback(JSON.parse(msg.body));
                });
                if (sub) this.subscriptions.set(topicId, sub);
            });
            this.pendingTopics.clear();
        };

        this.client.onStompError = (frame) => {
            console.error('[WS] STOMP Error:', frame.headers['message'], frame.body);
        };

        this.client.onDisconnect = () => {
            console.log('[WS] Disconnected — will auto-reconnect in', this.client?.reconnectDelay, 'ms');
        };

        this.client.activate();
    }

    subscribeTopic(topicId: string, destination: string, callback: (data: any) => void) {
        // Always register so reconnect can re-subscribe
        this.topicRegistry.set(topicId, { destination, callback });
        if (this.client && this.client.connected) {
            const sub = this.client.subscribe(destination, (msg) => {
                if (msg.body) callback(JSON.parse(msg.body));
            });
            this.subscriptions.set(topicId, sub);
        } else {
            this.pendingTopics.set(topicId, { destination, callback });
        }
    }

    unsubscribeTopic(topicId: string) {
        const sub = this.subscriptions.get(topicId);
        if (sub) { sub.unsubscribe(); this.subscriptions.delete(topicId); }
        this.pendingTopics.delete(topicId);
        this.topicRegistry.delete(topicId);
    }

    disconnect() {
        if (this.client) {
            this.subscriptions.forEach(sub => sub.unsubscribe());
            this.subscriptions.clear();
            this.pendingTopics.clear();
            this.client.deactivate();
            this.client = null;
            console.log('Disconnected from WebSocket');
        }
    }

    sendMessage(destination: string, body: any) {
        if (this.client && this.client.connected) {
            this.client.publish({
                destination,
                body: JSON.stringify(body)
            });
        } else {
            console.error('Cannot send message, WebSocket not connected');
        }
    }
}

const webSocketService = new WebSocketService();
export default webSocketService;
