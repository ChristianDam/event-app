import React from 'react';
import { EventStatus, eventStatusOptions } from '../../types/events';

interface EventStatusBadgeProps {
  status: EventStatus;
  className?: string;
}

export const EventStatusBadge: React.FC<EventStatusBadgeProps> = ({ status, className = '' }) => {
  const statusConfig = eventStatusOptions.find(option => option.value === status);
  
  if (!statusConfig) return null;

  const baseClasses = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
  
  const colorClasses = {
    draft: 'bg-gray-100 text-gray-800',
    published: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  };

  const iconMap = {
    draft: '📝',
    published: '✅',
    cancelled: '❌',
  };

  return (
    <span className={`${baseClasses} ${colorClasses[status]} ${className}`}>
      <span className="mr-1 text-xs">{iconMap[status]}</span>
      {statusConfig.label}
    </span>
  );
};