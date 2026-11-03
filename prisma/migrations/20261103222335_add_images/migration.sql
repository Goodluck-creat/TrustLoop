-- AlterTable
ALTER TABLE "Submission" ADD COLUMN     "reviewNote" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "avatarAt" TIMESTAMP(3),
ADD COLUMN     "coverAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "UserImage" (
    "userId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "data" BYTEA NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserImage_pkey" PRIMARY KEY ("userId","kind")
);

-- AddForeignKey
ALTER TABLE "UserImage" ADD CONSTRAINT "UserImage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
