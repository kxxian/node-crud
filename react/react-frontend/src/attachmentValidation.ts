/**
 * Allowed file types for attachments
 */
export const ALLOWED_ATTACHMENT_TYPES = {
    'application/pdf': '.pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
    'text/plain': '.txt',
    'application/xml': '.xml',
    'text/xml': '.xml',
};

export const ALLOWED_ATTACHMENT_EXTENSIONS = ['.pdf', '.docx', '.txt', '.xml'];

/**
 * Validate if a file is an allowed attachment type
 */
export const isValidAttachmentType = (file: File): boolean => {
    // Check MIME type
    if (ALLOWED_ATTACHMENT_TYPES[file.type as keyof typeof ALLOWED_ATTACHMENT_TYPES]) {
        return true;
    }

    // Check file extension as fallback
    const fileName = file.name.toLowerCase();
    return ALLOWED_ATTACHMENT_EXTENSIONS.some(ext => fileName.endsWith(ext));
};

/**
 * Get error message for invalid attachment
 */
export const getAttachmentErrorMessage = (file: File): string => {
    if (!isValidAttachmentType(file)) {
        return `"${file.name}" is not allowed. Only PDF, DOCX, TXT, and XML files are supported.`;
    }
    return '';
};
