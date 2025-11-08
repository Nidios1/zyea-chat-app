import { useState, useRef, useCallback, useEffect } from 'react';
import useSocket from './useSocket';
import { useAuth } from '../contexts/AuthContext';

// Import WebRTC from react-native-webrtc
let mediaDevices: any;
let RTCPeerConnection: any;
let RTCSessionDescription: any;
let RTCIceCandidate: any;
let MediaStream: any;

// Try to import react-native-webrtc (will work after installation and rebuild)
try {
  const webrtc = require('react-native-webrtc');
  mediaDevices = webrtc.mediaDevices;
  RTCPeerConnection = webrtc.RTCPeerConnection;
  RTCSessionDescription = webrtc.RTCSessionDescription;
  RTCIceCandidate = webrtc.RTCIceCandidate;
  MediaStream = webrtc.MediaStream;
} catch (error) {
  console.warn('react-native-webrtc not found. Please install and rebuild the app.');
}

interface UseCallProps {
  conversationId: string;
  otherUserId: string;
  isVideo: boolean;
  isIncoming?: boolean;
}

export const useVideoCall = ({
  conversationId,
  otherUserId,
  isVideo,
  isIncoming = false,
}: UseCallProps) => {
  const { socket } = useSocket();
  const { user } = useAuth();
  
  const [callStatus, setCallStatus] = useState<'idle' | 'calling' | 'ringing' | 'connecting' | 'connected' | 'ended'>('idle');
  const [isConnected, setIsConnected] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(isVideo);
  const [callDuration, setCallDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const callStartTimeRef = useRef<number | null>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // WebRTC configuration
  const iceServers = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ],
  };

  // Initialize media stream
  const getMediaStream = useCallback(async (): Promise<MediaStream | null> => {
    try {
      if (!mediaDevices) {
        throw new Error('react-native-webrtc chưa được cài đặt. Vui lòng rebuild ứng dụng.');
      }

      const stream = await mediaDevices.getUserMedia({
        audio: true,
        video: isVideo ? {
          facingMode: 'user',
          width: { min: 640, ideal: 1280, max: 1920 },
          height: { min: 480, ideal: 720, max: 1080 },
        } : false,
      });

      return stream;
    } catch (err: any) {
      console.error('Error getting media stream:', err);
      let errorMessage = 'Không thể truy cập camera/microphone';
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMessage = 'Quyền truy cập camera/microphone bị từ chối. Vui lòng cấp quyền trong Settings.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errorMessage = 'Không tìm thấy camera/microphone.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      return null;
    }
  }, [isVideo]);

  // Setup WebRTC peer connection
  const setupPeerConnection = useCallback((stream: MediaStream) => {
    try {
      if (!RTCPeerConnection) {
        throw new Error('react-native-webrtc chưa được cài đặt. Vui lòng rebuild ứng dụng.');
      }

      // Create RTCPeerConnection
      if (!peerConnectionRef.current) {
        peerConnectionRef.current = new RTCPeerConnection(iceServers);
      }

      // Add local stream tracks
      stream.getTracks().forEach((track: any) => {
        if (peerConnectionRef.current) {
          peerConnectionRef.current.addTrack(track, stream);
        }
      });

      // Handle remote stream
      peerConnectionRef.current.ontrack = (event: any) => {
        if (event.streams && event.streams[0]) {
          setRemoteStream(event.streams[0]);
          setIsConnected(true);
          setCallStatus('connected');
        }
      };

      // Handle ICE candidates
      peerConnectionRef.current.onicecandidate = (event: any) => {
        if (event.candidate && socket?.connected) {
          socket.emit('ice-candidate', {
            to: otherUserId,
            candidate: event.candidate,
            from: user?.id,
          });
        }
      };

      // Handle connection state changes
      peerConnectionRef.current.onconnectionstatechange = () => {
        if (peerConnectionRef.current) {
          const state = peerConnectionRef.current.connectionState;
          console.log('Connection state:', state);
          
          if (state === 'connected' || state === 'completed') {
            setIsConnected(true);
            setCallStatus('connected');
          } else if (state === 'disconnected' || state === 'failed') {
            setIsConnected(false);
            if (callStatus === 'connected') {
              endCall();
            }
          }
        }
      };
    } catch (err: any) {
      console.error('Error setting up peer connection:', err);
      setError(err.message || 'Lỗi thiết lập kết nối');
    }
  }, [socket, otherUserId, user?.id, callStatus]);

  // Start call (outgoing)
  const startCall = useCallback(async () => {
    if (!socket) {
      setError('Socket chưa được khởi tạo. Vui lòng đợi...');
      setCallStatus('ended');
      return;
    }

    // Wait for socket connection with timeout
    if (!socket.connected) {
      setCallStatus('connecting');
      setError('Đang kết nối với server...');
      
      // Wait up to 5 seconds for connection
      const connectionPromise = new Promise<boolean>((resolve) => {
        if (socket.connected) {
          resolve(true);
          return;
        }

        const startTime = Date.now();
        const timeout = 5000; // 5 seconds
        const checkInterval = setInterval(() => {
          if (socket.connected) {
            clearInterval(checkInterval);
            resolve(true);
          } else if (Date.now() - startTime > timeout) {
            clearInterval(checkInterval);
            resolve(false);
          }
        }, 100);
      });

      const connected = await connectionPromise;
      
      if (!connected) {
        setError('Không thể kết nối với server. Vui lòng kiểm tra kết nối mạng và thử lại.');
        setCallStatus('ended');
        console.error('Socket connection timeout. Connection state:', socket.connected);
        return;
      }
      
      setError(null);
    }

    if (!user?.id) {
      setError('Chưa đăng nhập. Vui lòng đăng nhập lại.');
      setCallStatus('ended');
      return;
    }

    try {
      setCallStatus('calling');
      setError(null);

      // Get media stream
      const stream = await getMediaStream();
      if (!stream) {
        setCallStatus('ended');
        return;
      }

      localStreamRef.current = stream;
      setLocalStream(stream);

      // Setup peer connection
      setupPeerConnection(stream);

      // Create offer
      if (peerConnectionRef.current) {
        const offer = await peerConnectionRef.current.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: isVideo,
        });
        
        await peerConnectionRef.current.setLocalDescription(
          new RTCSessionDescription(offer)
        );

        // Send offer via socket
        socket.emit('call-offer', {
          to: otherUserId,
          from: user.id,
          offer: offer,
          isVideo: isVideo,
          conversationId: conversationId,
        });

        setCallStatus('ringing');
      }
    } catch (err: any) {
      console.error('Error starting call:', err);
      setError(err.message || 'Lỗi bắt đầu cuộc gọi');
      setCallStatus('ended');
    }
  }, [socket, user?.id, otherUserId, isVideo, conversationId, getMediaStream, setupPeerConnection]);

  // Accept call (incoming)
  const acceptCall = useCallback(async (offer: RTCSessionDescription) => {
    if (!socket) {
      setError('Socket chưa được khởi tạo. Vui lòng đợi...');
      return;
    }

    if (!socket.connected) {
      setError('Không thể kết nối với server. Vui lòng kiểm tra kết nối mạng và thử lại.');
      console.error('Socket not connected. Connection state:', socket.connected);
      rejectCall();
      return;
    }

    if (!user?.id) {
      setError('Chưa đăng nhập. Vui lòng đăng nhập lại.');
      rejectCall();
      return;
    }

    try {
      setCallStatus('connecting');
      setError(null);

      // Get media stream
      const stream = await getMediaStream();
      if (!stream) {
        rejectCall();
        return;
      }

      localStreamRef.current = stream;
      setLocalStream(stream);

      // Setup peer connection
      setupPeerConnection(stream);

      // Set remote description (offer from caller)
      if (peerConnectionRef.current && RTCSessionDescription) {
        await peerConnectionRef.current.setRemoteDescription(
          new RTCSessionDescription(offer)
        );

        // Create answer
        const answer = await peerConnectionRef.current.createAnswer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: isVideo,
        });
        
        await peerConnectionRef.current.setLocalDescription(
          new RTCSessionDescription(answer)
        );

        // Send answer via socket
        socket.emit('call-answer', {
          to: otherUserId,
          from: user.id,
          answer: answer,
        });

        setCallStatus('connected');
      }
    } catch (err: any) {
      console.error('Error accepting call:', err);
      setError(err.message || 'Lỗi chấp nhận cuộc gọi');
      rejectCall();
    }
  }, [socket, user?.id, otherUserId, getMediaStream, setupPeerConnection]);

  // Reject call
  const rejectCall = useCallback(() => {
    if (socket?.connected && user?.id) {
      socket.emit('call-rejected', {
        to: otherUserId,
        from: user.id,
      });
    }
    endCall();
  }, [socket, user?.id, otherUserId]);

  // End call
  const endCall = useCallback(() => {
    // Stop local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track: any) => {
        track.stop();
      });
      localStreamRef.current = null;
      setLocalStream(null);
    }

    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    // Clear remote stream
    setRemoteStream(null);
    setIsConnected(false);
    setCallStatus('ended');

    // Stop duration timer
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
    callStartTimeRef.current = null;
    setCallDuration(0);

    // Notify other user
    if (socket?.connected && user?.id && callStatus !== 'idle' && callStatus !== 'ended') {
      socket.emit('end-call', {
        to: otherUserId,
        from: user.id,
      });
    }
  }, [socket, user?.id, otherUserId, callStatus]);

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      if (audioTracks.length > 0) {
        const newMutedState = !isAudioMuted;
        audioTracks[0].enabled = !newMutedState;
        setIsAudioMuted(newMutedState);
      }
    }
  }, [isAudioMuted]);

  // Toggle video
  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks();
      if (videoTracks.length > 0) {
        const newVideoState = !isVideoEnabled;
        videoTracks[0].enabled = newVideoState;
        setIsVideoEnabled(newVideoState);
      }
    }
  }, [isVideoEnabled]);

  // Switch camera (front/back)
  const switchCamera = useCallback(() => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        // React Native WebRTC camera switch
        // The track should have _switchCamera method or we need to recreate stream
        if (videoTrack._switchCamera) {
          videoTrack._switchCamera();
        } else {
          // Alternative: stop current track and get new stream with different facingMode
          const facingMode = videoTrack.getSettings().facingMode === 'user' ? 'environment' : 'user';
          videoTrack.stop();
          
          // Get new stream with different camera
          mediaDevices.getUserMedia({
            video: { facingMode },
            audio: true,
          }).then((newStream: MediaStream) => {
            const newVideoTrack = newStream.getVideoTracks()[0];
            if (peerConnectionRef.current && localStreamRef.current) {
              const sender = peerConnectionRef.current.getSenders().find((s: any) => 
                s.track && s.track.kind === 'video'
              );
              if (sender) {
                sender.replaceTrack(newVideoTrack);
              }
              
              // Update local stream
              localStreamRef.current.getVideoTracks().forEach((track: any) => track.stop());
              localStreamRef.current.removeTrack(localStreamRef.current.getVideoTracks()[0]);
              localStreamRef.current.addTrack(newVideoTrack);
              setLocalStream(localStreamRef.current);
            }
          }).catch((err: any) => {
            console.error('Error switching camera:', err);
            setError('Không thể chuyển camera');
          });
        }
      }
    }
  }, []);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    // Listen for call answer
    const handleCallAnswer = async (data: { answer: RTCSessionDescription; from: string }) => {
      if (data.from === otherUserId && peerConnectionRef.current && RTCSessionDescription) {
        try {
          await peerConnectionRef.current.setRemoteDescription(
            new RTCSessionDescription(data.answer)
          );
          setCallStatus('connected');
        } catch (err: any) {
          console.error('Error setting remote description:', err);
          setError('Lỗi kết nối');
        }
      }
    };

    // Listen for ICE candidates
    const handleIceCandidate = async (data: { candidate: RTCIceCandidate; from: string }) => {
      if (data.from === otherUserId && peerConnectionRef.current && data.candidate && RTCIceCandidate) {
        try {
          await peerConnectionRef.current.addIceCandidate(
            new RTCIceCandidate(data.candidate)
          );
        } catch (err: any) {
          console.error('Error adding ICE candidate:', err);
        }
      }
    };

    // Listen for call ended
    const handleCallEnded = (data: { from: string }) => {
      if (data.from === otherUserId) {
        endCall();
      }
    };

    // Listen for call rejected
    const handleCallRejected = (data: { from: string }) => {
      if (data.from === otherUserId) {
        setCallStatus('ended');
        setError('Người dùng đã từ chối cuộc gọi');
        setTimeout(() => {
          endCall();
        }, 2000);
      }
    };

    socket.on('call-answer', handleCallAnswer);
    socket.on('ice-candidate', handleIceCandidate);
    socket.on('call-ended', handleCallEnded);
    socket.on('call-rejected', handleCallRejected);

    return () => {
      socket.off('call-answer', handleCallAnswer);
      socket.off('ice-candidate', handleIceCandidate);
      socket.off('call-ended', handleCallEnded);
      socket.off('call-rejected', handleCallRejected);
    };
  }, [socket, otherUserId, endCall]);

  // Call duration timer
  useEffect(() => {
    if (callStatus === 'connected' && !callStartTimeRef.current) {
      callStartTimeRef.current = Date.now();
      durationIntervalRef.current = setInterval(() => {
        if (callStartTimeRef.current) {
          const duration = Math.floor((Date.now() - callStartTimeRef.current) / 1000);
          setCallDuration(duration);
        }
      }, 1000);
    } else if (callStatus !== 'connected' && durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
      callStartTimeRef.current = null;
    }

    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, [callStatus]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      endCall();
    };
  }, [endCall]);

  return {
    callStatus,
    isConnected,
    localStream,
    remoteStream,
    isAudioMuted,
    isVideoEnabled,
    callDuration,
    error,
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleVideo,
    switchCamera,
  };
};
