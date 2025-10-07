import { DeviceCard } from '@/components/devices/DeviceCard';
import { useEffect, useState } from 'react';

type Props = {
    userToken: string,
    url: string,
}
// TODO: refactorizar con zustand
export const DeviceList = ({ url, userToken }: Props) => {
    const [ devices, setDevices ] = useState([]);
    const [ loading, setLoading ] = useState(true);

    useEffect(()=>{
        setLoading(true);
        const options = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${userToken}`
            }
        }
        fetch(url, options)
            .then(response => response.json())
            .then(data => {
                setDevices(data.devices);
                setLoading(false); // <-- Desactiva loading aquí
            })
            .catch(error => {
                console.error('Error fetching devices:', error);
                setLoading(false); // <-- También desactiva en error
            });
    }, [ ]);

    return (
        <section>
            {loading ? (
                <div className="flex justify-center items-center h-32">
                <span className="loading loading-ring loading-2xl text-primary"></span>
                </div>
            ) : (
                devices.length > 0 ? (
                    <div className="flex flex-col gap-2">
                        {
                            devices.map((device: any) => (
                                <DeviceCard key={device.device_id} device={device} />
                            ))
                        }
                    </div>
                ) : (
                    <p>No hay dispositivos disponibles.</p>
                )
            )}
        </section>
    )
}


