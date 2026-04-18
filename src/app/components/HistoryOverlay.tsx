import { useState, useEffect } from 'react';
import { ArrowLeft, Clock, Calendar, MessageSquare, User, Loader2, PlayCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface HistoryOverlayProps {
  onBack: () => void;
  onOpenChat: (doubtId: string) => void;
}

export function HistoryOverlay({ onBack, onOpenChat }: HistoryOverlayProps) {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Fetch solved doubts join with tutors
    const { data, error } = await supabase
      .from('doubts')
      .select('*, teacher:profiles!teacher_id(full_name, role)')
      .eq('student_id', user.id)
      .eq('status', 'solved')
      .order('created_at', { ascending: false });

    if (!error) {
      setSessions(data || []);
    }
    setLoading(false);
  };

  return (
    <div className="h-full bg-white flex flex-col font-sans">
      <div className="p-6 border-b flex items-center gap-4 bg-white sticky top-0 z-10">
        <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-2xl transition-colors">
          <ArrowLeft className="w-6 h-6 text-slate-900" />
        </button>
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">Study History</h2>
          <p className="text-[10px] text-blue-600 font-bold uppercase tracking-widest mt-0.5">Your past sessions</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-4 opacity-20" />
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Loading history...</p>
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-20 px-8">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Clock className="w-10 h-10 text-slate-300" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">No past sessions yet</h3>
            <p className="text-sm text-slate-500">Solve your first doubt to start building your history!</p>
          </div>
        ) : (
          sessions.map((session) => (
            <div key={session.id} className="bg-white rounded-[2.5rem] p-6 border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-blue-900/5 transition-all">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-3xl shadow-inner">
                    👨‍🏫
                  </div>
                  <div>
                    <h4 className="font-black text-slate-800 text-lg">{session.teacher?.full_name || 'Expert Tutor'}</h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[8px] font-black uppercase rounded tracking-widest border border-blue-100">
                        {session.subject}
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(session.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Session Type</p>
                  <p className="text-sm font-black text-indigo-600">Video Call</p>
                </div>
              </div>

              <div className="bg-slate-50 rounded-3xl p-5 mb-6 border border-slate-100">
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-2">Solving Note</p>
                <p className="text-sm text-slate-700 font-medium leading-relaxed italic">
                  "{session.content.slice(0, 100)}{session.content.length > 100 ? '...' : ''}"
                </p>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => onOpenChat(session.id)}
                  className="flex-1 bg-white border border-slate-200 text-slate-700 rounded-2xl py-3.5 text-xs font-black flex items-center justify-center gap-2 hover:bg-slate-50 active:scale-95 transition-all"
                >
                  <MessageSquare className="w-4 h-4 text-slate-400" />
                  View Chat History
                </button>
                <button 
                  className="flex-1 bg-blue-600 text-white rounded-2xl py-3.5 text-xs font-black shadow-lg shadow-blue-100 hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <PlayCircle className="w-4 h-4" />
                  Watch Record
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
