/**
 * Branded transactional email templates (table layout + inline styles for email clients).
 * Every template returns subject, HTML and a plain-text alternative. All dynamic values are
 * HTML-escaped. Never include internal notes or staff-only data.
 */
import {
  INQUIRY_STATUS_LABELS,
  type InquiryStatusValue,
} from "@/features/inquiries/status";

const C = {
  forest: "#176B43",
  beige: "#E9DFC9",
  warm: "#F8F6F0",
  charcoal: "#292B25",
  muted: "#5C5E55",
};

export type EmailContent = { subject: string; html: string; text: string };
export type Brand = {
  siteUrl: string;
  logoUrl: string;
  whatsappUrl?: string | null;
  contactEmail?: string | null;
};

export function esc(s: string): string {
  return s.replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );
}

function layout(
  brand: Brand,
  heading: string,
  bodyHtml: string,
  cta?: { label: string; url: string },
): string {
  const button = cta
    ? `<tr><td style="padding:8px 0 24px"><a href="${esc(cta.url)}" style="background:${C.forest};color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:6px;font-weight:600;display:inline-block">${esc(cta.label)}</a></td></tr>`
    : "";
  const contact = [
    brand.contactEmail
      ? `<a href="mailto:${esc(brand.contactEmail)}" style="color:${C.forest}">${esc(brand.contactEmail)}</a>`
      : "",
    brand.whatsappUrl
      ? `<a href="${esc(brand.whatsappUrl)}" style="color:${C.forest}">WhatsApp</a>`
      : "",
    `<a href="${esc(brand.siteUrl)}" style="color:${C.forest}">${esc(brand.siteUrl.replace(/^https?:\/\//, "").replace(/\/$/, ""))}</a>`,
  ]
    .filter(Boolean)
    .join(" &nbsp;·&nbsp; ");
  return `<!doctype html><html><body style="margin:0;background:${C.warm};font-family:Arial,Helvetica,sans-serif;color:${C.charcoal}">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.warm};padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border:1px solid ${C.beige};border-radius:10px">
<tr><td style="padding:24px 28px;border-bottom:1px solid ${C.beige}"><img src="${esc(brand.logoUrl)}" alt="Kishwour — Made in Bangladesh" width="150" style="display:block;height:auto;border:0"></td></tr>
<tr><td style="padding:28px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
<tr><td style="font-family:Georgia,'Times New Roman',serif;font-size:24px;line-height:1.3;padding-bottom:16px">${esc(heading)}</td></tr>
<tr><td style="font-size:15px;line-height:1.6">${bodyHtml}</td></tr>
${button}
</table></td></tr>
<tr><td style="padding:18px 28px;background:${C.warm};border-top:1px solid ${C.beige};font-size:12px;color:${C.muted};line-height:1.6">Kishwour · Made in Bangladesh<br>${contact}</td></tr>
</table></td></tr></table></body></html>`;
}

const p = (s: string) => `<p style="margin:0 0 14px">${s}</p>`;
const ref = (n: string) =>
  `<strong style="font-family:Consolas,Menlo,monospace">${esc(n)}</strong>`;

type InquirySummary = {
  inquiryNumber: string;
  contactName: string;
  productLines: string[];
};

function productList(lines: string[]) {
  return lines.length
    ? `<ul style="margin:0 0 14px;padding-left:20px">${lines.map((l) => `<li>${esc(l)}</li>`).join("")}</ul>`
    : "";
}

/** Buyer acknowledgement for quote / contact inquiries. */
export function inquiryReceivedEmail(brand: Brand, d: InquirySummary): EmailContent {
  const subject = `We received your inquiry ${d.inquiryNumber} — Kishwour`;
  const html = layout(
    brand,
    "Thank you — we have received your inquiry",
    p(`Dear ${esc(d.contactName)},`) +
      p(
        `Thank you for contacting Kishwour. Your inquiry reference is ${ref(d.inquiryNumber)}.`,
      ) +
      productList(d.productLines) +
      p(
        "Our team will review your request and reply by email. Please quote your reference number in any follow-up.",
      ),
    { label: "Visit our catalogue", url: `${brand.siteUrl.replace(/\/$/, "")}/products` },
  );
  const text = `Dear ${d.contactName},\n\nThank you for contacting Kishwour. Your inquiry reference is ${d.inquiryNumber}.\n${d.productLines.map((l) => `- ${l}\n`).join("")}\nOur team will review your request and reply by email.\n\nKishwour · Made in Bangladesh\n${brand.siteUrl}`;
  return { subject, html, text };
}

/** Buyer acknowledgement for sample requests. */
export function sampleRequestReceivedEmail(
  brand: Brand,
  d: InquirySummary,
): EmailContent {
  const subject = `We received your sample request ${d.inquiryNumber} — Kishwour`;
  const html = layout(
    brand,
    "Your sample request has been received",
    p(`Dear ${esc(d.contactName)},`) +
      p(`Thank you for your sample request. Your reference is ${ref(d.inquiryNumber)}.`) +
      productList(d.productLines) +
      p(
        "We will confirm sample availability, cost and shipping by email before anything is sent.",
      ),
  );
  const text = `Dear ${d.contactName},\n\nThank you for your sample request. Your reference is ${d.inquiryNumber}.\n${d.productLines.map((l) => `- ${l}\n`).join("")}\nWe will confirm sample availability, cost and shipping by email before anything is sent.\n\nKishwour · Made in Bangladesh\n${brand.siteUrl}`;
  return { subject, html, text };
}

