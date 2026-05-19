-- CreateTable
CREATE TABLE "ShortnedUrl" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "url" TEXT NOT NULL,

    CONSTRAINT "ShortnedUrl_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ShortnedUrl_key_key" ON "ShortnedUrl"("key");

-- CreateIndex
CREATE INDEX "key_index" ON "ShortnedUrl" USING HASH ("key");
