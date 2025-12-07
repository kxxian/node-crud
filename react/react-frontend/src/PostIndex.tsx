import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import styles from './PostIndex.module.css';
import axios from 'axios';
import jsPDF from 'jspdf';
import ToastContainer, { type Toast } from './Toast';
import AttachmentModal, { type Attachment } from './AttachmentModal';

interface Post {
    id: number;
    title: string;
    body: string;
    image?: string;
    attachmentCount?: number;
}

export default function PostIndex() {
    const [searchParams] = useSearchParams();
    const [posts, setPosts] = useState<Post[]>([]);
    const [toasts, setToasts] = useState<Toast[]>([]);
    const [selectedPostId, setSelectedPostId] = useState<number | null>(null);
    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const [attachmentsLoading, setAttachmentsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPosts, setTotalPosts] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [itemsPerPage] = useState(10);
    const [filterImage, setFilterImage] = useState<'all' | 'with' | 'without'>('all');
    const [filterAttachment, setFilterAttachment] = useState<'all' | 'with' | 'without'>('all');

    const addToast = (message: string, type: 'success' | 'error') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);

        // Auto-remove toast after 3 seconds
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 3000);
    };

    const removeToast = (id: number) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    const fetchAttachments = (postId: number) => {
        setAttachmentsLoading(true);
        axios.get(`http://localhost:8000/api/posts/${postId}/attachments`)
            .then(response => {
                setAttachments(response.data);
                setSelectedPostId(postId);
            })
            .catch(error => {
                console.error('Error fetching attachments:', error);
                addToast('Failed to load attachments. Please try again.', 'error');
            })
            .finally(() => {
                setAttachmentsLoading(false);
            });
    };

    const closeModal = () => {
        setSelectedPostId(null);
        setAttachments([]);
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
        setCurrentPage(1); // Reset to page 1 when searching
    };

    const handlePreviousPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };

    const handleNextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1);
        }
    };

    const handleImageFilterChange = (value: 'all' | 'with' | 'without') => {
        setFilterImage(value);
        setCurrentPage(1); // Reset to page 1 when filtering
    };

    const handleAttachmentFilterChange = (value: 'all' | 'with' | 'without') => {
        setFilterAttachment(value);
        setCurrentPage(1); // Reset to page 1 when filtering
    };

    useEffect(() => {
        // Show success toast if redirected from create page
        if (searchParams.get('success') === 'true') {
            addToast('Post created successfully!', 'success');
        } else if (searchParams.get('success-update') === 'true') {
            addToast('Post updated successfully!', 'success');
        }
    }, [searchParams]);

    useEffect(() => {
        axios.get('http://localhost:8000/api/posts', {
            params: {
                search: searchQuery,
                page: currentPage,
                limit: itemsPerPage,
                filterImage: filterImage,
                filterAttachment: filterAttachment
            }
        })
            .then(response => {
                setPosts(response.data.posts);
                setTotalPosts(response.data.total);
                setTotalPages(response.data.totalPages);
            })
            .catch(error => {
                console.error('Error fetching posts:', error);
            });
    }, [searchQuery, currentPage, itemsPerPage, filterImage, filterAttachment]);

    const handleDelete = (id: number) => {
        if (window.confirm('Are you sure you want to delete this post?')) {
            axios.delete(`http://localhost:8000/api/posts/${id}`)
                .then(() => {
                    setPosts(posts.filter(p => p.id !== id));
                    addToast('Post deleted successfully!', 'success');
                })
                .catch(error => {
                    console.error('Error deleting post:', error);
                    addToast('Failed to delete post. Please try again.', 'error');
                });
        }
    };

    const handleDeleteAll = () => {
        const count = posts.length;
        if (window.confirm(`Are you sure you want to delete all ${count} post${count !== 1 ? 's' : ''}? This cannot be undone.`)) {
            if (window.confirm('Click OK again to confirm deletion.')) {
                Promise.all(posts.map(post => 
                    axios.delete(`http://localhost:8000/api/posts/${post.id}`)
                ))
                    .then(() => {
                        setPosts([]);
                        setCurrentPage(1);
                        addToast(`Deleted ${count} post${count !== 1 ? 's' : ''} successfully!`, 'success');
                    })
                    .catch(error => {
                        console.error('Error deleting posts:', error);
                        addToast('Failed to delete some posts. Please try again.', 'error');
                    });
            }
        }
    };

    const handleExportCSV = () => {
        if (posts.length === 0) {
            addToast('No posts to export', 'error');
            return;
        }

        const headers = ['ID', 'Title', 'Body', 'Image', 'Attachments'];
        const rows = posts.map(post => [
            post.id,
            `"${post.title.replace(/"/g, '""')}"`,
            `"${post.body.replace(/"/g, '""')}"`,
            post.image ? 'Yes' : 'No',
            post.attachmentCount || 0
        ]);

        const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `posts_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        addToast(`Exported ${posts.length} posts to CSV!`, 'success');
    };

    const handleExportPDF = async () => {
        if (posts.length === 0) {
            addToast('No posts to export', 'error');
            return;
        }

        try {
            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            const margin = 10;
            let yPosition = 20;

            // Add title
            doc.setFontSize(18);
            doc.text('Posts Report', pageWidth / 2, yPosition, { align: 'center' });
            yPosition += 15;

            // Add timestamp
            doc.setFontSize(10);
            doc.setTextColor(100);
            doc.text(`Generated on: ${new Date().toLocaleString()}`, pageWidth / 2, yPosition, { align: 'center' });
            doc.setTextColor(0);
            yPosition += 15;

            // Draw manual table
            const tableColumns = ['ID', 'Title', 'Body', 'Image', 'Attachments'];
            const colWidths = [(pageWidth - 2 * margin) * 0.1, (pageWidth - 2 * margin) * 0.15, (pageWidth - 2 * margin) * 0.4, (pageWidth - 2 * margin) * 0.15, (pageWidth - 2 * margin) * 0.2];
            const rowHeight = 12;
            let xPosition = margin;

            // Draw header
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.setFillColor(200, 200, 200); // Light gray background
            doc.setDrawColor(0, 0, 0);
            doc.setLineWidth(0.5); // Thicker border
            doc.setTextColor(0, 0, 0); // Black text
            
            // First, draw all rectangles
            let tempXPos = margin;
            for (let i = 0; i < tableColumns.length; i++) {
                doc.rect(tempXPos, yPosition, colWidths[i], rowHeight, 'FD');
                tempXPos += colWidths[i];
            }
            
            // Then, draw all text
            tempXPos = margin;
            for (let i = 0; i < tableColumns.length; i++) {
                doc.setFont('helvetica', 'bold');
                doc.text(tableColumns[i], tempXPos + 2, yPosition + 8);
                tempXPos += colWidths[i];
            }
            
            doc.setLineWidth(0.1); // Reset line width for rows
            yPosition += rowHeight;

            // Draw rows
            doc.setTextColor(0); // Black text for rows
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            
            posts.forEach((post) => {
                if (yPosition > pageHeight - 20) {
                    doc.addPage();
                    yPosition = margin;
                }

                const rowData = [
                    post.id.toString(),
                    post.title.substring(0, 10),
                    post.body.substring(0, 50), // Shorter to fit
                    post.image ? 'Yes' : 'No',
                    (post.attachmentCount || 0).toString()
                ];

                xPosition = margin;
                doc.setDrawColor(0);
                doc.setTextColor(0);

                rowData.forEach((cell, i) => {
                    doc.rect(xPosition, yPosition, colWidths[i], rowHeight);
                    doc.text(cell, xPosition + 1, yPosition + 8);
                    xPosition += colWidths[i];
                });
                yPosition += rowHeight;
            });

            // Add footer
            doc.setFontSize(9);
            doc.setTextColor(150);
            doc.text(`Page 1`, pageWidth / 2, pageHeight - 10, { align: 'center' });

            // Save PDF
            doc.save(`posts_${new Date().toISOString().split('T')[0]}.pdf`);
            addToast(`Exported ${posts.length} posts to PDF!`, 'success');
        } catch (error) {
            console.error('Error generating PDF:', error);
            addToast('Failed to generate PDF. Please try again.', 'error');
        }
    };

    const handlePrint = () => {
        if (posts.length === 0) {
            addToast('No posts to print', 'error');
            return;
        }

        let printContent = `
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    h1 { text-align: center; color: #333; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th { background-color: #f2f2f2; padding: 12px; text-align: left; border: 1px solid #ddd; }
                    td { padding: 12px; border: 1px solid #ddd; }
                    tr:nth-child(even) { background-color: #f9f9f9; }
                    @media print { body { margin: 0; } }
                </style>
            </head>
            <body>
                <h1>Posts Report</h1>
                <p>Generated on: ${new Date().toLocaleString()}</p>
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Title</th>
                            <th>Body</th>
                            <th>Image</th>
                            <th>Attachments</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        posts.forEach(post => {
            printContent += `
                <tr>
                    <td>${post.id}</td>
                    <td>${post.title}</td>
                    <td>${post.body.substring(0, 50)}${post.body.length > 50 ? '...' : ''}</td>
                    <td>${post.image ? 'Yes' : 'No'}</td>
                    <td>${post.attachmentCount || 0}</td>
                </tr>
            `;
        });

        printContent += `
                    </tbody>
                </table>
            </body>
            </html>
        `;

        const printWindow = window.open('', '', 'width=1000,height=600');
        if (printWindow) {
            const blob = new Blob([printContent], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            printWindow.location.href = url;
            printWindow.onload = () => {
                printWindow.print();
            };
        }
    };

    return (
        <div className={styles.container}>
            <ToastContainer toasts={toasts} onRemove={removeToast} />
            <h1 className={styles.header}>CRUD APP</h1>
            <div className={styles.topButtonGroup}>
                <Link to="/create" className={styles.createButton}>
                    Create
                </Link>
                {posts.length > 0 && (
                    <>
                        <button 
                            onClick={handleDeleteAll}
                            className={styles.deleteAllButton}
                        >
                            Delete All ({posts.length})
                        </button>
                        <div className={styles.exportButtonGroup}>
                            <button 
                                onClick={handleExportCSV}
                                className={styles.exportButton}
                                title="Export to CSV"
                            >
                                CSV
                            </button>
                            <button 
                                onClick={handleExportPDF}
                                className={styles.exportButton}
                                title="Export to PDF"
                            >
                                PDF
                            </button>
                            <button 
                                onClick={handlePrint}
                                className={styles.exportButton}
                                title="Print posts"
                            >
                                Print
                            </button>
                        </div>
                    </>
                )}
            </div>

            <div className={styles.searchContainer}>
                <input
                    type="text"
                    placeholder="Search by title or body..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    className={styles.searchInput}
                />
                {totalPosts > 0 && (
                    <span className={styles.resultCount}>
                        {totalPosts} post{totalPosts !== 1 ? 's' : ''} found
                    </span>
                )}
            </div>

            <div className={styles.filterContainer}>
                <div className={styles.filterGroup}>
                    <label className={styles.filterLabel}>Image:</label>
                    <select 
                        value={filterImage}
                        onChange={(e) => handleImageFilterChange(e.target.value as 'all' | 'with' | 'without')}
                        className={styles.filterSelect}
                    >
                        <option value="all">All Posts</option>
                        <option value="with">With Image</option>
                        <option value="without">Without Image</option>
                    </select>
                </div>
                <div className={styles.filterGroup}>
                    <label className={styles.filterLabel}>Attachments:</label>
                    <select 
                        value={filterAttachment}
                        onChange={(e) => handleAttachmentFilterChange(e.target.value as 'all' | 'with' | 'without')}
                        className={styles.filterSelect}
                    >
                        <option value="all">All Posts</option>
                        <option value="with">With Attachments</option>
                        <option value="without">Without Attachments</option>
                    </select>
                </div>
            </div>

            {posts.length === 0 ? (
                <div className={styles.noDataMessage}>
                    <p>{searchQuery ? 'No posts match your search' : 'No data available'}</p>
                </div>
            ) : (
                <table className={styles.table}>
                    <thead className={styles.tableHeader}>
                        <tr>
                            {/* <th className={styles.tableHeaderCell}>ID</th> */}
                            <th className={styles.tableHeaderCell}>Image</th>
                            <th className={styles.tableHeaderCell}>Title</th>
                            <th className={styles.tableHeaderCell}>Body</th>
                            <th className={styles.tableHeaderCell}>Attachments</th>
                            <th className={styles.tableHeaderCell}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {posts.map((post) => (
                            <tr key={post.id} className={styles.tableRow}>
                                {/* <td className={styles.tableCell}>{post.id}</td> */}
                                <td className={styles.imageCell}>
                                    {post.image ? (
                                        <img 
                                            src={`http://localhost:8000/images/${post.image}`} 
                                            alt={post.title}
                                            className={styles.tableThumbnail}
                                        />
                                    ) : (
                                        <span className={styles.noImage}>No image</span>
                                    )}
                                </td>
                                <td className={styles.tableCell}>{post.title}</td>
                                <td className={styles.tableCell}>{post.body}</td>
                                <td className={styles.attachmentCountCell}>
                                    {post.attachmentCount && post.attachmentCount > 0 ? (
                                        <button
                                            onClick={() => fetchAttachments(post.id)}
                                            className={styles.attachmentBadge}
                                            title="Click to view attachments"
                                        >
                                            {post.attachmentCount}
                                        </button>
                                    ) : (
                                        <span className={styles.noAttachments}>—</span>
                                    )}
                                </td>
                                <td className={styles.actionCell}>
                                    <Link to={`/show/${post.id}`} className={`${styles.button} ${styles.showButton}`}>
                                        Show
                                    </Link>
                                    <Link to={`/edit/${post.id}`} className={`${styles.button} ${styles.editButton}`}>
                                        Edit
                                    </Link>
                                    <button
                                        onClick={() => handleDelete(post.id)}
                                        className={`${styles.button} ${styles.deleteButton}`}
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            {posts.length > 0 && totalPages > 1 && (
                <div className={styles.paginationContainer}>
                    <button
                        onClick={handlePreviousPage}
                        disabled={currentPage === 1}
                        className={styles.paginationButton}
                    >
                        ← Previous
                    </button>
                    <span className={styles.pageIndicator}>
                        Page {currentPage} of {totalPages}
                    </span>
                    <button
                        onClick={handleNextPage}
                        disabled={currentPage === totalPages}
                        className={styles.paginationButton}
                    >
                        Next →
                    </button>
                </div>
            )}

            <AttachmentModal
                isOpen={selectedPostId !== null}
                attachments={attachments}
                isLoading={attachmentsLoading}
                onClose={closeModal}
            />
        </div>
    )
}