# Database Migration

Run this SQL query in your MySQL database to add the image column to the posts table:

```sql
ALTER TABLE posts ADD COLUMN image VARCHAR(255) NULL DEFAULT NULL;
```

Or if you prefer to create the posts table from scratch:

```sql
CREATE TABLE posts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    body LONGTEXT NOT NULL,
    image VARCHAR(255) NULL DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

After running the migration, restart your backend server.
