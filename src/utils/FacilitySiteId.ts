import { FacilitiesEntity } from '@/product-types';

type Facility = typeof FacilitiesEntity['instanceType'] & { id?: string };

/**
 * Writer-stamp contract: every Lease / FacilityBooking created in the UI must
 * carry the siteId of the chosen facility. Use this helper on every such
 * create so the row lands in the correct site scope.
 */
export const withFacilitySiteId = <T extends Record<string, unknown>>(
  facility: Facility,
  data: T,
): T & { siteId: string | undefined } => ({
  ...data,
  siteId: facility.siteId,
});