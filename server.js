const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const multer = require('multer');
const path = require('path');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));


// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname))
    }
});
const upload = multer({ storage: storage });

// Database connection
const db = new sqlite3.Database('./nab_network.db', (err) => {
    if (err) {
        console.error('Error connecting to database:', err);
    } else {
        console.log('Connected to SQLite database');
    }
});

// API Routes

// Create new employee profile
app.post('/api/employees', upload.fields([
    { name: 'profilePicture', maxCount: 1 },
    { name: 'certifications', maxCount: 5 }
]), async (req, res) => {
    const {
        fullName,
        position,
        socialMediaLinks,
        qualifications,
        email,
        dateOfJoining,
        skills
    } = req.body;

    let parsedSkills = [];

try {
    parsedSkills = typeof skills === 'string' ? JSON.parse(skills) : skills;
    if (!Array.isArray(parsedSkills)) parsedSkills = [];
} catch (e) {
    console.error('Failed to parse skills:', e);
    parsedSkills = [];
}

    try {
        db.serialize(() => {
            // Insert employee
            db.run(`INSERT INTO Employees (
                ProfilePicture, FullName, PositionInCompany, 
                SocialMediaLink1, SocialMediaLink2, SocialMediaLink3,
                Qualifications, Email, DateOfJoining
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                req.files.profilePicture ? req.files.profilePicture[0].filename : null,
                fullName,
                position,
                socialMediaLinks.linkedin || null,
                socialMediaLinks.instagram || null,
                socialMediaLinks.facebook || null,
                qualifications,
                email,
                dateOfJoining
            ], function(err) {
                if (err) {
                    return res.status(500).json({ error: err.message });
                }
                const employeeId = this.lastID;
            
                console.log('Received skills:', skills);
                // Insert skills
                const skillStmt = db.prepare('INSERT INTO EmployeeSkills (EmployeeID, SkillID, SkillLevel) VALUES (?, ?, ?)');
                parsedSkills.forEach(skill => {
                    // First, ensure skill exists
                    db.get('SELECT SkillID FROM Skills WHERE SkillName = ?', [skill.name], (err, row) => {
                        if (err) return;
                        if (!row) {
                            db.run('INSERT INTO Skills (SkillName) VALUES (?)', [skill.name], function(err) {
                                if (err) return;
                                skillStmt.run(employeeId, this.lastID, skill.level);
                            });
                        } else {
                            skillStmt.run(employeeId, row.SkillID, skill.level);
                        }
                    });
                });
                skillStmt.finalize();

                // Insert certifications
                if (req.files.certifications) {
                    const certStmt = db.prepare('INSERT INTO Certifications (EmployeeID, CertificationName, CertificationFile) VALUES (?, ?, ?)');
                    req.files.certifications.forEach(cert => {
                        certStmt.run(employeeId, cert.originalname, cert.filename);
                    });
                    certStmt.finalize();
                }

                res.json({ employeeId });
            });
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all employees
app.get('/api/employees', (req, res) => {
    db.all(`
        SELECT e.*, 
        GROUP_CONCAT(s.SkillName || ':' || es.SkillLevel) as skills,
        GROUP_CONCAT(c.CertificationName) as certifications
        FROM Employees e
        LEFT JOIN EmployeeSkills es ON e.EmployeeID = es.EmployeeID
        LEFT JOIN Skills s ON es.SkillID = s.SkillID
        LEFT JOIN Certifications c ON e.EmployeeID = c.EmployeeID
        GROUP BY e.EmployeeID
    `, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// Get employee by ID
app.get('/api/employees/:id', (req, res) => {
    db.get(`
        SELECT e.*, 
        GROUP_CONCAT(s.SkillName || ':' || es.SkillLevel) as skills,
        GROUP_CONCAT(c.CertificationName) as certifications
        FROM Employees e
        LEFT JOIN EmployeeSkills es ON e.EmployeeID = es.EmployeeID
        LEFT JOIN Skills s ON es.SkillID = s.SkillID
        LEFT JOIN Certifications c ON e.EmployeeID = c.EmployeeID
        WHERE e.EmployeeID = ?
        GROUP BY e.EmployeeID
    `, [req.params.id], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(row);
    });
});

// Update employee profile
app.put('/api/employees/:id', upload.fields([
    { name: 'profilePicture', maxCount: 1 },
    { name: 'certifications', maxCount: 5 }
]), (req, res) => {
    const {
        fullName,
        position,
        socialMediaLinks,
        qualifications,
        email,
        dateOfJoining,
        skills
    } = req.body;

    try {
        db.serialize(() => {
            // Update employee
            db.run(`UPDATE Employees SET
                ProfilePicture = COALESCE(?, ProfilePicture),
                FullName = ?,
                PositionInCompany = ?,
                SocialMediaLink1 = ?,
                SocialMediaLink2 = ?,
                SocialMediaLink3 = ?,
                Qualifications = ?,
                Email = ?,
                DateOfJoining = ?
                WHERE EmployeeID = ?`,
            [
                req.files.profilePicture ? req.files.profilePicture[0].filename : null,
                fullName,
                position,
                socialMediaLinks.linkedin || null,
                socialMediaLinks.instagram || null,
                socialMediaLinks.facebook || null,
                qualifications,
                email,
                dateOfJoining,
                req.params.id
            ], function(err) {
                if (err) {
                    return res.status(500).json({ error: err.message });
                }

                // Update skills
                db.run('DELETE FROM EmployeeSkills WHERE EmployeeID = ?', [req.params.id]);
                const skillStmt = db.prepare('INSERT INTO EmployeeSkills (EmployeeID, SkillID, SkillLevel) VALUES (?, ?, ?)');
                skills.forEach(skill => {
                    db.get('SELECT SkillID FROM Skills WHERE SkillName = ?', [skill.name], (err, row) => {
                        if (err) return;
                        if (!row) {
                            db.run('INSERT INTO Skills (SkillName) VALUES (?)', [skill.name], function(err) {
                                if (err) return;
                                skillStmt.run(req.params.id, this.lastID, skill.level);
                            });
                        } else {
                            skillStmt.run(req.params.id, row.SkillID, skill.level);
                        }
                    });
                });
                skillStmt.finalize();

                // Update certifications
                if (req.files.certifications) {
                    db.run('DELETE FROM Certifications WHERE EmployeeID = ?', [req.params.id]);
                    const certStmt = db.prepare('INSERT INTO Certifications (EmployeeID, CertificationName, CertificationFile) VALUES (?, ?, ?)');
                    req.files.certifications.forEach(cert => {
                        certStmt.run(req.params.id, cert.originalname, cert.filename);
                    });
                    certStmt.finalize();
                }

                res.json({ success: true });
            });
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 