import { useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import { 
  eventRegistrationSchema, 
  EventRegistrationData, 
  EventRegistrationErrors 
} from '../schemas/registrationSchema';

interface UseRegistrationFormProps {
  eventId: Id<"events">;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

interface UseRegistrationFormReturn {
  formData: EventRegistrationData;
  errors: EventRegistrationErrors;
  isValid: boolean;
  isSubmitting: boolean;
  isDirty: boolean;
  handleInputChange: (field: keyof EventRegistrationData, value: string) => void;
  handleSubmit: () => Promise<void>;
  resetForm: () => void;
  setFieldValue: (field: keyof EventRegistrationData, value: string) => void;
  clearFieldError: (field: keyof EventRegistrationData) => void;
  // React Hook Form methods
  register: ReturnType<typeof useForm<EventRegistrationData>>['register'];
  formState: ReturnType<typeof useForm<EventRegistrationData>>['formState'];
}

const defaultValues: EventRegistrationData = {
  attendeeName: '',
  attendeeEmail: '',
  attendeePhone: ''
};

export const useRegistrationForm = ({
  eventId,
  onSuccess,
  onError,
}: UseRegistrationFormProps): UseRegistrationFormReturn => {
  const form = useForm<EventRegistrationData>({
    resolver: zodResolver(eventRegistrationSchema),
    defaultValues,
    mode: 'onChange'
  });

  const { 
    register,
    handleSubmit: rhfHandleSubmit,
    watch,
    setValue,
    formState,
    reset,
    clearErrors
  } = form;

  const registerForEvent = useMutation(api.events.registerForEvent);

  // Watch form values for backward compatibility
  const watchedValues = watch();

  // Transform React Hook Form errors to legacy format
  const errors: EventRegistrationErrors = {};
  Object.keys(formState.errors).forEach((field) => {
    const fieldError = formState.errors[field as keyof EventRegistrationData];
    if (fieldError?.message) {
      errors[field as keyof EventRegistrationData] = fieldError.message;
    }
  });

  // Backward compatible methods
  const handleInputChange = useCallback((field: keyof EventRegistrationData, value: string) => {
    setValue(field, value, { shouldDirty: true, shouldValidate: true });
  }, [setValue]);

  const setFieldValue = useCallback((field: keyof EventRegistrationData, value: string) => {
    setValue(field, value, { shouldDirty: true, shouldValidate: true });
  }, [setValue]);

  const clearFieldError = useCallback((field: keyof EventRegistrationData) => {
    clearErrors(field);
  }, [clearErrors]);

  const handleSubmit = useCallback(async () => {
    const onSubmit = async (data: EventRegistrationData) => {
      try {
        await registerForEvent({
          eventId,
          attendeeName: data.attendeeName.trim(),
          attendeeEmail: data.attendeeEmail.trim(),
          attendeePhone: data.attendeePhone ? data.attendeePhone.trim() : undefined,
        });
        
        onSuccess?.();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to register for event';
        onError?.(errorMessage);
      }
    };

    await rhfHandleSubmit(onSubmit)();
  }, [rhfHandleSubmit, eventId, registerForEvent, onSuccess, onError]);

  const resetForm = useCallback(() => {
    reset(defaultValues);
  }, [reset]);

  return {
    formData: watchedValues,
    errors,
    isValid: formState.isValid,
    isSubmitting: formState.isSubmitting,
    isDirty: formState.isDirty,
    handleInputChange,
    handleSubmit,
    resetForm,
    setFieldValue,
    clearFieldError,
    register,
    formState,
  };
};