import { useCallback, useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { 
  userProfileSchema, 
  UserProfileData, 
  UserProfileErrors 
} from '../schemas/userSchema';

interface UserData {
  name?: string;
  email?: string;
  phone?: string;
  favoriteColor?: string;
}

interface UseProfileFormProps {
  initialData?: UserData;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

interface UseProfileFormReturn {
  formData: UserProfileData;
  errors: UserProfileErrors;
  isValid: boolean;
  isSubmitting: boolean;
  isDirty: boolean;
  hasChanges: boolean;
  handleInputChange: (field: keyof UserProfileData, value: string) => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  resetForm: () => void;
  setFieldValue: (field: keyof UserProfileData, value: string) => void;
  clearFieldError: (field: keyof UserProfileData) => void;
  validateForm: () => boolean;
  // React Hook Form methods
  register: ReturnType<typeof useForm<UserProfileData>>['register'];
  formState: ReturnType<typeof useForm<UserProfileData>>['formState'];
}

const createDefaultValues = (initialData?: UserData): UserProfileData => ({
  name: initialData?.name || '',
  email: initialData?.email || '',
  phone: initialData?.phone || '',
  favoriteColor: initialData?.favoriteColor || ''
});

export const useProfileForm = ({
  initialData,
  onSuccess,
  onError,
}: UseProfileFormProps): UseProfileFormReturn => {
  const defaultValues = useMemo(() => createDefaultValues(initialData), [initialData]);
  
  const form = useForm<UserProfileData>({
    resolver: zodResolver(userProfileSchema),
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
    clearErrors,
    trigger
  } = form;

  const updateProfile = useMutation(api.users.updateProfile);

  // Watch form values for backward compatibility
  const watchedValues = watch();

  // Reset form when initialData changes
  useEffect(() => {
    if (initialData) {
      reset(createDefaultValues(initialData));
    }
  }, [initialData, reset]);

  // Check if form has changes compared to initial data
  const hasChanges = useMemo(() => {
    if (!initialData) return false;
    return (
      watchedValues.name !== (initialData.name || '') ||
      watchedValues.email !== (initialData.email || '') ||
      watchedValues.phone !== (initialData.phone || '') ||
      watchedValues.favoriteColor !== (initialData.favoriteColor || '')
    );
  }, [watchedValues, initialData]);

  // Transform React Hook Form errors to legacy format
  const errors: UserProfileErrors = {};
  Object.keys(formState.errors).forEach((field) => {
    const fieldError = formState.errors[field as keyof UserProfileData];
    if (fieldError?.message) {
      errors[field as keyof UserProfileData] = fieldError.message;
    }
  });

  // Backward compatible methods
  const handleInputChange = useCallback((field: keyof UserProfileData, value: string) => {
    setValue(field, value, { shouldDirty: true, shouldValidate: true });
  }, [setValue]);

  const setFieldValue = useCallback((field: keyof UserProfileData, value: string) => {
    setValue(field, value, { shouldDirty: true, shouldValidate: true });
  }, [setValue]);

  const clearFieldError = useCallback((field: keyof UserProfileData) => {
    clearErrors(field);
  }, [clearErrors]);

  const validateForm = useCallback(() => {
    void trigger();
    return Object.keys(formState.errors).length === 0;
  }, [trigger, formState.errors]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    const onSubmit = async (data: UserProfileData) => {
      if (!hasChanges) return;

      try {
        await updateProfile({
          name: data.name || undefined,
          email: data.email || undefined,
          phone: data.phone || undefined,
          favoriteColor: data.favoriteColor || undefined,
        });
        
        onSuccess?.();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to update profile';
        onError?.(errorMessage);
      }
    };

    await rhfHandleSubmit(onSubmit)(e);
  }, [rhfHandleSubmit, hasChanges, updateProfile, onSuccess, onError]);

  const resetForm = useCallback(() => {
    reset(createDefaultValues(initialData));
  }, [reset, initialData]);

  return {
    formData: watchedValues,
    errors,
    isValid: formState.isValid,
    isSubmitting: formState.isSubmitting,
    isDirty: formState.isDirty,
    hasChanges,
    handleInputChange,
    handleSubmit,
    resetForm,
    setFieldValue,
    clearFieldError,
    validateForm,
    register,
    formState,
  };
};