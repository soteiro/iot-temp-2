-- AlterTable
ALTER TABLE "public"."devices" ADD COLUMN     "user_id" TEXT;

-- CreateTable
CREATE TABLE "public"."users" (
    "user_id" TEXT NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "name" VARCHAR(100),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("user_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE INDEX "sensor_data_device_id_idx" ON "public"."sensor_data"("device_id");

-- CreateIndex
CREATE INDEX "sensor_data_timestamp_idx" ON "public"."sensor_data"("timestamp");

-- CreateIndex
CREATE INDEX "sensor_data_device_id_timestamp_idx" ON "public"."sensor_data"("device_id", "timestamp");

-- AddForeignKey
ALTER TABLE "public"."devices" ADD CONSTRAINT "devices_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;
