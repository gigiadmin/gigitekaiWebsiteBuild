/**
 * WebRTC Manager for Remote Assistance
 * Handles screen sharing, remote control, and real-time communication
 */

import { EventEmitter } from 'events';

/**
 * WebRTC Configuration
 */
export const WEBRTC_CONFIG = {
  iceServers: [
    { urls: ['stun:stun.l.google.com:19302'] },
    { urls: ['stun:stun1.l.google.com:19302'] },
    { urls: ['stun:stun2.l.google.com:19302'] },
    { urls: ['stun:stun3.l.google.com:19302'] },
    { urls: ['stun:stun4.l.google.com:19302'] },
  ],
  iceCandidatePoolSize: 10,
};

/**
 * Session Peer Connection Manager
 */
export class SessionPeerManager extends EventEmitter {
  private peerConnections: Map<number, RTCPeerConnection> = new Map();
  private dataChannels: Map<number, RTCDataChannel> = new Map();
  private sessionId: number;
  private userId: number;

  constructor(sessionId: number, userId: number) {
    super();
    this.sessionId = sessionId;
    this.userId = userId;
  }

  /**
   * Create peer connection for screen sharing
   */
  async createScreenShareConnection(
    remoteUserId: number,
    onLocalStream?: (stream: MediaStream) => void
  ): Promise<RTCPeerConnection> {
    try {
      const peerConnection = new RTCPeerConnection({
        iceServers: WEBRTC_CONFIG.iceServers,
      });

      // Get screen capture stream
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true as any,
        audio: false,
      });

