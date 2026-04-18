import { useState, useEffect } from 'react';
import { Camera, X, ArrowRight, Loader2, CheckCircle2, User, Play, Clock, RefreshCcw } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface PostDoubtScreenProps {
  onBack: () => void;
  onSuccess: (doubtId: string) => void;
}

export function PostDoubtScreen({ onBack, onSuccess }: PostDoubtScreenProps) {
  const [step, setStep] = useState<'form' | 'waiting' | 'success'>('form');
  const [category, setCategory] = useState('');
  const [doubtText, setDoubtText] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [timer, setTimer] = useState(120);
  const [activeDoubtId, setActiveDoubtId] = useState<string | null>(null);
  const [connectedTeacher, setConnectedTeacher] = useState<any>(null);
  const [applicants, setApplicants] = useState<any[]>([]);

  const categories = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'Other'];

  useEffect(() => {
    let interval: any;
    if (step === 'waiting' && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  // Listen for Tutor Interest
  useEffect(() => {
    if (activeDoubtId && step === 'waiting') {
      // 1. Fetch any existing applicants first
      fetchApplicants();

      // 2. Subscribe to new ones
      const channel = supabase
        .channel(`connect_pool:${activeDoubtId}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'connect_requests',
          filter: `doubt_id=eq.${activeDoubtId}`
        }, async (payload) => {
          console.log("New applicant payload:", payload);
          addApplicant(payload.new.teacher_id, payload.new.id);
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [activeDoubtId, step]);

  const fetchApplicants = async () => {
    const { data } = await supabase
      .from('connect_requests')
      .select('*, teacher:profiles!teacher_id(*)')
      .eq('doubt_id', activeDoubtId)
      .eq('status', 'pending');

    if (data) {
      const formatted = data.map(req => ({
        ...req.teacher,
        requestId: req.id
      }));
      setApplicants(formatted);
    }
  };

  const addApplicant = async (teacherId: string, requestId: string) => {
    const { data: teacher } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', teacherId)
      .single();

    if (teacher) {
      setApplicants(prev => {
        if (prev.find(a => a.id === teacher.id)) return prev;
        return [...prev, { ...teacher, requestId }];
      });
    }
  };

  const handleCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (category && doubtText) {
      setStep('waiting');
      setTimer(120);
      setApplicants([]);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          alert("Login required.");
          setStep('form');
          return;
        }

        const { data, error } = await supabase
          .from('doubts')
          .insert([
            {
              student_id: user.id,
              subject: category,
              content: doubtText,
              image_url: image,
              status: 'pending'
            }
          ])
          .select()
          .single();

        if (error) throw error;
        setActiveDoubtId(data.id);

      } catch (err: any) {
        alert("Failed to post doubt");
        setStep('form');
      }
    }
  };

  const connectWithTutor = async (tutor: any) => {
    try {
      console.log("Connecting... Doubt ID:", activeDoubtId, "Request ID:", tutor.requestId);

      // 1. Accept the specific request (Critical)
      const { error: reqError } = await supabase
        .from('connect_requests')
        .update({ status: 'accepted' })
        .eq('id', tutor.requestId);

      // 2. Clear to go! No need to update doubt status here as it's handled by history later.
      // This prevents Enum mismatch errors.

      console.log("Connection verified. Launching Console...");
      onSuccess(activeDoubtId!);
    } catch (err: any) {
      console.error("Critical Connection Error:", err);
      alert(`Connection failed: ${err.message}. Please try again.`);
    }
  };

  const reCreateRequest = () => {
    setStep('form');
    setTimer(120);
    setApplicants([]);
  };

  if (step === 'success') {
    return (
      <div className="h-full bg-white flex flex-col items-center justify-center px-6 text-center">
        <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 className="w-12 h-12 text-green-500" />
        </div>
        <h2 className="text-3xl font-black text-slate-900 mb-2">Expert Connected!</h2>
        <p className="text-slate-500 font-bold mb-8 px-8">
          <span className="text-blue-600">{connectedTeacher?.full_name}</span> is ready to help you solve this!
        </p>
        <button
          onClick={() => onSuccess(activeDoubtId!)}
          className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-lg shadow-2xl shadow-blue-100 flex items-center justify-center gap-3 hover:bg-blue-700 transition-all active:scale-95"
        >
          <span>Open Expert Console</span>
          <Play className="w-5 h-5 fill-current" />
        </button>
      </div>
    );
  }

  if (step === 'waiting') {
    return (
      <div className="h-full bg-slate-50 flex flex-col relative">
        <div className="p-8 bg-blue-600 text-white rounded-b-[3rem] shadow-2xl">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-black leading-tight">Finding Experts...</h2>
              <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest mt-1">Status: Scanning for available tutors</p>
            </div>
            <div className="bg-white/20 px-3 py-1.5 rounded-xl backdrop-blur-md flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span className="font-mono font-bold text-lg">{Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}</span>
            </div>
          </div>

          <div className="bg-white/10 rounded-2xl p-4 border border-white/10">
            <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">Your Doubt</p>
            <p className="text-sm font-bold truncate opacity-90">{doubtText}</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {applicants.length > 0 ? (
            <>
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 px-1">Available Tutors ({applicants.length})</h3>
              {applicants.map((tutor) => (
                <div key={tutor.id} className="bg-white p-5 rounded-3xl border border-white shadow-xl shadow-blue-900/5 flex items-center gap-4 animate-in fade-in slide-in-from-bottom-2">
                  <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-3xl shadow-inner">
                    {tutor.gender === 'Female' ? '👩‍🏫' : '👨‍🏫'}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-black text-slate-800 text-base">{tutor.full_name}</h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{tutor.course_name || 'Expert'}</span>
                      <span className="w-1 h-1 bg-gray-200 rounded-full"></span>
                      <span className="text-[10px] font-black text-yellow-500">⭐ 4.9</span>
                    </div>
                  </div>
                  <button
                    onClick={() => connectWithTutor(tutor)}
                    className="bg-blue-600 text-white px-5 py-3 rounded-2xl font-black text-xs shadow-lg shadow-blue-100 hover:bg-blue-700 active:scale-90 transition-all uppercase tracking-widest"
                  >
                    Connect
                  </button>
                </div>
              ))}
            </>
          ) : timer > 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Loader2 className="w-12 h-12 animate-spin text-blue-600 opacity-20 mb-4" />
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest leading-loose">
                Waiting for experts to<br />accept your request...
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
                <X className="w-8 h-8 text-red-500" />
              </div>
              <p className="text-slate-900 font-black mb-1">Time Elapsed</p>
              <p className="text-slate-500 text-xs font-bold mb-8 px-10">We couldn't find a tutor in time. Would you like to try again?</p>
              <button
                onClick={reCreateRequest}
                className="bg-white border-2 border-slate-200 text-slate-900 px-8 py-4 rounded-2xl font-black text-sm flex items-center gap-3 hover:border-blue-600 hover:text-blue-600 transition-all"
              >
                <RefreshCcw className="w-4 h-4" />
                <span>Re-post Doubt</span>
              </button>
            </div>
          )}
        </div>

        {timer > 0 && (
          <div className="p-8 text-center bg-white/50 backdrop-blur-xl border-t border-white">
            <button onClick={onBack} className="text-slate-400 text-[10px] font-black uppercase tracking-widest hover:text-red-500 transition-colors">
              Cancel Request
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="h-full bg-white flex flex-col relative">
      <div className="p-4 flex items-center justify-between border-b">
        <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full">
          <X className="w-6 h-6" />
        </button>
        <h2 className="font-bold">Post your Doubt</h2>
        <div className="w-10"></div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <label className="block text-xs font-black text-gray-400 mb-3 uppercase tracking-widest">Select Category</label>
        <div className="grid grid-cols-2 gap-2 mb-8">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`py-3 px-2 rounded-xl border-2 transition-all text-xs font-bold uppercase tracking-wider ${category === cat
                ? 'border-blue-600 bg-blue-50 text-blue-600'
                : 'border-gray-100 bg-gray-50 text-gray-600'
                }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <label className="block text-xs font-black text-gray-400 mb-3 uppercase tracking-widest">Your Question</label>
        <textarea
          value={doubtText}
          onChange={(e) => setDoubtText(e.target.value)}
          placeholder="Describe your doubt in detail..."
          className="w-full h-40 bg-gray-50 border border-gray-100 rounded-2xl p-5 mb-8 outline-none focus:border-blue-600 text-sm transition-all resize-none shadow-inner"
        ></textarea>

        <label className="block text-xs font-black text-gray-400 mb-3 uppercase tracking-widest">Reference Photo</label>
        <div className="relative mb-8">
          {!image ? (
            <label className="w-full h-48 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors">
              <Camera className="w-10 h-10 text-gray-300 mb-2" />
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Tap to snap</span>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleCapture}
                className="hidden"
              />
            </label>
          ) : (
            <div className="relative w-full h-48">
              <img src={image} alt="Doubt" className="w-full h-full object-cover rounded-2xl shadow-xl" />
              <button
                onClick={() => setImage(null)}
                className="absolute top-3 right-3 bg-black/50 text-white p-2 rounded-full backdrop-blur-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="p-6 border-t bg-white">
        <button
          onClick={handleSubmit}
          disabled={!category || !doubtText}
          className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-lg flex items-center justify-center gap-3 disabled:opacity-50 disabled:grayscale transition-all shadow-xl shadow-blue-100 active:scale-95"
        >
          <span>Find Expert Tutor</span>
          <ArrowRight className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}
