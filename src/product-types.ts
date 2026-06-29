export type AccessRequestsEntityRequestedRoleEnum =
  | "Client"
  | "Funder"
  | "SiteManager"
  | "ProgramCoordinator";

export type AccessRequestsEntityStatusEnum =
  | "Pending"
  | "Approved"
  | "Approved - pending invite"
  | "Denied";

/**
 * In-app access-provisioning requests. Staff (SiteManager/ProgramCoordinator), who lack Blocks build permission, file requests to grant a person access to a Client company, a Funder, or a staff site assignment. ProgramAdmins (build users) approve/deny from the Sites & Access inbox. requesterEmail/decidedByEmail are stamped SERVER-SIDE from getCurrentUser() and never trusted from the request body. Approving writes the linkage row immediately; if no Blocks account exists yet, status becomes 'Approved - pending invite' so the admin knows to invite the email as a 'use' member in App Settings -> Members. Scoping: SM/Coordinator see only rows for their own sites or that they filed; ProgramAdmin sees all.
 */
export interface IAccessRequestsEntity {
  /** Staff member who filed the request (normalized, lowercased). Stamped server-side from getCurrentUser(); never trusted from the request body.  */
  requesterEmail?: string;
  /** Email of the person being granted access (normalized, lowercased).  */
  requestedUserEmail?: string;
  /** Free-text justification supplied by the requester.  */
  note?: string;
  /** ProgramAdmin who approved/denied (normalized). Stamped server-side from getCurrentUser().  */
  decidedByEmail?: string;
  /** When the request was approved/denied. ISO 8601 datetime string.. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30  */
  decidedAt?: string;
  /** Persona the requester wants this email to have once approved.  */
  requestedRole?: AccessRequestsEntityRequestedRoleEnum;
  /** Clients.id to link when requestedRole=Client (the single company for that client). Empty otherwise.  */
  targetClientId?: string;
  /** Funder reference to link when requestedRole=Funder (free string until a Funders table exists). Empty otherwise.  */
  targetFunderId?: string;
  /** Sites.id to assign when requestedRole=SiteManager/ProgramCoordinator. For staff requesters this must be one of their own assigned sites (enforced server-side).  */
  targetSiteId?: string;
  /** Grouping/scope key for the inbox = the site this request belongs to. Equals targetSiteId for staff requests; for client/funder requests it is the company's primary site when known. Drives SM/Coordinator inbox visibility.  */
  siteId?: string;
  /** Lifecycle of the request.  */
  status?: AccessRequestsEntityStatusEnum;
  /** Set true via the 'Invited / account exists' checkbox to clear the pending-invite call-to-action once the admin has invited the email in Members (or confirmed the account exists).  */
  inviteCleared?: boolean;
}

export const AccessRequestsEntity = {
  tableBlockId: "AccessRequests",
  instanceType: {} as IAccessRequestsEntity,
} as const;

export type ApplicationsEntityRecommendedTrackEnum =
  | "Traction"
  | "Growth"
  | "Soft Landing"
  | "Partner Referral";

export type ApplicationsEntityStatusEnum =
  | "Screener Started"
  | "Partner Referral"
  | "Site Selected"
  | "Application Submitted"
  | "Under Review"
  | "Intro Meeting"
  | "Presentation"
  | "Scored"
  | "Accepted"
  | "Declined"
  | "Hold"
  | "Withdrawn";

/**
 * Holds applicant submissions from the public intake wizard. Anonymous (no-login) users can CREATE rows via the public app; the table is NOT publicly readable. Internal staff read rows scoped to their assigned sites via selectedSiteId (P0.3 usePersona siteIds). Partner-referral rows carry only the 5 screener booleans + status (no PII). Demographic and contact fields are staff-read only and must never be surfaced on any public screen.
 */
export interface IApplicationsEntity {
  /** Reason the application is on Hold (required when status = Hold)  */
  holdReason?: string;
  /** Company / venture name  */
  companyName?: string;
  /** Primary founder full name  */
  founderName?: string;
  /** Founder email, stored trimmed + lowercased  */
  founderEmail?: string;
  /** Founder phone number  */
  founderPhone?: string;
  /** Screener: business is headquartered in Central Florida (CFL HQ). DRAFT wording.  */
  screenerQ1?: boolean;
  /** Screener: business is for-profit. DRAFT wording.  */
  screenerQ2?: boolean;
  /** Screener: business is independent of a franchise. DRAFT wording.  */
  screenerQ3?: boolean;
  /** Screener: business is scalable. DRAFT wording.  */
  screenerQ4?: boolean;
  /** Screener: business is technology / innovation-driven. DRAFT wording.  */
  screenerQ5?: boolean;
  /** Track the applicant selected / was routed to  */
  recommendedTrack?: ApplicationsEntityRecommendedTrackEnum;
  /** Description of the business  */
  businessDescription?: string;
  /** Industry / NAICS code  */
  industryNaics?: string;
  /** Business stage  */
  stage?: string;
  /** Competitive advantage  */
  competitiveAdvantage?: string;
  /** Market validation evidence  */
  marketValidation?: string;
  /** Growth plan  */
  growthPlan?: string;
  /** Financials summary  */
  financials?: string;
  /** Why the program is a fit  */
  programFit?: string;
  /** Connections to UCF  */
  ucfConnections?: string;
  /** Demographic: race (optional, staff-read only)  */
  race?: string;
  /** Demographic: ethnicity (optional, staff-read only)  */
  ethnicity?: string;
  /** Demographic: veteran status (optional, staff-read only)  */
  veteran?: string;
  /** Demographic: age group (optional, staff-read only)  */
  ageGroup?: string;
  /** Demographic: disability status (optional, staff-read only)  */
  disability?: string;
  /** How the applicant heard about the program (optional)  */
  referralSource?: string;
  /** Application lifecycle status  */
  status?: ApplicationsEntityStatusEnum;
  /** Incubator site the applicant selected; drives staff site-scope  */
  selectedSiteId?: string;
  /** Follow-up date for a held application (required when status = Hold). ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30  */
  followUpDate?: string;
}

