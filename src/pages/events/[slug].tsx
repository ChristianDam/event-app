import React, { useState, useEffect } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { generateEventTheme, applyTeamTheme, clearTeamTheme } from '../../utils/teamBranding';
import { formatDate, formatTime, isUpcoming, isPast } from '../../utils/dateTime';
import { eventTypeOptions } from '../../types/events';
import { EventRegistrationForm } from '../../components/events/EventRegistrationForm';

interface PublicEventPageProps {
  params: Record<string, string>;
  navigate: (to: string) => void;
}

const PublicEventPage: React.FC<PublicEventPageProps> = ({ params, navigate }) => {
  const slug = params.slug;
  const [showRegistration, setShowRegistration] = useState(false);
  const [registrationCount, setRegistrationCount] = useState(0);

  // Fetch event data
  const event = useQuery(api.events.getEventBySlug, slug ? { slug } : 'skip');
  const eventRegistrationCount = useQuery(
    api.events.getEventRegistrationCount, 
    event ? { eventId: event._id } : 'skip'
  );

  // Update registration count when it loads
  useEffect(() => {
    if (eventRegistrationCount !== undefined) {
      setRegistrationCount(eventRegistrationCount);
    }
  }, [eventRegistrationCount]);

  // Apply team branding
  useEffect(() => {
    if (event?.team) {
      const theme = generateEventTheme(event.team);
      applyTeamTheme(theme);
    }
    
    return () => {
      clearTeamTheme();
    };
  }, [event]);

  // SEO Meta tags
  useEffect(() => {
    if (event) {
      document.title = `${event.title} - ${event.team.name}`;
      
      // Basic meta tags
      updateMetaTag('description', `${event.description.substring(0, 160)}...`);
      updateMetaTag('keywords', `event, ${event.team.name}, ${event.eventType}, ${event.venue}`);
      
      // Open Graph tags
      updateMetaProperty('og:title', event.title);
      updateMetaProperty('og:description', event.description);
      updateMetaProperty('og:type', 'event');
      updateMetaProperty('og:url', window.location.href);
      if (event.socialImageUrl || event.bannerImageUrl) {
        updateMetaProperty('og:image', event.socialImageUrl || event.bannerImageUrl);
      }
      
      // Twitter Card tags
      updateMetaProperty('twitter:card', 'summary_large_image');
      updateMetaProperty('twitter:title', event.title);
      updateMetaProperty('twitter:description', event.description);
      
      // Structured data
      const structuredData = {
        '@context': 'https://schema.org',
        '@type': 'Event',
        name: event.title,
        description: event.description,
        startDate: new Date(event.startTime).toISOString(),
        endDate: new Date(event.endTime).toISOString(),
        location: {
          '@type': 'Place',
          name: event.venue,
        },
        organizer: {
          '@type': 'Organization',
          name: event.team.name,
        },
        eventStatus: 'https://schema.org/EventScheduled',
      };
      
      updateStructuredData(structuredData);
    }
    
    return () => {
      // Cleanup meta tags on unmount
      document.title = 'Event Platform';
    };
  }, [event]);
  
  // Early return checks after all hooks
  if (!slug) {
    return <EventNotFound navigate={navigate} />;
  }

  if (event === undefined) {
    return <PublicEventPageSkeleton />;
  }

  if (event === null) {
    return <EventNotFound navigate={navigate} />;
  }

  const eventTypeConfig = eventTypeOptions.find(option => option.value === event.eventType);
  const eventIsUpcoming = isUpcoming(event.startTime);
  const eventIsPast = isPast(event.endTime);
  const isAtCapacity = event.maxCapacity && registrationCount >= event.maxCapacity;
  const registrationDeadlinePassed = event.registrationDeadline && event.registrationDeadline <= Date.now();
  
  const canRegister = event.status === 'published' && 
                     eventIsUpcoming && 
                     !isAtCapacity && 
                     !registrationDeadlinePassed;

  const handleRegistrationSuccess = () => {
    setRegistrationCount(prev => prev + 1);
    setShowRegistration(false);
    // Show success message or redirect
  };

  return (
    <div className="min-h-screen bg-muted/50">
      {/* Hero Section */}
      <div className="relative">
        {/* Event Image Background */}
        {event.bannerImageUrl && (
          <div className="absolute inset-0 z-0">
            <img
              src={event.bannerImageUrl}
              alt={event.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black bg-opacity-40" />
          </div>
        )}
        
        {/* Hero Content */}
        <div 
          className="relative z-10 text-foreground"
          style={{
            background: `linear-gradient(to right, var(--event-primary, #3b82f6), var(--event-secondary, #1e40af))`
          }}
        >
          <div className="container mx-auto px-4 py-12 md:py-20">
            
            {/* Team Branding */}
            <div className="flex items-center gap-3 mb-6">
              {event.team.logoUrl && (
                <img
                  src={event.team.logoUrl}
                  alt={`${event.team.name} logo`}
                  className="w-12 h-12 rounded-lg object-cover border-2 border-white/20"
                />
              )}
              <div>
                <div className="text-foreground/80 text-sm font-medium">Organized by</div>
                <div className="text-xl font-bold">{event.team.name}</div>
              </div>
            </div>

            {/* Event Type Badge */}
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-4">
              <span className="text-2xl">{eventTypeConfig?.icon || '📅'}</span>
              <span className="font-medium">{eventTypeConfig?.label}</span>
            </div>

            {/* Event Title */}
            <h1 className="text-4xl md:text-6xl font-bold mb-4 leading-tight">
              {event.title}
            </h1>

            {/* Date and Status */}
            <div className="flex flex-wrap items-center gap-4 text-lg mb-8">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>{formatDate(event.startTime)} at {formatTime(event.startTime)}</span>
              </div>
              
              {eventIsUpcoming && (
                <div className="bg-green-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                  Upcoming
                </div>
              )}
              
              {eventIsPast && (
                <div className="bg-muted text-muted-foreground px-3 py-1 rounded-full text-sm font-medium">
                  Past Event
                </div>
              )}
              
              {isAtCapacity && (
                <div className="bg-destructive text-destructive-foreground px-3 py-1 rounded-full text-sm font-medium">
                  Sold Out
                </div>
              )}
            </div>

            {/* Registration CTA */}
            {canRegister && (
              <div className="flex flex-col sm:flex-row gap-4 items-start">
                <button
                  onClick={() => setShowRegistration(true)}
                  className="bg-background border px-8 py-4 rounded-lg font-bold text-lg hover:bg-muted/50 transition-colors shadow-lg"
                  style={{ color: 'var(--event-primary, #3b82f6)' }}
                >
                  Register for Free
                </button>
                <div className="text-foreground/80">
                  {event.maxCapacity && (
                    <div className="text-sm">
                      {registrationCount} of {event.maxCapacity} spots filled
                    </div>
                  )}
                  {!event.maxCapacity && (
                    <div className="text-sm">
                      {registrationCount} people registered
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Event Details - Main Column */}
            <div className="lg:col-span-2 space-y-8">
              
              {/* Description */}
              <section className="bg-background rounded-lg p-6 shadow-sm">
                <h2 className="text-2xl font-bold mb-4">About This Event</h2>
                <div className="prose prose-lg max-w-none">
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {event.description}
                  </p>
                </div>
              </section>

              {/* Date & Time Details */}
              <section className="bg-background rounded-lg p-6 shadow-sm">
                <h2 className="text-2xl font-bold mb-4">When & Where</h2>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <svg className="w-6 h-6 text-primary mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <div>
                      <div className="font-semibold text-foreground">
                        {formatDate(event.startTime)}
                      </div>
                      <div className="text-muted-foreground">
                        {formatTime(event.startTime)} - {formatTime(event.endTime)}
                      </div>
                      <div className="text-sm text-muted-foreground/70">
                        {event.timezone}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <svg className="w-6 h-6 text-primary mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <div>
                      <div className="font-semibold text-foreground">
                        {event.venue}
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Social Sharing */}
              <section className="bg-background rounded-lg p-6 shadow-sm">
                <h2 className="text-2xl font-bold mb-4">Share This Event</h2>
                <div className="flex flex-wrap gap-3">
                  <SocialShareButton 
                    platform="facebook" 
                    url={window.location.href}
                    title={event.title}
                  />
                  <SocialShareButton 
                    platform="twitter" 
                    url={window.location.href}
                    title={event.title}
                  />
                  <SocialShareButton 
                    platform="whatsapp" 
                    url={window.location.href}
                    title={event.title}
                  />
                  <SocialShareButton 
                    platform="copy" 
                    url={window.location.href}
                    title={event.title}
                  />
                </div>
              </section>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              
              {/* Registration Card */}
              <div className="bg-background rounded-lg p-6 shadow-sm border-l-4" 
                   style={{ borderLeftColor: event.team.primaryColor || '#3b82f6' }}>
                <h3 className="text-xl font-bold mb-4">Event Registration</h3>
                
                {canRegister ? (
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600 mb-1">
                        FREE
                      </div>
                      <div className="text-sm text-muted-foreground">Registration</div>
                    </div>
                    
                    {event.maxCapacity && (
                      <div>
                        <div className="flex justify-between text-sm text-muted-foreground mb-1">
                          <span>Spots Available</span>
                          <span>{event.maxCapacity - registrationCount} left</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className="h-2 rounded-full transition-all"
                            style={{ 
                              width: `${Math.min((registrationCount / event.maxCapacity) * 100, 100)}%`,
                              backgroundColor: event.team.primaryColor || '#3b82f6'
                            }}
                          />
                        </div>
                      </div>
                    )}
                    
                    <button
                      onClick={() => setShowRegistration(true)}
                      className="w-full py-3 px-4 text-white font-semibold rounded-lg hover:opacity-90 transition-colors"
                      style={{ backgroundColor: event.team.primaryColor || '#3b82f6' }}
                    >
                      Register Now
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    {eventIsPast && (
                      <div className="text-muted-foreground">
                        This event has already ended
                      </div>
                    )}
                    {isAtCapacity && eventIsUpcoming && (
                      <div className="text-destructive font-semibold">
                        Event is at full capacity
                      </div>
                    )}
                    {registrationDeadlinePassed && eventIsUpcoming && (
                      <div className="text-destructive font-semibold">
                        Registration deadline has passed
                      </div>
                    )}
                    {event.status !== 'published' && (
                      <div className="text-muted-foreground">
                        Registration is not yet open
                      </div>
                    )}
                  </div>
                )}
                
                <div className="mt-4 text-sm text-muted-foreground text-center">
                  {registrationCount} people registered
                </div>
              </div>

              {/* Organizer Info */}
              <div className="bg-background rounded-lg p-6 shadow-sm">
                <h3 className="text-xl font-bold mb-4">Organized by</h3>
                <div className="flex items-center gap-3">
                  {event.team.logo && (
                    <img
                      src={`${window.location.origin}/api/storage/${event.team.logo}`}
                      alt={`${event.team.name} logo`}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                  )}
                  <div>
                    <div className="font-semibold text-foreground">
                      {event.team.name}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Event Organizer
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Registration Modal */}
      {showRegistration && (
        <EventRegistrationForm
          event={event}
          isOpen={showRegistration}
          onClose={() => setShowRegistration(false)}
          onSuccess={handleRegistrationSuccess}
        />
      )}
    </div>
  );
};

// Helper function to update meta tags
const updateMetaTag = (name: string, content: string) => {
  let meta = document.querySelector(`meta[name="${name}"]`);
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('name', name);
    document.head.appendChild(meta);
  }
  meta.setAttribute('content', content);
};

// Helper function to update meta property tags
const updateMetaProperty = (property: string, content: string) => {
  let meta = document.querySelector(`meta[property="${property}"]`);
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('property', property);
    document.head.appendChild(meta);
  }
  meta.setAttribute('content', content);
};

