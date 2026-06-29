import { ClientsEntity } from '@/product-types';

type Client = (typeof ClientsEntity)['instanceType'];

/**
 * P3.1 ownerEmail STAMP CONTRACT: every create of a client-scoped child row
 * (ClientMilestoneProgress / CoachingSessions / Documents) MUST carry
 * ownerEmail = the parent Client's ownerEmail so the manual RowPolicy can
 * isolate client access. Centralized here so it is never forgotten.
 */
export const withOwnerEmail = <T extends Record<string, unknown>>(
  client: Pick<Client, 'ownerEmail'>,
  data: T,
): T & { ownerEmail?: string } => ({
  ...data,
  ownerEmail: client.ownerEmail,
});