export const ApplicationsEntity = {
  tableBlockId: "Applications",
  instanceType: {} as IApplicationsEntity,
} as const;

export type ClientMilestoneProgressEntityStatusEnum =
  | "Not Started"
  | "In Progress"
  | "Completed";

/**
 * Per-client progress on a StageMilestone. CLIENT-READABLE: carries a scalar ownerEmail (= parent Client.ownerEmail) set by the writer on create, so the SAME manual role-aware RowPolicy as Clients applies (App Settings -> Table Permissions): staff roles pass through; Client/Funder see only rows where ownerEmail == {{user.email}}. Policies are configured manually, NOT in this artifact.
 */
export interface IClientMilestoneProgressEntity {
  /** When work on this milestone started. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30  */
  startedDate?: string;
  /** Progress notes  */
  notes?: string;
  /** Milestone being tracked  */
  stageMilestoneId?: string;
  /** Progress status  */
  status?: ClientMilestoneProgressEntityStatusEnum;
  /** Client this progress belongs to  */
  clientId?: string;
  /** Scalar row-scope owner (= parent Client.ownerEmail), set on create. Drives the manual RowPolicy for client isolation.  */
  ownerEmail?: string;
  /** Client-entered comment on this milestone; separate from staff 'notes'. Client-writable ONLY via the UpsertMyMilestoneProgress code action (whitelisted status + clientComment).  */
  clientComment?: string;
  /** When this milestone was completed. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30  */
  completedDate?: string;
}

export const ClientMilestoneProgressEntity = {
  tableBlockId: "ClientMilestoneProgress",
  instanceType: {} as IClientMilestoneProgressEntity,
} as const;

export type ClientsEntityTrackEnum = "Traction" | "Growth" | "Soft Landing";

export type ClientsEntityStatusEnum =
  | "Prospect"
  | "Applicant"
  | "Active"
  | "On Hold"
  | "At Risk"
  | "Withdrawn"
  | "Graduated";

export type ClientsEntityLocationTypeEnum = "Onsite" | "Offsite";

export type ClientsEntityRiskLevelEnum = "Low" | "Medium" | "High";

/**
 * A Client is created from an Accepted application via the AcceptApplication server action. ownerEmail is the SCALAR row-scope key (= normalizeEmail(founderEmail)); the MANUAL Clients RowPolicy (App Settings -> Table Permissions) keys on it so Client/Funder 'use' users see only their own row while staff roles pass through. riskLevel and ein are INTERNAL/staff-only and are hidden from non-staff by a MANUAL ColumnPolicy (and excluded from the ClientPortalSafe view). siteId gives staff site scope (app-layer for now). These RowPolicy/ColumnPolicy controls are NOT in this artifact — they are configured manually in App Settings and gate client login.
 */
export interface IClientsEntity {
  /** Program start date. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30  */
  startDate?: string;
  /** Company / venture name  */
  companyName?: string;
  /** Founder email (normalized, lowercased)  */
  founderEmail?: string;
  /** Scalar row-scope owner (= normalized founderEmail). The manual Clients RowPolicy keys on this for Client/Funder isolation.  */
  ownerEmail?: string;
  /** Program track  */
  track?: ClientsEntityTrackEnum;
  /** Business stage  */
  stage?: string;
  /** Client lifecycle status  */
  status?: ClientsEntityStatusEnum;
  /** Incubator site (staff site scope)  */
  siteId?: string;
  /** Suite / unit at the site  */
  suite?: string;
  /** Onsite or offsite client  */
  locationType?: ClientsEntityLocationTypeEnum;
  /** Origin country/region for soft-landing clients (INTERNAL)  */
  softLandingOrigin?: string;
  /** Industry / NAICS code  */
  industryNaics?: string;
  /** Employer Identification Number (INTERNAL/staff-only)  */
  ein?: string;
  /** CEO full name  */
  ceoName?: string;
  /** CEO email  */
  ceoEmail?: string;
  /** CEO phone  */
  ceoPhone?: string;
  /** Company website URL  */
  website?: string;
  /** Company description  */
  description?: string;
  /** Company logo URL  */
  logoUrl?: string;
  /** INTERNAL/staff-only risk assessment  */
  riskLevel?: ClientsEntityRiskLevelEnum;
  /** Total funding raised (USD)  */
  funding?: number;
  /** Annual revenue (USD)  */
  revenue?: number;
  /** Number of team members  */
  teamSize?: number;
  /** Number of mentors engaged  */
  mentorsEngaged?: number;
  /** Program resources used  */
  resourcesUsed?: string;
}

export const ClientsEntity = {
  tableBlockId: "Clients",
  instanceType: {} as IClientsEntity,
} as const;

export type ClientUsersEntityStatusEnum = "Invited" | "Active";

/**
 * Linkage table mapping a client user's email to a client company. A Client belongs to EXACTLY ONE company: there is one row per userEmail (uniqueness is enforced SERVER-SIDE in the AssignClientCompany / ApproveAccessRequest code actions — they move the single row on reassignment, never insert a duplicate; the platform has no DB unique constraint). A client with no ClientUsers row = Access Pending. userEmail is stored trimmed + lowercased (canonical form used by the data-driven usePersona() resolver). clientId references a Clients company.
 */
