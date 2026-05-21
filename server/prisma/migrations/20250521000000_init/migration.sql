-- CreateEnum
CREATE TYPE "SlotType" AS ENUM ('ELECTION_DAY', 'PRE_VOTE');

-- CreateTable
CREATE TABLE "VotingSlot" (
    "id" SERIAL NOT NULL,
    "type" "SlotType" NOT NULL,
    "region" TEXT NOT NULL,
    "stationName" TEXT NOT NULL,
    "buildingName" TEXT,
    "stationAddress" TEXT,
    "date" TEXT NOT NULL,
    "timeSlot" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VotingSlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Registration" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "birthDate" TEXT NOT NULL,
    "gender" TEXT,
    "phone" TEXT NOT NULL,
    "addressDong" TEXT,
    "address" TEXT,
    "bankAccount" TEXT,
    "isMember" BOOLEAN NOT NULL DEFAULT false,
    "isSupporter" BOOLEAN NOT NULL DEFAULT false,
    "isConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "slotId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Registration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VotingSlot_stationName_date_timeSlot_key" ON "VotingSlot"("stationName", "date", "timeSlot");

-- AddForeignKey
ALTER TABLE "Registration" ADD CONSTRAINT "Registration_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "VotingSlot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
