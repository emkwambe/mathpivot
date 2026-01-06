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

  return (
    <div className="space-y-6">
      {error && <Alert variant="destructive">{error}</Alert>}

      {/* Step 1: Select Student */}
      <div className={step === 1 ? '' : 'opacity-50'}>
        <h3 className="font-medium text-slate-900 mb-3">1. Select Student</h3>
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
        <div className={step === 2 ? '' : 'opacity-50'}>
          <h3 className="font-medium text-slate-900 mb-3">2. Select Tutor</h3>
          <div className="space-y-2">
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
                className={`w-full p-4 text-left border rounded-lg transition-colors ${
                  selectedTutor === tutor.id
                    ? 'border-sky-500 bg-sky-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-slate-900">{tutor.name}</p>
                    {tutor.bio && (
                      <p className="text-sm text-slate-600 mt-1">{tutor.bio}</p>
                    )}
                  </div>
                  <span className="text-sm text-slate-600">
                    {formatCurrency(tutor.hourlyRateCents)}/hr
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 3: Select Date */}
      {step >= 3 && (
        <div className={step === 3 ? '' : 'opacity-50'}>
          <h3 className="font-medium text-slate-900 mb-3">3. Select Date</h3>
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
          <h3 className="font-medium text-slate-900 mb-3">4. Select Time</h3>
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
        <div className="space-y-4 border-t border-slate-200 pt-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Notes for the tutor (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any specific topics or areas you'd like to focus on?"
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
              rows={3}
            />
          </div>

          {/* Summary */}
          <div className="bg-slate-50 rounded-lg p-4">
            <h4 className="font-medium text-slate-900 mb-2">Booking Summary</h4>
            <dl className="space-y-1 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-600">Student:</dt>
                <dd className="text-slate-900">
                  {students.find((s) => s.id === selectedStudent)?.name}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-600">Tutor:</dt>
                <dd className="text-slate-900">{selectedTutorData?.name}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-600">Date:</dt>
                <dd className="text-slate-900">
                  {new Date(selectedDate).toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                  })}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-600">Time:</dt>
                <dd className="text-slate-900">
                  {formatSlotTime(selectedSlot.start)} - {formatSlotTime(selectedSlot.end)}
                </dd>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200 mt-2">
                <dt className="text-slate-600">Credits Used:</dt>
                <dd className="font-medium text-slate-900">1 credit</dd>
              </div>
            </dl>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={isPending}
            className="w-full"
          >
            {isPending ? 'Booking...' : 'Confirm Booking'}
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