export interface IClientUsersEntity {
  /** Client user's email, stored trimmed + lowercased  */
  userEmail?: string;
  /** Free reference to a client company (plain string until the Clients table exists)  */
  clientId?: string;
  /** Invitation/access status of this client user  */
  status?: ClientUsersEntityStatusEnum;
}

export const ClientUsersEntity = {
  tableBlockId: "ClientUsers",
  instanceType: {} as IClientUsersEntity,
} as const;

/**
 * Coaching session records for a Client. CLIENT-READABLE: carries scalar ownerEmail (= parent Client.ownerEmail) set on create → SAME manual role-aware RowPolicy as Clients. sessionNotes is INTERNAL/staff-only and MUST be in the manual ColumnPolicy deny list (hidden from non-staff) and excluded from any client-facing safe view (P3.2). actionItems is client-visible. Policies configured manually, NOT in this artifact.
 */
export interface ICoachingSessionsEntity {
  /** Date of the next scheduled session. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30  */
  nextSessionDate?: string;
  /** INTERNAL/staff-only coaching notes. Hidden from clients via manual ColumnPolicy + excluded from client-facing views.  */
  sessionNotes?: string;
  /** Scalar row-scope owner (= parent Client.ownerEmail), set on create. Drives the manual RowPolicy for client isolation.  */
  ownerEmail?: string;
  /** Client this session is for  */
  clientId?: string;
  /** Session type  */
  type?: string;
  /** Session length in minutes  */
  durationMinutes?: number;
  /** Site manager / coach who led the session  */
  siteManager?: string;
  /** Topics covered  */
  topics?: string;
  /** Action items (client-visible)  */
  actionItems?: string;
  /** Session date. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30  */
  date?: string;
}

export const CoachingSessionsEntity = {
  tableBlockId: "CoachingSessions",
  instanceType: {} as ICoachingSessionsEntity,
} as const;

export type ContactsEntityContactTypeEnum =
  | "Mentor"
  | "Partner"
  | "Investor"
  | "Sponsor"
  | "Service Provider"
  | "Other";

/**
 * Staff-only contacts/CRM directory. email is stored normalized (trim+lowercase) via normalizeEmail (src/utils/EmailUtils.ts) on every write. tags is a comma-separated list of segments (for Constant Contact segmentation; multiselect in UI). siteId scopes to a site for SiteManager/ProgramCoordinator; a BLANK siteId means program-wide (visible to ALL staff — these are shared, not site-specific). Site-scoped read = site rows + program-wide (blank siteId) union. All seed data DRAFT until UCF/Constant Contact export provides the real list.
 */
export interface IContactsEntity {
  /** Full name  */
  fullName?: string;
  /** Email (stored trimmed + lowercased)  */
  email?: string;
  /** Phone number  */
  phone?: string;
  /** Company / organization  */
  company?: string;
  /** Job title  */
  title?: string;
  /** Type of contact  */
  contactType?: ContactsEntityContactTypeEnum;
  /** Comma-separated tags/segments for Constant Contact segmentation  */
  tags?: string;
  /** Areas of expertise (esp. for mentors)  */
  expertise?: string;
  /** Notes  */
  notes?: string;
  /** Site for staff scope; BLANK = program-wide (all staff)  */
  siteId?: string;
}

export const ContactsEntity = {
  tableBlockId: "Contacts",
  instanceType: {} as IContactsEntity,
} as const;

export type ContractsEntityTypeEnum = "License Agreement" | "Other";

export type ContractsEntityStatusEnum = "Draft" | "Sent" | "Signed" | "Void";

/**
 * Mapped application/client fields used to fill the template
 */
export interface IContractsEntityFieldMapJsonObject {
  companyName?: string;
  founderName?: string;
  founderEmail?: string;
  track?: string;
  siteId?: string;
  startDate?: string;
}

/**
 * One row per contract document for a Client. fieldMapJson holds the mapped application/client fields used to populate the template. PDF generation (GenerateContract) is STUBBED until UCF delivers the 4 templates; status stays pending-template and pdfUrl null until then. Internal/staff.
 */
export interface IContractsEntity {
  /** When the contract was generated. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30  */
  generatedAt?: string;
  /** Client this contract belongs to  */
  clientId?: string;
  /** Contract type  */
  type?: ContractsEntityTypeEnum;
  /** Contract status  */
  status?: ContractsEntityStatusEnum;
  /** Identifier of the template used (gated on UCF templates)  */
  templateKey?: string;
  /** URL of the generated PDF (null until templates are wired)  */
  pdfUrl?: string;
  /** Mapped application/client fields used to fill the template  */
  fieldMapJson?: IContractsEntityFieldMapJsonObject;
}

export const ContractsEntity = {
  tableBlockId: "Contracts",
  instanceType: {} as IContractsEntity,
} as const;

/**
 * Documents attached to a Client. CLIENT-READABLE: carries scalar ownerEmail (= parent Client.ownerEmail) set on create → SAME manual role-aware RowPolicy as Clients. fileUrl stores the uploaded file URL (reserved column name 'file' avoided). Policies configured manually, NOT in this artifact.
 */
export interface IDocumentsEntity {
  /** Uploaded file URL  */
  fileUrl?: string;
  /** Document type/category  */
  type?: string;
  /** Scalar row-scope owner (= parent Client.ownerEmail), set on create. Drives the manual RowPolicy for client isolation.  */
  ownerEmail?: string;
  /** Client this document belongs to  */
  clientId?: string;
}

export const DocumentsEntity = {
  tableBlockId: "Documents",
  instanceType: {} as IDocumentsEntity,
} as const;

export type FacilitiesEntityTypeEnum = "Office/Suite" | "Conference Room";

export type FacilitiesEntityAvailabilityStatusEnum =
  | "Available"
  | "Occupied"
  | "Maintenance";

