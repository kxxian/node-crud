# Image Upload Setup - Complete Guide

## ✅ Changes Made

### Backend (Node.js)
1. **Installed multer** for handling file uploads
2. **Created uploads/images directory** automatically on server start
3. **Configured multer storage** with:
   - Automatic filename generation (timestamp-based)
   - 5MB file size limit
   - File type validation (JPEG, PNG, GIF, WebP only)
4. **Updated POST /api/posts endpoint** to handle image uploads
5. **Updated DELETE /api/posts/:id endpoint** to delete associated image files
6. **Added error handling middleware** for upload errors
7. **Configured static file serving** to access uploaded images

### Frontend (React)
1. **Added image field to PostCreate form** with:
   - File input with image type validation
   - Client-side file size and type validation
   - Image preview display
   - Remove image functionality
2. **Updated PostIndex table** to display image thumbnails
3. **Added CSS styling** for image cells and thumbnails

## 📋 Database Migration

Run this SQL command in your MySQL database:

```sql
ALTER TABLE posts ADD COLUMN image VARCHAR(255) NULL DEFAULT NULL;
```

## 🚀 Next Steps

1. **Install multer** in your backend:
```bash
cd node-backend
npm install multer
```

2. **Run the database migration** in MySQL

3. **Restart your backend server**:
```bash
npm server.js
```

## 📁 Folder Structure

```
node-backend/
├── uploads/
│   └── images/
│       ├── 1701234567890-image1.jpg
│       ├── 1701234568000-image2.png
│       └── ...
├── server.js
└── package.json
```

## 🔗 Image Access

Images are accessible at:
```
http://localhost:8000/images/{filename}
```

Example:
```
http://localhost:8000/images/1701234567890-image1.jpg
```

## ✨ Features

✅ Image upload during post creation
✅ Image preview before upload
✅ Automatic image cleanup when post is deleted
✅ File size validation (max 5MB)
✅ File type validation (JPEG, PNG, GIF, WebP)
✅ Thumbnail display in post list
✅ Responsive image sizing

## 🐛 Troubleshooting

**Images not showing?**
- Check that uploads/images directory exists
- Verify backend is serving static files
- Check browser console for image URL errors

**Upload failing?**
- Check file size (max 5MB)
- Verify file format is supported
- Check backend logs for error messages

**Permission issues?**
- Ensure node-backend directory has write permissions
- Check that uploads folder is created with correct permissions

