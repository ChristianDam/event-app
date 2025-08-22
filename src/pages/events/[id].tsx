import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { eventTypeOptions, EventType, EventStatus } from '../../types/events';
import { ArrowLeft, Save, Eye, Trash2, Users, Settings } from 'lucide-react';
import { EventStatusBadge } from '../../components/events/EventStatusBadge';
import { Id } from '../../../convex/_generated/dataModel';
import { toast } from 'sonner';

interface EventManagePageProps {
  params: Record<string, string>;
  navigate: (to: string) => void;
}

interface FormData {
  title: string;
  description: string;
  venue: string;
  startTime: string;
  endTime: string;
  timezone: string;
  eventType: EventType;
  maxCapacity?: number;
  registrationDeadline?: string;
  status: EventStatus;
}

const EventManagePage: React.FC<EventManagePageProps> = ({ params, navigate }) => {
  const eventId = params.id as Id<"events"> | undefined;
  const [formData, setFormData] = useState<FormData | null>(null);
  const [originalFormData, setOriginalFormData] = useState<FormData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<'details' | 'registrations'>('details');

  // Fetch event data
  const event = useQuery(api.events.getEvent, eventId ? { eventId } : 'skip');
  const updateEvent = useMutation(api.events.updateEvent);
  const deleteEvent = useMutation(api.events.deleteEvent);
  const registrations = useQuery(
    api.events.getEventRegistrations, 
    eventId ? { eventId } : 'skip'
  );

  // Initialize form data when event loads
  useEffect(() => {
    if (event && !formData) {
      const startDate = new Date(event.startTime);
      const endDate = new Date(event.endTime);
      
      const initialFormData: FormData = {
        title: event.title,
        description: event.description,
        venue: event.venue,
        startTime: startDate.toISOString().slice(0, 16), // Format for datetime-local input
        endTime: endDate.toISOString().slice(0, 16),
        timezone: event.timezone,
        eventType: event.eventType,
        maxCapacity: event.maxCapacity,
        registrationDeadline: event.registrationDeadline 
          ? new Date(event.registrationDeadline).toISOString().slice(0, 16)
          : undefined,
        status: event.status,
      };
      
      setFormData(initialFormData);
      setOriginalFormData({ ...initialFormData }); // Deep copy for comparison
    }
  }, [event, formData]);

  // Check if form has changes
  const hasChanges = (): boolean => {
    if (!formData || !originalFormData) return false;
    
    // Compare all form fields
    const fieldsToCompare: (keyof FormData)[] = [
      'title', 'description', 'venue', 'startTime', 'endTime', 
      'timezone', 'eventType', 'maxCapacity', 'registrationDeadline', 'status'
    ];
    
    return fieldsToCompare.some(field => {
      const current = formData[field];
      const original = originalFormData[field];
      
      // Handle undefined/empty values consistently
      const currentValue = current === undefined ? '' : String(current);
      const originalValue = original === undefined ? '' : String(original);
      
      return currentValue !== originalValue;
    });
  };

  // Handle form input changes
  const handleInputChange = (field: keyof FormData, value: any) => {
    if (!formData) return;
    
    setFormData(prev => ({ ...prev!, [field]: value }));
    
    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    if (!formData) return false;
    
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.trim().length < 3) {
      newErrors.title = 'Title must be at least 3 characters';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.trim().length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    }

    if (!formData.venue.trim()) {
      newErrors.venue = 'Venue is required';
    }

    const startTime = new Date(formData.startTime).getTime();
    const endTime = new Date(formData.endTime).getTime();

    if (startTime >= endTime) {
      newErrors.endTime = 'End time must be after start time';
    }

    if (formData.maxCapacity && formData.maxCapacity <= 0) {
      newErrors.maxCapacity = 'Capacity must be greater than 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData || !event || !validateForm()) return;

    setIsSubmitting(true);

    try {
      await updateEvent({
        eventId: event._id,
        title: formData.title.trim(),
        description: formData.description.trim(),
        venue: formData.venue.trim(),
        startTime: new Date(formData.startTime).getTime(),
        endTime: new Date(formData.endTime).getTime(),
        timezone: formData.timezone,
        eventType: formData.eventType,
        maxCapacity: formData.maxCapacity,
        registrationDeadline: formData.registrationDeadline 
          ? new Date(formData.registrationDeadline).getTime()
          : undefined,
        status: formData.status,
      });
      
      // Event saved successfully - update original form data to reflect current state
      setOriginalFormData({ ...formData });
      toast.success('Event updated successfully', {
        description: 'Your changes have been saved.'
      });
    } catch (error) {
      console.error('Failed to update event:', error);
      toast.error('Failed to update event', {
        description: 'Please try again. If the problem persists, contact support.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle event deletion
  const handleDelete = async () => {
    if (!event) return;
    
    if (!confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteEvent({ eventId: event._id });
      toast.success('Event deleted successfully', {
        description: 'The event has been permanently removed.'
      });
      navigate('/events');
    } catch (error) {
      console.error('Failed to delete event:', error);
      toast.error('Failed to delete event', {
        description: 'Please try again. If the problem persists, contact support.'
      });
    }
  };

  // Loading state
  if (!eventId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-foreground mb-2">Invalid Event</h1>
          <p className="text-muted-foreground">Event not found.</p>
        </div>
      </div>
    );
  }

  if (event === undefined || !formData) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  // Event not found or no permission
  if (event === null || !event.canManage) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-foreground mb-2">
            {event === null ? 'Event Not Found' : 'Access Denied'}
          </h1>
          <p className="text-muted-foreground mb-4">
            {event === null 
              ? 'The event you are looking for does not exist.' 
              : 'You do not have permission to manage this event.'
            }
          </p>
          <Button onClick={() => navigate('/events')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Events
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate('/events')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Events
          </Button>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Manage Event</h1>
            <div className="flex items-center gap-4 mt-2">
              <EventStatusBadge status={event.status} />
              <span className="text-sm text-muted-foreground">
                {event.registrationCount} registered
                {event.maxCapacity && ` / ${event.maxCapacity}`}
              </span>
              <span className="text-sm text-muted-foreground">
                ID: {event._id}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={() => navigate(`/events/${event.slug}`)}
          >
            <Eye className="h-4 w-4 mr-2" />
            View Public Page
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDelete}
            disabled={event.registrationCount > 0}
            title={event.registrationCount > 0 ? 'Cannot delete event with registrations' : 'Delete event'}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border mb-6">
        <button
          onClick={() => setActiveTab('details')}
          className={`flex items-center gap-2 px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'details' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Settings className="h-4 w-4" />
          Event Details
        </button>
        <button
          onClick={() => setActiveTab('registrations')}
          className={`flex items-center gap-2 px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'registrations' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Users className="h-4 w-4" />
          Registrations ({event.registrationCount})
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'details' && (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-background rounded-lg p-6 shadow-sm border">
            <h2 className="text-xl font-semibold text-foreground mb-4">Event Information</h2>
            
            <div className="grid gap-4">
              {/* Title */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-foreground mb-2">Event Title</label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Enter event title"
                  className={errors.title ? 'border-red-500' : ''}
                />
                {errors.title && (
                  <p className="text-sm text-red-500 mt-1">{errors.title}</p>
                )}
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-foreground mb-2">Description</label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Describe your event"
                  rows={4}
                  className={`w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${errors.description ? 'border-red-500' : ''}`}
                />
                {errors.description && (
                  <p className="text-sm text-red-500 mt-1">{errors.description}</p>
                )}
              </div>

              {/* Venue */}
              <div>
                <label htmlFor="venue" className="block text-sm font-medium text-foreground mb-2">Venue</label>
                <Input
                  id="venue"
                  value={formData.venue}
                  onChange={(e) => handleInputChange('venue', e.target.value)}
                  placeholder="Event location"
                  className={errors.venue ? 'border-red-500' : ''}
                />
                {errors.venue && (
                  <p className="text-sm text-red-500 mt-1">{errors.venue}</p>
                )}
              </div>

              {/* Event Type */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Event Type</label>
                <select 
                  value={formData.eventType} 
                  onChange={(e) => handleInputChange('eventType', e.target.value as EventType)}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  {eventTypeOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.icon} {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Event Status</label>
                <select 
                  value={formData.status} 
                  onChange={(e) => handleInputChange('status', e.target.value as EventStatus)}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              {/* Date and Time */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="startTime" className="block text-sm font-medium text-foreground mb-2">Start Date & Time</label>
                  <Input
                    id="startTime"
                    type="datetime-local"
                    value={formData.startTime}
                    onChange={(e) => handleInputChange('startTime', e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="endTime" className="block text-sm font-medium text-foreground mb-2">End Date & Time</label>
                  <Input
                    id="endTime"
                    type="datetime-local"
                    value={formData.endTime}
                    onChange={(e) => handleInputChange('endTime', e.target.value)}
                    className={errors.endTime ? 'border-red-500' : ''}
                  />
                  {errors.endTime && (
                    <p className="text-sm text-red-500 mt-1">{errors.endTime}</p>
                  )}
                </div>
              </div>

              {/* Capacity and Deadline */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="maxCapacity" className="block text-sm font-medium text-foreground mb-2">Maximum Capacity (Optional)</label>
                  <Input
                    id="maxCapacity"
                    type="number"
                    min="1"
                    value={formData.maxCapacity || ''}
                    onChange={(e) => handleInputChange('maxCapacity', e.target.value ? parseInt(e.target.value) : undefined)}
                    placeholder="No limit"
                    className={errors.maxCapacity ? 'border-red-500' : ''}
                  />
                  {errors.maxCapacity && (
                    <p className="text-sm text-red-500 mt-1">{errors.maxCapacity}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="registrationDeadline" className="block text-sm font-medium text-foreground mb-2">Registration Deadline (Optional)</label>
                  <Input
                    id="registrationDeadline"
                    type="datetime-local"
                    value={formData.registrationDeadline || ''}
                    onChange={(e) => handleInputChange('registrationDeadline', e.target.value || undefined)}
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border">
              <Button 
                type="submit" 
                disabled={isSubmitting || !hasChanges()}
                className={!hasChanges() && !isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}
              >
                <Save className="h-4 w-4 mr-2" />
                {isSubmitting ? 'Saving...' : hasChanges() ? 'Save Changes' : 'No Changes'}
              </Button>
            </div>
          </div>
        </form>
      )}

      {activeTab === 'registrations' && (
        <div className="bg-background rounded-lg p-6 shadow-sm border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-foreground">Event Registrations</h2>
            <div className="text-sm text-muted-foreground">
              {event.registrationCount} total registrations
            </div>
          </div>
          
          {registrations && registrations.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Name</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Email</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Phone</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Registered</th>
                  </tr>
                </thead>
                <tbody>
                  {registrations.map(registration => (
                    <tr key={registration._id} className="border-b border-border/50">
                      <td className="py-3 px-4 font-medium">{registration.attendeeName}</td>
                      <td className="py-3 px-4 text-muted-foreground">{registration.attendeeEmail}</td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {registration.attendeePhone || '—'}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {new Date(registration.registeredAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No Registrations Yet</h3>
              <p className="text-muted-foreground">
                When people register for your event, they'll appear here.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EventManagePage;