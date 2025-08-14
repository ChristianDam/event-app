import React, { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { EventWithDetails } from '../../types/events';
// import { validateEventField } from '../../utils/eventValidation'; // Reserved for future use

interface EventRegistrationFormProps {
  event: EventWithDetails;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface RegistrationFormData {
  attendeeName: string;
  attendeeEmail: string;
  attendeePhone?: string;
}

interface RegistrationFormErrors {
  attendeeName?: string;
  attendeeEmail?: string;
  attendeePhone?: string;
  general?: string;
}

export const EventRegistrationForm: React.FC<EventRegistrationFormProps> = ({
  event,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState<RegistrationFormData>({
    attendeeName: '',
    attendeeEmail: '',
    attendeePhone: '',
  });
  const [errors, setErrors] = useState<RegistrationFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const registerForEvent = useMutation(api.events.registerForEvent);

  const handleInputChange = (field: keyof RegistrationFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = (): RegistrationFormErrors => {
    const newErrors: RegistrationFormErrors = {};

    // Name validation
    if (!formData.attendeeName.trim()) {
      newErrors.attendeeName = 'Name is required';
    } else if (formData.attendeeName.trim().length < 2) {
      newErrors.attendeeName = 'Name must be at least 2 characters long';
    } else if (formData.attendeeName.trim().length > 100) {
      newErrors.attendeeName = 'Name must be less than 100 characters';
    }

    // Email validation
    if (!formData.attendeeEmail.trim()) {
      newErrors.attendeeEmail = 'Email is required';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.attendeeEmail.trim())) {
        newErrors.attendeeEmail = 'Please enter a valid email address';
      }
    }

    // Phone validation (optional)
    if (formData.attendeePhone && formData.attendeePhone.trim()) {
      const phoneRegex = /^[+]?[1-9][\d]{0,15}$/;
      if (!phoneRegex.test(formData.attendeePhone.replace(/\s/g, ''))) {
        newErrors.attendeePhone = 'Please enter a valid phone number';
      }
    }

    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return;

    // Validate form
    const formErrors = validateForm();
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      await registerForEvent({
        eventId: event._id,
        attendeeName: formData.attendeeName.trim(),
        attendeeEmail: formData.attendeeEmail.toLowerCase().trim(),
        attendeePhone: formData.attendeePhone?.trim() || undefined,
      });

      // Show success state
      setShowSuccess(true);
      
      // Call success callback after a delay
      setTimeout(() => {
        onSuccess();
        handleClose();
      }, 2000);

    } catch (error) {
      console.error('Registration failed:', error);
      setErrors({ 
        general: error instanceof Error ? error.message : 'Registration failed. Please try again.' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      attendeeName: '',
      attendeeEmail: '',
      attendeePhone: '',
    });
    setErrors({});
    setShowSuccess(false);
    setIsSubmitting(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden">
        
        {/* Success State */}
        {showSuccess && (
          <div className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Registration Successful!</h2>
            <p className="text-gray-600">
              You're all set for {event.title}. We'll send you a confirmation email shortly.
            </p>
          </div>
        )}

        {/* Main Form */}
        {!showSuccess && (
          <>
            {/* Header */}
            <div 
              className="px-6 py-4 border-b text-white"
              style={{ backgroundColor: event.team.primaryColor || '#3b82f6' }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-bold">Register for Event</h1>
                  <p className="text-white/80 text-sm">{event.title}</p>
                </div>
                <button
                  onClick={handleClose}
                  className="text-white/80 hover:text-white transition-colors"
                  disabled={isSubmitting}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={(e) => void handleSubmit(e)} className="p-6 space-y-4">
              {/* General Error */}
              {errors.general && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-red-800">
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm font-medium">{errors.general}</span>
                  </div>
                </div>
              )}

              {/* Name Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={formData.attendeeName}
                  onChange={(e) => handleInputChange('attendeeName', e.target.value)}
                  placeholder="Enter your full name"
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:border-transparent ${
                    errors.attendeeName 
                      ? 'border-red-300 focus:ring-red-500' 
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                  disabled={isSubmitting}
                  required
                />
                {errors.attendeeName && (
                  <p className="mt-1 text-sm text-red-600">{errors.attendeeName}</p>
                )}
              </div>

              {/* Email Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={formData.attendeeEmail}
                  onChange={(e) => handleInputChange('attendeeEmail', e.target.value)}
                  placeholder="Enter your email address"
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:border-transparent ${
                    errors.attendeeEmail 
                      ? 'border-red-300 focus:ring-red-500' 
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                  disabled={isSubmitting}
                  required
                />
                {errors.attendeeEmail && (
                  <p className="mt-1 text-sm text-red-600">{errors.attendeeEmail}</p>
                )}
              </div>

              {/* Phone Field (Optional) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number (Optional)
                </label>
                <input
                  type="tel"
                  value={formData.attendeePhone || ''}
                  onChange={(e) => handleInputChange('attendeePhone', e.target.value)}
                  placeholder="Enter your phone number"
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:border-transparent ${
                    errors.attendeePhone 
                      ? 'border-red-300 focus:ring-red-500' 
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                  disabled={isSubmitting}
                />
                {errors.attendeePhone && (
                  <p className="mt-1 text-sm text-red-600">{errors.attendeePhone}</p>
                )}
              </div>

              {/* Event Info Summary */}
              <div className="bg-gray-50 rounded-lg p-4 border">
                <h3 className="font-medium text-gray-900 mb-2">Event Details</h3>
                <div className="space-y-1 text-sm text-gray-600">
                  <div>📅 {new Date(event.startTime).toLocaleDateString()}</div>
                  <div>🕒 {new Date(event.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                  <div>📍 {event.venue}</div>
                  <div>🎫 Free Registration</div>
                </div>
              </div>

              {/* Terms */}
              <div className="text-xs text-gray-500">
                By registering, you agree to receive event updates and confirmations via email.
                Your information will only be used for this event and will not be shared with third parties.
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 text-white font-semibold rounded-lg hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: event.team.primaryColor || '#3b82f6' }}
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>Registering...</span>
                  </div>
                ) : (
                  'Complete Registration'
                )}
              </button>

              {/* Cancel Button */}
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="w-full py-2 px-4 text-gray-600 font-medium hover:text-gray-800 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};