/**
 * Facilities belong to a Site (siteId). Staff-only management. Site-scoped via the same server-side {where siteId in scope.siteIds} pattern as Clients/Applications. amenities is comma-separated text (multiselect in UI). Seeded with DRAFT Downtown Orlando facilities (siteId 9798818); Eustis + Kissimmee DRAFT facilities inserted via MCP post-sync. All seed data is DRAFT until UCF provides real inventory.
 */
export interface IFacilitiesEntity {
  /** Site this facility belongs to (site scope)  */
  siteId?: string;
  /** Facility name (DRAFT)  */
  name?: string;
  /** Facility type  */
  type?: FacilitiesEntityTypeEnum;
  /** Capacity (people)  */
  capacity?: number;
  /** Amenities (comma-separated)  */
  amenities?: string;
  /** Current availability  */
  availabilityStatus?: FacilitiesEntityAvailabilityStatusEnum;
  /** Notes  */
  notes?: string;
}

export const FacilitiesEntity = {
  tableBlockId: "Facilities",
  instanceType: {} as IFacilitiesEntity,
} as const;

export type FacilityBookingsEntityStatusEnum =
  | "Tentative"
  | "Confirmed"
  | "Rejected";

/**
 * A time-slot booking of a Facility. siteId is denormalized from the facility for the site-scoped {where siteId in scope.siteIds} query (writer stamps siteId = facility.siteId on create). P4.1 = staff/coordinator-created bookings ONLY; the client-submitted request entry point is P4.2 and is GATED on the client portal — no client-facing request form exists yet. Staff see requesterName/email on each slot.
 */
export interface IFacilityBookingsEntity {
  /** Booked facility  */
  facilityId?: string;
  /** Site (denormalized from facility) for site scope  */
  siteId?: string;
  /** Requester email  */
  requesterEmail?: string;
  /** Requester name  */
  requesterName?: string;
  /** Booking status  */
  status?: FacilityBookingsEntityStatusEnum;
  /** Purpose of the booking  */
  purpose?: string;
  /** Booking end. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30  */
  endTime?: string;
  /** Booking start. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30  */
  startTime?: string;
}

export const FacilityBookingsEntity = {
  tableBlockId: "FacilityBookings",
  instanceType: {} as IFacilityBookingsEntity,
} as const;

export type FitAssessmentScorecardsEntityDecisionRecommendationEnum =
  | "Accept"
  | "Decline"
  | "Hold";

/**
 * Weighted fit-assessment scorecard tied to an Application. siteId is denormalized from the application's selectedSiteId so scorecards are site-scoped with the same server-side filter pattern as Applications. Criterion scores are 1-5; weightedTotal is the 0-100 rollup (Market 25, Technology 25, Team 20, Traction 20, ProgramFit 10). aiGenerated marks rows pre-populated by the EvaluateApplication AI action (human reviews + edits before saving). Internal staff-only.
 */
export interface IFitAssessmentScorecardsEntity {
  /** Application this scorecard assesses  */
  applicationId?: string;
  /** Site (denormalized from the application's selectedSiteId) for site-scoping  */
  siteId?: string;
  /** Market / Scalability score (1-5), weight 25  */
  scoreMarket?: number;
  /** Technology / Innovation score (1-5), weight 25  */
  scoreTechnology?: number;
  /** Team score (1-5), weight 20  */
  scoreTeam?: number;
  /** Traction / Validation score (1-5), weight 20  */
  scoreTraction?: number;
  /** Program Fit score (1-5), weight 10  */
  scoreProgramFit?: number;
  /** Weighted total fit score, 0-100  */
  weightedTotal?: number;
  /** Name of the reviewer who scored  */
  reviewerName?: string;
  /** Reviewer's recommended decision  */
  decisionRecommendation?: FitAssessmentScorecardsEntityDecisionRecommendationEnum;
  /** Reviewer notes / rationale  */
  notes?: string;
  /** True when the scorecard was pre-populated by EvaluateApplication AI  */
  aiGenerated?: boolean;
}

export const FitAssessmentScorecardsEntity = {
  tableBlockId: "FitAssessmentScorecards",
  instanceType: {} as IFitAssessmentScorecardsEntity,
} as const;

/**
 * Linkage table mapping a funder user's email to a funder. userEmail is stored trimmed + lowercased (canonical form used by usePersona() lookups). funderId is a FREE string reference for now — the Funders table does not exist yet (created in a later milestone), so no reference constraint is applied.
 */
export interface IFunderUsersEntity {
  /** Funder user's email, stored trimmed + lowercased  */
  userEmail?: string;
  /** Free reference to a funder (plain string until the Funders table exists)  */
  funderId?: string;
}

export const FunderUsersEntity = {
  tableBlockId: "FunderUsers",
  instanceType: {} as IFunderUsersEntity,
} as const;

export type LeasesEntityStatusEnum = "Active" | "Pending" | "Ended";

/**
 * A lease links a Client to a Facility with financial terms. siteId is denormalized from the facility for the site-scoped {where siteId in scope.siteIds} query (writer stamps siteId = facility.siteId on create). ALL financial fields are STAFF-only and must NEVER be added to a client-portal view/allowed list. Site-scoped staff management.
 */
