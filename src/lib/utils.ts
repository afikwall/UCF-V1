import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { PageConfig } from '@blocksdiy/blocks-client-sdk/page';

/**
 * Combines multiple class names using clsx and tailwind-merge
 *
 * This utility function merges Tailwind CSS classes intelligently, handling
 * conflicts properly by giving precedence to classes that appear later in the list.
 *
 * @param {...ClassValue[]} inputs - Class values to be combined
 * @returns {string} Merged class string with conflicts resolved
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Generates a URL for a page with optional search parameters
 *
 * Creates a navigation URL pointing to a specific page and adds optional search
 * parameters. Pass the page name as a string (the filename under `src/pages/`
 * without `.tsx`, e.g. `'Dashboard'` or `'admin/Users'`), or a legacy
 * `PageConfig` object for backward compatibility.
 *
 * @param {PageConfig | string} page - Page name string or page configuration
 * @param {Record<string, string>} searchParams - Optional query parameters to include in the URL
 * @returns {string} The complete URL for the page
 * @example
 * ```ts
 * // Preferred: page name string (matches src/pages/ProductDetails.tsx)
 * const url = getPageUrl('ProductDetails', { productId: '123' });
 * // Result: "/ProductDetails?productId=123"
 *
 * // Legacy: PageConfig object (still supported)
 * const url = getPageUrl({ pageBlockId: 'product-details-id', pageName: 'product-details' });
 * ```
 */
export function getPageUrl(
  page: PageConfig | string,
  searchParams: Record<string, string> = {},
) {
  const appId = (window as any).appId as string | undefined;
  if (!appId) {
    return '';
  }

  const searchParamsString = new URLSearchParams(
    searchParams as Record<string, string>,
  ).toString();

  const { pathname: currentPath } = window.location;
  const pageBlockId = typeof page === 'string' ? page : page.pageBlockId;
  const pageName = typeof page === 'string' ? page : page.pageName;

  if (currentPath.startsWith('/app/')) {
    return `/app/${pageBlockId}${searchParamsString ? `?${searchParamsString}` : ''}`;
  }

  if (currentPath.startsWith('/apps/')) {
    return `/apps/${appId}/design/pages/${pageBlockId}${searchParamsString ? `?${searchParamsString}` : ''}`;
  }

  return `/${pageName || pageBlockId}${searchParamsString ? `?${searchParamsString}` : ''}`;
}

/**
 * Generates a URL for the login page
 *
 * @returns {string} The URL for the login page
 */
export function getLoginUrl() {
  return `/auth/login`;
}

/**
 * Logs out the user by removing the token from localStorage and reloading the page
 */
export function logOut() {
  localStorage.removeItem('token');
  window.location.href = '/auth/logout';
}
