/**
 * User onboarding status and utilities
 * SSOT for determining onboarding completion
 */

export interface OnboardedUser {
  profile_address_id?: string | null;
  profile_complete?: boolean | null;
}

/**
 * Check if user has completed onboarding
 * A user is onboarded if they have a default address set
 */
export function isUserOnboarded(user: OnboardedUser): boolean {
  return Boolean(user?.profile_address_id);
}

/**
 * Get onboarding status for API responses
 */
export function getOnboardingStatus(user: OnboardedUser & { onboarding_step?: number | null }) {
  const onboarded = isUserOnboarded(user);
  const step = user.onboarding_step || (onboarded ? 3 : 1);
  
  return {
    onboarded,
    step,
    needsAddress: !user.profile_address_id,
    needsPhone: false // Phone is optional in current flow
  };
}