export interface ILeasesEntity {
  /** Move-in date. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30  */
  moveInDate?: string;
  /** Client on the lease  */
  clientId?: string;
  /** Leased facility  */
  facilityId?: string;
  /** Site (denormalized from facility) for site scope  */
  siteId?: string;
  /** Suite / unit number  */
  suiteNumber?: string;
  /** Monthly program fee (USD, STAFF-only)  */
  programFee?: number;
  /** Monthly space fee (USD, STAFF-only)  */
  spaceFee?: number;
  /** Total monthly (USD, STAFF-only)  */
  totalMonthly?: number;
  /** Deposit (USD, STAFF-only)  */
  deposit?: number;
  /** First payment (USD, STAFF-only)  */
  firstPayment?: number;
  /** Current contract amount (USD, STAFF-only)  */
  currentContractAmount?: number;
  /** Aggregate contract amount to date (USD, STAFF-only)  */
  aggregateContractAmount?: number;
  /** Lease terms  */
  terms?: string;
  /** Lease status  */
  status?: LeasesEntityStatusEnum;
}

export const LeasesEntity = {
  tableBlockId: "Leases",
  instanceType: {} as ILeasesEntity,
} as const;

export type SitesEntityStatusEnum =
  | "Active"
  | "Under Renovation"
  | "Coming Soon"
  | "Closed";

/**
 * Physical incubator sites operated by the UCF Business Incubation Program. Used as the tenancy anchor: staff are assigned to sites via StaffAssignments, and clients/program data will be scoped to sites in later milestones.
 */
export interface ISitesEntity {
  /** Name of the incubator location  */
  siteName?: string;
  /** Street address  */
  address?: string;
  /** ZIP / postal code  */
  zipCode?: string;
  /** Operational status of the site  */
  status?: SitesEntityStatusEnum;
  /** Current number of clients occupying the site  */
  currentOccupancy?: number;
  /** City  */
  city?: string;
  /** State (e.g. FL)  */
  state?: string;
  /** Total client capacity of the site  */
  totalCapacity?: number;
}

export const SitesEntity = {
  tableBlockId: "Sites",
  instanceType: {} as ISitesEntity,
} as const;

export type StaffAssignmentsEntityStaffRoleEnum =
  | "SiteManager"
  | "ProgramCoordinator";

/**
 * Linkage table mapping a staff user's email to a Site and their staff role at that site. NOT 1:1 — one email may have multiple rows (a staff member assigned to multiple sites). userEmail is stored trimmed + lowercased (canonical form used by usePersona() lookups). The app references UsersEntity by email per platform convention.
 */
export interface IStaffAssignmentsEntity {
  /** Staff member's email, stored trimmed + lowercased  */
  userEmail?: string;
  /** Site this staff member is assigned to  */
  siteId?: string;
  /** Staff role at this site  */
  staffRole?: StaffAssignmentsEntityStaffRoleEnum;
}

export const StaffAssignmentsEntity = {
  tableBlockId: "StaffAssignments",
  instanceType: {} as IStaffAssignmentsEntity,
} as const;

export type StageDefinitionsEntityTrackEnum =
  | "Traction"
  | "Growth"
  | "Soft Landing";

/**
 * Reference/config data: the ordered list of program stages for each track. Not client-scoped (no PII; readable by all authenticated users). StageMilestones reference these. Descriptions are DRAFT (UCF to refine).
 */
export interface IStageDefinitionsEntity {
  /** 1-based order of this stage within its track  */
  order?: number;
  /** Stage name  */
  stageName?: string;
  /** Short stage description (DRAFT — UCF to refine)  */
  description?: string;
  /** Program track  */
  track?: StageDefinitionsEntityTrackEnum;
}

export const StageDefinitionsEntity = {
  tableBlockId: "StageDefinitions",
  instanceType: {} as IStageDefinitionsEntity,
} as const;

/**
 * Template milestones for each StageDefinition. Not client-scoped (templates, no PII). ClientMilestoneProgress rows reference these per client. seedData stageDefinitionId placeholders match the 1-based ORDER of rows in StageDefinitions.seedData (1=Traction/Intake ... 19=Soft Landing/Long-Term Integration); sync remaps to real ids. All titles/descriptions are DRAFT.
 */
export interface IStageMilestonesEntity {
  /** Stage this milestone belongs to  */
  stageDefinitionId?: string;
  /** Milestone title (DRAFT)  */
  title?: string;
  /** Milestone description (DRAFT)  */
  description?: string;
  /** 1-based order within the stage  */
  order?: number;
}

export const StageMilestonesEntity = {
  tableBlockId: "StageMilestones",
  instanceType: {} as IStageMilestonesEntity,
} as const;

/**
 * undefined
 */
export interface IUsersEntity {
  /** User name  */
  name?: string;
  /** First name  */
  firstName?: string;
  /** Last name  */
  lastName?: string;
  /** Email address  */
  email?: string;
  /** Profile image URL  */
  profileImageUrl?: string;
}

export const UsersEntity = {
  tableBlockId: "Users",
  instanceType: {} as IUsersEntity,
} as const;

export type ClientPortalSafeEntityTrackEnum =
  | "Traction"
  | "Growth"
  | "Soft Landing";

export type ClientPortalSafeEntityStatusEnum =
  | "Prospect"
  | "Applicant"
  | "Active"
  | "On Hold"
  | "At Risk"
  | "Withdrawn"
  | "Graduated";

export type ClientPortalSafeEntityLocationTypeEnum = "Onsite" | "Offsite";

/**
 * undefined
 */
