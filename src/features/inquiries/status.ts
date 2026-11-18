/** Inquiry pipeline statuses (single source for admin UI, emails and statistics). */
export const INQUIRY_STATUS_LABELS = {
  NEW: "New",
  REVIEWING: "Reviewing",
  CONTACTED: "Contacted",
  QUOTATION_SENT: "Quotation sent",
  NEGOTIATION: "Negotiation",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  CLOSED: "Closed",
  SPAM: "Spam",
} as const;

export type InquiryStatusValue = keyof typeof INQUIRY_STATUS_LABELS;
export const INQUIRY_STATUS_VALUES = Object.keys(
  INQUIRY_STATUS_LABELS,
) as InquiryStatusValue[];

/** Waiting for the team to act. */
export const PENDING_STATUSES = [
  "NEW",
  "REVIEWING",
] as const satisfies readonly InquiryStatusValue[];
/** Finished — no further action expected. */
export const FINISHED_STATUSES = [
  "APPROVED",
  "REJECTED",
  "CLOSED",
  "SPAM",
] as const satisfies readonly InquiryStatusValue[];

export const INQUIRY_SOURCE_LABELS = {
  WEBSITE: "Website",
  ALIBABA: "Alibaba",
  WHATSAPP: "WhatsApp",
  EMAIL: "Email",
  TRADE_SHOW: "Trade show",
  REFERRAL: "Referral",
  OTHER: "Other",
} as const;
export type InquirySourceValue = keyof typeof INQUIRY_SOURCE_LABELS;
