import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface WebSocketEvent {
  type: 'command.executed' | 'alert.triggered' | 'alert.resolved' | 'system.health';
  data: any;
  timestamp: string;
}

interface UseWebSocketOptions {
  onCommandExecuted?: (data: any) => void;
  onAlertTriggered?: (data: any) => void;
  onAlertResolved?: (data: any) => void;
  onSystemHealth?: (data: any) => void;
  onConnectionChange?: (connected: boolean) => void;
  autoConnect?: boolean;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'reconnecting'>('disconnected');
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = useCallback(() => {
    if (socketRef.current?.connected) return;

    try {
      setConnectionStatus('connecting');
      
      const socket = io(window.location.origin, {
        path: '/socket.io',
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: maxReconnectAttempts,
        transports: ['websocket', 'polling'],
      });

      // Connection events
      socket.on('connect', () => {
        console.log('[WebSocket] Connected:', socket.id);
        setConnected(true);
        setConnectionStatus('connected');
        reconnectAttemptsRef.current = 0;
        options.onConnectionChange?.(true);
      });

      socket.on('disconnect', () => {
        console.log('[WebSocket] Disconnected');
        setConnected(false);
        setConnectionStatus('disconnected');
        options.onConnectionChange?.(false);
      });

      socket.on('reconnecting', () => {
        console.log('[WebSocket] Reconnecting...');
        setConnectionStatus('reconnecting');
      });

      socket.on('connect_error', (error) => {
        console.error('[WebSocket] Connection error:', error);
        reconnectAttemptsRef.current++;
      });

      // Command events
      socket.on('command.executed', (data) => {
        console.log('[WebSocket] Command executed:', data);
        options.onCommandExecuted?.(data);
      });

      // Alert events
      socket.on('alert.triggered', (data) => {
        console.log('[WebSocket] Alert triggered:', data);
        options.onAlertTriggered?.(data);
      });

      socket.on('alert.resolved', (data) => {
        console.log('[WebSocket] Alert resolved:', data);
        options.onAlertResolved?.(data);
      });

      // System health events
      socket.on('system.health', (data) => {
        console.log('[WebSocket] System health:', data);
        options.onSystemHealth?.(data);
      });

      // Error handling
      socket.on('error', (error) => {
        console.error('[WebSocket] Socket error:', error);
      });

      socketRef.current = socket;
    } catch (error) {
      console.error('[WebSocket] Failed to connect:', error);
      setConnectionStatus('disconnected');
    }
  }, [options]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setConnected(false);
      setConnectionStatus('disconnected');
    }
  }, []);

  const emit = useCallback((event: string, data?: any) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    } else {
      console.warn('[WebSocket] Socket not connected, cannot emit event:', event);
    }
  }, []);

  // Auto-connect on mount
  useEffect(() => {
    if (options.autoConnect !== false) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [connect, disconnect, options.autoConnect]);

  return {
    connected,
    connectionStatus,
    connect,
    disconnect,
    emit,
    socket: socketRef.current,
  };
}
