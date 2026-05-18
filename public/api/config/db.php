<?php
require_once __DIR__ . '/config.php';

try {
    $db = new PDO('sqlite:' . DB_PATH);
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $db->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

    // Create tables
    $queries = [
        "CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            username TEXT UNIQUE,
            password TEXT NOT NULL,
            role TEXT DEFAULT 'admin',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )",
        "CREATE TABLE IF NOT EXISTS news (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            category TEXT,
            content TEXT NOT NULL,
            image TEXT,
            author_id INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (author_id) REFERENCES users(id)
        )",
        "CREATE TABLE IF NOT EXISTS gallery (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT,
            image_path TEXT NOT NULL,
            category TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )",
        "CREATE TABLE IF NOT EXISTS events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT,
            event_date DATETIME,
            location TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )",
        "CREATE TABLE IF NOT EXISTS vehicles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            image TEXT,
            year INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )",
        "CREATE TABLE IF NOT EXISTS members (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            rank TEXT,
            role TEXT,
            image TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )",
        "CREATE TABLE IF NOT EXISTS applications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            phone TEXT,
            message TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )",
        "CREATE TABLE IF NOT EXISTS contacts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            subject TEXT,
            message TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )"
    ];

    foreach ($queries as $query) {
        $db->exec($query);
    }

    // Check if role column exists
    try {
        $db->query("SELECT role FROM users LIMIT 1");
    } catch (Exception $e) {
        $db->exec("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'admin'");
    }

    // Check if news category column exists
    try {
        $db->query("SELECT category FROM news LIMIT 1");
    } catch (Exception $e) {
        $db->exec("ALTER TABLE news ADD COLUMN category TEXT DEFAULT 'Novice'");
    }

    // Check if username column exists
    try {
        $db->query("SELECT username FROM users LIMIT 1");
    } catch (Exception $e) {
        $db->exec("ALTER TABLE users ADD COLUMN username TEXT");
    }

    // Insert default admins
    $admins = [
        ['email' => 'test@pgd.local', 'username' => 'test', 'password' => 'test', 'role' => 'admin'],
        ['email' => 'admin@pgd.local', 'username' => 'admin', 'password' => 'changeme123', 'role' => 'admin']
    ];

    foreach ($admins as $admin) {
        $stmt = $db->prepare("SELECT COUNT(*) FROM users WHERE email = ?");
        $stmt->execute([$admin['email']]);
        if ($stmt->fetchColumn() == 0) {
            $hashedPassword = password_hash($admin['password'], PASSWORD_DEFAULT);
            $stmt = $db->prepare("INSERT INTO users (email, username, password, role) VALUES (?, ?, ?, ?)");
            $stmt->execute([$admin['email'], $admin['username'], $hashedPassword, $admin['role']]);
        }
    }

} catch (PDOException $e) {
    die("Database connection failed: " . $e->getMessage());
}
