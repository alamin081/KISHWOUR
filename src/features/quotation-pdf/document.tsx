/* eslint-disable jsx-a11y/alt-text -- react-pdf <Image> renders into a PDF, not an HTML <img>. */
import { Document, Image, Link, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

const C = {
  forest: "#176B43",
  beige: "#E9DFC9",
  charcoal: "#292B25",
  muted: "#5C5E55",
  border: "#DDD3BF",
};

const s = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 9,
    color: C.charcoal,
    padding: 40,
    paddingBottom: 60,
  },
  row: { flexDirection: "row" },
  h1: { fontFamily: "Times-Roman", fontSize: 22 },
  label: {
    fontSize: 7.5,
    color: C.muted,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 3,
    fontFamily: "Helvetica-Bold",
  },
  th: { fontFamily: "Helvetica-Bold", fontSize: 8, color: C.muted, paddingVertical: 6 },
  td: { paddingVertical: 6 },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 7.5,
    color: C.muted,
    borderTopWidth: 0.5,
    borderTopColor: C.border,
    paddingTop: 6,
  },
});

const cols = {
  desc: "38%",
  qty: "10%",
  moq: "10%",
  unit: "10%",
  price: "16%",
  total: "16%",
} as const;

export type QuotationPdfData = {
  logo: Buffer;
  siteUrl: string;
  number: string;
  date: string;
  validUntil: string | null;
  currency: string;
  incoterm: string | null;
  shippingTerms: string | null;
  paymentTerms: string | null;
  leadTime: string | null;
  notes: string | null;
  buyer: {
    contactPerson: string;
    companyName: string | null;
    email: string;
    country: string;
    inquiryNumber: string;
  };
  items: {
    description: string;
    quantity: number;
    moq: number | null;
    unit: string;
    unitPrice: string;
    total: string;
  }[];
  subtotal: string;
  shippingCost: string;
  total: string;
  sellerContact: string[];
};

