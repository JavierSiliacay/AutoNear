/**
 * Formats a last_active_at timestamp into Facebook/Messenger-style activity text
 */
export interface PresenceInfo {
  isOnline: boolean;
  label: string;
  shortLabel: string;
  color: 'emerald' | 'muted' | 'offline';
}

export function getPresenceStatus(lastActiveAt?: string | Date | null): PresenceInfo {
  if (!lastActiveAt) {
    return {
      isOnline: false,
      label: 'Offline',
      shortLabel: 'Offline',
      color: 'offline'
    };
  }

  const activeTime = typeof lastActiveAt === 'string' ? new Date(lastActiveAt).getTime() : lastActiveAt.getTime();
  if (isNaN(activeTime)) {
    return {
      isOnline: false,
      label: 'Offline',
      shortLabel: 'Offline',
      color: 'offline'
    };
  }

  const diffMs = Math.max(0, Date.now() - activeTime);
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  // Active in the last 3 minutes -> Online Now
  if (diffMins < 3) {
    return {
      isOnline: true,
      label: 'Active Now',
      shortLabel: 'Active Now',
      color: 'emerald'
    };
  }

  // Active within the last hour (3m to 59m)
  if (diffMins < 60) {
    return {
      isOnline: false,
      label: `Active ${diffMins}m ago`,
      shortLabel: `${diffMins}m ago`,
      color: 'muted'
    };
  }

  // Active today (1h to 23h)
  if (diffHours < 24) {
    return {
      isOnline: false,
      label: `Active ${diffHours}h ago`,
      shortLabel: `${diffHours}h ago`,
      color: 'muted'
    };
  }

  // Active yesterday
  if (diffDays === 1) {
    return {
      isOnline: false,
      label: 'Active yesterday',
      shortLabel: 'Yesterday',
      color: 'offline'
    };
  }

  // Active several days ago
  if (diffDays < 7) {
    return {
      isOnline: false,
      label: `Active ${diffDays}d ago`,
      shortLabel: `${diffDays}d ago`,
      color: 'offline'
    };
  }

  return {
    isOnline: false,
    label: 'Offline',
    shortLabel: 'Offline',
    color: 'offline'
  };
}
