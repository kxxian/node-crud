import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import styles from './PostCreate.module.css';
import { isValidAttachmentType, getAttachmentErrorMessage } from './attachmentValidation';

interface FormData {
    title: string;
    body: string;
    image?: File;
}

interface FormErrors {
    title?: string;
    body?: string;
    image?: string;
    attachments?: string;
}

interface Attachment {
    id: string;
    file: File;
    name: string;
    size: number;
}

interface ImagePreview {
    url: string;
    file: File;
}

export default function PostCreate() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState<FormData>({
        title: '',
        body: ''
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<FormErrors>({});
    const [imagePreview, setImagePreview] = useState<ImagePreview | null>(null);
    const [attachments, setAttachments] = useState<Attachment[]>([]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        
        if (!file) {
            setImagePreview(null);
            setFormData(prev => {
                const { image, ...rest } = prev;
                return rest;
            });
            return;
        }

        // Validate file size (max 5MB)
        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            setErrors(prev => ({
                ...prev,
                image: 'Image size must be less than 5MB'
            }));
            return;
        }

        // Validate file type
        const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            setErrors(prev => ({
                ...prev,
                image: 'Only JPEG, PNG, GIF, and WebP images are allowed'
            }));
            return;
        }

        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setImagePreview({
                url: reader.result as string,
                file: file
            });
            setFormData(prev => ({
                ...prev,
                image: file
            }));
            setErrors(prev => {
                const { image, ...rest } = prev;
                return rest;
            });
        };
        reader.readAsDataURL(file);
    };

    const removeImage = () => {
        setImagePreview(null);
        setFormData(prev => {
            const { image, ...rest } = prev;
            return rest;
        });
    };

    const handleAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        
        if (!files) return;

        const maxSize = 10 * 1024 * 1024; // 10MB per file
        const newAttachments: Attachment[] = [];
        let hasErrors = false;

        for (let i = 0; i < files.length; i++) {
            const file = files[i];

            // Validate file type
            if (!isValidAttachmentType(file)) {
                setErrors(prev => ({
                    ...prev,
                    attachments: getAttachmentErrorMessage(file)
                }));
                hasErrors = true;
                continue;
            }

            // Validate file size
            if (file.size > maxSize) {
                setErrors(prev => ({
                    ...prev,
                    attachments: `File "${file.name}" exceeds 10MB limit`
                }));
                hasErrors = true;
                continue;
            }

            // Add attachment with unique ID
            newAttachments.push({
                id: `${Date.now()}-${i}`,
                file: file,
                name: file.name,
                size: file.size
            });
        }

        if (newAttachments.length > 0) {
            setAttachments(prev => [...prev, ...newAttachments]);
            if (!hasErrors) {
                setErrors(prev => {
                    const { attachments, ...rest } = prev;
                    return rest;
                });
            }
        }

        // Reset input
        e.target.value = '';
    };

    const removeAttachment = (id: string) => {
        setAttachments(prev => prev.filter(a => a.id !== id));
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const newErrors: FormErrors = {};

        if (!formData.title.trim()) {
            newErrors.title = 'Title is required';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setLoading(true);
        setErrors({});

        // Create FormData for multipart/form-data submission
        const submitData = new FormData();
        submitData.append('title', formData.title);
        submitData.append('body', formData.body);
        if (formData.image) {
            submitData.append('image', formData.image);
        }
        // Add attachments
        attachments.forEach((attachment) => {
            submitData.append('attachments', attachment.file);
        });

        axios.post('http://localhost:8000/api/posts', submitData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        })
            .then(() => {
                navigate('/?success=true');
            })
            .catch(err => {
                console.error('Error creating post:', err);
                setErrors({ body: 'Failed to create post. Please try again.' });
                setLoading(false);
            });
    };

    return (
        <div className={styles.container}>
            <h1 className={styles.header}>Create Post</h1>
            
            <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.formGroup}>
                    <label htmlFor="title" className={styles.label}>Title</label>
                    <input
                        type="text"
                        id="title"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        placeholder="Enter post title"
                        className={`${styles.input} ${errors.title ? styles.inputError : ''}`}
                    />
                    {errors.title && <span className={styles.fieldError}>{errors.title}</span>}
                </div>

                <div className={styles.formGroup}>
                    <label htmlFor="body" className={styles.label}>Body</label>
                    <textarea
                        id="body"
                        name="body"
                        value={formData.body}
                        onChange={handleChange}
                        placeholder="Enter post content"
                        className={`${styles.textarea} ${errors.body ? styles.inputError : ''}`}
                        rows={6}
                    />
                    {errors.body && <span className={styles.fieldError}>{errors.body}</span>}
                </div>

                <div className={styles.formGroup}>
                    <label htmlFor="image" className={styles.label}>Image</label>
                    <input
                        type="file"
                        id="image"
                        name="image"
                        onChange={handleImageChange}
                        accept="image/jpeg,image/png,image/gif,image/webp"
                        className={`${styles.input} ${errors.image ? styles.inputError : ''}`}
                    />
                    {errors.image && <span className={styles.fieldError}>{errors.image}</span>}
                    
                    {imagePreview && (
                        <div className={styles.imagePreviewContainer}>
                            <img src={imagePreview.url} alt="Preview" className={styles.imagePreview} />
                            <button 
                                type="button" 
                                onClick={removeImage}
                                className={styles.removeImageButton}
                            >
                                Remove Image
                            </button>
                        </div>
                    )}
                </div>

                <div className={styles.formGroup}>
                    <label htmlFor="attachments" className={styles.label}>Attachments</label>
                    <input
                        type="file"
                        id="attachments"
                        name="attachments"
                        onChange={handleAttachmentChange}
                        multiple
                        accept=".pdf,.docx,.txt,.xml,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,application/xml,text/xml"
                        className={styles.input}
                    />
                    <small className={styles.helpText}>Allowed: PDF, DOCX, TXT, XML (Max 10MB per file)</small>
                    {errors.attachments && <span className={styles.fieldError}>{errors.attachments}</span>}
                    
                    {attachments.length > 0 && (
                        <div className={styles.attachmentsList}>
                            <h4 className={styles.attachmentsTitle}>Selected Files ({attachments.length})</h4>
                            <ul className={styles.attachmentsListItems}>
                                {attachments.map((attachment) => (
                                    <li key={attachment.id} className={styles.attachmentItem}>
                                        <span className={styles.attachmentName}>{attachment.name}</span>
                                        <span className={styles.attachmentSize}>{formatFileSize(attachment.size)}</span>
                                        <button
                                            type="button"
                                            onClick={() => removeAttachment(attachment.id)}
                                            className={styles.removeAttachmentButton}
                                        >
                                            Remove
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                <div className={styles.buttonGroup}>
                    <button 
                        type="submit" 
                        className={styles.submitButton}
                        disabled={loading}
                    >
                        {loading ? 'Creating...' : 'Create Post'}
                    </button>
                    <Link to="/" className={styles.cancelButton}>
                        Cancel
                    </Link>
                </div>
            </form>
        </div>
    );
}