export interface IClientPortalSafeEntity {
  /** Company / venture name  */
  companyName?: string;
  /** Founder email (normalized, lowercased)  */
  founderEmail?: string;
  /** Scalar row-scope owner (= normalized founderEmail). The manual Clients RowPolicy keys on this for Client/Funder isolation.  */
  ownerEmail?: string;
  /** Program track  */
  track?: ClientPortalSafeEntityTrackEnum;
  /** Business stage  */
  stage?: string;
  /** Client lifecycle status  */
  status?: ClientPortalSafeEntityStatusEnum;
  /** Incubator site (staff site scope)  */
  siteId?: string;
  /** Suite / unit at the site  */
  suite?: string;
  /** Onsite or offsite client  */
  locationType?: ClientPortalSafeEntityLocationTypeEnum;
  /** Industry / NAICS code  */
  industryNaics?: string;
  /** Program start date. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30  */
  startDate?: string;
  /** CEO full name  */
  ceoName?: string;
  /** CEO email  */
  ceoEmail?: string;
  /** CEO phone  */
  ceoPhone?: string;
  /** Company website URL  */
  website?: string;
  /** Company description  */
  description?: string;
  /** Company logo URL  */
  logoUrl?: string;
  /** Total funding raised (USD)  */
  funding?: number;
  /** Annual revenue (USD)  */
  revenue?: number;
  /** Number of team members  */
  teamSize?: number;
  /** Number of mentors engaged  */
  mentorsEngaged?: number;
  /** Program resources used  */
  resourcesUsed?: string;
}

export const ClientPortalSafeEntity = {
  tableBlockId: "ClientPortalSafe",
  instanceType: {} as IClientPortalSafeEntity,
} as const;

/**
 * undefined
 */
export interface IClientPortalSafeCoachingEntity {
  /** Client this session is for  */
  clientId?: string;
  /** Scalar row-scope owner (= parent Client.ownerEmail), set on create. Drives the manual RowPolicy for client isolation.  */
  ownerEmail?: string;
  /** Session date. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30  */
  date?: string;
  /** Session type  */
  type?: string;
  /** Session length in minutes  */
  durationMinutes?: number;
  /** Topics covered  */
  topics?: string;
  /** Action items (client-visible)  */
  actionItems?: string;
  /** Date of the next scheduled session. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30. ISO 8601 date string, format: YYYY-MM-DD, e.g. 2025-09-30  */
  nextSessionDate?: string;
}

export const ClientPortalSafeCoachingEntity = {
  tableBlockId: "ClientPortalSafeCoaching",
  instanceType: {} as IClientPortalSafeCoachingEntity,
} as const;

export type ClientRoomAvailabilitySafeEntityStatusEnum =
  | "Tentative"
  | "Confirmed"
  | "Rejected";

/**
 * undefined
 */
export interface IClientRoomAvailabilitySafeEntity {
  /** Booked facility  */
  facilityId?: string;
  /** Site (denormalized from facility) for site scope  */
  siteId?: string;
  /** Booking start. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30  */
  startTime?: string;
  /** Booking end. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30. ISO 8601 datetime string, format: YYYY-MM-DDTHH:MM:SS, e.g. 2025-09-30T18:45:00Z, 2025-09-30T18:45:00+05:30  */
  endTime?: string;
  /** Booking status  */
  status?: ClientRoomAvailabilitySafeEntityStatusEnum;
}

export const ClientRoomAvailabilitySafeEntity = {
  tableBlockId: "ClientRoomAvailabilitySafe",
  instanceType: {} as IClientRoomAvailabilitySafeEntity,
} as const;

export type PublicSitesEntityStatusEnum =
  | "Active"
  | "Under Renovation"
  | "Coming Soon"
  | "Closed";

/**
 * undefined
 */
export interface IPublicSitesEntity {
  /** Name of the incubator location  */
  siteName?: string;
  /** Operational status of the site  */
  status?: PublicSitesEntityStatusEnum;
}

export const PublicSitesEntity = {
  tableBlockId: "PublicSites",
  instanceType: {} as IPublicSitesEntity,
} as const;

export const ApplicationsPage = "Applications";

export const ApplyPage = "Apply";

export const ClientDetailPage = "ClientDetail";

export const ClientsPage = "Clients";

export const ContactsPage = "Contacts";

export const DashboardPage = "Dashboard";

export const FacilitiesPage = "Facilities";

export const HomePage = "Home";

export const LoginPage = "Login";

export const MyCompanyPage = "MyCompany";

export const PartnersPage = "Partners";

export const PipelinePage = "Pipeline";

export const RoomCalendarPage = "RoomCalendar";

export const SitesAndUsersPage = "SitesAndUsers";

/**
 * AcceptApplication input payload
 */
export interface IAcceptApplicationActionInput {
  /** Id of the application to accept  */
  applicationId: string;
}

/**
 * AcceptApplication output payload
 */
export interface IAcceptApplicationActionOutput {
  /** Id of the newly created client  */
  clientId: string;
  success: boolean;
  message?: string;
}

/**
 * AcceptApplicationAction
 * Execute code action
 */
export const AcceptApplicationAction = {
  actionBlockId: "AcceptApplication",

  inputInstanceType: {} as IAcceptApplicationActionInput,
  outputInstanceType: {} as IAcceptApplicationActionOutput,
} as const;

/**
 * ApproveAccessRequest input payload
 */
export interface IApproveAccessRequestActionInput {
  /** AccessRequests.id to approve  */
  requestId: string;
}

/**
 * ApproveAccessRequest output payload
 */
export interface IApproveAccessRequestActionOutput {
  success: boolean;
  message?: string;
  /** Resulting request status (Approved | Approved - pending invite)  */
  status?: string;
  pendingInvite?: boolean;
}

/**
 * ApproveAccessRequestAction
 * Execute code action
 */
export const ApproveAccessRequestAction = {
  actionBlockId: "ApproveAccessRequest",

  inputInstanceType: {} as IApproveAccessRequestActionInput,
  outputInstanceType: {} as IApproveAccessRequestActionOutput,
} as const;

/**
 * AssignClientCompany input payload
 */
export interface IAssignClientCompanyActionInput {
  /** Client user's email (will be normalized)  */
  userEmail: string;
  /** Clients.id of the single company to link  */
  clientId: string;
}

