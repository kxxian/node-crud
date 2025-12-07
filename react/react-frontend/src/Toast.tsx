import styles from './Toast.module.css';

export interface Toast {
    id: number;
    message: string;
    type: 'success' | 'error';
}

interface ToastProps {
    toasts: Toast[];
    onRemove: (id: number) => void;
}

export default function ToastContainer({ toasts, onRemove }: ToastProps) {
    return (
        <div className={styles.toastContainer}>
            {toasts.map(toast => (
                <div key={toast.id} className={`${styles.toast} ${styles[`toast${toast.type === 'success' ? 'Success' : 'Error'}`]}`}>
                    <span>{toast.message}</span>
                    <button 
                        onClick={() => onRemove(toast.id)}
                        className={styles.toastClose}
                    >
                        ×
                    </button>
                </div>
            ))}
        </div>
    );
}