export function QuotationPdf(d: QuotationPdfData) {
  const money = (v: string) =>
    `${d.currency} ${Number(v).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const terms: [string, string | null][] = [
    ["Incoterm", d.incoterm],
    ["Shipping terms", d.shippingTerms],
    ["Payment terms", d.paymentTerms],
    ["Production lead time", d.leadTime],
    ["Valid until", d.validUntil],
  ];
  return (
    <Document title={`Quotation ${d.number}`} author="Kishwour" creator="Kishwour">
      <Page size="A4" style={s.page}>
        <View
          style={[s.row, { justifyContent: "space-between", alignItems: "flex-start" }]}
        >
          <Image src={{ data: d.logo, format: "png" }} style={{ width: 150 }} />
          <View style={{ alignItems: "flex-end" }}>
            <Text style={s.h1}>Quotation</Text>
            <Text style={{ marginTop: 4 }}>{d.number}</Text>
            <Text style={{ color: C.muted, marginTop: 2 }}>Date: {d.date}</Text>
          </View>
        </View>

        <View style={[s.row, { marginTop: 28, gap: 24 }]}>
          <View style={{ flex: 1 }}>
            <Text style={s.label}>Prepared for</Text>
            <Text style={{ fontFamily: "Helvetica-Bold" }}>
              {d.buyer.companyName ?? d.buyer.contactPerson}
            </Text>
            {d.buyer.companyName ? <Text>{d.buyer.contactPerson}</Text> : null}
            <Text>{d.buyer.email}</Text>
            <Text>{d.buyer.country}</Text>
            <Text style={{ color: C.muted, marginTop: 4 }}>
              Your inquiry: {d.buyer.inquiryNumber}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.label}>From</Text>
            <Text style={{ fontFamily: "Helvetica-Bold" }}>Kishwour</Text>
            {d.sellerContact.map((c) => (
              <Text key={c}>{c}</Text>
            ))}
            <Link src={d.siteUrl} style={{ color: C.forest, textDecoration: "none" }}>
              {d.siteUrl.replace(/^https?:\/\//, "").replace(/\/$/, "")}
            </Link>
          </View>
        </View>

        <View style={{ marginTop: 24, borderTopWidth: 1, borderTopColor: C.charcoal }}>
          <View style={[s.row, { borderBottomWidth: 0.5, borderBottomColor: C.border }]}>
            <Text style={[s.th, { width: cols.desc }]}>Description</Text>
            <Text style={[s.th, { width: cols.qty, textAlign: "right" }]}>Qty</Text>
            <Text style={[s.th, { width: cols.moq, textAlign: "right" }]}>MOQ</Text>
            <Text style={[s.th, { width: cols.unit, textAlign: "right" }]}>Unit</Text>
            <Text style={[s.th, { width: cols.price, textAlign: "right" }]}>
              Unit price
            </Text>
            <Text style={[s.th, { width: cols.total, textAlign: "right" }]}>Total</Text>
          </View>
          {d.items.map((it, i) => (
            <View
              key={i}
              style={[s.row, { borderBottomWidth: 0.5, borderBottomColor: C.border }]}
              wrap={false}
            >
              <Text style={[s.td, { width: cols.desc, paddingRight: 6 }]}>
                {it.description}
              </Text>
              <Text style={[s.td, { width: cols.qty, textAlign: "right" }]}>
                {it.quantity.toLocaleString("en-US")}
              </Text>
              <Text style={[s.td, { width: cols.moq, textAlign: "right" }]}>
                {it.moq ? it.moq.toLocaleString("en-US") : "—"}
              </Text>
              <Text style={[s.td, { width: cols.unit, textAlign: "right" }]}>
                {it.unit}
              </Text>
              <Text style={[s.td, { width: cols.price, textAlign: "right" }]}>
                {money(it.unitPrice)}
              </Text>
              <Text style={[s.td, { width: cols.total, textAlign: "right" }]}>
                {money(it.total)}
              </Text>
            </View>
          ))}
          <View style={{ alignSelf: "flex-end", width: "40%", marginTop: 8 }}>
            {[
              ["Subtotal", money(d.subtotal)],
              ["Shipping", money(d.shippingCost)],
            ].map(([k, v]) => (
              <View
                key={k}
                style={[s.row, { justifyContent: "space-between", paddingVertical: 3 }]}
              >
                <Text style={{ color: C.muted }}>{k}</Text>
                <Text>{v}</Text>
              </View>
            ))}
            <View
              style={[
                s.row,
                {
                  justifyContent: "space-between",
                  paddingVertical: 6,
                  borderTopWidth: 1,
                  borderTopColor: C.charcoal,
                  marginTop: 3,
                },
              ]}
            >
              <Text style={{ fontFamily: "Helvetica-Bold" }}>Total</Text>
              <Text style={{ fontFamily: "Helvetica-Bold" }}>{money(d.total)}</Text>
            </View>
          </View>
        </View>

        <View
          style={{
            marginTop: 20,
            backgroundColor: "#F8F6F0",
            padding: 12,
            borderRadius: 4,
          }}
          wrap={false}
        >
          <Text style={s.label}>Terms</Text>
          {terms
            .filter((t): t is [string, string] => Boolean(t[1]))
            .map(([k, v]) => (
              <View key={k} style={[s.row, { marginTop: 3 }]}>
                <Text style={{ width: 120, color: C.muted }}>{k}</Text>
                <Text style={{ flex: 1 }}>{v}</Text>
              </View>
            ))}
        </View>

        {d.notes ? (
          <View style={{ marginTop: 14 }}>
            <Text style={s.label}>Notes</Text>
            <Text style={{ lineHeight: 1.4 }}>{d.notes}</Text>
          </View>
        ) : null}

        <View style={s.footer} fixed>
          <Text>Kishwour · Made in Bangladesh</Text>
          <Text
            render={({ pageNumber, totalPages }) =>
              `${d.number} · ${pageNumber}/${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}
