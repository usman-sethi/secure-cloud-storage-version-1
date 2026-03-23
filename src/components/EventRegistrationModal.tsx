import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Upload, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../lib/auth';

interface EventRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: any;
}

export default function EventRegistrationModal({ isOpen, onClose, event }: EventRegistrationModalProps) {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [registrationId, setRegistrationId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    full_name: '',
    program: '',
    section: '',
    mobile_number: '+92 ',
    email: ''
  });

  const [paymentProof, setPaymentProof] = useState<string>('');

  const getStorageKey = () => {
    return user?.email ? `event_registrations_${user.email}` : 'event_registrations_guest';
  };

  useEffect(() => {
    if (isOpen && event) {
      // Check if already registered in local storage for this specific user
      const storageKey = getStorageKey();
      const storedRegs = JSON.parse(localStorage.getItem(storageKey) || '{}');
      
      if (storedRegs[event.id]) {
        const regId = storedRegs[event.id].id;
        setRegistrationId(regId);
        setStatus(storedRegs[event.id].status);
        setStep(4); // Show status

        // Fetch latest status from server
        fetch('/api/event-registrations')
          .then(res => res.json())
          .then(data => {
            if (Array.isArray(data)) {
              const currentReg = data.find((r: any) => r.id === regId);
              if (currentReg && currentReg.status !== storedRegs[event.id].status) {
                setStatus(currentReg.status);
                storedRegs[event.id].status = currentReg.status;
                localStorage.setItem(storageKey, JSON.stringify(storedRegs));
              }
            }
          })
          .catch(err => console.error('Failed to fetch latest status', err));
      } else {
        setStep(1);
        setFormData({
          full_name: user?.name || '',
          program: '',
          section: '',
          mobile_number: '+92 ',
          email: user?.email || ''
        });
        setPaymentProof('');
        setError('');
      }
    }
  }, [isOpen, event, user]);

  const handleMobileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    if (!val.startsWith('+92 ')) {
      val = '+92 ';
    }
    setFormData({ ...formData, mobile_number: val });
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Basic validation
    const mobileRegex = /^\+92 \d{3} \d{3} \d{4}$/;
    if (!mobileRegex.test(formData.mobile_number.replace(/-/g, ' '))) {
      // Allow some flexibility but enforce +92 and length
      const digits = formData.mobile_number.replace(/\D/g, '');
      if (digits.length !== 12) { // 92 + 10 digits
        setError('Mobile number must be in format +92 000 000 0000');
        return;
      }
    }

    setLoading(true);
    try {
      const res = await fetch('/api/event-registrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          event_id: event.id
        })
      });

      if (!res.ok) throw new Error('Failed to register');
      const data = await res.json();
      
      setRegistrationId(data.id);
      setStatus(data.status);
      
      // Save to local storage
      const storageKey = getStorageKey();
      const storedRegs = JSON.parse(localStorage.getItem(storageKey) || '{}');
      storedRegs[event.id] = { id: data.id, status: data.status };
      localStorage.setItem(storageKey, JSON.stringify(storedRegs));

      setStep(2); // Move to payment prompt
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPaymentProof(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePaymentSubmit = async () => {
    if (!paymentProof) {
      setError('Please upload a payment proof image');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/event-registrations/${registrationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment_proof: paymentProof, status: 'pending_approval' })
      });

      if (!res.ok) throw new Error('Failed to submit payment proof');
      const data = await res.json();
      
      setStatus(data.status);
      
      // Update local storage
      const storageKey = getStorageKey();
      const storedRegs = JSON.parse(localStorage.getItem(storageKey) || '{}');
      storedRegs[event.id] = { id: data.id, status: data.status };
      localStorage.setItem(storageKey, JSON.stringify(storedRegs));

      setStep(4);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-slate-900 rounded-2xl w-full max-w-md border border-white/10 overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
        >
          <div className="flex justify-between items-center p-6 border-b border-white/10 shrink-0">
            <h2 className="text-xl font-semibold text-white">Register for {event?.title}</h2>
            <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto">
            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-xl flex items-start gap-3 text-red-400">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            {step === 1 && (
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-800 border border-white/10 rounded-xl focus:outline-none focus:border-indigo-500 text-white"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Program *</label>
                  <input
                    type="text"
                    required
                    value={formData.program}
                    onChange={(e) => setFormData({ ...formData, program: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-800 border border-white/10 rounded-xl focus:outline-none focus:border-indigo-500 text-white"
                    placeholder="BSCS"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Section *</label>
                  <input
                    type="text"
                    required
                    value={formData.section}
                    onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-800 border border-white/10 rounded-xl focus:outline-none focus:border-indigo-500 text-white"
                    placeholder="A"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Mobile Number *</label>
                  <input
                    type="text"
                    required
                    value={formData.mobile_number}
                    onChange={handleMobileChange}
                    className="w-full px-4 py-2 bg-slate-800 border border-white/10 rounded-xl focus:outline-none focus:border-indigo-500 text-white"
                    placeholder="+92 000 000 0000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Email (Optional)</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-800 border border-white/10 rounded-xl focus:outline-none focus:border-indigo-500 text-white"
                    placeholder="john@example.com"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-6"
                >
                  {loading ? 'Registering...' : 'Submit Registration'}
                </button>
              </form>
            )}

            {step === 2 && (
              <div className="text-center py-6">
                <div className="w-16 h-16 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Successfully Registered!</h3>
                <p className="text-slate-300 mb-8">
                  Would you like to submit your payment proof now?
                </p>
                <div className="flex gap-4">
                  <button
                    onClick={() => {
                      setStep(4);
                      setStatus('registered');
                    }}
                    className="flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium transition-colors"
                  >
                    No, later
                  </button>
                  <button
                    onClick={() => setStep(3)}
                    className="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors"
                  >
                    Yes, submit now
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-xl font-bold text-white mb-2">Upload Payment Proof</h3>
                  <p className="text-slate-400 text-sm">Upload a screenshot of your payment receipt.</p>
                </div>

                <div className="border-2 border-dashed border-white/10 rounded-xl p-8 text-center hover:border-indigo-500/50 transition-colors relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  {paymentProof ? (
                    <img src={paymentProof} alt="Payment Proof" className="max-h-48 mx-auto rounded-lg" />
                  ) : (
                    <div className="flex flex-col items-center">
                      <Upload className="w-8 h-8 text-slate-400 mb-3" />
                      <p className="text-slate-300 font-medium">Click or drag image here</p>
                      <p className="text-slate-500 text-sm mt-1">PNG, JPG up to 5MB</p>
                    </div>
                  )}
                </div>

                <button
                  onClick={handlePaymentSubmit}
                  disabled={loading || !paymentProof}
                  className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Submitting...' : 'Submit Payment Proof'}
                </button>
              </div>
            )}

            {step === 4 && (
              <div className="text-center py-8">
                {status === 'approved' ? (
                  <>
                    <div className="w-16 h-16 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="w-8 h-8" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">Registration Approved</h3>
                    <p className="text-green-400 font-medium">Your payment has been accepted.</p>
                  </>
                ) : status === 'rejected' ? (
                  <>
                    <div className="w-16 h-16 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <X className="w-8 h-8" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">Registration Rejected</h3>
                    <p className="text-slate-300 mb-4">Your payment proof or registration was rejected by the admin.</p>
                    <button
                      onClick={() => setStep(3)}
                      className="py-2 px-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors"
                    >
                      Re-submit Payment Proof
                    </button>
                  </>
                ) : status === 'pending_approval' ? (
                  <>
                    <div className="w-16 h-16 bg-yellow-500/20 text-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <AlertCircle className="w-8 h-8" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">Payment Pending</h3>
                    <p className="text-slate-300">Your payment proof has been submitted and is pending admin approval.</p>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 bg-indigo-500/20 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="w-8 h-8" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">Successfully Registered</h3>
                    <p className="text-slate-300 mb-4">Please submit payment to respective member.</p>
                    <button
                      onClick={() => setStep(3)}
                      className="py-2 px-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors"
                    >
                      Upload Payment Proof Now
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
