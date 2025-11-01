import { useState, useRef, useCallback } from 'react';

export const useCall = (conversationId: string, isVideo: boolean) => {
  const [isConnected, setIsConnected] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(isVideo);

  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const localVideoRef = useRef<any>(null);

  const startCall = useCallback(async () => {
    try {
      // Get user media - ensure video is always boolean
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: Boolean(isVideoEnabled),
      });

      setLocalStream(stream);

      // Setup WebRTC (simplified)
      const configuration = {
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
      };

      peerConnection.current = new RTCPeerConnection(configuration);

      // Add local stream tracks
      stream.getTracks().forEach((track) => {
        peerConnection.current?.addTrack(track, stream);
      });

      // Handle remote stream
      peerConnection.current.ontrack = (event) => {
        setRemoteStream(event.streams[0]);
        setIsConnected(true);
      };

      // Create offer
      const offer = await peerConnection.current.createOffer();
      await peerConnection.current.setLocalDescription(offer);

      // Send offer to server/peer (via Socket.io or API)
      // This should be implemented with your signaling server

    } catch (error) {
      console.error('Error starting call:', error);
    }
  }, [isVideoEnabled]);

  const endCall = useCallback(() => {
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }
    if (peerConnection.current) {
      peerConnection.current.close();
    }
    setLocalStream(null);
    setRemoteStream(null);
    setIsConnected(false);
  }, [localStream]);

  const toggleMute = useCallback(() => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        // Ensure enabled is always boolean, not string
        const newMutedState = !isAudioMuted;
        audioTrack.enabled = Boolean(newMutedState);
        setIsAudioMuted(newMutedState);
      }
    }
  }, [localStream, isAudioMuted]);

  const toggleVideo = useCallback(() => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        // Ensure enabled is always boolean, not string
        const newVideoState = !isVideoEnabled;
        videoTrack.enabled = Boolean(newVideoState);
        setIsVideoEnabled(newVideoState);
      }
    }
  }, [localStream, isVideoEnabled]);

  const switchCamera = useCallback(() => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      // Switch camera logic would go here
      // This requires device-specific implementation
    }
  }, [localStream]);

  return {
    isConnected,
    localStream,
    remoteStream,
    isAudioMuted,
    isVideoEnabled,
    startCall,
    endCall,
    toggleMute,
    toggleVideo,
    switchCamera,
  };
};