      // Add screen tracks to peer connection
      screenStream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, screenStream);
      });

      // Handle ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          this.emit('ice-candidate', {
            sessionId: this.sessionId,
            from: this.userId,
            to: remoteUserId,
            candidate: event.candidate,
          });
        }
      };

      // Handle connection state changes
      peerConnection.onconnectionstatechange = () => {
        this.emit('connection-state-change', {
          sessionId: this.sessionId,
          state: peerConnection.connectionState,
        });
      };

      // Create data channel for control signals
      const dataChannel = peerConnection.createDataChannel('control', {
        ordered: true,
      });
      this.setupDataChannel(dataChannel, remoteUserId);

      // Handle remote data channels
      peerConnection.ondatachannel = (event) => {
        this.setupDataChannel(event.channel, remoteUserId);
      };

      this.peerConnections.set(remoteUserId, peerConnection);

      if (onLocalStream) {
        onLocalStream(screenStream);
      }

      return peerConnection;
    } catch (error) {
      console.error('Failed to create screen share connection:', error);
      throw error;
    }
  }

  /**
   * Create peer connection for audio/video
   */
  async createAudioVideoConnection(
    remoteUserId: number,
    onLocalStream?: (stream: MediaStream) => void
  ): Promise<RTCPeerConnection> {
    try {
      const peerConnection = new RTCPeerConnection({
        iceServers: WEBRTC_CONFIG.iceServers,
      });

      // Get audio/video stream
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      // Add tracks to peer connection
      mediaStream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, mediaStream);
      });

      // Handle ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          this.emit('ice-candidate', {
            sessionId: this.sessionId,
            from: this.userId,
            to: remoteUserId,
            candidate: event.candidate,
          });
        }
      };

      // Handle remote stream
      peerConnection.ontrack = (event) => {
        this.emit('remote-stream', {
          sessionId: this.sessionId,
          stream: event.streams[0],
        });
      };

      this.peerConnections.set(remoteUserId, peerConnection);

      if (onLocalStream) {
        onLocalStream(mediaStream);
      }

      return peerConnection;
    } catch (error) {
      console.error('Failed to create audio/video connection:', error);
      throw error;
    }
  }

  /**
   * Setup data channel for control signals
   */
  private setupDataChannel(dataChannel: RTCDataChannel, remoteUserId: number) {
    dataChannel.onopen = () => {
      console.log(`Data channel opened with user ${remoteUserId}`);
      this.emit('data-channel-open', { remoteUserId });
    };

    dataChannel.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        this.emit('control-message', {
          from: remoteUserId,
          message,
        });
      } catch (error) {
        console.error('Failed to parse control message:', error);
      }
    };

    dataChannel.onerror = (error) => {
      console.error(`Data channel error with user ${remoteUserId}:`, error);
      this.emit('data-channel-error', { remoteUserId, error });
    };

    dataChannel.onclose = () => {
      console.log(`Data channel closed with user ${remoteUserId}`);
      this.dataChannels.delete(remoteUserId);
    };

    this.dataChannels.set(remoteUserId, dataChannel);
  }

  /**
   * Send control message through data channel
   */
  sendControlMessage(remoteUserId: number, message: any) {
    const dataChannel = this.dataChannels.get(remoteUserId);
    if (dataChannel && dataChannel.readyState === 'open') {
      dataChannel.send(JSON.stringify(message));
    } else {
      console.warn(`Data channel not ready for user ${remoteUserId}`);
    }
  }

  /**
   * Create offer for peer connection
   */
  async createOffer(remoteUserId: number): Promise<RTCSessionDescriptionInit> {
    const peerConnection = this.peerConnections.get(remoteUserId);
    if (!peerConnection) {
      throw new Error(`No peer connection for user ${remoteUserId}`);
    }

    const offer = await peerConnection.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: true,
    });

    await peerConnection.setLocalDescription(offer);
    return offer;
  }

  /**
   * Create answer for peer connection
   */
  async createAnswer(remoteUserId: number): Promise<RTCSessionDescriptionInit> {
    const peerConnection = this.peerConnections.get(remoteUserId);
    if (!peerConnection) {
      throw new Error(`No peer connection for user ${remoteUserId}`);
    }

    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    return answer;
  }

  /**
   * Add ICE candidate
   */
  async addIceCandidate(remoteUserId: number, candidate: RTCIceCandidateInit) {
    const peerConnection = this.peerConnections.get(remoteUserId);
    if (!peerConnection) {
      throw new Error(`No peer connection for user ${remoteUserId}`);
    }

    try {
      await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (error) {
      console.error('Failed to add ICE candidate:', error);
    }
  }

  /**
   * Set remote description
   */
  async setRemoteDescription(
    remoteUserId: number,
    description: RTCSessionDescriptionInit
  ) {
    const peerConnection = this.peerConnections.get(remoteUserId);
    if (!peerConnection) {
      throw new Error(`No peer connection for user ${remoteUserId}`);
    }

    await peerConnection.setRemoteDescription(new RTCSessionDescription(description));
  }

  /**
   * Close peer connection
   */
  closePeerConnection(remoteUserId: number) {
    const peerConnection = this.peerConnections.get(remoteUserId);
    if (peerConnection) {
      peerConnection.close();
      this.peerConnections.delete(remoteUserId);
    }

    const dataChannel = this.dataChannels.get(remoteUserId);
    if (dataChannel) {
      dataChannel.close();
      this.dataChannels.delete(remoteUserId);
    }
  }

  /**
   * Close all connections
   */
  closeAllConnections() {
    this.peerConnections.forEach((pc) => pc.close());
    this.dataChannels.forEach((dc) => dc.close());
    this.peerConnections.clear();
    this.dataChannels.clear();
  }

  /**
   * Get connection statistics
   */
  async getConnectionStats(remoteUserId: number): Promise<any> {
    const peerConnection = this.peerConnections.get(remoteUserId);
    if (!peerConnection) {
      throw new Error(`No peer connection for user ${remoteUserId}`);
    }

    const stats = await peerConnection.getStats();
    const result: any = {
      audio: {},
      video: {},
      connection: {},
    };

    stats.forEach((report) => {
      if (report.type === 'inbound-rtp') {
        if (report.mediaType === 'audio') {
          result.audio.bytesReceived = report.bytesReceived;
          result.audio.packetsLost = report.packetsLost;
        } else if (report.mediaType === 'video') {
          result.video.bytesReceived = report.bytesReceived;
          result.video.framesDecoded = report.framesDecoded;
          result.video.frameRate = report.framesPerSecond;
        }
      } else if (report.type === 'outbound-rtp') {
        if (report.mediaType === 'video') {
          result.video.bytesSent = report.bytesSent;
          result.video.framesSent = report.framesSent;
        }
      } else if (report.type === 'candidate-pair' && report.state === 'succeeded') {
        result.connection.currentRoundTripTime = report.currentRoundTripTime;
        result.connection.availableOutgoingBitrate = report.availableOutgoingBitrate;
      }
    });

    return result;
  }
}

