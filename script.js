document.addEventListener('DOMContentLoaded', function() {
    const skillsList = document.getElementById('skills-list');
    const skillInput = document.getElementById('skill-input');
    let skills = [];

    // Handle skills input
    skillInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            const skill = this.value.trim();
            if (skill && !skills.some(s => s.name === skill)) {
                showSkillLevelPopup(skill, (selectedLevel) => {
                    if (selectedLevel) {
                        skills.push({
                            name: skill,
                            level: selectedLevel
                        });
                        updateSkillsList();
                        skillInput.value = '';
                    }
                });
            }
        }
    });

    function updateSkillsList() {
        skillsList.innerHTML = skills.map(skill => `
            <li>
                ${skill.name} (${skill.level})
                <button onclick="removeSkill('${skill.name}')" class="remove-skill">&times;</button>
            </li>
        `).join('');
    }

    window.removeSkill = function(skillName) {
        skills = skills.filter(s => s.name !== skillName);
        updateSkillsList();
    };

    // Popup for skill level selection
    function showSkillLevelPopup(skill, callback) {
        // Remove any existing popup
        const oldPopup = document.getElementById('skill-level-popup');
        if (oldPopup) oldPopup.remove();
        
        const popup = document.createElement('div');
        popup.id = 'skill-level-popup';
        popup.style.position = 'fixed';
        popup.style.left = '0';
        popup.style.top = '0';
        popup.style.width = '100vw';
        popup.style.height = '100vh';
        popup.style.background = 'rgba(0,0,0,0.5)';
        popup.style.display = 'flex';
        popup.style.alignItems = 'center';
        popup.style.justifyContent = 'center';
        popup.style.zIndex = '9999';

        popup.innerHTML = `
            <div style="background: #222; color: #fff; padding: 32px 24px; border-radius: 12px; min-width: 260px; text-align: center;">
                <h3 style="margin-bottom: 18px;">Choose skill level for <br><span style='color:#ed0100'>${skill}</span></h3>
                <button class="popup-skill-btn" data-level="Beginner">Beginner</button>
                <button class="popup-skill-btn" data-level="Intermediate">Intermediate</button>
                <button class="popup-skill-btn" data-level="Expert">Expert</button>
                <button class="popup-skill-btn" data-level="Master">Master</button>
                <br><br>
                <button id="cancel-skill-popup" style="margin-top:10px; background:#444; color:#fff; border:none; padding:6px 18px; border-radius:6px; cursor:pointer;">Cancel</button>
            </div>
        `;
        document.body.appendChild(popup);
        
        popup.querySelectorAll('.popup-skill-btn').forEach(btn => {
            btn.onclick = function() {
                document.body.removeChild(popup);
                callback(this.dataset.level);
            };
        });
        document.getElementById('cancel-skill-popup').onclick = function() {
            document.body.removeChild(popup);
            callback(null);
        };
    }
});
