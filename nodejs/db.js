import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbDir = path.join(__dirname, 'data');
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'pgd.db');
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

// Create tables
const queries = [
    `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        username TEXT UNIQUE,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'admin',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS news (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        category TEXT DEFAULT 'Novice',
        content TEXT NOT NULL,
        image TEXT,
        author_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (author_id) REFERENCES users(id)
    )`,
    `CREATE TABLE IF NOT EXISTS gallery (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        image_path TEXT NOT NULL,
        category TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        event_date DATETIME,
        location TEXT,
        image TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS vehicles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        image TEXT,
        year INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS members (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        rank TEXT,
        role TEXT,
        image TEXT,
        vulkan_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS applications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT,
        message TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS contacts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        subject TEXT,
        message TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`
];

for (const query of queries) {
    db.prepare(query).run();
}

// Migration: check if members table has vulkan_id column, add if missing
try {
    const tableInfo = db.prepare("PRAGMA table_info(members)").all();
    const hasVulkanId = tableInfo.some(col => col.name === 'vulkan_id');
    if (!hasVulkanId) {
        db.prepare("ALTER TABLE members ADD COLUMN vulkan_id TEXT").run();
        console.log("Migration: Added column 'vulkan_id' to table 'members'.");
    }
} catch (err) {
    console.error("Migration error adding vulkan_id to members table:", err.message);
}

// Migration: check if events table has image column, add if missing
try {
    const tableInfo = db.prepare("PRAGMA table_info(events)").all();
    const hasImage = tableInfo.some(col => col.name === 'image');
    if (!hasImage) {
        db.prepare("ALTER TABLE events ADD COLUMN image TEXT").run();
        console.log("Migration: Added column 'image' to table 'events'.");
    }
} catch (err) {
    console.error("Migration error adding image to events table:", err.message);
}

// Add default admins if they don't exist
const admins = [
    { email: 'test@pgd.local', username: 'test', password: 'test', role: 'admin' },
    { email: 'admin@pgd.local', username: 'admin', password: 'changeme123', role: 'admin' }
];

for (const admin of admins) {
    const row = db.prepare('SELECT COUNT(*) as count FROM users WHERE email = ?').get(admin.email);
    if (row.count === 0) {
        const hashedPassword = bcrypt.hashSync(admin.password, 10);
        db.prepare('INSERT INTO users (email, username, password, role) VALUES (?, ?, ?, ?)').run(
            admin.email,
            admin.username,
            hashedPassword,
            admin.role
        );
    }
}

// Seed default vehicles
try {
    const v1 = db.prepare('SELECT COUNT(*) as count FROM vehicles WHERE name = ?').get('GVC-1');
    if (v1.count === 0) {
        db.prepare('INSERT INTO vehicles (name, description, image, year) VALUES (?, ?, ?, ?)').run(
            'GVC-1',
            'Leto proizvodnje: 4/2022\nZnamka in tip: MAN TGM 13.290\nPogon: 4x4\nMoč motorja: 213kW\nKoličina vode: 3000l\nČrpalka: JOHSTDAT TO3001',
            'uploads/vaje.jpg',
            2022
        );
    }
    const v2 = db.prepare('SELECT COUNT(*) as count FROM vehicles WHERE name = ?').get('GVM-1');
    if (v2.count === 0) {
        db.prepare('INSERT INTO vehicles (name, description, image, year) VALUES (?, ?, ?, ?)').run(
            'GVM-1',
            'Leto proizvodnje: 2018\nZnamka in tip: Renault Master\nPogon: 4x2\nMoč motorja: 125kW\nNamembnost: Prevoz moštva na intervencije in tekmovanja\nPosadka: 1+8',
            'uploads/dogodek.jpg',
            2018
        );
    }
} catch (err) {
    console.error("Seeding error for vehicles:", err.message);
}

// Seed gallery items from downloaded images if gallery is empty
try {
    const galleryCount = db.prepare('SELECT COUNT(*) as count FROM gallery').get();
    if (galleryCount.count === 0) {
        const galleryItems = [
            { title: 'Gasilska tekmovanja', image_path: 'uploads/tekmovanje.jpg', category: 'tekmovanje' },
            { title: 'Tekmovanje operative', image_path: 'uploads/tekmovanje1.jpg', category: 'tekmovanje' },
            { title: 'Pokalno tekmovanje', image_path: 'uploads/tekmovanje3.jpg', category: 'tekmovanje' },
            { title: 'Operativna vaja enote', image_path: 'uploads/vaje.jpg', category: 'vaje' },
            { title: 'Vaja z opremo', image_path: 'uploads/vaje1.jpg', category: 'vaje' },
            { title: 'Skupinska vaja', image_path: 'uploads/vaje2.jpg', category: 'vaje' },
            { title: 'Nočna vaja', image_path: 'uploads/vaje3.jpg', category: 'vaje' },
            { title: 'Druženje članov PGD', image_path: 'uploads/druzenje.jpg', category: 'prosti-cas' },
            { title: 'Srečanje in druženje', image_path: 'uploads/druzenje1.jpg', category: 'prosti-cas' },
            { title: 'Prosti čas in družabnost', image_path: 'uploads/prosti_cas.jpg', category: 'prosti-cas' }
        ];

        const stmt = db.prepare('INSERT INTO gallery (title, image_path, category) VALUES (?, ?, ?)');
        for (const item of galleryItems) {
            stmt.run(item.title, item.image_path, item.category);
        }
        console.log("Seeded gallery with downloaded images.");
    }
} catch (err) {
    console.error("Seeding error for gallery:", err.message);
}

