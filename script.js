// script.js

// IMPORTANT: For production applications, NEVER expose your API_KEY (or PAT) directly in client-side code.
// Use a backend server or a serverless function to handle API requests to Airtable securely.
const AIRTABLE_API_KEY = 'patw6VVGEq3Uq8h9E.91e9582b450cc5ee58f50bf1793eb917968404239b314c74cd20df28462636cf'; // Your Personal Access Token (PAT)
const AIRTABLE_BASE_ID = 'appwgI8yyj7oLI4Ui'; // Your Base ID
const AIRTABLE_TABLE_NAME = 'Profiles'; // Assuming your table is named 'Profiles' - adjust if different

const AIRTABLE_API_URL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME}`;

document.addEventListener('DOMContentLoaded', function() {
    const requiredFields = ['name', 'email', 'dateOfJoining', 'position', 'qualifications'];
    const skillsList = document.getElementById('skills-list');
    const skillInput = document.getElementById('skill-input');
    const certificationsList = document.getElementById('certification-list');
    let skills = [];
    let certifications = [];

    // Handle skills input
    skillInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            const skill = this.value.trim();
            if (skill && !skills.some(s => s.name === skill)) { // Check if skill name already exists
                const skillLevel = prompt(`Please enter your skill level for ${skill} (1-5 out of 5):`);
                const level = parseInt(skillLevel);

                if (isNaN(level) || level < 1 || level > 5) {
                    alert('Please enter a valid skill level between 1 and 5. Try again.');
                    return;
                }

                skills.push({
                    name: skill,
                    level: level
                });
                updateSkillsList();
                this.value = '';
            }
        }
    });

    function updateSkillsList() {
        skillsList.innerHTML = skills.map(skill => `
            <li>
                ${skill.name} (Level ${skill.level}/5)
                <button onclick="removeSkill('${skill.name}')" class="remove-skill">&times;</button>
            </li>
        `).join('');
    }

    window.removeSkill = function(skillName) {
        skills = skills.filter(s => s.name !== skillName);
        updateSkillsList();
    };

    // Handle profile picture upload
    window.handleProfilePictureUpload = function(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                document.getElementById('profile-preview').src = e.target.result;
                // No direct saving to localStorage here for profilePictureBase64
                // We will handle the file object directly on form submission for upload.
            };
            reader.readAsDataURL(file);
        }
    };

    // Handle certification upload
    window.handleCertificationUpload = function(event) {
        const files = event.target.files;
        for (let file of files) {
            if (!certifications.some(c => c.name === file.name)) {
                certifications.push({ name: file.name, file: file }); // Store the file object
            }
        }
        updateCertificationsList();
    };

    function updateCertificationsList() {
        certificationsList.innerHTML = certifications.map(cert => `
            <div class="certification-item">
                ${cert.name}
                <button onclick="removeCertification('${cert.name}')" class="remove-cert">&times;</button>
            </div>
        `).join('');
    }

    window.removeCertification = function(certName) {
        certifications = certifications.filter(c => c.name !== certName);
        updateCertificationsList();
    };

    // This function is a placeholder for actual file uploading to a public host
    // (e.g., Cloudinary, S3, etc.). Airtable's attachment field needs a public URL.
    // Directly uploading a File object from the browser to Airtable via the API
    // is not straightforward without a backend.
    async function uploadFileAndGetUrl(file) {
        // In a real application, you'd send 'file' to your server or a cloud storage service.
        // For demonstration, we're returning a placeholder URL.
        console.log(`Simulating upload of file: ${file.name}`);
        // Example of what a real upload might look like (requires a backend endpoint):
        /*
        const formData = new FormData();
        formData.append('file', file);
        const response = await fetch('/your-upload-endpoint', {
            method: 'POST',
            body: formData
        });
        const data = await response.json();
        return data.url; // Assuming your backend returns a public URL
        */
        return `https://example.com/uploads/${file.name.replace(/\s/g, '_')}_${Date.now()}`; // Placeholder URL
    }


    // Handle profile completion and Airtable submission
    window.saveProfile = async function() {
        // Validate required fields
        let isValid = true;
        requiredFields.forEach(field => {
            const element = document.getElementById(field);
            const validation = document.getElementById(`${field}-validation`);
            if (!element.value.trim()) {
                validation.textContent = 'This field is required';
                isValid = false;
            } else {
                validation.textContent = '';
            }
        });

        // Validate email domain
        const emailInput = document.getElementById('email');
        const emailValidation = document.getElementById('email-validation');
        const emailValue = emailInput.value.trim();
        const emailRegex = /^[a-zA-Z0-9._%+-]+@nab\.com\.au$/;
        
        if (!emailValue) {
            emailValidation.textContent = 'Email is required';
            isValid = false;
        } else if (!emailRegex.test(emailValue)) {
            emailValidation.textContent = 'Please use a valid NAB email address (@nab.com.au)';
            isValid = false;
        } else {
            emailValidation.textContent = '';
        }

        // Validate profile picture
        const profilePictureInput = document.getElementById('profile-picture');
        const profilePictureValidation = document.getElementById('profile-picture-validation');
        if (!profilePictureInput.files || profilePictureInput.files.length === 0) {
            profilePictureValidation.textContent = 'Profile picture is required';
            isValid = false;
        } else {
            profilePictureValidation.textContent = '';
        }

        // Validate skills
        const skillsValidation = document.getElementById('skills-validation');
        if (skills.length === 0) {
            skillsValidation.textContent = 'At least one skill is required';
            isValid = false;
        } else {
            skillsValidation.textContent = '';
        }

        // Validate certifications
        const certificationsValidation = document.getElementById('certifications-validation');
        if (certifications.length === 0) {
            certificationsValidation.textContent = 'At least one certification is required';
            isValid = false;
        } else {
            certificationsValidation.textContent = '';
        }

        // Validate social media (at least one is required)
        const linkedin = document.getElementById('linkedin').value.trim();
        const instagram = document.getElementById('instagram').value.trim();
        const facebook = document.getElementById('facebook').value.trim();
        const socialMediaValidation = document.getElementById('social-media-validation');

        if (!linkedin && !instagram && !facebook) {
            socialMediaValidation.textContent = 'At least one social media link is required.';
            isValid = false;
        } else {
            socialMediaValidation.textContent = '';
        }

        if (isValid) {
            // Prepare data for Airtable
            const profileData = {
                "Full Name": document.getElementById('name').value,
                "Email ID": emailInput.value,
                "Date of Joining": document.getElementById('dateOfJoining').value,
                "Position in Company/Team": document.getElementById('position').value,
                "Team Name": document.getElementById('team').value,
                "Qualifications": document.getElementById('qualifications').value,
                // Skills will be formatted as a comma-separated string
                "Skills": skills.map(s => `${s.name} (Level ${s.level}/5)`).join(', '),
                "LinkedIn": linkedin,
                "Instagram": instagram,
                "Facebook": facebook,
            };

            // Handle Profile Picture Upload
            // You need a service to upload the actual file and get a public URL.
            // For now, this is a placeholder.
            if (profilePictureInput.files.length > 0) {
                const profilePicFile = profilePictureInput.files[0];
                try {
                    const profilePicUrl = await uploadFileAndGetUrl(profilePicFile);
                    profileData["Profile Picture"] = [{ url: profilePicUrl, filename: profilePicFile.name }];
                } catch (error) {
                    console.error("Error uploading profile picture:", error);
                    alert("Failed to upload profile picture. Please try again.");
                    return;
                }
            }

            // Handle Certifications Upload
            // Similar to profile picture, you'd upload these files and get their public URLs.
            if (certifications.length > 0) {
                const certificationUrls = [];
                for (const cert of certifications) {
                    try {
                        const certUrl = await uploadFileAndGetUrl(cert.file);
                        certificationUrls.push({ url: certUrl, filename: cert.name });
                    } catch (error) {
                        console.error(`Error uploading certification ${cert.name}:`, error);
                        alert(`Failed to upload certification ${cert.name}. Please try again.`);
                        return;
                    }
                }
                profileData["Certifications"] = certificationUrls;
            }

            try {
                const response = await fetch(AIRTABLE_API_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        // Using 'Bearer' token for Personal Access Tokens (PAT)
                        'Authorization': `Bearer ${AIRTABLE_API_KEY}`
                    },
                    body: JSON.stringify({
                        records: [
                            {
                                fields: profileData
                            }
                        ]
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    console.log('Profile saved to Airtable:', data);
                    alert('Profile created successfully and saved to Airtable!');
                    // Optionally, clear the form or redirect
                    window.location.href = 'colleague-profiles.html';
                } else {
                    const errorData = await response.json();
                    console.error('Error saving profile to Airtable:', errorData);
                    alert(`Failed to create profile. Error: ${errorData.error.message || response.statusText}`);
                }
            } catch (error) {
                console.error('Network error or problem sending data to Airtable:', error);
                alert('Failed to create profile. Please check your internet connection and try again.');
            }
        }
    };
}); 