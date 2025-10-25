import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { FiPhone, FiVideo, FiMic, FiMicOff, FiVideoOff, FiX, FiMaximize2, FiMinimize2 } from 'react-icons/fi';
import { getUserMedia, formatMediaError, isNative } from '../../utils/mediaPermissions';

const CallOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.95);
  z-index: 9999;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  @media (max-width: 768px) {
    background: #000;
  }
`;

const VideoContainer = styled.div`
  position: relative;
  width: 100%;
  max-width: ${props => props.isMinimized ? '300px' : '1200px'};
  height: ${props => props.isMinimized ? '200px' : '80vh'};
  background: #1a1a1a;
  border-radius: ${props => props.isMinimized ? '12px' : '16px'};
  overflow: hidden;
  transition: all 0.3s ease;

  @media (max-width: 768px) {
    max-width: 100%;
    height: 100vh;
    border-radius: 0;
  }
`;

const RemoteVideo = styled.video`
  width: 100%;
  height: 100%;
  object-fit: cover;
  background: #000;
`;

const LocalVideo = styled.video`
  position: absolute;
  top: 20px;
  right: 20px;
  width: ${props => props.isMinimized ? '80px' : '200px'};
  height: ${props => props.isMinimized ? '100px' : '150px'};
  border-radius: 12px;
  object-fit: cover;
  background: #2a2a2a;
  border: 2px solid rgba(255, 255, 255, 0.2);
  z-index: 10;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    border-color: rgba(255, 255, 255, 0.4);
  }

  @media (max-width: 768px) {
    top: 10px;
    right: 10px;
    width: 100px;
    height: 80px;
  }
`;

const CallInfo = styled.div`
  position: absolute;
  top: 30px;
  left: 30px;
  color: white;
  z-index: 10;

  @media (max-width: 768px) {
    top: 15px;
    left: 15px;
  }
`;

const CallerName = styled.h2`
  font-size: 24px;
  font-weight: 600;
  margin: 0 0 8px 0;

  @media (max-width: 768px) {
    font-size: 20px;
  }
`;

const CallStatus = styled.p`
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  margin: 0;
`;

const CallDuration = styled.p`
  font-size: 14px;
  color: rgba(255, 255, 255, 0.9);
  margin: 5px 0 0 0;
  font-weight: 500;
`;

const ControlsContainer = styled.div`
  position: absolute;
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 20px;
  z-index: 10;

  @media (max-width: 768px) {
    bottom: 30px;
    gap: 15px;
  }
`;

const ControlButton = styled.button`
  width: 60px;
  height: 60px;
  border-radius: 50%;
  border: none;
  background: ${props => props.danger ? '#e74c3c' : 'rgba(255, 255, 255, 0.2)'};
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);

  &:hover {
    background: ${props => props.danger ? '#c0392b' : 'rgba(255, 255, 255, 0.3)'};
    transform: scale(1.1);
  }

  &:active {
    transform: scale(0.95);
  }

  &.disabled {
    background: rgba(100, 100, 100, 0.5);
  }

  @media (max-width: 768px) {
    width: 55px;
    height: 55px;
  }
`;

const MinimizeButton = styled.button`
  position: absolute;
  top: 20px;
  right: 80px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  z-index: 10;

  &:hover {
    background: rgba(255, 255, 255, 0.3);
  }

  @media (max-width: 768px) {
    display: none;
  }
`;

const IncomingCallOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  z-index: 9999;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  animation: fadeIn 0.3s ease;

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;

const IncomingCallAvatar = styled.div`
  width: 150px;
  height: 150px;
  border-radius: 50%;
  background: ${props => props.avatar ? `url(${props.avatar})` : '#555'};
  background-size: cover;
  background-position: center;
  margin-bottom: 30px;
  border: 5px solid rgba(255, 255, 255, 0.3);
  animation: pulse 2s ease-in-out infinite;

  @keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
  }

  @media (max-width: 768px) {
    width: 120px;
    height: 120px;
  }
`;

const IncomingCallName = styled.h2`
  font-size: 32px;
  color: white;
  margin: 0 0 10px 0;
  font-weight: 600;

  @media (max-width: 768px) {
    font-size: 24px;
  }