// Seed news articles
try {
    const articles = [
        {
            title: 'Po desetletju nova generacija bolničarjev za pomoč ob nesrečah in poškodbah',
            category: 'Organizacija',
            content: 'Majšperk je bogatejši za 19 bolničarjev. Bogatejši, ker je vsak na novo izobraženi občan velik doprinos skupnosti, je poudaril poveljnik CZ Majšperk Zlatko Letonja. Tečaj prve pomoči za bolničarje Civilne zaščite in Rdečega križa je z izpitom uspešno zaključilo 19 kandidatov iz občine Majšperk.',
            image: 'https://cdn.kme.si/public/images-cache/1200x630/2026/05/14/c2a0543edba4ab4277ab43f9048846c7/6a05867eae578/c2a0543edba4ab4277ab43f9048846c7.jpeg'
        },
        {
            title: 'PGD Majšperk Breg: »Le en cilj: pomagati ljudem v nesreči, brez meja«',
            category: 'Društvo',
            content: 'Člani PGD Majšperk Breg zase pravijo, da so morda majhni, a imajo veliko srce. Gre za gasilsko društvo, ki je bilo prvotno ustanovljeno za potrebe industrijske cone, a v več kot 75 letih obstoja je prerastlo te okvire. Danes sestavljajo društvo, ki se pohvali z naslovi prvakov, obnovljenim gasilskim domom ter sodobnim voznim parkom.',
            image: 'https://cdn.kme.si/public/images-cache/1200x630/2025/01/21/19e50d4cacb745fefbe1f43334c651b6/678fa011be757/19e50d4cacb745fefbe1f43334c651b6.jpeg'
        },
        {
            title: 'Sredi Majšperka pristal helikopter, to se je dogajalo',
            category: 'Intervencije',
            content: 'V Majšperku je pristal helikopter Slovenske vojske z ekipo nujne medicinske pomoči. Pri oskrbi občana in zavarovanju pristajališča ter helikopterja so posredovali gasilci PGD Majšperk Breg.',
            image: 'https://editorial.netmedia.si/s3fs-public/styles/1280x720/public/slike/novice/2023/6/1/majsperk1.jpg?h=4521fff0'
        },
        {
            title: 'Zagorelo v Makolah, ogenj uničil objekt in kmetijske stroje',
            category: 'Požari',
            content: 'V Makolah je izbruhnil obsežen požar na gospodarskem poslopju. Na lokaciji so posredovali gasilci PGD Majšperk Breg skupaj z drugimi sosednjimi društvi, da so lokalizirali in pogasili požar ter preprečili širjenje.',
            image: 'https://editorial.netmedia.si/s3fs-public/styles/1280x720/public/slike/novice/2023/2/21/befunky-collage-16.jpg?h=fef4f2b5'
        }
    ];

    const stmt = db.prepare('INSERT INTO news (title, category, content, image) VALUES (?, ?, ?, ?)');
    for (const art of articles) {
        const existing = db.prepare('SELECT id FROM news WHERE title = ?').get(art.title);
        if (!existing) {
            stmt.run(art.title, art.category, art.content, art.image);
            console.log(`Seeded news article: "${art.title}"`);
        }
    }
} catch (err) {
    console.error("Seeding error for news:", err.message);
}

// Seed events if empty
try {
    const eventsCount = db.prepare('SELECT COUNT(*) as count FROM events').get();
    if (eventsCount.count === 0) {
        db.prepare('INSERT INTO events (title, description, event_date, location, image) VALUES (?, ?, ?, ?, ?)').run(
            'Tradicionalni gasilski dogodek',
            'Prikaz gasilske opreme, vaje ter družabno srečanje s krajani Majšperk-Breg.',
            '2026-06-20 15:00:00',
            'Gasilski dom Majšperk-Breg',
            'uploads/dogodek.jpg'
        );
        console.log("Seeded events table.");
    } else {
        db.prepare("UPDATE events SET image = 'uploads/dogodek.jpg' WHERE image IS NULL OR image = ''").run();
    }
} catch (err) {
    console.error("Seeding error for events:", err.message);
}

export default db;
