import { useState, useEffect, useRef } from 'react';
import { PhoneOff, Mic, MicOff, Camera, CameraOff, MonitorUp, Send, MessageSquare, X, Clock, AlertTriangle, RefreshCcw, Wifi, WifiOff } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface VideoCallScreenProps {
  doubtId?: string;
  currentUserId?: string;
  onEnd: () => void;
  remoteName: string;
}

export function VideoCallScreen({ doubtId, currentUserId, onEnd, remoteName }: VideoCallScreenProps) {
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCamOn, setIsCamOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [time, setTime] = useState(0);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [connStatus, setConnStatus] = useState('Booting WebRTC...');
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const signallingChannel = useRef<any>(null);
  const iceCandidateQueue = useRef<RTCIceCandidateInit[]>([]);
  const pingInterval = useRef<any>(null);

  // Identity: Student is Caller
  const isCaller = true; 

  useEffect(() => {
    const timer = setInterval(() => setTime(prev => prev + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (doubtId) {
      initCall();
    }
    return () => {
      cleanup();
    };
  }, [doubtId]);

  const cleanup = () => {
    console.log("Cleaning up WebRTC...");
    if (pingInterval.current) clearInterval(pingInterval.current);
    streamRef.current?.getTracks().forEach(track => track.stop());
    if (peerConnection.current) {
        peerConnection.current.close();
        peerConnection.current = null;
    }
    if (signallingChannel.current) {
        supabase.removeChannel(signallingChannel.current);
    }
  };

  const initCall = async () => {
    try {
      setConnStatus("Accessing Media Devices...");
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 1280, height: 720 }, 
        audio: true 
      });
      streamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      setConnStatus("Media Ready. Creating Peer...");
      setupWebRTC(stream);
    } catch (err: any) {
      console.error("Camera fail:", err);
      setMediaError("Using Audio Fallback");
      const audioOnly = await navigator.mediaDevices.getUserMedia({ audio: true }).catch(() => null);
      if (audioOnly) {
          streamRef.current = audioOnly;
          setupWebRTC(audioOnly);
      } else {
          setConnStatus("Media Error");
          setMediaError("Blocked: Mic access required.");
          // Still try to connect data
          setupWebRTC(new MediaStream());
      }
    }
  };

  const setupWebRTC = (stream: MediaStream) => {
    const pc = new RTCPeerConnection({
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
            { urls: 'stun:stun3.l.google.com:19302' },
            { urls: 'stun:stun4.l.google.com:19302' }
        ]
    });
    peerConnection.current = pc;

    stream.getTracks().forEach(track => pc.addTrack(track, stream));

    pc.ontrack = (event) => {
      console.log("Remote view received");
      setConnStatus("Live Connection");
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = event.streams[0];
    };

    pc.oniceconnectionstatechange = () => {
        setConnStatus(`Status: ${pc.iceConnectionState}`);
        if (pc.iceConnectionState === 'disconnected') setConnStatus("Reconnecting...");
    };

    // Use a unique but consistent channel per doubt
    const channel = supabase.channel(`webrtc_v5_${doubtId}`);
    signallingChannel.current = channel;

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        channel.send({
          type: 'broadcast',
          event: 'candidate',
          payload: { candidate: event.candidate, senderId: currentUserId }
        });
      }
    };

    const processIceQueue = async () => {
        while (iceCandidateQueue.current.length > 0) {
            const cand = iceCandidateQueue.current.shift();
            if (cand && pc.remoteDescription) {
               await pc.addIceCandidate(new RTCIceCandidate(cand)).catch(e => console.warn(e));
            }
        }
    };

    const handleOffer = async (offer: any) => {
        console.log("Offer received");
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        await processIceQueue();
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        channel.send({
            type: 'broadcast',
            event: 'answer',
            payload: { answer, senderId: currentUserId }
        });
    };

    const handleAnswer = async (answer: any) => {
        console.log("Answer received");
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
        await processIceQueue();
    };

    channel
      .on('broadcast', { event: 'ping' }, () => {
          console.log("Peer discovered");
          if (isCaller) {
              pc.createOffer().then(offer => {
                  pc.setLocalDescription(offer);
                  channel.send({ type: 'broadcast', event: 'offer', payload: { offer, senderId: currentUserId }});
              });
          } else {
              channel.send({ type: 'broadcast', event: 'pong', payload: { senderId: currentUserId } });
          }
      })
      .on('broadcast', { event: 'pong' }, () => {
          if (isCaller) {
              pc.createOffer().then(offer => {
                  pc.setLocalDescription(offer);
                  channel.send({ type: 'broadcast', event: 'offer', payload: { offer, senderId: currentUserId }});
              });
          }
      })
      .on('broadcast', { event: 'offer' }, ({ payload }) => {
        if (payload.senderId !== currentUserId) handleOffer(payload.offer);
      })
      .on('broadcast', { event: 'answer' }, ({ payload }) => {
        if (payload.senderId !== currentUserId) handleAnswer(payload.answer);
      })
      .on('broadcast', { event: 'candidate' }, ({ payload }) => {
        if (payload.senderId !== currentUserId) {
          if (pc.remoteDescription) {
             pc.addIceCandidate(new RTCIceCandidate(payload.candidate)).catch(e => console.warn(e));
          } else {
             iceCandidateQueue.current.push(payload.candidate);
          }
        }
      })
      .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
              console.log("Signal Ready");
              setConnStatus("Scanning for Peer...");
              // Aggressive Pinging
              pingInterval.current = setInterval(() => {
                  channel.send({ type: 'broadcast', event: 'ping', payload: { senderId: currentUserId } });
              }, 3000);
          }
      });
  };

  const handleRetry = () => {
    cleanup();
    initCall();
  };

  const handleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        console.log("Launching Screen Share...");
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ 
            video: { 
                height: { ideal: 1080 },
                frameRate: { ideal: 15 }
            },
            audio: false 
        });
        
        const screenTrack = screenStream.getVideoTracks()[0];
        const sender = peerConnection.current?.getSenders().find(s => s.track?.kind === 'video');
        
        if (sender) {
            sender.replaceTrack(screenTrack).catch(e => console.error(e));
        }
        
        if (localVideoRef.current) {
            localVideoRef.current.srcObject = screenStream;
            localVideoRef.current.style.objectFit = 'contain'; // Better for screen text
        }
        
        setIsScreenSharing(true);
        setConnStatus("Presenting Screen");

        screenTrack.onended = () => {
          console.log("Screen share ended via system");
          resetCamera();
        };
      } catch (err) {
        console.error("Screen share fail:", err);
      }
    } else {
      resetCamera();
    }
  };

  const resetCamera = async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { width: 1280, height: 720 }, 
            audio: true 
        });
        const videoTrack = stream.getVideoTracks()[0];
        const sender = peerConnection.current?.getSenders().find(s => s.track?.kind === 'video');
        
        if (sender) {
            sender.replaceTrack(videoTrack).catch(e => console.error(e));
        }
        
        if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
            localVideoRef.current.style.objectFit = 'cover';
        }
        
        setIsScreenSharing(false);
        setConnStatus("Live Connection");
    } catch (e) {
        console.error(e);
        setIsScreenSharing(false);
    }
  };

  return (
    <div className="h-full bg-slate-950 flex flex-col relative overflow-hidden font-sans">
      {/* HUD Info */}
      <div className="absolute top-6 left-0 right-0 z-30 flex flex-col items-center gap-2 pointer-events-none">
        <div className="bg-white/10 backdrop-blur-3xl border border-white/20 px-5 py-2 rounded-2xl flex items-center gap-4 shadow-2xl pointer-events-auto">
          <div className="flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
             <span className="text-[9px] font-black uppercase tracking-widest text-white/70">Session ID: {doubtId?.slice(0, 8)}</span>
          </div>
          <div className="w-px h-4 bg-white/20" />
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-sky-400" />
            <span className="font-mono font-bold text-lg text-white">{formatTime(time)}</span>
          </div>
        </div>
        <div className="bg-black/60 px-4 py-1.5 rounded-full border border-white/5 shadow-inner pointer-events-auto">
            <div className="flex items-center gap-2">
               {connStatus.includes('Connected') || connStatus.includes('Live') ? <Wifi className="w-3 h-3 text-green-400" /> : <WifiOff className="w-3 h-3 text-red-400 animate-pulse" />}
               <p className="text-[9px] font-black text-white uppercase tracking-widest">{connStatus}</p>
            </div>
        </div>
      </div>

      {/* Main Remote View */}
      <div className="flex-1 relative bg-slate-900 overflow-hidden">
        <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-contain" />
        {!remoteVideoRef.current?.srcObject && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 transition-all">
             <div className="w-28 h-28 bg-sky-600/10 rounded-full flex items-center justify-center text-5xl font-black mb-6 animate-pulse border-2 border-sky-500/20 shadow-[0_0_50px_rgba(14,165,233,0.1)]">
                {remoteName?.charAt(0)}
             </div>
             <h3 className="text-2xl font-black text-white tracking-tight">{remoteName}</h3>
             <p className="text-[10px] text-sky-400 font-black uppercase tracking-[0.4em] mt-4 opacity-70">Handshaking Secure Link...</p>
             <div className="mt-12 flex flex-col items-center gap-4">
                <button onClick={handleRetry} className="bg-white/5 border border-white/10 px-6 py-3 rounded-2xl flex items-center gap-3 transition-all hover:bg-white/10 hover:border-white/30 group">
                   <RefreshCcw className="w-4 h-4 text-white/40 group-hover:rotate-180 transition-transform duration-500" />
                   <span className="text-xs font-black uppercase text-white/60">Force Recalibrate</span>
                </button>
             </div>
          </div>
        )}
      </div>

      {/* Local Preview */}
      <div className="absolute top-8 right-6 w-36 h-48 bg-slate-800 rounded-3xl border border-white/20 overflow-hidden shadow-2xl z-20 group transition-all">
         <video ref={localVideoRef} autoPlay muted playsInline className={`w-full h-full object-cover transition-opacity duration-700 ${!isCamOn ? 'opacity-0' : 'opacity-100'}`} />
         {!isCamOn && (
           <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 text-white/20 gap-2">
             <CameraOff className="w-7 h-7" />
             <span className="text-[8px] font-black uppercase tracking-widest">Privacy On</span>
           </div>
         )}
         {mediaError && (
            <div className="absolute top-2 left-2 right-2 bg-red-600/90 text-white text-[8px] px-2 py-1 rounded-lg font-black uppercase text-center animate-bounce">
                {mediaError}
            </div>
         )}
      </div>

      {/* Control Bar */}
      <div className="absolute bottom-12 left-0 right-0 z-40 px-8 flex justify-center">
        <div className="bg-black/80 backdrop-blur-3xl border border-white/10 p-5 rounded-[3.5rem] flex items-center gap-6 shadow-[0_32px_128px_-16px_rgba(0,0,0,1)]">
          <div className="flex gap-4 border-r border-white/10 pr-6">
            <button onClick={() => { setIsMicOn(!isMicOn); streamRef.current?.getAudioTracks().forEach(t => t.enabled = !isMicOn); }} className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${isMicOn ? 'bg-white/5 text-white' : 'bg-red-600 text-white'}`}>
              {isMicOn ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
            </button>
            <button onClick={() => { setIsCamOn(!isCamOn); streamRef.current?.getVideoTracks().forEach(t => t.enabled = !isCamOn); }} className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${isCamOn ? 'bg-white/5 text-white' : 'bg-red-600 text-white'}`}>
              {isCamOn ? <Camera className="w-6 h-6" /> : <CameraOff className="w-6 h-6" />}
            </button>
          </div>

          <button onClick={onEnd} className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center text-white shadow-2xl border-4 border-slate-950 hover:scale-110 active:scale-90 transition-all">
            <PhoneOff className="w-10 h-10" />
          </button>

          <div className="flex gap-4 border-l border-white/10 pl-6">
            <button onClick={handleScreenShare} className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${isScreenSharing ? 'bg-sky-600 text-white' : 'bg-white/5 text-white'}`}>
              <MonitorUp className="w-6 h-6" />
            </button>
            <button onClick={() => setShowChat(!showChat)} className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${showChat ? 'bg-white text-slate-950' : 'bg-white/5 text-white'}`}>
              <MessageSquare className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
