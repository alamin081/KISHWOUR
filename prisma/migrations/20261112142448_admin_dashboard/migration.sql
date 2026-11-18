-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "alibabaProductId" TEXT,
ADD COLUMN     "alibabaUpdatedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Inquiry" ADD COLUMN     "assignedToId" TEXT;

-- AlterTable
ALTER TABLE "Quotation" ADD COLUMN     "leadTime" TEXT,
ADD COLUMN     "paymentTerms" TEXT,
ADD COLUMN     "shippingTerms" TEXT;

-- AlterTable
ALTER TABLE "QuotationItem" ADD COLUMN     "moq" INTEGER;

-- CreateTable
CREATE TABLE "SiteSetting" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updatedById" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteSetting_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE INDEX "Inquiry_assignedToId_idx" ON "Inquiry"("assignedToId");

-- AddForeignKey
ALTER TABLE "Inquiry" ADD CONSTRAINT "Inquiry_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteSetting" ADD CONSTRAINT "SiteSetting_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
