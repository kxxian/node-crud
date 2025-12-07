/**
 * Format file size in bytes to human-readable format (B, KB, MB, GB)
 */
export const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i];
};

/**
 * Trigger file download from server
 */
export const handleDownload = (filename: string, originalName: string): void => {
    const link = document.createElement('a');
    link.href = `http://localhost:8000/attachments/${filename}`;
    link.download = originalName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
