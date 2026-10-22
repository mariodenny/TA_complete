import { io, Socket } from 'socket.io-client';
import { StorageService } from './storageService';

type ListenerCallback = (data: any) => void;

class SocketService {
  private socket: Socket | null = null;
  private isConnecting = false;
  private listeners: Map<string, Set<ListenerCallback>> = new Map();

  async connect(): Promise<Socket | null> {
    const isMock = await StorageService.getUseMock();
    if (isMock) {
      // In mock mode, don't attempt network socket connection to prevent connection errors
      return null;
    }

    if (this.socket && this.socket.connected) {
      return this.socket;
    }

    if (this.isConnecting) {
      return null;
    }

    this.isConnecting = true;

    try {
      const baseUrl = await StorageService.getApiUrl();
      const token = await StorageService.getAuthToken();

      this.socket = io(baseUrl, {
        transports: ['websocket', 'polling'],
        auth: { token },
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 2000,
        timeout: 10000,
      });

      this.socket.on('connect', () => {
        this.isConnecting = false;
        console.log('[Socket] Connected to Flask-SocketIO:', this.socket?.id);
      });

      this.socket.on('disconnect', (reason) => {
        console.log('[Socket] Disconnected:', reason);
      });

      this.socket.on('connect_error', (error) => {
        this.isConnecting = false;
        console.log('[Socket] Connection error:', error.message);
      });

      // Forward registered listeners
      this.listeners.forEach((callbacks, event) => {
        callbacks.forEach((cb) => {
          this.socket?.on(event, cb);
        });
      });

      return this.socket;
    } catch (err) {
      this.isConnecting = false;
      console.warn('[Socket] Initialization error:', err);
      return null;
    }
  }

  on(event: string, callback: ListenerCallback): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)?.add(callback);

    if (this.socket) {
      this.socket.on(event, callback);
    }

    // Return unbind function
    return () => this.off(event, callback);
  }

  off(event: string, callback: ListenerCallback) {
    this.listeners.get(event)?.delete(callback);
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  emit(event: string, data?: any) {
    if (this.socket && this.socket.connected) {
      this.socket.emit(event, data);
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnecting = false;
  }

  isConnected(): boolean {
    return Boolean(this.socket && this.socket.connected);
  }
}

export const RealtimeService = new SocketService();

