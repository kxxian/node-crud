const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 8000;

// Create uploads directories if they don't exist
const imageUploadDir = path.join(__dirname, 'uploads', 'images');
const attachmentUploadDir = path.join(__dirname, 'uploads', 'attachments');
if (!fs.existsSync(imageUploadDir)) {
    fs.mkdirSync(imageUploadDir, { recursive: true });
}
if (!fs.existsSync(attachmentUploadDir)) {
    fs.mkdirSync(attachmentUploadDir, { recursive: true });
}

// Combined upload middleware (image + multiple attachments)
const upload = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            if (file.fieldname === 'image') {
                cb(null, imageUploadDir);
            } else if (file.fieldname === 'attachments') {
                cb(null, attachmentUploadDir);
            }
        },
        filename: (req, file, cb) => {
            if (file.fieldname === 'image') {
                // Simple filename for images
                const uniqueName = Date.now() + '-' + file.originalname;
                cb(null, uniqueName);
            } else if (file.fieldname === 'attachments') {
                // More unique filename for attachments to avoid conflicts
                const uniqueName = Date.now() + '-' + Math.random().toString(36).substring(7) + '-' + file.originalname;
                cb(null, uniqueName);
            }
        }
    }),
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit to support both images and attachments
    },
    fileFilter: (req, file, cb) => {
        if (file.fieldname === 'image') {
            // Validate image files
            const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
            if (allowedMimes.includes(file.mimetype)) {
                cb(null, true);
            } else {
                cb(new Error('Only image files are allowed'));
            }
        } else if (file.fieldname === 'attachments') {
            // Validate attachment files - only PDF, DOCX, TXT, XML
            const allowedMimes = [
                'application/pdf',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'text/plain',
                'application/xml',
                'text/xml'
            ];
            
            // Also check file extension as fallback
            const allowedExtensions = ['.pdf', '.docx', '.txt', '.xml'];
            const fileName = file.originalname.toLowerCase();
            const hasValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext));
            
            if (allowedMimes.includes(file.mimetype) || hasValidExtension) {
                cb(null, true);
            } else {
                cb(new Error(`File type not allowed. Only PDF, DOCX, TXT, and XML files are supported.`));
            }
        } else {
            cb(new Error('Invalid field name'));
        }
    }
});

app.use(cors());
app.use(express.json());
app.use(express.static('uploads'));

const db = mysql.createConnection({
    host: '127.0.0.1',
    user: 'cbpp-kr',
    password: 'pass123',
    database: 'node_crud'
});

// list post
app.get('/api/posts', (req, res) => {
    const search = req.query.search || '';
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const filterImage = req.query.filterImage || 'all';
    const filterAttachment = req.query.filterAttachment || 'all';

    // Build WHERE clause for search
    let whereConditions = [];
    
    if (search) {
        whereConditions.push(`(p.title LIKE '%${search}%' OR p.body LIKE '%${search}%')`);
    }

    // Add image filter
    if (filterImage === 'with') {
        whereConditions.push(`p.image IS NOT NULL AND p.image != ''`);
    } else if (filterImage === 'without') {
        whereConditions.push(`(p.image IS NULL OR p.image = '')`);
    }

    // Add attachment filter
    if (filterAttachment === 'with') {
        whereConditions.push(`pa.id IS NOT NULL`);
    } else if (filterAttachment === 'without') {
        whereConditions.push(`pa.id IS NULL`);
    }

    const whereClause = whereConditions.length > 0 
        ? `WHERE ${whereConditions.join(' AND ')}` 
        : '';

    // Get total count
    const countQuery = `
        SELECT COUNT(DISTINCT p.id) as total
        FROM posts p
        LEFT JOIN post_attachments pa ON p.id = pa.post_id
        ${whereClause}
    `;

    db.query(countQuery, (countErr, countResults) => {
        if (countErr) {
            return res.status(500).json({ error: countErr.message });
        }

        const total = countResults[0].total;

        // Get paginated results with attachment count
        const query = `
            SELECT 
                p.id, 
                p.title, 
                p.body, 
                p.image,
                COUNT(pa.id) as attachmentCount
            FROM posts p
            LEFT JOIN post_attachments pa ON p.id = pa.post_id
            ${whereClause}
            GROUP BY p.id, p.title, p.body, p.image
            ORDER BY p.id DESC
            LIMIT ${limit} OFFSET ${offset}
        `;
        
        db.query(query, (err, results) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json({
                posts: results,
                total: total,
                page: page,
                limit: limit,
                totalPages: Math.ceil(total / limit)
            });
        });
    });
});

