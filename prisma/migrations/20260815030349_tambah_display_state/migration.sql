-- CreateTable
CREATE TABLE "DisplayState" (
    "id" TEXT NOT NULL DEFAULT 'CURRENT_STATE',
    "payload" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DisplayState_pkey" PRIMARY KEY ("id")
);
