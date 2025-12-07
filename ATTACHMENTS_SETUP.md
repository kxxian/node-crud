# Multiple Attachments Setup Guide

## Database Migration

Run the following SQL command in your MySQL database to create the attachments table:

```sql
CREATE TABLE post_attachments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    post_id INT NOT NULL,
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_size INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
);
```

## File Structure

After implementation, the file structure will be:

```
node-backend/
├── uploads/
│   ├── images/       (existing - for post images)
│   └── attachments/  (new - for multiple file attachments)
```

## API Changes

### POST /api/posts
Now accepts:
- `image` (required, single file) - Featured image
- `attachments` (optional, multiple files) - Up to 10 files per upload
- Maximum file size: 5MB for images, 10MB for attachments
- File types: Any type allowed for attachments

### Response includes:
```json
{
  "id": 1,
  "title": "Post Title",
  "body": "Post Body",
  "image": "timestamp-imagename.jpg",
  "attachmentCount": 2
}
```

## Attachment Retrieval

Get attachment file list with:
```
GET /api/posts/:id/attachments
```

Download attachment:
```
http://localhost:8000/attachments/filename
```

## Features

- ✅ Multiple file uploads (up to 10 per post)
- ✅ Automatic file deletion when post is deleted
- ✅ File size and name validation
- ✅ Unique filename generation to prevent conflicts
- ✅ Database tracking of file metadata
