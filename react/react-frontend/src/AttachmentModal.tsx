import { formatFileSize, handleDownload } from './attachmentUtils';
import styles from './PostIndex.module.css';

export interface Attachment {
    id: number;
    filename: string;
    original_name: string;
    file_size: number;
    created_at?: string;
}

interface AttachmentModalProps {
    isOpen: boolean;
    attachments: Attachment[];
    isLoading: boolean;
    onClose: () => void;
}

export default function AttachmentModal({
    isOpen,
    attachments,
    isLoading,
    onClose,
}: AttachmentModalProps) {
    if (!isOpen) return null;

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <h2>Attachments</h2>
                    <button className={styles.closeButton} onClick={onClose}>
                        ×
                    </button>
                </div>
                <div className={styles.modalContent}>
                    {isLoading ? (
                        <p className={styles.loadingText}>Loading attachments...</p>
                    ) : attachments.length > 0 ? (
                        <ul className={styles.modalAttachmentsList}>
                            {attachments.map((attachment) => (
                                <li key={attachment.id} className={styles.modalAttachmentItem}>
                                    <div className={styles.modalAttachmentInfo}>
                                        <span className={styles.modalAttachmentName}>
                                            {attachment.original_name}
                                        </span>
                                        <span className={styles.modalAttachmentSize}>
                                            {formatFileSize(attachment.file_size)}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() =>
                                            handleDownload(
                                                attachment.filename,
                                                attachment.original_name
                                            )
                                        }
                                        className={styles.modalDownloadButton}
                                    >
                                        Download
                                    </button>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className={styles.noAttachmentsText}>
                            No attachments for this post.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
