export const formatDate = (timestamp: number): string => {
  return new Date(timestamp).toLocaleDateString();
};

export const formatTime = (timestamp: number): string => {
  return new Date(timestamp).toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
};

export const formatDateTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  return `${date.toLocaleDateString()} at ${date.toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  })}`;
};

export const formatRelativeTime = (timestamp: number): string => {
  const now = Date.now();
  const diff = Math.abs(now - timestamp);
  const isPast = timestamp < now;
  
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (minutes < 1) {
    return isPast ? 'Just ended' : 'Starting now';
  } else if (minutes < 60) {
    return isPast ? `Ended ${minutes} min ago` : `Starting in ${minutes} min`;
  } else if (hours < 24) {
    return isPast ? `Ended ${hours}h ago` : `Starting in ${hours}h`;
  } else if (days < 7) {
    return isPast ? `Ended ${days}d ago` : `Starting in ${days}d`;
  } else {
    return formatDate(timestamp);
  }
};

export const isUpcoming = (timestamp: number): boolean => {
  return timestamp > Date.now();
};

export const isPast = (timestamp: number): boolean => {
  return timestamp < Date.now();
};

export const isToday = (timestamp: number): boolean => {
  const today = new Date();
  const date = new Date(timestamp);
  
  return today.toDateString() === date.toDateString();
};

export const getEventStatus = (startTime: number, endTime: number): 'upcoming' | 'ongoing' | 'past' => {
  const now = Date.now();
  
  if (now < startTime) return 'upcoming';
  if (now >= startTime && now <= endTime) return 'ongoing';
  return 'past';
};