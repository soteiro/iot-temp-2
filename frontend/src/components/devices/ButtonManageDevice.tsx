

export const ButtonManageDevice = () => {

    return (
        <div>
            <dialog>
                <form method="dialog" className="modal-box">
                    <ul>
                        <li><button className="btn btn-info">Renombrar</button></li>
                        <li><button className="btn btn-danger">Desactiva</button></li>
                        <li><button className="btn btn-secondary">Eliminar</button></li>
                    </ul>
                </form>
            </dialog>
        <div>
        <button onClick={()=>{
            const dialog = document.querySelector('dialog');
            if (dialog) {
                dialog.showModal();
            }
        }}
          className="btn btn-primary btn-soft btn-circle btn-sm"
        >
          <svg
            width="24"
            height="24"
            fill="currentColor"
            viewBox="0 0 24 24">
            <circle cx="12" cy="5" r="2" />
            <circle cx="12" cy="12" r="2" />
            <circle cx="12" cy="19" r="2" />
          </svg>
        </button>
        </div>
        </div>
    )
}