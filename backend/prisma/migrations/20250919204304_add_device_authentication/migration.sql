-- AlterTable
ALTER TABLE "public"."sensor_data" ADD COLUMN     "device_id" TEXT;

-- CreateTable
CREATE TABLE "public"."devices" (
    "device_id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "api_key" VARCHAR(255) NOT NULL,
    "api_secret" VARCHAR(255) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_seen" TIMESTAMP(3),

    CONSTRAINT "devices_pkey" PRIMARY KEY ("device_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "devices_api_key_key" ON "public"."devices"("api_key");

-- AddForeignKey
ALTER TABLE "public"."sensor_data" ADD CONSTRAINT "sensor_data_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "public"."devices"("device_id") ON DELETE SET NULL ON UPDATE CASCADE;
