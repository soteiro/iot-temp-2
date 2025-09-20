/*
  Warnings:

  - Made the column `user_id` on table `devices` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "public"."devices" DROP CONSTRAINT "devices_user_id_fkey";

-- AlterTable
ALTER TABLE "public"."devices" ALTER COLUMN "user_id" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."devices" ADD CONSTRAINT "devices_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
