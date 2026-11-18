-- AlterEnum (hand-written): rename values in place so existing rows keep their meaning,
-- then add CONTACTED after REVIEWING. Resulting order matches schema.prisma.
ALTER TYPE "InquiryStatus" RENAME VALUE 'IN_REVIEW' TO 'REVIEWING';
ALTER TYPE "InquiryStatus" RENAME VALUE 'QUOTED' TO 'QUOTATION_SENT';
ALTER TYPE "InquiryStatus" RENAME VALUE 'NEGOTIATING' TO 'NEGOTIATION';
ALTER TYPE "InquiryStatus" RENAME VALUE 'WON' TO 'APPROVED';
ALTER TYPE "InquiryStatus" RENAME VALUE 'LOST' TO 'REJECTED';
ALTER TYPE "InquiryStatus" ADD VALUE 'CONTACTED' AFTER 'REVIEWING';

-- AlterTable
ALTER TABLE "Inquiry" ADD COLUMN     "adminNotifiedAt" TIMESTAMP(3),
ADD COLUMN     "buyerAckSentAt" TIMESTAMP(3),
ADD COLUMN     "customerId" TEXT,
ADD COLUMN     "customizationRequirements" TEXT,
ADD COLUMN     "deliveryAddress" TEXT,
ADD COLUMN     "submissionKey" TEXT;

-- AlterTable
ALTER TABLE "InquiryItem" ADD COLUMN     "productSku" TEXT;

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "companyName" TEXT,
    "contactPerson" TEXT,
    "phone" TEXT,
    "country" CHAR(2),
    "businessType" TEXT,
    "website" TEXT,
    "address" TEXT,
    "notes" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Customer_email_key" ON "Customer"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_userId_key" ON "Customer"("userId");

-- CreateIndex
CREATE INDEX "Customer_country_idx" ON "Customer"("country");

-- CreateIndex
CREATE INDEX "Customer_companyName_idx" ON "Customer"("companyName");

-- CreateIndex
CREATE UNIQUE INDEX "Inquiry_submissionKey_key" ON "Inquiry"("submissionKey");

-- CreateIndex
CREATE INDEX "Inquiry_customerId_idx" ON "Inquiry"("customerId");

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inquiry" ADD CONSTRAINT "Inquiry_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
