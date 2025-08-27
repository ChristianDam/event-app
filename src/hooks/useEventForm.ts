import { useCallback, useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import { eventFormSchema, EventFormData, EventFormErrors } from '../schemas/eventSchema';
import { sanitizeString } from '../schemas/shared';

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
  validateField: (field: keyof EventFormData) => Promise<string | null>;
  setFieldValue: (field: keyof EventFormData, value: any) => void;
  clearFieldError: (field: keyof EventFormData) => void;
  // React Hook Form specific methods
  register: ReturnType<typeof useForm<EventFormData>>['register'];
  watch: ReturnType<typeof useForm<EventFormData>>['watch'];
  setValue: ReturnType<typeof useForm<EventFormData>>['setValue'];
  getFieldState: ReturnType<typeof useForm<EventFormData>>['getFieldState'];
  formState: ReturnType<typeof useForm<EventFormData>>['formState'];
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
    eventType: 'other',
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
  const defaultValues = useMemo(() => createInitialFormData(initialData), [initialData]);
  
  const form = useForm<EventFormData>({
    resolver: zodResolver(eventFormSchema),
    defaultValues,
    mode: 'onChange'
  });

  const { 
    register,
    handleSubmit: rhfHandleSubmit,
    watch,
    setValue,
    getFieldState,
    formState,
    reset,
    clearErrors,
    trigger
  } = form;

  const createEvent = useMutation(api.events.createEvent);

  // Watch form values for backward compatibility
  const watchedValues = watch();

  // Auto-adjust end time when start time changes
  useEffect(() => {
    const subscription = watch((value, { name }) => {
      if (name === 'startTime' && value.startTime) {
        const startTime = new Date(value.startTime);
        const currentEndTime = value.endTime ? new Date(value.endTime) : undefined;
        const currentStartTime = watchedValues.startTime ? new Date(watchedValues.startTime) : undefined;

        if (currentStartTime && currentEndTime) {
          // If end time was auto-set (2 hours after start), update it
          if (currentEndTime.getTime() === currentStartTime.getTime() + 2 * 60 * 60 * 1000) {
            setValue('endTime', new Date(startTime.getTime() + 2 * 60 * 60 * 1000));
          }
          // If end time is before new start time, adjust it
          else if (currentEndTime.getTime() <= startTime.getTime()) {
            setValue('endTime', new Date(startTime.getTime() + 60 * 60 * 1000));
          }
        }
      }
    });
    
    return () => subscription.unsubscribe();
  }, [watch, setValue, watchedValues.startTime]);

  // Transform React Hook Form errors to legacy format
  const errors: EventFormErrors = useMemo(() => {
    const rhfErrors = formState.errors;
    const transformedErrors: EventFormErrors = {};
    
    Object.keys(rhfErrors).forEach((field) => {
      const fieldError = rhfErrors[field as keyof EventFormData];
      if (fieldError?.message) {
        transformedErrors[field as keyof EventFormData] = fieldError.message;
      }
    });
    
    return transformedErrors;
  }, [formState.errors]);

  // Backward compatible methods
  const handleInputChange = useCallback((field: keyof EventFormData, value: any) => {
    setValue(field, value, { shouldDirty: true, shouldValidate: true });
  }, [setValue]);

  const setFieldValue = useCallback((field: keyof EventFormData, value: any) => {
    setValue(field, value, { shouldDirty: true, shouldValidate: true });
  }, [setValue]);

  const clearFieldError = useCallback((field: keyof EventFormData) => {
    clearErrors(field);
  }, [clearErrors]);

  const validateField = useCallback(async (field: keyof EventFormData): Promise<string | null> => {
    const result = await trigger(field);
    if (!result) {
      const fieldError = formState.errors[field];
      return fieldError?.message || 'Validation failed';
    }
    return null;
  }, [trigger, formState.errors]);

  const handleSubmit = useCallback(async () => {
    const onSubmit = async (data: EventFormData) => {
      try {
        // Sanitize text inputs
        const sanitizedData = {
          ...data,
          title: sanitizeString(data.title),
          description: sanitizeString(data.description),
          venue: sanitizeString(data.venue),
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
          bannerImageId: undefined, // This will be set by the image upload component
          socialImageId: undefined,
          status: 'draft' as const,
        };

        const eventId = await createEvent(eventData);
        
        onSuccess?.(eventId);

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to create event';
        onError?.(errorMessage);
      }
    };

    await rhfHandleSubmit(onSubmit)();
  }, [rhfHandleSubmit, teamId, createEvent, onSuccess, onError]);

  const resetForm = useCallback(() => {
    reset(createInitialFormData(initialData));
  }, [reset, initialData]);

  return {
    formData: watchedValues,
    errors,
    isValid: formState.isValid,
    isSubmitting: formState.isSubmitting,
    isDirty: formState.isDirty,
    handleInputChange,
    handleSubmit,
    resetForm,
    validateField,
    setFieldValue,
    clearFieldError,
    // React Hook Form methods
    register,
    watch,
    setValue,
    getFieldState,
    formState,
  };
};