// create post
app.post('/api/posts', upload.fields([{ name: 'image', maxCount: 1 }, { name: 'attachments', maxCount: 10 }]), (req, res) => {
    const { title, body } = req.body;
    const imageFile = req.files?.image ? req.files.image[0] : null;
    const attachmentFiles = req.files?.attachments || [];
    
    const imageFileName = imageFile ? imageFile.filename : null;
    
    if (!title) {
        // Delete uploaded files if validation fails
        if (imageFile) {
            fs.unlinkSync(imageFile.path);
        }
        attachmentFiles.forEach(file => {
            if (fs.existsSync(file.path)) {
                fs.unlinkSync(file.path);
            }
        });
        return res.status(400).json({ error: 'Title is required' });
    }
    
    const query = 'INSERT INTO posts (title, body, image) VALUES (?, ?, ?)';
    db.query(query, [title, body, imageFileName], (err, results) => {
        if (err) {
            // Delete uploaded files if database insert fails
            if (imageFile) {
                fs.unlinkSync(imageFile.path);
            }
            attachmentFiles.forEach(file => {
                if (fs.existsSync(file.path)) {
                    fs.unlinkSync(file.path);
                }
            });
            return res.status(500).json({ error: err.message });
        }
        
        const postId = results.insertId;
        
        // Insert attachments into database
        if (attachmentFiles.length > 0) {
            const attachmentQuery = 'INSERT INTO post_attachments (post_id, filename, original_name, file_size) VALUES (?, ?, ?, ?)';
            attachmentFiles.forEach(file => {
                db.query(attachmentQuery, [postId, file.filename, file.originalname, file.size], (err) => {
                    if (err) {
                        console.error('Error inserting attachment:', err);
                        // Try to delete the file if db insert fails
                        if (fs.existsSync(file.path)) {
                            fs.unlinkSync(file.path);
                        }
                    }
                });
            });
        }
        
        res.status(201).json({ 
            id: postId, 
            title, 
            body, 
            image: imageFileName,
            attachmentCount: attachmentFiles.length
        });
    });
});

// get post by id
app.get('/api/posts/:id', (req, res) => {
    const { id } = req.params;
    const query = 'SELECT * FROM posts WHERE id = ?';
    db.query(query, [id], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (results.length === 0) {
            return res.status(404).json({ error: 'Post not found' });
        }
        res.json(results[0]);
    });
});