/**
 * Signaling Server Manager
 * Handles WebSocket communication for WebRTC signaling
 */
export class SignalingManager extends EventEmitter {
  private ws: WebSocket | null = null;
  private sessionId: number;
  private userId: number;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  constructor(sessionId: number, userId: number) {
    super();
    this.sessionId = sessionId;
    this.userId = userId;
  }

  /**
   * Connect to signaling server
   */
  connect(signalingServerUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(signalingServerUrl);

        this.ws.onopen = () => {
          console.log('Connected to signaling server');
          this.reconnectAttempts = 0;

          // Send join message
          this.send({
            type: 'join',
            sessionId: this.sessionId,
            userId: this.userId,
          });

          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            this.emit('message', message);
          } catch (error) {
            console.error('Failed to parse signaling message:', error);
          }
        };

        this.ws.onerror = (error) => {
          console.error('Signaling server error:', error);
          reject(error);
        };

        this.ws.onclose = () => {
          console.log('Disconnected from signaling server');
          this.attemptReconnect(signalingServerUrl);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Send message to signaling server
   */
  send(message: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not ready');
    }
  }

  /**
   * Attempt to reconnect
   */
  private attemptReconnect(signalingServerUrl: string) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

      console.log(`Attempting to reconnect in ${delay}ms...`);

      setTimeout(() => {
        this.connect(signalingServerUrl).catch((error) => {
          console.error('Reconnection failed:', error);
        });
      }, delay);
    } else {
      console.error('Max reconnection attempts reached');
      this.emit('connection-failed');
    }
  }

  /**
   * Disconnect from signaling server
   */
  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

/**
 * Remote Control Handler
 */
export class RemoteControlHandler {
  private sessionId: number;
  private peerManager: SessionPeerManager;

  constructor(sessionId: number, peerManager: SessionPeerManager) {
    this.sessionId = sessionId;
    this.peerManager = peerManager;
  }

  /**
   * Send mouse move command
   */
  sendMouseMove(remoteUserId: number, x: number, y: number) {
    this.peerManager.sendControlMessage(remoteUserId, {
      type: 'mouse-move',
      x,
      y,
    });
  }

  /**
   * Send mouse click command
   */
  sendMouseClick(remoteUserId: number, button: 'left' | 'right' | 'middle', x: number, y: number) {
    this.peerManager.sendControlMessage(remoteUserId, {
      type: 'mouse-click',
      button,
      x,
      y,
    });
  }

  /**
   * Send keyboard input
   */
  sendKeyboardInput(remoteUserId: number, key: string, modifiers: string[] = []) {
    this.peerManager.sendControlMessage(remoteUserId, {
      type: 'keyboard-input',
      key,
      modifiers,
    });
  }

  /**
   * Send file transfer request
   */
  sendFileTransfer(remoteUserId: number, file: File) {
    this.peerManager.sendControlMessage(remoteUserId, {
      type: 'file-transfer-request',
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
    });
  }
}

export default {
  SessionPeerManager,
  SignalingManager,
  RemoteControlHandler,
  WEBRTC_CONFIG,
};