`;

const IncomingCallType = styled.p`
  font-size: 18px;
  color: rgba(255, 255, 255, 0.9);
  margin: 0 0 50px 0;

  @media (max-width: 768px) {
    font-size: 16px;
  }
`;

const IncomingCallButtons = styled.div`
  display: flex;
  gap: 40px;

  @media (max-width: 768px) {
    gap: 30px;
  }
`;

const IncomingCallButton = styled.button`
  width: 70px;
  height: 70px;
  border-radius: 50%;
  border: none;
  background: ${props => props.accept ? '#2ecc71' : '#e74c3c'};
  color: white;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);

  &:hover {
    transform: scale(1.1);
  }

  &:active {
    transform: scale(0.95);
  }

  @media (max-width: 768px) {
    width: 65px;
    height: 65px;
  }
`;

const ButtonLabel = styled.span`
  margin-top: 10px;
  font-size: 14px;
  color: white;
`;

const VideoCall = ({ 
  conversation, 
  isVideoCall = true, 
  onClose,
  isIncoming = false,
  onAccept,
  onReject,
  socket
}) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(isVideoCall);
  const [isMinimized, setIsMinimized] = useState(false);
  const [callStatus, setCallStatus] = useState(isIncoming ? 'incoming' : 'connecting');
  const [callDuration, setCallDuration] = useState(0);
  const [isCallAccepted, setIsCallAccepted] = useState(false);
  
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);

  // Format duration to MM:SS
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Initialize media stream
  useEffect(() => {
    const initMediaStream = async () => {
      try {
        console.log('🎥 Initializing media stream...', { 
          isNative: isNative(), 
          isVideoCall, 
          isIncoming,
          isCallAccepted 
        });
        
        // Use utility function that works on both web and native
        const stream = await getUserMedia(isVideoCall);
        
        console.log('✅ Media stream obtained:', stream);
        console.log('   Video tracks:', stream.getVideoTracks().length);
        console.log('   Audio tracks:', stream.getAudioTracks().length);
        
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        if (!isIncoming) {
          // Initiator: create offer
          setupPeerConnection(stream);
          createOffer();
        }
      } catch (error) {
        console.error('❌ Error accessing media devices:', error);
        
        // Use utility function for error formatting
        const errorMessage = formatMediaError(error);
        alert(errorMessage);
        onClose();
      }
    };

    if (isCallAccepted || !isIncoming) {
      initMediaStream();
    }

    return () => {
      // Cleanup
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
    };
  }, [isVideoCall, isIncoming, isCallAccepted, onClose]);

  // Setup WebRTC peer connection
  const setupPeerConnection = (stream) => {
    const configuration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    };

    const pc = new RTCPeerConnection(configuration);
    peerConnectionRef.current = pc;

    // Add local stream tracks to peer connection
    stream.getTracks().forEach(track => {
      pc.addTrack(track, stream);
    });

    // Handle remote stream
    pc.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
        setCallStatus('connected');
      }
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('ice-candidate', {
          candidate: event.candidate,
          to: conversation.user_id
        });
      }
    };

    // Handle connection state changes
    pc.onconnectionstatechange = () => {
      console.log('Connection state:', pc.connectionState);
      if (pc.connectionState === 'connected') {
        setCallStatus('connected');
      } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        handleEndCall();
      }
    };
  };

  // Create and send offer
  const createOffer = async () => {
    try {
      const offer = await peerConnectionRef.current.createOffer();
      await peerConnectionRef.current.setLocalDescription(offer);
      
      if (socket) {
        socket.emit('call-offer', {
          offer,
          to: conversation.user_id,
          from: localStorage.getItem('userId'),
          isVideo: isVideoCall
        });
      }
    } catch (error) {
      console.error('Error creating offer:', error);
    }
  };

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    socket.on('call-answer', async ({ answer }) => {
      try {
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
      } catch (error) {
        console.error('Error setting remote description:', error);
      }
    });

    socket.on('ice-candidate', async ({ candidate }) => {
      try {
        await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (error) {
        console.error('Error adding ICE candidate:', error);
      }
    });

    socket.on('call-ended', () => {
      handleEndCall();
    });

    return () => {
      socket.off('call-answer');
      socket.off('ice-candidate');
      socket.off('call-ended');
    };
  }, [socket]);

  // Call duration timer
  useEffect(() => {
    let interval;
    if (callStatus === 'connected') {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [callStatus]);

  // Handle accepting incoming call
  const handleAcceptCall = async () => {
    setIsCallAccepted(true);
    setCallStatus('connecting');
    
    if (onAccept) {
      onAccept();
    }

    // Get media stream using utility function
    try {
      const stream = await getUserMedia(isVideoCall);
      
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      setupPeerConnection(stream);

      // Wait for offer from caller (should be received via socket)
      // This would be handled in socket listeners
    } catch (error) {
      console.error('Error accepting call:', error);
      const errorMessage = formatMediaError(error);
      alert(errorMessage);
      handleRejectCall();
    }
  };

  // Handle rejecting incoming call
  const handleRejectCall = () => {
    if (socket) {
      socket.emit('call-rejected', {
        to: conversation.user_id
      });
    }
    if (onReject) {
      onReject();
    }
    onClose();
  };

  // Toggle mute
  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  // Toggle video
  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  };

  // End call
  const handleEndCall = () => {
    if (socket) {
      socket.emit('end-call', {
        to: conversation.user_id
      });
    }

    // Stop all tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }

    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }

    onClose();
  };

  // Render incoming call screen
  if (isIncoming && !isCallAccepted) {
    return (
      <IncomingCallOverlay>
        <IncomingCallAvatar avatar={conversation.avatar} />
        <IncomingCallName>
          {conversation.full_name || conversation.username}
        </IncomingCallName>
        <IncomingCallType>
          {isVideoCall ? 'Cuộc gọi video đến...' : 'Cuộc gọi thoại đến...'}
        </IncomingCallType>
        <IncomingCallButtons>
          <div style={{ textAlign: 'center' }}>
            <IncomingCallButton accept onClick={handleAcceptCall}>
              <FiPhone size={28} />
            </IncomingCallButton>
            <ButtonLabel>Chấp nhận</ButtonLabel>
          </div>
          <div style={{ textAlign: 'center' }}>
            <IncomingCallButton onClick={handleRejectCall}>
              <FiX size={28} />
            </IncomingCallButton>
            <ButtonLabel>Từ chối</ButtonLabel>
          </div>
        </IncomingCallButtons>
      </IncomingCallOverlay>
    );
  }

  // Render active call screen
  return (
    <CallOverlay>
      <VideoContainer isMinimized={isMinimized}>
        <RemoteVideo
          ref={remoteVideoRef}
          autoPlay
          playsInline
        />
        
        {isVideoCall && (
          <LocalVideo
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            isMinimized={isMinimized}
          />
        )}

        <CallInfo>
          <CallerName>
            {conversation.full_name || conversation.username}
          </CallerName>
          <CallStatus>
            {callStatus === 'connecting' && 'Đang kết nối...'}
            {callStatus === 'connected' && 'Đang gọi'}
            {callStatus === 'incoming' && 'Cuộc gọi đến...'}
          </CallStatus>
          {callStatus === 'connected' && (
            <CallDuration>{formatDuration(callDuration)}</CallDuration>
          )}
        </CallInfo>

        <MinimizeButton onClick={() => setIsMinimized(!isMinimized)}>
          {isMinimized ? <FiMaximize2 size={20} /> : <FiMinimize2 size={20} />}
        </MinimizeButton>

        <ControlsContainer>
          <ControlButton onClick={toggleMute} className={isMuted ? 'disabled' : ''}>
            {isMuted ? <FiMicOff size={24} /> : <FiMic size={24} />}
          </ControlButton>

          {isVideoCall && (
            <ControlButton onClick={toggleVideo} className={!isVideoEnabled ? 'disabled' : ''}>
              {isVideoEnabled ? <FiVideo size={24} /> : <FiVideoOff size={24} />}
            </ControlButton>
          )}

          <ControlButton danger onClick={handleEndCall}>
            <FiPhone size={24} style={{ transform: 'rotate(135deg)' }} />
          </ControlButton>
        </ControlsContainer>
      </VideoContainer>
    </CallOverlay>
  );
};

export default VideoCall;

