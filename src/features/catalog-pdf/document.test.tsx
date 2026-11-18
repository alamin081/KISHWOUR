import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import { renderToBuffer } from "@react-pdf/renderer";
import { describe, expect, it } from "vitest";

import { CatalogPdf, type CatalogPdfProps } from "./document";
import { pdfImageUrl } from "./images";

const logo = readFileSync(
  path.join(process.cwd(), "public", "brand", "kishwour-logo.png"),
);

/** Test-only specimen rows (never stored in the database). */
function specimen(
  i: number,
  category: { name: string; slug: string },
): CatalogPdfProps["products"][number] {
  return {
    name: `Specimen product ${i}`,
    sku: `SPEC-${i}`,
    slug: `specimen-${i}`,
    material: "Specimen material",
    dimensions: "30 × 40 cm",
    weight: null,
    minimumOrderQuantity: 100 * i,
    unit: "pieces",
    leadTimeDays: 30,
    priceMin: i % 2 ? "4.5" : null,
    priceMax: i % 2 ? "6" : null,
    currency: "USD",
    incoterm: "FOB",
    originCountry: "BD",
    imageUrl: null,
    category,
    image: null,
    url: `https://example.com/products/specimen-${i}`,
  };
}

async function render(products: CatalogPdfProps["products"]) {
  return renderToBuffer(
    <CatalogPdf
      logo={logo}
      siteUrl="https://example.com/"
      products={products}
      contact={[]}
      requestQuoteUrl="https://example.com/request-quote"
      generatedOn="12 November 2026"
    />,
  );
}

const pageCount = (pdf: Buffer) =>
  (pdf.toString("latin1").match(/\/Type \/Page\b/g) ?? []).length;

describe("CatalogPdf", () => {
  it("renders cover, an empty-catalogue page and a contact page when there are no products", async () => {
    const pdf = await render([]);
    expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
    expect(pageCount(pdf)).toBe(3);
  });

  it("paginates products grouped by category", async () => {
    const a = { name: "Footwear", slug: "footwear" };
    const b = { name: "Jute Products & Bags", slug: "jute-products" };
    const products = [
      ...Array.from({ length: 9 }, (_, i) => specimen(i + 1, a)),
      specimen(10, b),
    ];
    const pdf = await render(products);
    expect(pageCount(pdf)).toBeGreaterThanOrEqual(5);
    if (process.env["PDF_PREVIEW_OUT"])
      writeFileSync(process.env["PDF_PREVIEW_OUT"], pdf);
  }, 30_000);
});

describe("pdfImageUrl", () => {
  it("transforms Cloudinary URLs to small JPEGs and rejects other hosts", () => {
    expect(
      pdfImageUrl("https://res.cloudinary.com/demo/image/upload/v1/kishwour/bag.webp"),
    ).toBe(
      "https://res.cloudinary.com/demo/image/upload/c_fill,w_520,h_390,q_auto,f_jpg/v1/kishwour/bag.webp",
    );
    expect(pdfImageUrl("https://evil.example/img.jpg")).toBeNull();
    expect(pdfImageUrl("http://res.cloudinary.com/demo/image/upload/x.jpg")).toBeNull();
  });
});
