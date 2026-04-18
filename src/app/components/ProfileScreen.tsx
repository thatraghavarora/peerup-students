import { useState, useEffect } from 'react';
import { Info } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface ProfileScreenProps {
  onNext: (name: string) => void;
  phoneNumber?: string;
  socialUser?: any;
}

export function ProfileScreen({ onNext, phoneNumber, socialUser }: ProfileScreenProps) {
  const [name, setName] = useState(socialUser?.displayName || '');
  const [gender, setGender] = useState('Male');
  const [studentType, setStudentType] = useState<'school' | 'college'>('school');
  const [classLevel, setClassLevel] = useState('');
  const [courseName, setCourseName] = useState('');
  const [semester, setSemester] = useState('');
  const [showReferral, setShowReferral] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchExistingData = async () => {
      const identifier = phoneNumber || socialUser?.email;
      if (!identifier) return;

      const { data } = await supabase
        .from('users')
        .select('*')
        .or(`phone_number.eq.${phoneNumber},email.eq.${socialUser?.email}`)
        .maybeSingle();

      if (data) {
        setName(data.full_name || name);
        setGender(data.gender || 'Male');
        setStudentType(data.student_type || 'school');
        setClassLevel(data.class_level || '');
        setCourseName(data.course_name || '');
        setSemester(data.semester || '');
      }
    };

    fetchExistingData();
  }, [phoneNumber, socialUser]);

  const genderOptions = ['Male', 'Female', 'Others', 'Prefer not to say'];

  const handleContinue = async () => {
    const isValid = name.trim() &&
      (studentType === 'school' ? classLevel.trim() : (courseName.trim() && semester.trim()));

    if (isValid) {
      setLoading(true);
      try {
        const { error } = await supabase
          .from('profiles')
          .upsert(
            {
              id: socialUser?.id || (await supabase.auth.getUser()).data.user?.id,
              full_name: name,
              role: 'student',
              gender: gender,
              course_name: studentType === 'college' ? courseName : null,
              semester: studentType === 'college' ? semester : null,
              class_level: studentType === 'school' ? classLevel : null
            }
          );

        if (error) throw error;
        onNext(name);
      } catch (error) {
        console.error("Error saving profile:", error);
        alert("Failed to save profile. Please try again.");
      } finally {
        setLoading(false);
      }
    }
  };

  const isFormValid = name.trim() &&
    (studentType === 'school' ? classLevel.trim() : (courseName.trim() && semester.trim()));

  return (
    <div className="h-full bg-white px-6 py-8 flex flex-col overflow-y-auto">
      {/* User Context */}
      <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
        <p className="text-xs text-blue-600 font-medium uppercase tracking-wider mb-1">Authenticated via</p>
        <p className="text-sm font-semibold text-gray-800">
          {phoneNumber ? `+91 ${phoneNumber}` : socialUser?.email}
        </p>
      </div>

      {/* Name Question */}
      <h1 className="text-2xl font-bold mb-6">What's your name??</h1>

      {/* Name Input */}
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="text-xl text-blue-600 outline-none border-b-2 border-gray-200 pb-2 mb-8 focus:border-blue-600 transition-colors"
        placeholder="Enter your name"
      />

      {/* Gender Label */}
      <div className="flex items-center gap-2 mb-4">
        <span className="font-medium">Gender</span>
        <Info className="w-4 h-4 text-gray-400" />
      </div>

      {/* Gender Pills */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        {genderOptions.map((option) => (
          <button
            key={option}
            onClick={() => setGender(option)}
            className={`px-4 py-3 rounded-full border-2 transition-colors ${
              gender === option
                ? 'border-blue-600 text-blue-600'
                : 'border-gray-200 text-gray-600'
            }`}
          >
            {option}
          </button>
        ))}
      </div>

      {/* Student Type */}
      <div className="mb-4">
        <span className="font-medium">I am a</span>
      </div>
      <div className="flex gap-3 mb-6">
        <button
          onClick={() => setStudentType('school')}
          className={`flex-1 px-4 py-3 rounded-full border-2 transition-colors ${
            studentType === 'school'
              ? 'border-blue-600 text-blue-600'
              : 'border-gray-200 text-gray-600'
          }`}
        >
          School Student
        </button>
        <button
          onClick={() => setStudentType('college')}
          className={`flex-1 px-4 py-3 rounded-full border-2 transition-colors ${
            studentType === 'college'
              ? 'border-blue-600 text-blue-600'
              : 'border-gray-200 text-gray-600'
          }`}
        >
          College Student
        </button>
      </div>

      {/* Class/Course Fields */}
      {studentType === 'school' ? (
        <div className="mb-8">
          <label className="block font-medium mb-2">Class</label>
          <input
            type="text"
            value={classLevel}
            onChange={(e) => setClassLevel(e.target.value)}
            placeholder="e.g., 10th, 12th"
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-blue-600 transition-colors"
          />
        </div>
      ) : (
        <>
          <div className="mb-4">
            <label className="block font-medium mb-2">Course Name</label>
            <input
              type="text"
              value={courseName}
              onChange={(e) => setCourseName(e.target.value)}
              placeholder="e.g., B.Tech, MBA, BBA"
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-blue-600 transition-colors"
            />
          </div>
          <div className="mb-8">
            <label className="block font-medium mb-2">Semester</label>
            <input
              type="text"
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              placeholder="e.g., 1st, 3rd, 5th"
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-blue-600 transition-colors"
            />
          </div>
        </>
      )}

      {/* Referral Code */}
      {!showReferral ? (
        <button
          onClick={() => setShowReferral(true)}
          className="text-blue-600 text-left mb-8"
        >
          Have a referral code ?
        </button>
      ) : (
        <input
          type="text"
          placeholder="Enter referral code"
          className="border-2 border-gray-200 rounded-xl px-4 py-3 mb-8 outline-none focus:border-blue-600 transition-colors"
        />
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Continue Button */}
      <button
        onClick={handleContinue}
        disabled={!isFormValid || loading}
        className="w-full bg-blue-600 text-white rounded-xl py-3.5 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
      >
        {loading ? 'Saving...' : 'Continue'}
      </button>
    </div>
  );
}