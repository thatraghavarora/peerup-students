import { useState, useEffect } from 'react';
import { Upload, Camera, Keyboard, Clock, PlayCircle, Loader2, Lock, Crown } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface SuperAIPageProps {
  onPostDoubt: () => void;
  onSelectDoubt: (id: string) => void;
  onShowHistory: () => void;
}

export function SuperAIPage({ onPostDoubt, onSelectDoubt, onShowHistory }: SuperAIPageProps) {
  const [tutors, setTutors] = useState<any[]>([]);
  const [latestDoubt, setLatestDoubt] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // 1. Fetch Latest Teachers from profiles
      const { data: tutorData } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'teacher')
        .limit(3);
      setTutors(tutorData || []);

      // 2. Fetch Latest Doubt for this user
      if (user) {
        const { data: doubtData } = await supabase
          .from('doubts')
          .select('*')
          .eq('student_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        setLatestDoubt(doubtData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-6 pt-8 pb-6">
      {/* Hero Section */}
      <div className="mb-10 text-center relative">
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-blue-100 rounded-full blur-3xl opacity-50 -z-10 animate-pulse"></div>
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-100 rounded-full blur-3xl opacity-50 -z-10 animate-pulse delay-700"></div>
        
        <h2 className="text-4xl font-black text-slate-900 leading-tight mb-3">
          Solve with <span className="text-blue-600">Peerup!</span>
        </h2>
        <p className="text-slate-500 font-bold text-sm tracking-tight px-4 underline decoration-blue-100 decoration-4 underline-offset-4">
          "Your companion in every equation"
        </p>

        <button 
          onClick={onShowHistory}
          className="mt-6 mx-auto flex items-center gap-2 bg-white border border-slate-100 px-4 py-2 rounded-2xl shadow-sm hover:shadow-md transition-all text-slate-500 hover:text-blue-600 group"
        >
          <Clock className="w-4 h-4 transition-transform group-hover:rotate-12" />
          <span className="text-[10px] font-black uppercase tracking-widest">View Study History</span>
        </button>
      </div>


      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-12">
        <button 
          onClick={onPostDoubt}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-[2rem] px-6 py-6 flex items-center justify-center gap-4 font-black shadow-2xl shadow-blue-200 hover:shadow-blue-300 hover:-translate-y-1 transition-all active:scale-95 group"
        >
          <div className="bg-white/20 p-2 rounded-2xl group-hover:rotate-12 transition-transform">
            <Camera className="w-7 h-7" />
          </div>
          <span className="text-xl tracking-tight">Post Your Doubt</span>
        </button>

        <button 
          onClick={onPostDoubt}
          className="w-full border-2 border-dashed border-slate-200 hover:border-blue-400 bg-white rounded-[2rem] px-7 py-5 flex items-center gap-4 transition-all hover:bg-gray-50 group"
        >
          <div className="w-12 h-12 bg-slate-50 group-hover:bg-blue-50 rounded-2xl flex items-center justify-center transition-colors">
            <Upload className="w-6 h-6 text-slate-400 group-hover:text-blue-600" />
          </div>
          <div className="flex-1 text-left">
            <div className="text-slate-800 font-black text-base">Bulk Upload</div>
            <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Assignments & PDFs</div>
          </div>
        </button>
      </div>

      {/* Latest Tutor Contacts */}
      <div className="mb-6 flex items-center justify-between px-1">
        <div>
          <h3 className="font-black text-2xl text-slate-900 tracking-tight">Top Experts</h3>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Available right now</p>
        </div>
        <div className="flex items-center gap-2">
           <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-lg border border-amber-100">
             <Crown className="w-3 h-3 text-amber-600" />
             <span className="text-[9px] font-black text-amber-600 uppercase tracking-widest">Premium</span>
           </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600 opacity-20" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 pb-10">
          {tutors.map((tutor, idx) => (
            <div key={idx} className="relative group overflow-hidden rounded-[2rem]">
              <div className={`bg-white p-5 flex items-center gap-4 transition-all shadow-sm border border-slate-100 ${idx > 0 ? 'opacity-50 grayscale' : 'hover:border-blue-200 hover:shadow-xl hover:shadow-blue-900/5'}`}>
                <div className="w-16 h-16 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl flex items-center justify-center text-4xl shadow-inner border border-white">
                  {tutor.gender === 'Female' ? '👩‍🏫' : '👨‍🏫'}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-black text-slate-800 text-lg">{tutor.full_name}</h4>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{tutor.course_name || 'Expert'}</p>
                    <span className="w-1 h-1 bg-gray-200 rounded-full"></span>
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] font-black text-yellow-600">⭐ 4.9</span>
                    </div>
                  </div>
                </div>
                
                <button 
                  onClick={onPostDoubt}
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-lg active:scale-90 ${idx === 0 ? 'bg-blue-600 text-white shadow-blue-100 hover:bg-blue-700' : 'bg-slate-200 text-slate-400'}`}
                >
                  <PlayCircle className="w-6 h-6" />
                </button>
              </div>

              {/* Box Cover for Premium */}
              {idx > 0 && (
                <div className="absolute inset-0 bg-slate-900/10 backdrop-blur-[1px] flex items-center justify-center group-hover:bg-slate-900/20 transition-all">
                   <div className="bg-white p-3 rounded-2xl shadow-xl flex items-center gap-2 border border-slate-100 transform translate-y-2 group-hover:translate-y-0 transition-transform">
                      <Lock className="w-4 h-4 text-amber-600" />
                      <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Unlock with Premium</span>
                   </div>
                </div>
              )}
            </div>
          ))}
          
          {tutors.length === 0 && (
            <div className="text-center py-10 bg-slate-50 rounded-[2rem] border border-dashed border-slate-200">
              <p className="text-gray-400 text-sm font-bold uppercase tracking-widest">Finding active experts...</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}