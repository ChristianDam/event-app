import React from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FormErrorProps {
  error?: string;
  className?: string;
}

export function FormError({ error, className }: FormErrorProps) {
  if (!error) return null;

  return (
    <div className={cn('flex items-center gap-2 text-sm text-destructive', className)}>
      <AlertCircle className="h-4 w-4" />
      <span>{error}</span>
    </div>
  );
}

interface FormErrorListProps {
  errors: string[];
  title?: string;
  className?: string;
}

export function FormErrorList({ errors, title = 'Please fix the following errors:', className }: FormErrorListProps) {
  if (errors.length === 0) return null;

  return (
    <div className={cn('rounded-md border border-destructive/50 bg-destructive/10 p-4', className)}>
      <div className="flex items-center gap-2 mb-2">
        <AlertCircle className="h-4 w-4 text-destructive" />
        <h4 className="text-sm font-medium text-destructive">{title}</h4>
      </div>
      <ul className="list-disc list-inside space-y-1">
        {errors.map((error, index) => (
          <li key={index} className="text-sm text-destructive">
            {error}
          </li>
        ))}
      </ul>
    </div>
  );
}