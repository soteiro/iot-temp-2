import { parsededTime } from "@/lib/parcedTime";
import { ButtonManageDevice } from "@/components/devices/ButtonManageDevice";

interface Device {
  device_id: string;
  name: string;
  api_key: string;
  is_active: boolean;
  last_seen: string;
}

export const DeviceCard = (device: any) => {
  return (
    <article className="relative">
      <div className="p-4 border border-base-300 rounded-lg shadow-sm bg-base-100">
        <h2 className="text-lg font-bold">{device.device.name}</h2>
        <p className="text-sm font-semibold">
          Status: {device.device.is_active ? "Active" : "Inactive"}
        </p>
        <p>Last Seen: {parsededTime(device.device.last_seen)}</p>
        <p>Created At: {parsededTime(device.device.created_at)}</p>
      </div>
      <div className="absolute top-2 right-2">
        <ButtonManageDevice />          
      </div>
    </article>
  );
};