/** Internal notification to the Kishwour team. */
export function adminNewInquiryEmail(
  brand: Brand,
  d: InquirySummary & {
    type: string;
    company: string | null;
    email: string;
    country: string;
    message: string;
    adminUrl: string;
  },
): EmailContent {
  const subject = `New ${d.type.toLowerCase().replaceAll("_", " ")} inquiry ${d.inquiryNumber} — ${d.company ?? d.contactName} (${d.country})`;
  const rows = [
    ["Reference", d.inquiryNumber],
    ["Type", d.type.replaceAll("_", " ").toLowerCase()],
    ["Contact", d.contactName],
    ["Company", d.company ?? "—"],
    ["Email", d.email],
    ["Country", d.country],
  ]
    .map(
      ([k, v]) =>
        `<tr><td style="padding:4px 12px 4px 0;color:${C.muted}">${esc(k!)}</td><td style="padding:4px 0">${esc(v!)}</td></tr>`,
    )
    .join("");
  const html = layout(
    brand,
    "New inquiry received",
    `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 14px;font-size:14px">${rows}</table>` +
      productList(d.productLines) +
      `<div style="background:${C.warm};border-radius:6px;padding:12px;white-space:pre-line;margin:0 0 14px">${esc(d.message.slice(0, 2000))}</div>`,
    { label: "Open in admin", url: d.adminUrl },
  );
  const text = `New inquiry ${d.inquiryNumber}\nType: ${d.type}\nContact: ${d.contactName}\nCompany: ${d.company ?? "-"}\nEmail: ${d.email}\nCountry: ${d.country}\n${d.productLines.map((l) => `- ${l}\n`).join("")}\n${d.message.slice(0, 2000)}\n\nOpen: ${d.adminUrl}`;
  return { subject, html, text };
}

/** Quotation emails (PDF attached separately). `updated` = re-sent after changes. */
export function quotationEmail(
  brand: Brand,
  d: {
    contactName: string;
    inquiryNumber: string;
    quotationNumber: string;
    total: string;
    validUntil: string | null;
    updated: boolean;
  },
): EmailContent {
  const subject = d.updated
    ? `Updated quotation ${d.quotationNumber} — Kishwour`
    : `Your quotation ${d.quotationNumber} — Kishwour`;
  const intro = d.updated
    ? `Please find the <strong>updated</strong> quotation ${ref(d.quotationNumber)} for your inquiry ${ref(d.inquiryNumber)} attached. It replaces the previous version.`
    : `Thank you for your inquiry ${ref(d.inquiryNumber)}. Please find our quotation ${ref(d.quotationNumber)} attached.`;
  const html = layout(
    brand,
    d.updated ? "Your quotation has been updated" : "Your quotation from Kishwour",
    p(`Dear ${esc(d.contactName)},`) +
      p(intro) +
      p(
        `Total: <strong>${esc(d.total)}</strong>${d.validUntil ? ` · valid until ${esc(d.validUntil)}` : ""}`,
      ) +
      p("Reply to this email with any questions or to confirm your order."),
  );
  const text = `Dear ${d.contactName},\n\n${d.updated ? `Please find the updated quotation ${d.quotationNumber} for your inquiry ${d.inquiryNumber} attached. It replaces the previous version.` : `Thank you for your inquiry ${d.inquiryNumber}. Please find our quotation ${d.quotationNumber} attached.`}\nTotal: ${d.total}${d.validUntil ? ` (valid until ${d.validUntil})` : ""}\n\nKishwour · Made in Bangladesh\n${brand.siteUrl}`;
  return { subject, html, text };
}

/** Buyer-facing status update (only statuses that are meaningful to the buyer). */
export function inquiryStatusEmail(
  brand: Brand,
  d: {
    contactName: string;
    inquiryNumber: string;
    status: InquiryStatusValue;
    note?: string | null;
  },
): EmailContent {
  const label = INQUIRY_STATUS_LABELS[d.status];
  const subject = `Update on your inquiry ${d.inquiryNumber}: ${label}`;
  const html = layout(
    brand,
    "An update on your inquiry",
    p(`Dear ${esc(d.contactName)},`) +
      p(
        `The status of your inquiry ${ref(d.inquiryNumber)} is now <strong>${esc(label)}</strong>.`,
      ) +
      (d.note ? p(esc(d.note)) : "") +
      p("Reply to this email if you have any questions."),
  );
  const text = `Dear ${d.contactName},\n\nThe status of your inquiry ${d.inquiryNumber} is now: ${label}.\n${d.note ? `\n${d.note}\n` : ""}\nKishwour · Made in Bangladesh\n${brand.siteUrl}`;
  return { subject, html, text };
}
