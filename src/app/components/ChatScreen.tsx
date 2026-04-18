import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Send, Image as ImageIcon, CheckCircle, Star, Video } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { VideoCallScreen } from './VideoCallScreen';

interface ChatScreenProps {
  doubtId: string;
  onBack: () => void;
}

export function ChatScreen({ doubtId, onBack }: ChatScreenProps) {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [doubtDetails, setDoubtDetails] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isRating, setIsRating] = useState(false);
  const [rating, setRating] = useState(5);
  const [activeCall, setActiveCall] = useState(true); 
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchInitialData();

    // Subscribe to new messages
    const channel = supabase
      .channel(`chat:${doubtId}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages',
        filter: `doubt_id=eq.${doubtId}` 
      }, payload => {
        setMessages(prev => [...prev, payload.new]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [doubtId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchInitialData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);

    // Fetch doubt info
    const { data: doubt } = await supabase
      .from('doubts')
      .select('*, student:profiles!student_id(full_name)')
      .eq('id', doubtId)
      .single();
    setDoubtDetails(doubt);

    // Fetch past messages
    const { data: msgs } = await supabase
      .from('messages')
      .select('*')
      .eq('doubt_id', doubtId)
      .order('created_at', { ascending: true });
    setMessages(msgs || []);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !currentUser) return;

    const { error } = await supabase
      .from('messages')
      .insert({
        doubt_id: doubtId,
        sender_id: currentUser.id,
        content: newMessage
      });

    if (!error) setNewMessage('');
  };

  const handleFinish = async () => {
    setIsRating(true);
  };

  const submitRating = async () => {
    try {
      await supabase
        .from('doubts')
        .update({ status: 'solved' })
        .eq('id', doubtId);

      await supabase
        .from('solved_history')
        .insert({
          doubt_id: doubtId,
          student_id: currentUser.id,
          rating: rating,
          resolution_type: 'chat'
        });

      onBack();
    } catch (err) {
      alert("Error closing session");
    }
  };

  if (isRating) {
    return (
      <div className="h-full bg-white flex flex-col items-center justify-center px-8 text-center">
        <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-6">
          <CheckCircle className="w-10 h-10 text-green-500" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Issue Solved?</h2>
        <p className="text-gray-500 mb-8">Please rate your experience with the tutor.</p>
        
        <div className="flex gap-2 mb-10">
          {[1, 2, 3, 4, 5].map(s => (
            <button key={s} onClick={() => setRating(s)}>
              <Star className={`w-10 h-10 ${rating >= s ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} />
            </button>
          ))}
        </div>

        <button 
          onClick={submitRating}
          className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold shadow-lg shadow-blue-100"
        >
          Submit Rating & Close
        </button>
      </div>
    );
  }

  return (
    <div className="h-full bg-white flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b flex items-center justify-between bg-white sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
            <ArrowLeft className="w-6 h-6 text-slate-800" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-base text-slate-900 leading-tight">Expert Session</h3>
              <span className="bg-green-100 text-green-700 text-[8px] font-black uppercase px-2 py-0.5 rounded-full animate-pulse">Live</span>
            </div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Connected with Peerup Expert</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setActiveCall(true)}
            className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl hover:bg-blue-100 transition-all active:scale-95"
          >
            <Video className="w-5 h-5" />
          </button>
          <button 
            onClick={handleFinish}
            className="bg-blue-600 text-white px-5 py-2.5 rounded-2xl text-xs font-black shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95"
          >
            End
          </button>
        </div>
      </div>

      {/* Video Call Overlay */}
      {activeCall && currentUser && (
        <div className="absolute inset-0 z-[60] bg-black">
          <VideoCallScreen 
            doubtId={doubtId}
            currentUserId={currentUser.id}
            remoteName="Expert Tutor" 
            onEnd={() => setActiveCall(false)} 
          />
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {/* Doubt Context */}
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm mb-6">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Doubt Subject: {doubtDetails?.subject}</p>
          <p className="text-sm font-medium">{doubtDetails?.content}</p>
          {doubtDetails?.image_url && (
            <img src={doubtDetails.image_url} alt="Doubt" className="mt-3 rounded-lg w-full max-h-40 object-cover border" />
          )}
        </div>

        {messages.map((msg, idx) => (
          <div 
            key={idx} 
            className={`flex ${msg.sender_id === currentUser?.id ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
              msg.sender_id === currentUser?.id 
                ? 'bg-blue-600 text-white rounded-tr-none' 
                : 'bg-white text-gray-800 rounded-tl-none border border-gray-200'
            }`}>
              {msg.content}
              <p className={`text-[9px] mt-1 opacity-60 ${msg.sender_id === currentUser?.id ? 'text-right' : 'text-left'}`}>
                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t safe-area-bottom">
        <div className="flex items-center gap-2 bg-gray-50 rounded-2xl px-4 py-2 border border-gray-100">
          <button className="p-2 text-gray-400 hover:text-blue-600">
            <ImageIcon className="w-5 h-5" />
          </button>
          <input 
            type="text" 
            placeholder="Type your explanation or query..." 
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            className="flex-1 bg-transparent py-2 outline-none text-sm"
          />
          <button 
            onClick={sendMessage}
            disabled={!newMessage.trim()}
            className="p-2 bg-blue-600 text-white rounded-xl disabled:opacity-50 shadow-sm shadow-blue-100"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
