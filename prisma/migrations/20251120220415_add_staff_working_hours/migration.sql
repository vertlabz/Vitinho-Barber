-- CreateTable
CREATE TABLE "StaffWorkingHours" (
    "id" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "weekday" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,

    CONSTRAINT "StaffWorkingHours_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "StaffWorkingHours" ADD CONSTRAINT "StaffWorkingHours_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
