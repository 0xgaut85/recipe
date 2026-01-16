-- Add connectedWallet column to Session table
ALTER TABLE "Session" ADD COLUMN "connectedWallet" TEXT;

-- Create index for faster lookups by connected wallet
CREATE INDEX "Session_connectedWallet_idx" ON "Session"("connectedWallet");
