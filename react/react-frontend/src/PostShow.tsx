import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';
import styles from './PostShow.module.css';
import { formatFileSize, handleDownload } from './attachmentUtils';
import type { Attachment } from './AttachmentModal';

interface Post {
    id: number;
    title: string;
    body: string;
    image?: string;
}

export default function PostShow() {
    const { id } = useParams();
    const [post, setPost] = useState<Post | null>(null);
    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (id) {
            axios.get(`http://localhost:8000/api/posts/${id}`)
                .then(response => {
                    setPost(response.data);
                    setLoading(false);
                })
                .catch(err => {
                    console.error('Error fetching post:', err);
                    setError('Failed to load post');
                    setLoading(false);
                });

            // Fetch attachments
            axios.get(`http://localhost:8000/api/posts/${id}/attachments`)
                .then(response => {
                    setAttachments(response.data);
                })
                .catch(err => {
                    console.error('Error fetching attachments:', err);
                });
        }
    }, [id]);

    if (loading) {
        return (
            <div className={styles.container}>
                <p className={styles.loading}>Loading...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.container}>
                <p className={styles.error}>{error}</p>
                <Link to="/" className={styles.backButton}>Back to Posts</Link>
            </div>
        );
    }

    if (!post) {
        return (
            <div className={styles.container}>
                <p className={styles.error}>Post not found</p>
                <Link to="/" className={styles.backButton}>Back to Posts</Link>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <h1 className={styles.header}>Post Details</h1>
            
            <div className={styles.content}>
                <div className={styles.field}>
                    <label className={styles.label}>ID</label>
                    <p className={styles.value}>{post.id}</p>
                </div>

                <div className={styles.field}>
                    <label className={styles.label}>Title</label>
                    <p className={styles.value}>{post.title}</p>
                </div>

                <div className={styles.field}>
                    <label className={styles.label}>Body</label>
                    <p className={styles.valueText}>{post.body}</p>
                </div>

                {post.image && (
                    <div className={styles.field}>
                        <label className={styles.label}>Image</label>
                        <img 
                            src={`http://localhost:8000/images/${post.image}`} 
                            alt="Post" 
                            className={styles.postImage}
                        />
                    </div>
                )}

                {attachments.length > 0 && (
                    <div className={styles.field}>
                        <label className={styles.label}>Attachments ({attachments.length})</label>
                        <ul className={styles.attachmentsList}>
                            {attachments.map((attachment) => (
                                <li key={attachment.id} className={styles.attachmentItem}>
                                    <div className={styles.attachmentInfo}>
                                        <span className={styles.attachmentName}>{attachment.original_name}</span>
                                        <span className={styles.attachmentSize}>{formatFileSize(attachment.file_size)}</span>
                                    </div>
                                    <button
                                        onClick={() => handleDownload(attachment.filename, attachment.original_name)}
                                        className={styles.downloadButton}
                                    >
                                        Download
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                <div className={styles.buttonGroup}>
                    <Link to="/" className={styles.backButton}>
                        Back to Posts
                    </Link>
                </div>
            </div>
        </div>
    );
}