// Helper function to add structured data
const updateStructuredData = (data: object) => {
  let script = document.querySelector('#structured-data');
  if (!script) {
    script = document.createElement('script');
    script.setAttribute('type', 'application/ld+json');
    script.setAttribute('id', 'structured-data');
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(data);
};

// Social Share Button Component
const SocialShareButton: React.FC<{
  platform: 'facebook' | 'twitter' | 'whatsapp' | 'copy';
  url: string;
  title: string;
}> = ({ platform, url, title }) => {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const encodedUrl = encodeURIComponent(url);
    const encodedTitle = encodeURIComponent(title);

    switch (platform) {
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`, '_blank');
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`, '_blank');
        break;
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodedTitle} ${encodedUrl}`, '_blank');
        break;
      case 'copy':
        try {
          await navigator.clipboard.writeText(url);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch (error) {
          // Fallback for older browsers
          const textArea = document.createElement('textarea');
          textArea.value = url;
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }
        break;
    }
  };

  const getIcon = () => {
    switch (platform) {
      case 'facebook': return '📘';
      case 'twitter': return '🐦';
      case 'whatsapp': return '💬';
      case 'copy': return copied ? '✅' : '📋';
    }
  };

  const getLabel = () => {
    switch (platform) {
      case 'facebook': return 'Facebook';
      case 'twitter': return 'Twitter';
      case 'whatsapp': return 'WhatsApp';
      case 'copy': return copied ? 'Copied!' : 'Copy Link';
    }
  };

  return (
    <button
      onClick={() => void handleShare()}
      className="flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg transition-colors"
    >
      <span className="text-lg">{getIcon()}</span>
      <span className="text-sm font-medium">{getLabel()}</span>
    </button>
  );
};

// Loading skeleton component
const PublicEventPageSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen bg-muted/50 animate-pulse">
      <div className="bg-muted h-64 md:h-80" />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <div className="bg-background rounded-lg p-6 shadow-sm">
                <div className="h-8 bg-muted rounded mb-4" />
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded" />
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                </div>
              </div>
            </div>
            <div className="space-y-6">
              <div className="bg-background rounded-lg p-6 shadow-sm">
                <div className="h-6 bg-muted rounded mb-4" />
                <div className="h-32 bg-muted rounded" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Event not found component
const EventNotFound: React.FC<{ navigate: (to: string) => void }> = ({ navigate }) => {
  return (
    <div className="min-h-screen bg-muted/50 flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl mb-4">🎪</div>
        <h1 className="text-3xl font-bold text-foreground mb-4">Event Not Found</h1>
        <p className="text-muted-foreground mb-8">
          The event you're looking for doesn't exist or is no longer available.
        </p>
        <button
          onClick={() => navigate('/')}
          className="bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors"
        >
          Go to Homepage
        </button>
      </div>
    </div>
  );
};

export default PublicEventPage;