/**
 * AssignClientCompany output payload
 */
export interface IAssignClientCompanyActionOutput {
  success: boolean;
  message?: string;
  /** true if an existing row was reassigned  */
  moved?: boolean;
}

/**
 * AssignClientCompanyAction
 * Execute code action
 */
export const AssignClientCompanyAction = {
  actionBlockId: "AssignClientCompany",

  inputInstanceType: {} as IAssignClientCompanyActionInput,
  outputInstanceType: {} as IAssignClientCompanyActionOutput,
} as const;

/**
 * AssignFunderCompany input payload
 */
export interface IAssignFunderCompanyActionInput {
  /** Funder user's email (will be normalized)  */
  userEmail: string;
  /** Funder reference (company) to link  */
  funderId: string;
}

/**
 * AssignFunderCompany output payload
 */
export interface IAssignFunderCompanyActionOutput {
  success: boolean;
  message?: string;
  /** true if a new link row was inserted  */
  created?: boolean;
}

/**
 * AssignFunderCompanyAction
 * Execute code action
 */
export const AssignFunderCompanyAction = {
  actionBlockId: "AssignFunderCompany",

  inputInstanceType: {} as IAssignFunderCompanyActionInput,
  outputInstanceType: {} as IAssignFunderCompanyActionOutput,
} as const;

/**
 * DenyAccessRequest input payload
 */
export interface IDenyAccessRequestActionInput {
  /** AccessRequests.id to deny  */
  requestId: string;
}

/**
 * DenyAccessRequest output payload
 */
export interface IDenyAccessRequestActionOutput {
  success: boolean;
  message?: string;
}

/**
 * DenyAccessRequestAction
 * Execute code action
 */
export const DenyAccessRequestAction = {
  actionBlockId: "DenyAccessRequest",

  inputInstanceType: {} as IDenyAccessRequestActionInput,
  outputInstanceType: {} as IDenyAccessRequestActionOutput,
} as const;

/**
 * EvaluateApplication input payload
 */
export interface IEvaluateApplicationActionInput {
  /** Id of the application to evaluate  */
  applicationId: string;
}

export type EvaluateApplicationActionOutputDecisionRecommendationEnum =
  | "Accept"
  | "Decline"
  | "Hold";

/**
 * EvaluateApplication output payload
 */
export interface IEvaluateApplicationActionOutput {
  /** Market / Scalability, 1-5  */
  scoreMarket: number;
  /** Technology / Innovation, 1-5  */
  scoreTechnology: number;
  /** Team, 1-5  */
  scoreTeam: number;
  /** Traction / Validation, 1-5  */
  scoreTraction: number;
  /** Program Fit, 1-5  */
  scoreProgramFit: number;
  /** Weighted total, 0-100  */
  weightedTotal: number;
  decisionRecommendation: EvaluateApplicationActionOutputDecisionRecommendationEnum;
  /** Concise rationale, 3-6 sentences  */
  notes: string;
}

/**
 * EvaluateApplicationAction
 * AI fit-assessment for an application. Loads the application by id and asks the Iris reviewer agent to score it against the 5 weighted criteria, returning a structured fit assessment (per-criterion scores 1-5, weightedTotal 0-100, decisionRecommendation, notes) that the UI uses to pre-populate a FitAssessmentScorecards row. Does not write the scorecard itself (human reviews before saving).
 */
export const EvaluateApplicationAction = {
  actionBlockId: "EvaluateApplication",

  inputInstanceType: {} as IEvaluateApplicationActionInput,
  outputInstanceType: {} as IEvaluateApplicationActionOutput,
} as const;

/**
 * GenerateContract input payload
 */
export interface IGenerateContractActionInput {
  /** Id of the client to generate a contract for  */
  clientId: string;
  /** Template identifier (optional until templates exist)  */
  templateKey?: string;
}

/**
 * Mapped contract fields
 */
export interface IGenerateContractActionOutputFieldMapJsonObject {}

/**
 * GenerateContract output payload
 */
export interface IGenerateContractActionOutput {
  /** pending-template until UCF templates are wired  */
  status: string;
  /** Null/empty until templates are wired  */
  pdfUrl?: string;
  /** Mapped contract fields  */
  fieldMapJson: IGenerateContractActionOutputFieldMapJsonObject;
}

/**
 * GenerateContractAction
 * Execute code action
 */
export const GenerateContractAction = {
  actionBlockId: "GenerateContract",

  inputInstanceType: {} as IGenerateContractActionInput,
  outputInstanceType: {} as IGenerateContractActionOutput,
} as const;

/**
 * RequestRoomBooking input payload
 */
export interface IRequestRoomBookingActionInput {
  /** Optional. Required only when the caller is linked to more than one client.  */
  clientId?: string;
  /** Facility to book  */
  facilityId: string;
  /** ISO 8601 datetime start  */
  startTime: string;
  /** ISO 8601 datetime end  */
  endTime: string;
  /** Purpose of the booking  */
  purpose?: string;
}

/**
 * RequestRoomBooking output payload
 */
export interface IRequestRoomBookingActionOutput {
  success: boolean;
  message?: string;
  bookingId?: string;
}

/**
 * RequestRoomBookingAction
 * Execute code action
 */
export const RequestRoomBookingAction = {
  actionBlockId: "RequestRoomBooking",

  inputInstanceType: {} as IRequestRoomBookingActionInput,
  outputInstanceType: {} as IRequestRoomBookingActionOutput,
} as const;

/**
 * RevokeClientCompany input payload
 */
export interface IRevokeClientCompanyActionInput {
  /** Client user's email (will be normalized)  */
  userEmail: string;
}

/**
 * RevokeClientCompany output payload
 */
