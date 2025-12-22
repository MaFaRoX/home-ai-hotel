import { useApp } from '../contexts/AppContext';
import { Subscription } from '../utils/api/subscriptions';

interface UseSubscriptionOptions {
  appSlug?: string;
}

interface UseSubscriptionReturn {
  subscription: Subscription | null;
  loading: boolean;
  hasFeature: (feature: string) => boolean;
  getFeature: <T = unknown>(feature: string) => T | undefined;
  maxRooms: number; // -1 means unlimited, otherwise defaults to 10 for free plan
  maxBuildings: number; // -1 means unlimited, otherwise defaults to 1 for free plan
  canExportReports: boolean;
  hasAdvancedReports: boolean;
  isPremium: boolean;
}

export function useSubscription({ appSlug = 'guesthouse' }: UseSubscriptionOptions = {}): UseSubscriptionReturn {
  // Use subscription from AppContext (fetched once on login)
  const { subscription: contextSubscription, isPremium: contextIsPremium, isGuestMode, loading: appLoading } = useApp();

  // Filter subscription by appSlug if needed (for multi-app support)
  const subscription = contextSubscription && contextSubscription.appSlug === appSlug
    ? contextSubscription
    : null;

  // Loading is false once app has loaded (subscription is fetched during login)
  const loading = appLoading;

  const hasFeature = (feature: string): boolean => {
    if (isGuestMode) return true;
    if (!subscription || subscription.status !== 'active') {
      return false;
    }
    const featureValue = subscription.features[feature];
    if (featureValue === true) return true;
    if (typeof featureValue === 'number') return featureValue > 0 || featureValue === -1;
    if (featureValue === 'all') return true;
    return false;
  };

  const getFeature = <T = unknown>(feature: string): T | undefined => {
    if (isGuestMode) {
      // Return "premium-like" values for common features in guest mode
      if (feature === 'max_rooms' || feature === 'max_buildings') return -1 as any;
      if (feature === 'export_reports' || feature === 'advanced_reports') return true as any;
      return undefined;
    }
    // Return feature value if subscription exists, otherwise undefined
    if (!subscription || subscription.status !== 'active') {
      return undefined;
    }
    return subscription.features[feature] as T | undefined;
  };

  // Free tier: max 8 rooms, max 1 building
  // Premium: unlimited (-1)
  // Use isPremium from context (already calculated in AppContext)
  const isPremium = isGuestMode || (contextIsPremium && subscription?.appSlug === appSlug);
  const maxRooms = isPremium
    ? -1 // Unlimited for premium
    : (subscription?.features.max_rooms as number | undefined) ?? 8; // Default to 8 for free

  const maxBuildings = isPremium
    ? -1 // Unlimited for premium
    : (subscription?.features.max_buildings as number | undefined) ?? 1; // Default to 1 for free

  const canExportReports = isPremium || hasFeature('export_reports');
  const hasAdvancedReports = isPremium || hasFeature('advanced_reports');

  return {
    subscription,
    loading,
    hasFeature,
    getFeature,
    maxRooms,
    maxBuildings,
    canExportReports,
    hasAdvancedReports,
    isPremium,
  };
}

