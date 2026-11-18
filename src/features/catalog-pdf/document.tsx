/* eslint-disable jsx-a11y/alt-text -- react-pdf <Image> renders into a PDF, not an HTML <img>. */
import { Document, Image, Link, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

import {
  countryName,
  formatLeadTime,
  formatPriceRange,
  formatQuantity,
} from "@/features/products/format";
import { type PdfProduct } from "@/features/products/types";

const C = {
  forest: "#176B43",
  beige: "#E9DFC9",
  warm: "#F8F6F0",
  jute: "#7F5230",
  charcoal: "#292B25",
  muted: "#5C5E55",
  border: "#DDD3BF",
};

const s = StyleSheet.create({
  page: {
    backgroundColor: C.warm,
    color: C.charcoal,
    fontFamily: "Helvetica",
    fontSize: 9,
    paddingTop: 64,
    paddingBottom: 56,
    paddingHorizontal: 40,
  },
  header: {
    position: "absolute",
    top: 22,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 0.5,
    borderBottomColor: C.border,
    paddingBottom: 8,
  },
  headerText: { fontSize: 8, color: C.muted, letterSpacing: 1 },
  footer: {
    position: "absolute",
    bottom: 22,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 8,
    color: C.muted,
    borderTopWidth: 0.5,
    borderTopColor: C.border,
    paddingTop: 8,
  },
  eyebrow: {
    fontSize: 8,
    color: C.jute,
    letterSpacing: 2,
    textTransform: "uppercase",
    fontFamily: "Helvetica-Bold",
  },
  categoryTitle: {
    fontFamily: "Times-Roman",
    fontSize: 22,
    marginTop: 4,
    marginBottom: 14,
  },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  card: {
    width: "48.5%",
    backgroundColor: "#FFFDF8",
    borderWidth: 0.5,
    borderColor: C.border,
    borderRadius: 4,
    marginBottom: 12,
    overflow: "hidden",
  },
  image: { width: "100%", height: 150, objectFit: "cover" },
  placeholder: {
    width: "100%",
    height: 150,
    backgroundColor: C.beige,
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderText: {
    fontSize: 7,
    color: C.jute,
    letterSpacing: 1.5,
    fontFamily: "Helvetica-Bold",
  },
  cardBody: { padding: 10 },
  name: { fontFamily: "Times-Bold", fontSize: 12, marginBottom: 2 },
  sku: { fontSize: 7.5, color: C.muted, marginBottom: 6 },
  specRow: { flexDirection: "row", marginBottom: 2 },
  specLabel: { width: 62, color: C.muted, fontSize: 8 },
  specValue: { flex: 1, fontSize: 8 },
  link: { color: C.forest, fontSize: 7.5, marginTop: 6, textDecoration: "none" },
});

function Spec({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <View style={s.specRow}>
      <Text style={s.specLabel}>{label}</Text>
      <Text style={s.specValue}>{value}</Text>
    </View>
  );
}

function PageHeader({ logo, categoryName }: { logo: Buffer; categoryName?: string }) {
  return (
    <View style={s.header} fixed>
      <Image src={{ data: logo, format: "png" }} style={{ height: 18 }} />
      <Text style={s.headerText}>
        PRODUCT CATALOGUE{categoryName ? ` · ${categoryName.toUpperCase()}` : ""}
      </Text>
    </View>
  );
}

function PageFooter({ siteUrl, host }: { siteUrl: string; host: string }) {
  return (
    <View style={s.footer} fixed>
      <Link src={siteUrl} style={{ color: C.muted, textDecoration: "none" }}>
        {host}
      </Link>
      <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
    </View>
  );
}

export type CatalogPdfProps = {
  logo: Buffer;
  siteUrl: string;
  products: (PdfProduct & { image: Buffer | null; url: string })[];
  categoryName?: string;
  contact: { label: string; value: string; href?: string }[];
  requestQuoteUrl: string;
  generatedOn: string;
};

export function CatalogPdf({
  logo,
  siteUrl,
  products,
  categoryName,
  contact,
  requestQuoteUrl,
  generatedOn,
}: CatalogPdfProps) {
  const groups = new Map<string, typeof products>();
  for (const p of products) {
    const list = groups.get(p.category.name) ?? [];
    list.push(p);
    groups.set(p.category.name, list);
  }
  const host = siteUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");

  return (
    <Document
      title={`Kishwour Product Catalogue${categoryName ? ` — ${categoryName}` : ""}`}
      author="Kishwour"
      subject="Handmade products from Bangladesh"
      creator="Kishwour"
    >
      {/* Cover */}
      <Page size="A4" style={{ backgroundColor: C.warm, padding: 0, color: C.charcoal }}>
        <View style={{ flex: 1, paddingHorizontal: 56, paddingTop: 120 }}>
          <Image src={{ data: logo, format: "png" }} style={{ width: 260 }} />
          <Text style={{ ...s.eyebrow, marginTop: 70 }}>
            Product catalogue{categoryName ? ` · ${categoryName}` : ""}
          </Text>
          <Text
            style={{
              fontFamily: "Times-Roman",
              fontSize: 34,
              lineHeight: 1.15,
              marginTop: 12,
            }}
          >
            Authentic Craftsmanship from Bangladesh to the World.
          </Text>
          <Text
            style={{
              fontSize: 11,
              color: C.muted,
              marginTop: 18,
              lineHeight: 1.5,
              maxWidth: 380,
            }}
          >
            Handmade footwear, jute products, bags, traditional handicrafts and home décor
            for importers, wholesalers and brands.
          </Text>
        </View>
        <View
          style={{
            backgroundColor: C.forest,
            paddingHorizontal: 56,
            paddingVertical: 26,
            flexDirection: "row",
            justifyContent: "space-between",
          }}
        >
          <Link
            src={siteUrl}
            style={{
              color: C.warm,
              fontSize: 11,
              textDecoration: "none",
              fontFamily: "Helvetica-Bold",
            }}
          >
            {host}
          </Link>
          <Text style={{ color: C.beige, fontSize: 9 }}>Generated {generatedOn}</Text>
        </View>
      </Page>

      {/* Products */}
      <Page size="A4" style={s.page} wrap>
        <PageHeader logo={logo} categoryName={categoryName} />
        {products.length === 0 ? (
          <View style={{ marginTop: 40 }}>
            <Text style={s.categoryTitle}>Catalogue in preparation</Text>
            <Text style={{ fontSize: 11, color: C.muted, lineHeight: 1.5 }}>
              Products are being added to our online catalogue. Please send us your
              requirements and we will prepare a quotation.
            </Text>
            <Link
              src={requestQuoteUrl}
              style={{ ...s.link, fontSize: 11, marginTop: 12 }}
            >
              {requestQuoteUrl}
            </Link>
          </View>
        ) : (
          [...groups.entries()].map(([category, items], gi) => (
            <View key={category} break={gi > 0}>
              <Text style={s.eyebrow}>Category</Text>
              <Text style={s.categoryTitle}>{category}</Text>
              <View style={s.grid}>
                {items.map((p) => (
                  <View key={p.slug} style={s.card} wrap={false}>
                    {p.image ? (
                      <Image src={{ data: p.image, format: "jpg" }} style={s.image} />
                    ) : (
                      <View style={s.placeholder}>
                        <Text style={s.placeholderText}>PHOTO COMING SOON</Text>
                      </View>
                    )}
                    <View style={s.cardBody}>
                      <Text style={s.name}>{p.name}</Text>
                      <Text style={s.sku}>{p.sku ? `SKU ${p.sku}` : " "}</Text>
                      <Spec label="Material" value={p.material} />
                      <Spec label="Dimensions" value={p.dimensions} />
                      <Spec label="Weight" value={p.weight} />
                      <Spec
                        label="MOQ"
                        value={formatQuantity(p.minimumOrderQuantity, p.unit)}
                      />
                      <Spec label="Lead time" value={formatLeadTime(p.leadTimeDays)} />
                      <Spec
                        label="Price"
                        value={(() => {
                          const price = formatPriceRange(
                            p.priceMin,
                            p.priceMax,
                            p.currency,
                          );
                          return price
                            ? `${price}${p.incoterm ? ` (${p.incoterm})` : ""}`
                            : null;
                        })()}
                      />
                      <Spec label="Origin" value={countryName(p.originCountry)} />
                      <Link src={p.url} style={s.link}>
                        View online »
                      </Link>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          ))
        )}
        <PageFooter siteUrl={siteUrl} host={host} />
      </Page>

      {/* Contact */}
      <Page size="A4" style={s.page}>
        <PageHeader logo={logo} categoryName={categoryName} />
        <Text style={s.eyebrow}>Contact & ordering</Text>
        <Text style={s.categoryTitle}>Request a quotation</Text>
        <Text style={{ fontSize: 11, color: C.muted, lineHeight: 1.5, maxWidth: 420 }}>
          Prices, minimum order quantities and lead times are confirmed in each quotation.
          Tell us the products, quantities and destination you need.
        </Text>
        <View style={{ marginTop: 24 }}>
          {[
            { label: "Website", value: host, href: siteUrl },
            { label: "Request a quote", value: requestQuoteUrl, href: requestQuoteUrl },
            ...contact,
          ].map((c) => (
            <View key={c.label} style={{ flexDirection: "row", marginBottom: 8 }}>
              <Text style={{ width: 110, color: C.muted, fontSize: 10 }}>{c.label}</Text>
              {c.href ? (
                <Link
                  src={c.href}
                  style={{ color: C.forest, fontSize: 10, textDecoration: "none" }}
                >
                  {c.value}
                </Link>
              ) : (
                <Text style={{ fontSize: 10 }}>{c.value}</Text>
              )}
            </View>
          ))}
        </View>
        <PageFooter siteUrl={siteUrl} host={host} />
      </Page>
    </Document>
  );
}