// get attachments for a post
app.get('/api/posts/:id/attachments', (req, res) => {
    const { id } = req.params;
    const query = 'SELECT id, filename, original_name, file_size, created_at FROM post_attachments WHERE post_id = ? ORDER BY created_at DESC';
    db.query(query, [id], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
});

// update post
app.put('/api/posts/:id', upload.fields([{ name: 'image', maxCount: 1 }, { name: 'attachments', maxCount: 10 }]), (req, res) => {
    const { id } = req.params;
    const { title, body, removeAttachments } = req.body;
    const deleteImage = req.body.deleteImage === 'true';
    const imageFile = req.files?.image ? req.files.image[0] : null;
    const attachmentFiles = req.files?.attachments || [];
    const newImageFileName = imageFile ? imageFile.filename : null;
    
    if (!title) {
        // Delete uploaded files if validation fails
        if (imageFile) {
            fs.unlinkSync(imageFile.path);
        }
        attachmentFiles.forEach(file => {
            if (fs.existsSync(file.path)) {
                fs.unlinkSync(file.path);
            }
        });
        return res.status(400).json({ error: 'Title is required' });
    }
    
    // Get the current post to check for existing image
    const getQuery = 'SELECT image FROM posts WHERE id = ?';
    db.query(getQuery, [id], (err, results) => {
        if (err) {
            if (imageFile) fs.unlinkSync(imageFile.path);
            attachmentFiles.forEach(file => {
                if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
            });
            return res.status(500).json({ error: err.message });
        }
        
        if (results.length === 0) {
            if (imageFile) fs.unlinkSync(imageFile.path);
            attachmentFiles.forEach(file => {
                if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
            });
            return res.status(404).json({ error: 'Post not found' });
        }
        
        const oldImage = results[0].image;
        let imageFileName = oldImage; // Keep old image by default
        
        // Handle new image upload
        if (newImageFileName) {
            // Delete old image if exists
            if (oldImage) {
                const oldImagePath = path.join(imageUploadDir, oldImage);
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                }
            }
            imageFileName = newImageFileName;
        }
        // Handle explicit image deletion
        else if (deleteImage && oldImage) {
            const oldImagePath = path.join(imageUploadDir, oldImage);
            if (fs.existsSync(oldImagePath)) {
                fs.unlinkSync(oldImagePath);
            }
            imageFileName = null;
        }
        
        // Handle attachment removal
        if (removeAttachments) {
            const idsToRemove = JSON.parse(removeAttachments);
            const deleteAttachmentQuery = 'SELECT filename FROM post_attachments WHERE id = ? AND post_id = ?';
            idsToRemove.forEach(attachmentId => {
                db.query(deleteAttachmentQuery, [attachmentId, id], (err, results) => {
                    if (!err && results.length > 0) {
                        const attachmentPath = path.join(attachmentUploadDir, results[0].filename);
                        if (fs.existsSync(attachmentPath)) {
                            fs.unlinkSync(attachmentPath);
                        }
                    }
                    // Delete from database
                    db.query('DELETE FROM post_attachments WHERE id = ? AND post_id = ?', [attachmentId, id]);
                });
            });
        }
        
        // Insert new attachments
        if (attachmentFiles.length > 0) {
            const attachmentQuery = 'INSERT INTO post_attachments (post_id, filename, original_name, file_size) VALUES (?, ?, ?, ?)';
            attachmentFiles.forEach(file => {
                db.query(attachmentQuery, [id, file.filename, file.originalname, file.size], (err) => {
                    if (err) {
                        console.error('Error inserting attachment:', err);
                        if (fs.existsSync(file.path)) {
                            fs.unlinkSync(file.path);
                        }
                    }
                });
            });
        }
        
        // Update post
        const updateQuery = 'UPDATE posts SET title = ?, body = ?, image = ? WHERE id = ?';
        db.query(updateQuery, [title, body, imageFileName, id], (err) => {
            if (err) {
                if (imageFile) fs.unlinkSync(imageFile.path);
                attachmentFiles.forEach(file => {
                    if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
                });
                return res.status(500).json({ error: err.message });
            }
            res.json({ id, title, body, image: imageFileName, attachmentCount: attachmentFiles.length });
        });
    });
});

// delete post
app.delete('/api/posts/:id', (req, res) => {
    const { id } = req.params;
    
    // First, get the post and attachments
    const getQuery = 'SELECT image FROM posts WHERE id = ?';
    db.query(getQuery, [id], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        
        if (results.length === 0) {
            return res.status(404).json({ error: 'Post not found' });
        }
        
        // Delete the image file if it exists
        if (results[0].image) {
            const imagePath = path.join(imageUploadDir, results[0].image);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }
        
        // Get and delete all attachment files
        const attachmentQuery = 'SELECT filename FROM post_attachments WHERE post_id = ?';
        db.query(attachmentQuery, [id], (err, attachmentResults) => {
            if (!err && attachmentResults.length > 0) {
                attachmentResults.forEach(attachment => {
                    const attachmentPath = path.join(attachmentUploadDir, attachment.filename);
                    if (fs.existsSync(attachmentPath)) {
                        fs.unlinkSync(attachmentPath);
                    }
                });
            }
            
            // Delete the post from database (which will cascade delete attachments via foreign key)
            const deleteQuery = 'DELETE FROM posts WHERE id = ?';
            db.query(deleteQuery, [id], (err) => {
                if (err) {
                    return res.status(500).json({ error: err.message });
                }
                res.json({ message: 'Post deleted successfully' });
            });
        });
    });
});

// Error handling middleware for multer
app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'FILE_TOO_LARGE') {
            return res.status(400).json({ error: 'File too large. Maximum size is 5MB' });
        }
        return res.status(400).json({ error: err.message });
    } else if (err) {
        return res.status(400).json({ error: err.message });
    }
    next();
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});