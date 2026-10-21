/**
 * Single source of truth for Sabah Electricity (SE) Bulletin domain constants,
 * default media assets, authentic station locations, and organizational defaults.
 */

export const DEFAULT_DEPARTMENT_ID = 'dept-ops';

export const DEFAULT_AVATAR_URL = '/sabah_electricity_logo.png';
export const DEFAULT_LOGO_URL = '/sabah_electricity_logo.png';
export const SESB_LOGO_FALLBACK_URL = '/sesb_logo.png';
export const DEFAULT_APP_ICON_URL = '/sesb_app_icon.png';
export const FAVICON_URL = '/favicon.svg';
export const DEFAULT_COVER_URL = '/grid_horizon_hero.jpg';
export const FALLBACK_POST_IMAGE_URL = '/mock-images/image1.png';
export const CEO_AVATAR_URL = '/ceo_portrait.png';

/**
 * Superadmin UUID for local and pilot system privileges.
 */
export const SE_SUPERADMIN_UUID = '270b3427-b4bc-4975-bdfb-3eea83a20229';

/**
 * Authentic canonical stations & facilities across Sabah Electricity.
 */
export const SESB_LOCATIONS = [
  'Wisma SE HQ, Kota Kinabalu',
  'Bangunan KWASA',
  'Tenom Pangi Hydro Power Station',
  'Sepanggar Bay Power Station',
  'Sandakan Regional Station',
  'Tawau Regional Station',
  'Labuan Regional Office',
] as const;

export type SesbLocation = typeof SESB_LOCATIONS[number];

/**
 * Default mission statement / bio for Sabah Electricity staff profiles.
 */
export const DEFAULT_EMPLOYEE_BIO =
  'Committed to Sabah Electricity Goal Zero, digital transformation, and reliable power statewide.';

/**
 * Organizational role titles for employee profiles.
 */
export const SESB_ROLES = [
  'Chief Information & Digital Officer (CIDO)',
  'Head of Department / Director',
  'Senior Manager',
  'Lead Engineer',
  'Senior Executive',
  'Staff Administrator',
  'Technical Specialist',
  'Field Technician',
  'Corporate Staff',
] as const;
