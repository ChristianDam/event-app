import type React from "react";
import { useState } from "react";
import { toast } from "sonner";
import { useRegistrationForm } from "../../hooks/useRegistrationForm";
import type { EventWithDetails } from "../../types/events";
import { FormField, FormInput } from "../ui/form";

interface EventRegistrationFormProps {
  event: EventWithDetails;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const EventRegistrationForm: React.FC<EventRegistrationFormProps> = ({
  event,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [showSuccess, setShowSuccess] = useState(false);

  const {
    formData,
    errors,
    isValid,
    isSubmitting,
    handleInputChange,
    handleSubmit,
    resetForm,
  } = useRegistrationForm({
    eventId: event._id,
    onSuccess: () => {
      toast.success("Registration successful!", {
        description: "You have been registered for this event.",
      });
      setShowSuccess(true);
      setTimeout(() => {
        onSuccess();
        resetForm();
        setShowSuccess(false);
        onClose();
      }, 2000);
    },
    onError: (error) => {
      console.error("Registration failed:", error);
      toast.error("Registration failed", {
        description: error || "Please check your input and try again.",
      });
    },
  });

  const handleClose = () => {
    resetForm();
    setShowSuccess(false);
    onClose();
  };

  const onFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleSubmit();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden">
        {/* Success State */}
        {showSuccess && (
          <div className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Registration Successful!
            </h2>
            <p className="text-gray-600">
              You're all set for {event.title}. We'll send you a confirmation
              email shortly.
            </p>
          </div>
        )}

        {/* Main Form */}
        {!showSuccess && (
          <>
            {/* Header */}
            <div
              className="px-6 py-4 border-b text-white"
              style={{ backgroundColor: event.team.primaryColor || "#3b82f6" }}
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
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Form */}
            <form
              onSubmit={(e) => {
                void onFormSubmit(e);
              }}
              className="p-6 space-y-4"
            >
              <FormField
                id="attendeeName"
                label="Full Name"
                required
                error={errors.attendeeName}
              >
                <FormInput
                  id="attendeeName"
                  type="text"
                  value={formData.attendeeName}
                  onChange={(e) =>
                    handleInputChange("attendeeName", e.target.value)
                  }
                  placeholder="Enter your full name"
                  error={errors.attendeeName}
                  disabled={isSubmitting}
                  className="p-3"
                />
              </FormField>

              <FormField
                id="attendeeEmail"
                label="Email Address"
                required
                error={errors.attendeeEmail}
              >
                <FormInput
                  id="attendeeEmail"
                  type="email"
                  value={formData.attendeeEmail}
                  onChange={(e) =>
                    handleInputChange("attendeeEmail", e.target.value)
                  }
                  placeholder="Enter your email address"
                  error={errors.attendeeEmail}
                  disabled={isSubmitting}
                  className="p-3"
                />
              </FormField>

              <FormField
                id="attendeePhone"
                label="Phone Number (Optional)"
                error={errors.attendeePhone}
              >
                <FormInput
                  id="attendeePhone"
                  type="tel"
                  value={formData.attendeePhone || ""}
                  onChange={(e) =>
                    handleInputChange("attendeePhone", e.target.value)
                  }
                  placeholder="Enter your phone number"
                  error={errors.attendeePhone}
                  disabled={isSubmitting}
                  className="p-3"
                />
              </FormField>

              {/* Event Info Summary */}
              <div className="bg-gray-50 rounded-lg p-4 border">
                <h3 className="font-medium text-gray-900 mb-2">
                  Event Details
                </h3>
                <div className="space-y-1 text-sm text-gray-600">
                  <div>📅 {new Date(event.startTime).toLocaleDateString()}</div>
                  <div>
                    🕒{" "}
                    {new Date(event.startTime).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                  <div>📍 {event.venue}</div>
                  <div>🎫 Free Registration</div>
                </div>
              </div>

              {/* Terms */}
              <div className="text-xs text-gray-500">
                By registering, you agree to receive event updates and
                confirmations via email. Your information will only be used for
                this event and will not be shared with third parties.
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || !isValid}
                className="w-full py-3 px-4 text-white font-semibold rounded-lg hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: event.team.primaryColor || "#3b82f6",
                }}
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center gap-2">
                    <svg
                      className="animate-spin w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                    <span>Registering...</span>
                  </div>
                ) : (
                  "Complete Registration"
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
