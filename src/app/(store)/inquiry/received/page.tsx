import { CheckCircle2, MessageCircle, SearchX } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { routes } from "@/config/site";
import { whatsAppLink } from "@/features/products/links";
import { getSiteSettings } from "@/features/settings/queries";
import { db } from "@/lib/db";

export const metadata: Metadata = {
  title: "Request received",
  robots: { index: false, follow: false },
};

/**
 * Confirmation page. It shows success ONLY after reading the stored inquiry from the database,
 * and says an email was sent only if it actually was.
 */
async function Confirmation({
  searchParams,
}: {
  searchParams: PageProps<"/inquiry/received">["searchParams"];
}) {
  const sp = await searchParams;
  const ref =
    typeof sp["ref"] === "string" && /^KSW-INQ-\d{8}-[A-Z0-9]{6}$/.test(sp["ref"])
      ? sp["ref"]
      : null;
  const inquiry = ref
    ? await db.inquiry.findUnique({
        where: { inquiryNumber: ref },
        select: { inquiryNumber: true, inquiryType: true, buyerAckSentAt: true },
      })
    : null;

  if (!inquiry) {
    return (
      <EmptyState
        icon={SearchX}
        headingAs="h1"
        title="We could not find this reference"
        description="If you just submitted a request, please check the link or contact us with your details."
        action={
          <Button asChild>
            <Link href={routes.contact}>Contact us</Link>
          </Button>
        }
      />
    );
  }

  const { contact } = await getSiteSettings();
  const wa = contact.whatsapp
    ? whatsAppLink(
        contact.whatsapp,
        `Hello Kishwour, my reference is ${inquiry.inquiryNumber}.`,
      )
    : null;
  const what =
    inquiry.inquiryType === "SAMPLE_REQUEST"
      ? "sample request"
      : inquiry.inquiryType === "GENERAL"
        ? "message"
        : "quotation request";

  return (
    <div className="rounded-xl border bg-card p-8 text-center sm:p-12">
      <CheckCircle2 className="mx-auto size-12 text-forest" aria-hidden />
      <h1 className="mt-5 text-3xl">Thank you — your {what} has been received</h1>
      <p className="mt-4 text-muted-foreground">
        Your reference number is{" "}
        <strong className="font-mono text-foreground">{inquiry.inquiryNumber}</strong>.
        Please keep it for any follow-up.
      </p>
      <p className="mt-2 text-sm text-muted-foreground">
        {inquiry.buyerAckSentAt
          ? "A confirmation has been sent to your email address."
          : "Our team will reply to the email address you provided."}
      </p>
      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <Button asChild variant="secondary">
          <Link href={routes.products}>Browse products</Link>
        </Button>
        {wa ? (
          <Button asChild variant="outline">
            <a href={wa} target="_blank" rel="noopener noreferrer">
              <MessageCircle aria-hidden /> Message us on WhatsApp
            </a>
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export default function InquiryReceivedPage(props: PageProps<"/inquiry/received">) {
  return (
    <div className="container-page max-w-2xl py-16 sm:py-24">
      <Suspense fallback={<Skeleton className="h-72 w-full rounded-xl" />}>
        <Confirmation searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}
