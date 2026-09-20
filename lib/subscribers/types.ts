export type SubscriberStatus = "DRAFT" | "TRIAL" | "ACTIVE" | "SUSPENDED";

export type WorkspaceMemberRole = "OWNER" | "ADMIN" | "ADVISOR";

export interface SubscriberMemberDraft {
  id: string;
  name: string;
  email: string;
  role: WorkspaceMemberRole;
}

export interface SubscriberBrandingDraft {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  logoLabel: string;
}

export interface SubscriberWorkspaceDraft {
  id: string;
  commercialName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  planLabel: string;
  status: SubscriberStatus;
  members: SubscriberMemberDraft[];
  branding: SubscriberBrandingDraft;
  createdAt: string;
}
