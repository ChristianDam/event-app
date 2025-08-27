import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface FormFieldProps {
  id: string;
  label: string;
  error?: { message: string } | string;
  description?: string;
  required?: boolean;
  children?: React.ReactNode;
  className?: string;
}

export function FormField({
  id,
  label,
  error,
  description,
  required = false,
  children,
  className
}: FormFieldProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <Label htmlFor={id} className={error ? 'text-destructive' : ''}>
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      {children}
      {description && !error && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
      {error && (
        <p className="text-sm text-destructive">
          {typeof error === 'string' ? error : error.message}
        </p>
      )}
    </div>
  );
}

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: { message: string } | string;
}

export function FormInput({ error, className, ...props }: FormInputProps) {
  return (
    <Input
      className={cn(
        error && 'border-destructive focus-visible:ring-destructive',
        className
      )}
      {...props}
    />
  );
}

interface FormTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: { message: string } | string;
}

export function FormTextarea({ error, className, ...props }: FormTextareaProps) {
  return (
    <Textarea
      className={cn(
        error && 'border-destructive focus-visible:ring-destructive',
        className
      )}
      {...props}
    />
  );
}