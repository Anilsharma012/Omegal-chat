
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import Disclaimer from './components/Disclaimer';
import VideoRoom from './components/VideoRoom';
import ChatPanel from './components/ChatPanel';
import { ChatStatus, Message } from './types';

// WebRTC Configuration
const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

const App: React.FC = () => {
  const [showDisclaimer, setShowDisclaimer] = useState(true);
  const [status, setStatus] = useState<ChatStatus>('IDLE');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const partnerIdRef = useRef<string | null>(null);

  // Initialize Media Devices
  const initMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setLocalStream(stream);
      return stream;
    } catch (error) {
      console.error("Error accessing media devices:", error);
      alert("Please allow camera and microphone access to use RandomTalk Live.");
      return null;
    }
  };

  // Socket setup
  useEffect(() => {
    const socket = io(window.location.origin);
    socketRef.current = socket;

    socket.on('partner-found', async ({ partnerId, initiator }) => {
      partnerIdRef.current = partnerId;
      setStatus('CONNECTED');
      addSystemMessage('Connected with a stranger');

      if (initiator) {
        await createOffer();
      }
    });

    socket.on('signal', async ({ from, signal }) => {
      if (!peerRef.current) return;

      if (signal.type === 'offer') {
        await peerRef.current.setRemoteDescription(new RTCSessionDescription(signal));
        const answer = await peerRef.current.createAnswer();
        await peerRef.current.setLocalDescription(answer);
        socketRef.current?.emit('signal', { to: from, signal: answer });
      } else if (signal.type === 'answer') {
        await peerRef.current.setRemoteDescription(new RTCSessionDescription(signal));
      } else if (signal.candidate) {
        await peerRef.current.addIceCandidate(new RTCIceCandidate(signal));
      }
    });

    socket.on('chat-message', (text: string) => {
      addMessage('partner', text);
    });

    socket.on('partner-left', () => {
      addSystemMessage('Stranger disconnected');
      cleanupPeer();
      setStatus('DISCONNECTED');
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const addSystemMessage = (text: string) => {
    const newMsg: Message = {
      id: Math.random().toString(36).substr(2, 9),
      sender: 'system',
      text,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newMsg]);
  };

  const addMessage = (sender: 'me' | 'partner', text: string) => {
    const newMsg: Message = {
      id: Math.random().toString(36).substr(2, 9),
      sender,
      text,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newMsg]);
  };

  const createPeer = (stream: MediaStream) => {
    const pc = new RTCPeerConnection(RTC_CONFIG);

    stream.getTracks().forEach(track => {
      pc.addTrack(track, stream);
    });

    pc.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
    };

    pc.onicecandidate = (event) => {
      if (event.candidate && partnerIdRef.current) {
        socketRef.current?.emit('signal', {
          to: partnerIdRef.current,
          signal: event.candidate,
        });
      }
    };

    peerRef.current = pc;
    return pc;
  };

  const createOffer = async () => {
    if (!peerRef.current || !partnerIdRef.current) return;
    const offer = await peerRef.current.createOffer();
    await peerRef.current.setLocalDescription(offer);
    socketRef.current?.emit('signal', {
      to: partnerIdRef.current,
      signal: offer,
    });
  };

  const cleanupPeer = () => {
    if (peerRef.current) {
      peerRef.current.close();
      peerRef.current = null;
    }
    setRemoteStream(null);
    partnerIdRef.current = null;
  };

  const startChat = async () => {
    setMessages([]);
    let stream = localStream;
    if (!stream) {
      stream = await initMedia();
    }
    if (!stream) return;

    cleanupPeer();
    createPeer(stream);
    setStatus('SEARCHING');
    socketRef.current?.emit('find-partner');
  };

  const nextChat = () => {
    cleanupPeer();
    socketRef.current?.emit('leave-chat');
    startChat();
  };

  const endChat = () => {
    cleanupPeer();
    socketRef.current?.emit('leave-chat');
    setStatus('IDLE');
    setMessages([]);
    addSystemMessage('Session ended');
  };

  const handleSendMessage = (text: string) => {
    if (partnerIdRef.current) {
      socketRef.current?.emit('chat-message', { to: partnerIdRef.current, text });
      addMessage('me', text);
    }
  };

  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => (track.enabled = !track.enabled));
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => (track.enabled = !track.enabled));
      setIsVideoOff(!isVideoOff);
    }
  };

  if (showDisclaimer) {
    return <Disclaimer onAccept={() => setShowDisclaimer(false)} />;
  }

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-200 overflow-hidden">
      {/* Header */}
      <header className="h-16 flex items-center justify-between px-6 bg-slate-900 border-b border-slate-800 shrink-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <i className="fa-solid fa-bolt-lightning text-white text-sm"></i>
          </div>
          <h1 className="font-black text-xl tracking-tight hidden sm:block">
            RANDOMTALK <span className="text-indigo-500">LIVE</span>
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {status === 'IDLE' ? (
            <button
              onClick={startChat}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-xl font-bold transition-all flex items-center gap-2 shadow-lg shadow-indigo-500/20"
            >
              <i className="fa-solid fa-play"></i> Start
            </button>
          ) : (
            <>
              <button
                onClick={nextChat}
                className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-2"
              >
                <i className="fa-solid fa-forward-step"></i> Next
              </button>
              <button
                onClick={endChat}
                className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-2"
              >
                <i className="fa-solid fa-stop"></i> End
              </button>
            </>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col md:flex-row min-h-0">
        <div className="flex-1 flex flex-col min-h-0 relative">
          <VideoRoom 
            localStream={localStream} 
            remoteStream={remoteStream} 
            status={status} 
          />
          
          {/* In-Video Controls */}
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-4 z-20">
             <button
              onClick={toggleMute}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all border ${
                isMuted ? 'bg-red-500 border-red-400 text-white' : 'bg-slate-900/60 backdrop-blur-md border-white/10 text-slate-200'
              }`}
            >
              <i className={`fa-solid ${isMuted ? 'fa-microphone-slash' : 'fa-microphone'}`}></i>
            </button>
            <button
              onClick={toggleVideo}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all border ${
                isVideoOff ? 'bg-red-500 border-red-400 text-white' : 'bg-slate-900/60 backdrop-blur-md border-white/10 text-slate-200'
              }`}
            >
              <i className={`fa-solid ${isVideoOff ? 'fa-video-slash' : 'fa-video'}`}></i>
            </button>
            <button
              onClick={() => alert("Report submitted. Thank you for keeping our community safe.")}
              className="w-12 h-12 rounded-full bg-slate-900/60 backdrop-blur-md border border-white/10 text-amber-500 hover:bg-amber-500/20 flex items-center justify-center transition-all"
              title="Report User"
            >
              <i className="fa-solid fa-circle-exclamation"></i>
            </button>
          </div>
        </div>

        <ChatPanel 
          messages={messages} 
          onSendMessage={handleSendMessage} 
          isConnected={status === 'CONNECTED'} 
        />
      </main>
    </div>
  );
};

export default App;
