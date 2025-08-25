import React, { useState, useEffect } from 'react';
import { Id } from '../../../convex/_generated/dataModel';
import { useEventForm } from '../../hooks/useEventForm';
import { useImageUpload } from '../../hooks/useImageUpload';
import { generateEventTheme, applyTeamTheme, clearTeamTheme, Team } from '../../utils/teamBranding';
import { eventTypeOptions } from '../../types/events';
import { DatePicker } from '../ui/date-picker';
import { toast } from 'sonner';

interface CreateEventDialogProps {
  isOpen: boolean;
  onClose: () => void;
  team: Team;
  onSuccess?: (eventId: Id<"events">) => void;
}

type FormStep = 'basic' | 'details' | 'image' | 'review';

const STEPS: { key: FormStep; title: string; description: string }[] = [
  { key: 'basic', title: 'Basic Info', description: 'Event title, description, and venue' },
  { key: 'details', title: 'Date & Details', description: 'When and how your event happens' },
  { key: 'image', title: 'Visual Identity', description: 'Add an image to make your event shine' },
  { key: 'review', title: 'Review & Publish', description: 'Final check before creating your event' },
];

export const CreateEventDialog: React.FC<CreateEventDialogProps> = ({
  isOpen,
  onClose,
  team,
  onSuccess,
}) => {
  const [currentStep, setCurrentStep] = useState<FormStep>('basic');
  const [showSuccess, setShowSuccess] = useState(false);

  const {
    formData,
    errors,
    isValid,
    isSubmitting,
    isDirty,
    handleInputChange,
    handleSubmit,
    resetForm,
  } = useEventForm({
    teamId: team._id,
    onSuccess: (eventId) => {
      toast.success('Event created successfully!', {
        description: 'Your event has been saved as a draft and is ready for review.',
      });
      setShowSuccess(true);
      setTimeout(() => {
        onSuccess?.(eventId);
        handleClose();
      }, 2000);
    },
    onError: (error) => {
      console.error('Event creation failed:', error);
      toast.error('Failed to create event', {
        description: error || 'Please check your input and try again.',
      });
    },
  });

  const imageUpload = useImageUpload(team._id);

  // Apply team branding when dialog opens
  useEffect(() => {
    if (isOpen) {
      const theme = generateEventTheme(team);
      applyTeamTheme(theme);
    } else {
      clearTeamTheme();
    }

    return () => {
      if (!isOpen) {
        clearTeamTheme();
      }
    };
  }, [isOpen, team]);

  const handleClose = () => {
    if (isDirty && !window.confirm('You have unsaved changes. Are you sure you want to close?')) {
      return;
    }
    
    resetForm();
    imageUpload.clearImage();
    setCurrentStep('basic');
    setShowSuccess(false);
    clearTeamTheme();
    onClose();
  };

  const currentStepIndex = STEPS.findIndex(step => step.key === currentStep);
  const canGoNext = () => {
    switch (currentStep) {
      case 'basic':
        return !errors.title && !errors.description && !errors.venue && 
               formData.title && formData.description && formData.venue;
      case 'details':
        return !errors.startTime && !errors.endTime && !errors.eventType &&
               formData.startTime && formData.endTime && formData.eventType;
      case 'image':
        return true; // Image is optional
      case 'review':
        return isValid;
      default:
        return false;
    }
  };

  const handleNext = () => {
    const nextIndex = Math.min(currentStepIndex + 1, STEPS.length - 1);
    setCurrentStep(STEPS[nextIndex].key);
  };

  const handlePrevious = () => {
    const prevIndex = Math.max(currentStepIndex - 1, 0);
    setCurrentStep(STEPS[prevIndex].key);
  };

  const handleImageUpload = async (file: File) => {
    await imageUpload.uploadImage(file);
    // The uploaded image ID will be handled when submitting the form
  };

  const handleFinalSubmit = async () => {
    // Note: Image upload ID will be handled separately in the mutation
    // The form data doesn't include bannerImageId as it's not part of EventFormData
    await handleSubmit();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="bg-secondary rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
          
          {/* Success State */}
          {showSuccess && (
            <div className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
                <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Event Created Successfully!</h2>
              <p className="text-gray-600">Your event is ready and has been saved as a draft.</p>
            </div>
          )}

          {/* Main Form */}
          {!showSuccess && (
            <>
              {/* Header */}
              <div className="bg-gradient-to-r from-var(--event-primary, #3b82f6) to-var(--event-secondary, #1e40af) text-white p-6">
                <div className="flex justify-between items-center mb-4">
                  <h1 className="text-2xl font-bold">Create New Event</h1>
                  <button
                    onClick={handleClose}
                    className="text-foreground transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Progress Steps */}
                <div className="flex justify-between items-center">
                  {STEPS.map((step, index) => (
                    <div key={step.key} className="flex-1 flex items-center">
                      <div className="flex items-center">
                        <div className={`
                          w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                          ${index <= currentStepIndex 
                            ? 'bg-white text-blue-600' 
                            : 'bg-white/20 text-white/60'
                          }
                        `}>
                          {index + 1}
                        </div>
                        <div className="ml-2 text-left">
                          <div className="text-sm font-medium">{step.title}</div>
                          <div className="text-xs text-foreground hidden sm:block">{step.description}</div>
                        </div>
                      </div>
                      {index < STEPS.length - 1 && (
                        <div className={`
                          flex-1 h-0.5 mx-4
                        `} />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Form Content */}
              <div className="p-6 min-h-[400px] overflow-y-auto">
                <form onSubmit={(e) => { e.preventDefault(); }} className="space-y-6">
                  
                  {/* Basic Info Step */}
                  {currentStep === 'basic' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Event Title *
                        </label>
                        <input
                          type="text"
                          value={formData.title}
                          onChange={(e) => handleInputChange('title', e.target.value)}
                          placeholder="Give your event a catchy name"
                          className={`
                            w-full p-3 border rounded-lg focus:ring-2 focus:ring-var(--event-primary, #3b82f6) focus:border-transparent
                            ${errors.title ? 'border-red-300' : 'border-gray-300'}
                          `}
                        />
                        {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Event Description *
                        </label>
                        <textarea
                          value={formData.description}
                          onChange={(e) => handleInputChange('description', e.target.value)}
                          placeholder="Tell people what makes your event special..."
                          rows={4}
                          className={`
                            w-full p-3 border rounded-lg focus:ring-2 focus:ring-var(--event-primary, #3b82f6) focus:border-transparent
                            ${errors.description ? 'border-red-300' : 'border-gray-300'}
                          `}
                        />
                        {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Venue *
                        </label>
                        <input
                          type="text"
                          value={formData.venue}
                          onChange={(e) => handleInputChange('venue', e.target.value)}
                          placeholder="Where will your event take place?"
                          className={`
                            w-full p-3 border rounded-lg focus:ring-2 focus:ring-var(--event-primary, #3b82f6) focus:border-transparent
                            ${errors.venue ? 'border-red-300' : 'border-gray-300'}
                          `}
                        />
                        {errors.venue && <p className="mt-1 text-sm text-red-600">{errors.venue}</p>}
                      </div>
                    </div>
                  )}

                  {/* Details Step */}
                  {currentStep === 'details' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            Start Date & Time *
                          </label>
                          <DatePicker
                            date={formData.startTime}
                            onSelect={(date) => date && handleInputChange('startTime', date)}
                            placeholder="Select start date and time"
                            includeTime={true}
                            className={errors.startTime ? 'border-red-500' : ''}
                          />
                          {errors.startTime && <p className="mt-1 text-sm text-red-600">{errors.startTime}</p>}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            End Date & Time *
                          </label>
                          <DatePicker
                            date={formData.endTime}
                            onSelect={(date) => date && handleInputChange('endTime', date)}
                            placeholder="Select end date and time"
                            includeTime={true}
                            className={errors.endTime ? 'border-red-500' : ''}
                          />
                          {errors.endTime && <p className="mt-1 text-sm text-red-600">{errors.endTime}</p>}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Event Type *
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {eventTypeOptions.map(option => (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => handleInputChange('eventType', option.value)}
                              className={`
                                p-4 border rounded-lg text-left hover:border-var(--event-primary, #3b82f6) transition-colors
                                ${formData.eventType === option.value 
                                  ? 'border-var(--event-primary, #3b82f6) bg-var(--event-accent, #dbeafe)' 
                                  : 'border-gray-200'
                                }
                              `}
                            >
                              <div className="text-2xl mb-1">{option.icon}</div>
                              <div className="font-medium text-sm">{option.label}</div>
                              <div className="text-xs text-gray-500">{option.description}</div>
                            </button>
                          ))}
                        </div>
                        {errors.eventType && <p className="mt-1 text-sm text-red-600">{errors.eventType}</p>}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            Maximum Capacity (Optional)
                          </label>
                          <input
                            type="number"
                            value={formData.maxCapacity || ''}
                            onChange={(e) => handleInputChange('maxCapacity', e.target.value ? parseInt(e.target.value) : undefined)}
                            placeholder="Leave empty for unlimited"
                            min="1"
                            className={`
                              w-full p-3 border rounded-lg focus:ring-2 focus:ring-var(--event-primary, #3b82f6) focus:border-transparent
                              ${errors.maxCapacity ? 'border-red-300' : 'border-gray-300'}
                            `}
                          />
                          {errors.maxCapacity && <p className="mt-1 text-sm text-red-600">{errors.maxCapacity}</p>}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            Registration Deadline (Optional)
                          </label>
                          <DatePicker
                            date={formData.registrationDeadline}
                            onSelect={(date) => handleInputChange('registrationDeadline', date)}
                            placeholder="Select registration deadline"
                            includeTime={true}
                            className={errors.registrationDeadline ? 'border-red-500' : ''}
                          />
                          {errors.registrationDeadline && <p className="mt-1 text-sm text-red-600">{errors.registrationDeadline}</p>}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Image Step */}
                  {currentStep === 'image' && (
                    <div className="space-y-4">
                      <div className="text-center">
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Add an Event Image</h3>
                        <p className="text-gray-600 mb-6">Upload an image to make your event stand out</p>

                        {!imageUpload.uploadedImageId && !imageUpload.isUploading && (
                          <div
                            className="border-2 border-dashed border-gray-300 rounded-lg p-8 hover:border-var(--event-primary, #3b82f6) transition-colors cursor-pointer"
                            onClick={() => document.getElementById('event-image')?.click()}
                          >
                            <div className="text-6xl text-gray-400 mb-4">📷</div>
                            <p className="text-gray-600">Click to upload or drag and drop</p>
                            <p className="text-sm text-gray-500 mt-2">JPEG, PNG, or WebP up to 10MB</p>
                          </div>
                        )}

                        {imageUpload.isUploading && (
                          <div className="p-8">
                            <div className="text-4xl mb-4">⏳</div>
                            <p className="text-gray-600">Uploading image...</p>
                            <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
                              <div 
                                className="bg-var(--event-primary, #3b82f6) h-2 rounded-full transition-all duration-300"
                                style={{ width: `${imageUpload.uploadProgress}%` }}
                              />
                            </div>
                            <p className="text-sm text-gray-500 mt-2">{imageUpload.uploadProgress}% complete</p>
                          </div>
                        )}

                        {imageUpload.uploadedImageId && (
                          <div className="p-4 border rounded-lg bg-green-50 border-green-200">
                            <div className="text-2xl text-green-600 mb-2">✅</div>
                            <p className="text-green-800">Image uploaded successfully!</p>
                            <button
                              type="button"
                              onClick={imageUpload.clearImage}
                              className="mt-2 text-sm text-gray-600 hover:text-gray-800"
                            >
                              Remove image
                            </button>
                          </div>
                        )}

                        {imageUpload.error && (
                          <div className="p-4 border rounded-lg bg-red-50 border-red-200">
                            <p className="text-red-800">{imageUpload.error}</p>
                            <button
                              type="button"
                              onClick={imageUpload.clearError}
                              className="mt-2 text-sm text-red-600 hover:text-red-800"
                            >
                              Try again
                            </button>
                          </div>
                        )}

                        <input
                          id="event-image"
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) void handleImageUpload(file);
                          }}
                          className="hidden"
                        />
                      </div>
                    </div>
                  )}

                  {/* Review Step */}
                  {currentStep === 'review' && (
                    <div className="space-y-6">
                      <div className="text-center mb-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Review Your Event</h3>
                        <p className="text-gray-600">Make sure everything looks perfect before creating</p>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                        <div>
                          <h4 className="font-medium text-gray-900">{formData.title}</h4>
                          <p className="text-gray-600 mt-1">{formData.description}</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Venue:</span>
                            <span className="ml-2 text-gray-900">{formData.venue}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Type:</span>
                            <span className="ml-2 text-gray-900">
                              {eventTypeOptions.find(opt => opt.value === formData.eventType)?.label}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">Start:</span>
                            <span className="ml-2 text-gray-900">
                              {formData.startTime.toLocaleDateString()} at {formData.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">End:</span>
                            <span className="ml-2 text-gray-900">
                              {formData.endTime.toLocaleDateString()} at {formData.endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          {formData.maxCapacity && (
                            <div>
                              <span className="text-gray-500">Capacity:</span>
                              <span className="ml-2 text-gray-900">{formData.maxCapacity} people</span>
                            </div>
                          )}
                          {imageUpload.uploadedImageId && (
                            <div>
                              <span className="text-gray-500">Image:</span>
                              <span className="ml-2 text-green-600">✓ Uploaded</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </form>
              </div>

              {/* Footer */}
              <div className="bg-secondary px-6 py-4 flex justify-between items-center">
                <button
                  type="button"
                  onClick={handlePrevious}
                  disabled={currentStepIndex === 0}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ← Previous
                </button>

                <div className="flex gap-2">
                  {currentStepIndex < STEPS.length - 1 ? (
                    <button
                      type="button"
                      onClick={handleNext}
                      disabled={!canGoNext()}
                      className="px-6 py-2 bg-var(--event-primary, #3b82f6) text-foreground rounded-lg hover:bg-var(--event-secondary, #1e40af) disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Next →
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void handleFinalSubmit()}
                      disabled={!isValid || isSubmitting}
                      className="px-6 py-2 bg-var(--event-primary, #3b82f6) text-foreground rounded-lg hover:bg-var(--event-secondary, #1e40af) disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isSubmitting ? 'Creating...' : 'Create Event'}
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};