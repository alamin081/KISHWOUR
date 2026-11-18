import { buildQuotationPdf } from "@/features/admin/quotations/pdf";
import { AuthorizationError, assertPermission } from "@/lib/auth/session";

/** GET /admin/quotations/<id>/pdf — staff only. */
export async function GET(
  _request: Request,
  ctx: RouteContext<"/admin/quotations/[id]/pdf">,
) {
  try {
    await assertPermission("quotations:manage");
  } catch (error) {
    return new Response(
      error instanceof AuthorizationError ? "Forbidden" : "Unauthorized",
      { status: 403 },
    );
  }
  const { id } = await ctx.params;
  const pdf = await buildQuotationPdf(id);
  if (!pdf) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(pdf.buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${pdf.filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
