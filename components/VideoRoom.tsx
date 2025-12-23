
import React, { useEffect, useRef } from 'react';

interface VideoRoomProps {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  status: string;
}

const VideoRoom: React.FC<VideoRoomProps> = ({ localStream, remoteStream, status }) => {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  return (
    <div className="flex-1 relative flex flex-col md:flex-row gap-4 p-4 min-h-0 bg-slate-950">
      {/* Remote Video Container */}
      <div className="flex-1 relative bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-inner flex items-center justify-center">
        {status === 'SEARCHING' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/80 z-10">
            <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-indigo-400 font-medium animate-pulse">Looking for someone special...</p>
          </div>
        )}
        
        {status === 'IDLE' && (
          <div className="text-slate-500 flex flex-col items-center">
            <i className="fa-solid fa-video-slash text-5xl mb-4 opacity-20"></i>
            <p className="text-lg">Click "Start" to meet people</p>
          </div>
        )}

        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />
        
        {/* Remote Label */}
        <div className="absolute bottom-4 left-4 bg-slate-900/60 backdrop-blur-md px-3 py-1 rounded-lg text-xs font-medium border border-white/10">
          Stranger
        </div>
      </div>

      {/* Local Video Container */}
      <div className="w-full md:w-72 h-48 md:h-auto md:aspect-video relative bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-lg">
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover mirror"
          style={{ transform: 'scaleX(-1)' }}
        />
        <div className="absolute bottom-4 left-4 bg-slate-900/60 backdrop-blur-md px-3 py-1 rounded-lg text-xs font-medium border border-white/10">
          You
        </div>
      </div>
    </div>
  );
};

export default VideoRoom;
