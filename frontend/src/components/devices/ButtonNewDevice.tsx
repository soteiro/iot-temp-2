import { useState } from 'react';
interface CreateNewDeviceProps {
    userToken: string;
    url: string;
}
export function CreateNewDevice({ userToken, url }: CreateNewDeviceProps) {
    const [open, setOpen] = useState(false);
    const [deviceName, setDeviceName] = useState('');
    const [apiKeys, setApiKeys] = useState<{ api_key: string, api_secret: string, device_id:string } | null>(null);

    const createDevice = async (userToken: string) => {
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userToken}`
                },
                body: JSON.stringify({
                    name: deviceName,
                })
            });
            if (!response.ok) throw new Error('Error al crear el dispositivo');
            const data = await response.json();
            setApiKeys({
                api_key: data.device.api_key,
                api_secret: data.device.api_secret,
                device_id: data.device.device_id
            });
        } catch (error) {
            alert('No se pudo crear el dispositivo');
        }
    }
    const formHandler = (e: React.FormEvent) => {
        e.preventDefault();
        if(!apiKeys) createDevice(userToken);
    }
    return (
        <>
            {!apiKeys && (
                <button className="btn btn-primary sm:btn-sm md:btn-md lg:btn-lg gap-2" onClick={() => setOpen(true)}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Nuevo Dispositivo
                </button>
            )}
            {open && (
                <dialog open className="modal">
                    <form
                    onSubmit={formHandler} 
                    method="dialog"
                    className="modal-box">
                        <h3 className="font-bold text-lg">Crear nuevo dispositivo</h3>
                        <input 
                            onChange={(e) => setDeviceName(e.target.value)}
                            className='input input-bordered w-full mt-2'
                            placeholder='Nombre del dispositivo' 
                            disabled={!!apiKeys}
                        />
                        {apiKeys && (
                            <div className="alert alert-success mt-2">
                                <span>
                                    <b>API Key:</b> {apiKeys.api_key} <br />
                                    <b>Device ID:</b> {apiKeys.device_id}<br />
                                    <b>API Secret:</b> {apiKeys.api_secret}
                                </span>
                            </div>
                        )}
                        <div className="modal-action">
                            {!apiKeys && (
                                <button type="button" onClick={() => createDevice(userToken)} className='btn btn-primary'>Crear</button>
                            )}
                            <button
                                type="button"
                                className="btn"
                                onClick={() => {
                                    setOpen(false);
                                    setApiKeys(null); // Limpiar claves al cerrar
                                    setDeviceName(''); // Limpiar nombre al cerrar
                                }}
                            >
                                Cerrar
                            </button>
                        </div>
                    </form>
                </dialog>
            )}
        </>
    );
}