export interface IRevokeClientCompanyActionOutput {
  success: boolean;
  message?: string;
  /** Number of rows removed  */
  removed?: number;
}

/**
 * RevokeClientCompanyAction
 * Execute code action
 */
export const RevokeClientCompanyAction = {
  actionBlockId: "RevokeClientCompany",

  inputInstanceType: {} as IRevokeClientCompanyActionInput,
  outputInstanceType: {} as IRevokeClientCompanyActionOutput,
} as const;

/**
 * RevokeFunderCompany input payload
 */
export interface IRevokeFunderCompanyActionInput {
  /** Funder user's email (will be normalized)  */
  userEmail: string;
  /** Funder reference (company) to unlink  */
  funderId: string;
}

/**
 * RevokeFunderCompany output payload
 */
export interface IRevokeFunderCompanyActionOutput {
  success: boolean;
  message?: string;
  /** Number of rows removed  */
  removed?: number;
}

/**
 * RevokeFunderCompanyAction
 * Execute code action
 */
export const RevokeFunderCompanyAction = {
  actionBlockId: "RevokeFunderCompany",

  inputInstanceType: {} as IRevokeFunderCompanyActionInput,
  outputInstanceType: {} as IRevokeFunderCompanyActionOutput,
} as const;

/**
 * SubmitAccessRequest input payload
 */
export interface ISubmitAccessRequestActionInput {
  /** Email to be granted access  */
  requestedUserEmail: string;
  /** Client | Funder | SiteManager | ProgramCoordinator  */
  requestedRole: string;
  /** Clients.id when requestedRole=Client  */
  targetClientId?: string;
  /** Funder reference when requestedRole=Funder  */
  targetFunderId?: string;
  /** Sites.id when requestedRole is staff; must be one of the caller's assigned sites  */
  targetSiteId?: string;
  /** Justification  */
  note?: string;
}

/**
 * SubmitAccessRequest output payload
 */
export interface ISubmitAccessRequestActionOutput {
  success: boolean;
  message?: string;
  requestId?: string;
}

/**
 * SubmitAccessRequestAction
 * Execute code action
 */
export const SubmitAccessRequestAction = {
  actionBlockId: "SubmitAccessRequest",

  inputInstanceType: {} as ISubmitAccessRequestActionInput,
  outputInstanceType: {} as ISubmitAccessRequestActionOutput,
} as const;

/**
 * UpdateMyCompanyProfile input payload
 */
export interface IUpdateMyCompanyProfileActionInput {
  /** Optional. Required only when the caller is linked to more than one client; must be one of the caller's authorized clients.  */
  clientId?: string;
  /** Company description  */
  description?: string;
  /** Company website URL  */
  website?: string;
  /** Company logo file URL  */
  logoUrl?: string;
  /** Contact phone (stored on ceoPhone)  */
  phone?: string;
}

/**
 * UpdateMyCompanyProfile output payload
 */
export interface IUpdateMyCompanyProfileActionOutput {
  success: boolean;
  message?: string;
  clientId?: string;
}

/**
 * UpdateMyCompanyProfileAction
 * Execute code action
 */
export const UpdateMyCompanyProfileAction = {
  actionBlockId: "UpdateMyCompanyProfile",

  inputInstanceType: {} as IUpdateMyCompanyProfileActionInput,
  outputInstanceType: {} as IUpdateMyCompanyProfileActionOutput,
} as const;

/**
 * UploadMyDocument input payload
 */
export interface IUploadMyDocumentActionInput {
  /** Optional. Required only when the caller is linked to more than one client.  */
  clientId?: string;
  /** Uploaded file URL (from useFileUpload)  */
  fileUrl: string;
  /** Document label/type, e.g. Pitch Deck, Financials. Defaults to General.  */
  type?: string;
}

/**
 * UploadMyDocument output payload
 */
export interface IUploadMyDocumentActionOutput {
  success: boolean;
  message?: string;
  documentId?: string;
}

/**
 * UploadMyDocumentAction
 * Execute code action
 */
export const UploadMyDocumentAction = {
  actionBlockId: "UploadMyDocument",

  inputInstanceType: {} as IUploadMyDocumentActionInput,
  outputInstanceType: {} as IUploadMyDocumentActionOutput,
} as const;

export type UpsertMyMilestoneProgressActionInputStatusEnum =
  | "Not Started"
  | "In Progress"
  | "Completed";

/**
 * UpsertMyMilestoneProgress input payload
 */
export interface IUpsertMyMilestoneProgressActionInput {
  /** Id of the ClientMilestoneProgress row to update (must be owned by the caller).  */
  progressId: string;
  /** Progress status  */
  status?: UpsertMyMilestoneProgressActionInputStatusEnum;
  /** Client-entered comment on this milestone.  */
  clientComment?: string;
}

/**
 * UpsertMyMilestoneProgress output payload
 */
export interface IUpsertMyMilestoneProgressActionOutput {
  success: boolean;
  message?: string;
}

/**
 * UpsertMyMilestoneProgressAction
 * Execute code action
 */
export const UpsertMyMilestoneProgressAction = {
  actionBlockId: "UpsertMyMilestoneProgress",

  inputInstanceType: {} as IUpsertMyMilestoneProgressActionInput,
  outputInstanceType: {} as IUpsertMyMilestoneProgressActionOutput,
} as const;

export const IrisAgent = {
  id: "Iris",
  name: "Iris",
  title: "Application Reviewer",
  harness: "deep_agent",
  photoUrl:
    "https://res.cloudinary.com/blocksws/image/upload/Blocks/app-agents/Iris/Iris_image.png",
  avatarUrl:
    "https://res.cloudinary.com/blocksws/image/upload/Blocks/app-agents/Iris/Iris_avatar.png",
} as const;
