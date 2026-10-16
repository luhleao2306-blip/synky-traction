// This flag is populated only from the live, server-to-server Synky One grant check.
// An email address or a company membership never grants platform-wide access.
export type MasterIdentity = { userId: string; oneAdministrator?: boolean };
export function hasMasterAccess(user: MasterIdentity, nativeMasterId?: string) {
  return user.oneAdministrator === true || (!!nativeMasterId && user.userId === nativeMasterId);
}
