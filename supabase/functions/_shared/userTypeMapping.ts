/**
 * Map user type strings to os_user_type.display values
 * The foreign key constraint fk_user_type_current requires exact match to display column
 *
 * Shared by: signup.ts, oauthSignup.ts
 */

const USER_TYPE_DISPLAY_MAP: Record<string, string> = {
  'Host': 'A Host (I have a space available to rent)',
  'host': 'A Host (I have a space available to rent)',
  'Guest': 'A Guest (I would like to rent a space)',
  'guest': 'A Guest (I would like to rent a space)',
  'Split Lease': 'Split Lease',
  'split_lease': 'Split Lease',
  'Trial Host': 'Trial Host',
  'trial_host': 'Trial Host',
};

const DEFAULT_USER_TYPE_DISPLAY = 'A Guest (I would like to rent a space)';

export function mapUserTypeToDisplay(userType: string): string {
  return USER_TYPE_DISPLAY_MAP[userType] || DEFAULT_USER_TYPE_DISPLAY;
}
