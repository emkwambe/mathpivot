'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Select, Alert } from '@/components/ui';
import { formatCurrency } from '@/lib/utils';
import { createBooking } from '@/app/actions/booking';
import { getAvailableSlotsForDate } from '@/app/actions/availability';

type Student = {
  id: string;
  name: string;
  gradeLevel: number;
};

type Tutor = {
  id: string;
  name: string;
  bio: string | null;
  hourlyRateCents: number;
};

type Props = {
  students: Student[];
  tutors: Tutor[];
  creditBalance: number;
};

type Slot = {
  start: string;
  end: string;
};

export function BookingForm({ students, tutors, creditBalance }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [step, setStep] = useState(1);
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [selectedTutor, setSelectedTutor] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [availableSlots, setAvailableSlots] = useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const selectedTutorData = tutors.find((t) => t.id === selectedTutor);

  const handleDateChange = async (date: string) => {
    setSelectedDate(date);
    setSelectedSlot(null);
    setLoading(true);
    setError(null);

    try {
      const result = await getAvailableSlotsForDate(selectedTutor, date);
      if (result.error) {
        setError(result.error);
      } else {
        setAvailableSlots(result.slots);
      }
    } catch {
      setError('Failed to load available slots');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedSlot) return;

    setError(null);
    const formData = new FormData();
    formData.append('studentUserId', selectedStudent);
    formData.append('tutorUserId', selectedTutor);
    formData.append('startAt', selectedSlot.start);
    formData.append('endAt', selectedSlot.end);
    if (notes) formData.append('notes', notes);

    startTransition(async () => {
      const result = await createBooking(formData);
      if (result.success) {
        router.push('/parent?booked=true');
      } else {
        setError(result.error || 'Failed to create booking');
      }
    });
  };

  const formatSlotTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Get minimum date (tomorrow)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  // Get maximum date (2 weeks out)
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 14);
  const maxDateStr = maxDate.toISOString().split('T')[0];

  if (creditBalance < 1) {
    return (
      <Alert variant="warning">
        You need at least 1 credit to book a session. Please purchase a package.
      </Alert>
    );
  }

  const steps = [
    { number: 1, label: 'Student' },
    { number: 2, label: 'Tutor' },
    { number: 3, label: 'Date' },
    { number: 4, label: 'Time' },
    { number: 5, label: 'Confirm' },
  ];

  const currentStep = selectedSlot ? 5 : step;

  return (
    <div className="space-y-6">
      {/* Step Indicator */}
      <div className="flex items-center justify-between mb-8">
        {steps.map((s, index) => (
          <div key={s.number} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  currentStep >= s.number
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                {currentStep > s.number ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  s.number
                )}
              </div>
              <span className={`text-xs mt-2 ${currentStep >= s.number ? 'text-blue-600 font-medium' : 'text-slate-400'}`}>
                {s.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 ${currentStep > s.number ? 'bg-blue-600' : 'bg-slate-200'}`} />
            )}
          </div>
        ))}
      </div>

      {error && <Alert variant="destructive">{error}</Alert>}

      {/* Step 1: Select Student */}
      <div className={step === 1 ? '' : step > 1 ? 'opacity-60' : 'hidden'}>
        <h3 className="font-medium text-slate-900 mb-3 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm">1</span>
          Select Student
        </h3>
        <Select
          value={selectedStudent}
          onChange={(e) => {
            setSelectedStudent(e.target.value);
            if (e.target.value) setStep(Math.max(step, 2));
          }}
          placeholder="Choose a student..."
          options={students.map((student) => ({
            value: student.id,
            label: `${student.name} (Grade ${student.gradeLevel})`,
          }))}
        />
      </div>

      {/* Step 2: Select Tutor */}
      {step >= 2 && (
        <div className={step === 2 ? '' : 'opacity-60'}>
          <h3 className="font-medium text-slate-900 mb-3 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm">2</span>
            Select Tutor
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {tutors.map((tutor) => (
              <button
                key={tutor.id}
                type="button"
                onClick={() => {
                  setSelectedTutor(tutor.id);
                  setSelectedDate('');
                  setAvailableSlots([]);
                  setSelectedSlot(null);
                  setStep(Math.max(step, 3));
                }}
                className={`p-4 text-left border-2 rounded-xl transition-all ${
                  selectedTutor === tutor.id
                    ? 'border-blue-500 bg-blue-50 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold ${
                    selectedTutor === tutor.id ? 'bg-blue-500' : 'bg-gradient-to-r from-emerald-500 to-teal-500'
                  }`}>
                    {tutor.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-slate-900">{tutor.name}</p>
                      {selectedTutor === tutor.id && (
                        <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    {tutor.bio && (
                      <p className="text-sm text-slate-600 mt-1 line-clamp-2">{tutor.bio}</p>
                    )}
                    <p className="text-sm font-medium text-slate-700 mt-2">
                      {formatCurrency(tutor.hourlyRateCents)}/hr
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 3: Select Date */}
      {step >= 3 && (
        <div className={step === 3 ? '' : 'opacity-60'}>
          <h3 className="font-medium text-slate-900 mb-3 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm">3</span>
            Select Date
          </h3>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => {
              handleDateChange(e.target.value);
              if (e.target.value) setStep(Math.max(step, 4));
            }}
            min={minDate}
            max={maxDateStr}
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>
      )}

      {/* Step 4: Select Time Slot */}
      {step >= 4 && selectedDate && (
        <div>
          <h3 className="font-medium text-slate-900 mb-3 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm">4</span>
            Select Time
          </h3>
          {loading ? (
            <p className="text-slate-500 text-center py-4">Loading available times...</p>
          ) : availableSlots.length > 0 ? (
            <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
              {availableSlots.map((slot) => (
                <button
                  key={slot.start}
                  type="button"
                  onClick={() => setSelectedSlot(slot)}
                  className={`p-3 text-sm border rounded-lg transition-colors ${
                    selectedSlot?.start === slot.start
                      ? 'border-sky-500 bg-sky-50 text-sky-700'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {formatSlotTime(slot.start)}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-center py-4">
              No available times for this date. Please select another date.
            </p>
          )}
        </div>
      )}

      {/* Step 5: Notes & Confirm */}
      {selectedSlot && (
        <div className="space-y-4 border-t-2 border-slate-100 pt-6">
          <h3 className="font-medium text-slate-900 mb-3 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm">5</span>
            Confirm Booking
          </h3>

          {/* Summary Card */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-100">
            <div className="flex items-center gap-4 mb-4 pb-4 border-b border-blue-200">
              <div className="w-14 h-14 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center text-white font-bold text-lg">
                {selectedTutorData?.name.charAt(0)}
              </div>
              <div>
                <p className="font-semibold text-slate-900">{selectedTutorData?.name}</p>
                <p className="text-sm text-slate-600">
                  Session with {students.find((s) => s.id === selectedStudent)?.name}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-500">Date</p>
                <p className="font-medium text-slate-900">
                  {new Date(selectedDate).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>
              </div>
              <div>
                <p className="text-slate-500">Time</p>
                <p className="font-medium text-slate-900">
                  {formatSlotTime(selectedSlot.start)} - {formatSlotTime(selectedSlot.end)}
                </p>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-blue-200 flex items-center justify-between">
              <span className="text-slate-600">Credits to use:</span>
              <span className="text-lg font-bold text-blue-600">1 credit</span>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Notes for the tutor (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any specific topics or areas you'd like to focus on?"
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={3}
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={isPending}
            className="w-full py-3 text-base"
          >
            {isPending ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Booking...
              </span>
            ) : (
              'Confirm Booking'
            )}
          </Button>

          <p className="text-xs text-slate-500 text-center">
            By booking, you agree to our cancellation policy. Late cancellations (less than 24 hours)
            may forfeit the session credit.
          </p>
        </div>
      )}
    </div>
  );
}
