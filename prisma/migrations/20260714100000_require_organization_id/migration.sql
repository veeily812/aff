-- AlterTable
ALTER TABLE "Channel" ALTER COLUMN "organizationId" SET NOT NULL;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "organizationId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Product" ALTER COLUMN "organizationId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Post" ALTER COLUMN "organizationId" SET NOT NULL;
