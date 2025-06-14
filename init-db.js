const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

// Create database and tables
const db = new sqlite3.Database('./nab_network.db', (err) => {
    if (err) {
        console.error('Error creating database:', err);
        process.exit(1);
    }
    console.log('Connected to SQLite database');
});

db.serialize(() => {
    // Create Employees table
    db.run(`CREATE TABLE IF NOT EXISTS Employees (
        EmployeeID INTEGER PRIMARY KEY AUTOINCREMENT,
        ProfilePicture TEXT,
        FullName TEXT NOT NULL,
        PositionInCompany TEXT NOT NULL,
        SocialMediaLink1 TEXT,
        SocialMediaLink2 TEXT,
        SocialMediaLink3 TEXT,
        Qualifications TEXT NOT NULL,
        Email TEXT NOT NULL UNIQUE,
        DateOfJoining TEXT NOT NULL
    )`);

    // Create Skills table
    db.run(`CREATE TABLE IF NOT EXISTS Skills (
        SkillID INTEGER PRIMARY KEY AUTOINCREMENT,
        SkillName TEXT NOT NULL UNIQUE
    )`);

    // Create EmployeeSkills table
    db.run(`CREATE TABLE IF NOT EXISTS EmployeeSkills (
        EmployeeID INTEGER,
        SkillID INTEGER,
        SkillLevel INTEGER NOT NULL,
        FOREIGN KEY (EmployeeID) REFERENCES Employees(EmployeeID),
        FOREIGN KEY (SkillID) REFERENCES Skills(SkillID),
        PRIMARY KEY (EmployeeID, SkillID)
    )`);

    // Create Certifications table
    db.run(`CREATE TABLE IF NOT EXISTS Certifications (
        CertificationID INTEGER PRIMARY KEY AUTOINCREMENT,
        EmployeeID INTEGER,
        CertificationName TEXT NOT NULL,
        CertificationFile TEXT NOT NULL,
        FOREIGN KEY (EmployeeID) REFERENCES Employees(EmployeeID)
    )`);

    console.log('Database tables created successfully');
});

db.close((err) => {
    if (err) {
        console.error('Error closing database:', err);
    } else {
        console.log('Database connection closed');
    }
}); 