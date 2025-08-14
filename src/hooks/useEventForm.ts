import { useState, useCallback, useMemo } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import { EventFormData, EventFormErrors, EventType } from '../types/events';
import { validateEventField, validateEventForm, sanitizeEventInput } from '../utils/eventValidation';

interface UseEventFormProps {
  teamId: Id<"teams">;
  initialData?: Partial<EventFormData>;
  onSuccess?: (eventId: Id<"events">) => void;
  onError?: (error: string) => void;
}

interface UseEventFormReturn {
  formData: EventFormData;
  errors: EventFormErrors;
  isValid: boolean;
  isSubmitting: boolean;
  isDirty: boolean;
  handleInputChange: (field: keyof EventFormData, value: any) => void;
  handleSubmit: () => Promise<void>;
  resetForm: () => void;
  validateField: (field: keyof EventFormData) => string | null;
  setFieldValue: (field: keyof EventFormData, value: any) => void;
  clearFieldError: (field: keyof EventFormData) => void;
}

const createInitialFormData = (initialData?: Partial<EventFormData>): EventFormData => {
  const now = new Date();
  const defaultStartTime = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Tomorrow
  const defaultEndTime = new Date(defaultStartTime.getTime() + 2 * 60 * 60 * 1000); // 2 hours later

  return {
    title: '',
    description: '',
    venue: '',
    startTime: defaultStartTime,
    endTime: defaultEndTime,
    timezone: 'Europe/Copenhagen',
    eventType: 'other' as EventType,
    maxCapacity: undefined,
    registrationDeadline: undefined,
    eventImage: undefined,
    ...initialData,
  };
};

export const useEventForm = ({
  teamId,
  initialData,
  onSuccess,
  onError,
}: UseEventFormProps): UseEventFormReturn => {
  const [formData, setFormData] = useState<EventFormData>(() => createInitialFormData(initialData));
  const [errors, setErrors] = useState<EventFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const createEvent = useMutation(api.events.createEvent);

  // Memoized validation state
  const isValid = useMemo(() => {
    const requiredFields: (keyof EventFormData)[] = ['title', 'description', 'venue', 'startTime', 'endTime', 'eventType'];
    
    // Check if all required fields are filled
    const allRequiredFieldsFilled = requiredFields.every(field => {
      const value = formData[field];
      return value !== undefined && value !== null && value !== '';
    });

    if (!allRequiredFieldsFilled) return false;

    // Check if there are any validation errors
    const currentErrors = validateEventForm(formData);
    return Object.keys(currentErrors).length === 0;
  }, [formData]);

  const handleInputChange = useCallback((field: keyof EventFormData, value: any) => {
    setIsDirty(true);
    
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      
      // Auto-adjust end time when start time changes
      if (field === 'startTime' && value instanceof Date) {
        const currentEndTime = prev.endTime;
        const currentStartTime = prev.startTime;
        
        // If end time was auto-set (2 hours after start), update it
        if (currentEndTime.getTime() === currentStartTime.getTime() + 2 * 60 * 60 * 1000) {
          newData.endTime = new Date(value.getTime() + 2 * 60 * 60 * 1000);
        }
        // If end time is before new start time, adjust it
        else if (currentEndTime.getTime() <= value.getTime()) {
          newData.endTime = new Date(value.getTime() + 60 * 60 * 1000); // 1 hour after
        }
      }
      
      return newData;
    });

    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }

    // Validate field in real-time for immediate feedback
    setTimeout(() => {
      setFormData(currentData => {
        const error = validateEventField(field, currentData[field], currentData);
        if (error) {
          setErrors(prev => ({ ...prev, [field]: error }));
        }
        return currentData;
      });
    }, 300); // Debounce validation
  }, [errors]);

  const setFieldValue = useCallback((field: keyof EventFormData, value: any) => {
    handleInputChange(field, value);
  }, [handleInputChange]);

  const clearFieldError = useCallback((field: keyof EventFormData) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  const validateField = useCallback((field: keyof EventFormData): string | null => {
    return validateEventField(field, formData[field], formData);
  }, [formData]);

  const handleSubmit = useCallback(async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      // Validate entire form
      const formErrors = validateEventForm(formData);
      
      if (Object.keys(formErrors).length > 0) {
        setErrors(formErrors);
        throw new Error('Please fix the errors in the form');
      }

      // Sanitize text inputs
      const sanitizedData = {
        ...formData,
        title: sanitizeEventInput(formData.title),
        description: sanitizeEventInput(formData.description),
        venue: sanitizeEventInput(formData.venue),
      };

      // Prepare data for Convex mutation
      const eventData = {
        title: sanitizedData.title,
        description: sanitizedData.description,
        venue: sanitizedData.venue,
        startTime: sanitizedData.startTime.getTime(),
        endTime: sanitizedData.endTime.getTime(),
        timezone: sanitizedData.timezone,
        teamId,
        eventType: sanitizedData.eventType,
        maxCapacity: sanitizedData.maxCapacity,
        registrationDeadline: sanitizedData.registrationDeadline?.getTime(),
        eventImageId: undefined, // This will be set by the image upload component
        status: 'draft' as const,
      };

      const eventId = await createEvent(eventData);

      // Reset form state
      setErrors({});
      setIsDirty(false);
      
      onSuccess?.(eventId);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create event';
      onError?.(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, teamId, isSubmitting, createEvent, onSuccess, onError]);

  const resetForm = useCallback(() => {
    setFormData(createInitialFormData(initialData));
    setErrors({});
    setIsDirty(false);
    setIsSubmitting(false);
  }, [initialData]);

  return {
    formData,
    errors,
    isValid,
    isSubmitting,
    isDirty,
    handleInputChange,
    handleSubmit,
    resetForm,
    validateField,
    setFieldValue,
    clearFieldError,
  };
};