// Define the 4 custom core sections with singular names for labels
const sections = [
    { id: 'homework', name: 'Homework', singular: 'HW' },
    { id: 'assignments', name: 'Assignments', singular: 'Assignment' },
    { id: 'quizzes', name: 'Quizzes', singular: 'Quiz' },
    { id: 'midterms', name: 'Midterms', singular: 'Midterm' }
];

// Track how many rows each section has
const sectionCounts = { homework: 0, assignments: 0, quizzes: 0, midterms: 0 };

// 1. Build the UI dynamically when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('sections-container');
    
    sections.forEach(sec => {
        const div = document.createElement('div');
        div.className = 'grade-section';
        div.id = `section-${sec.id}`;
        div.innerHTML = `
            <h3>${sec.name}</h3>
            <div class="section-controls">
                <button type="button" class="btn-add" onclick="addRow('${sec.id}')">+ Add ${sec.singular}</button>
                <label>
                    <input type="checkbox" id="check-${sec.id}" onchange="toggleWeightMode('${sec.id}')"> Individual Weights
                </label>
                <div class="input-unit" id="total-weight-wrapper-${sec.id}">
                    <input type="number" id="total-weight-${sec.id}" placeholder="Total Weight" min="0" max="100" oninput="calculateGrade(false)">
                    <span>% of grade</span>
                </div>
            </div>
            <div id="rows-${sec.id}"></div>
        `;
        container.appendChild(div);
        
        // Start each category with 1 default entry row
        addRow(sec.id);
    });
});

// 2. Add an assignment row to a category with a delete action
function addRow(sectionId) {
    const rowsContainer = document.getElementById(`rows-${sectionId}`);
    const isIndividual = document.getElementById(`check-${sectionId}`).checked;
    const secConfig = sections.find(s => s.id === sectionId);

    const uniqueId = Date.now() + Math.random().toString(36).substr(2, 5);

    const row = document.createElement('div');
    row.className = `section-row ${isIndividual ? '' : 'shared-weight'}`;
    row.id = `row-${sectionId}-${uniqueId}`;
    
    row.innerHTML = `
        <span class="row-label">${secConfig.singular}</span>
        <div class="row-inputs-group">
            <div class="input-unit">
                <input type="number" class="${sectionId}-score" placeholder="Score" min="0" oninput="calculateGrade(false)">
                <span>%</span>
            </div>
            <div class="input-unit ${isIndividual ? '' : 'hidden'}" id="weight-input-wrapper-${sectionId}-${uniqueId}">
                <input type="number" class="${sectionId}-weight" placeholder="Weight" min="0" oninput="calculateGrade(false)">
                <span>%</span>
            </div>
            <button type="button" class="btn-delete" onclick="removeRow('${sectionId}', '${uniqueId}')">Delete</button>
        </div>
    `;
    rowsContainer.appendChild(row);

    updateRowNumbers(sectionId);
}

// Helper to remove a specific row entry and trigger re-numbering
function removeRow(sectionId, uniqueId) {
    const rowToRemove = document.getElementById(`row-${sectionId}-${uniqueId}`);
    if (rowToRemove) {
        rowToRemove.remove();
        updateRowNumbers(sectionId);
        calculateGrade(false); // Live update calculations on delete silently
    }
}

// Loops through existing rows and cleanly fixes numbering order (e.g. 1, 2, 3)
function updateRowNumbers(sectionId) {
    const rowsContainer = document.getElementById(`rows-${sectionId}`);
    const rows = rowsContainer.children;
    const secConfig = sections.find(s => s.id === sectionId);

    for (let i = 0; i < rows.length; i++) {
        const labelSpan = rows[i].querySelector('.row-label');
        if (labelSpan) {
            labelSpan.innerText = `${secConfig.singular} #${i + 1}`;
        }
    }
}

// 3. Handle toggling between Individual weights vs Single Group weight
function toggleWeightMode(sectionId) {
    const isIndividual = document.getElementById(`check-${sectionId}`).checked;
    
    document.getElementById(`total-weight-wrapper-${sectionId}`).classList.toggle('hidden', isIndividual);
    
    const rows = document.getElementById(`rows-${sectionId}`).children;
    for (let i = 0; i < rows.length; i++) {
        const uniqueId = rows[i].id.replace(`row-${sectionId}-`, '');
        const weightWrapper = document.getElementById(`weight-input-wrapper-${sectionId}-${uniqueId}`);
        
        if (isIndividual) {
            rows[i].classList.remove('shared-weight');
            if (weightWrapper) weightWrapper.classList.remove('hidden');
        } else {
            rows[i].classList.add('shared-weight');
            if (weightWrapper) weightWrapper.classList.add('hidden');
        }
    }
    calculateGrade(false);
}

// 4. Heavy Math Calculations
// Pass 'true' when clicking the main button to trigger strict validation alerts.
function calculateGrade(isExplicitClick = true) {
    const targetGrade = parseFloat(document.getElementById('target-grade').value);
    const finalWeight = parseFloat(document.getElementById('final-weight').value);
    const extraCredit = parseFloat(document.getElementById('extra-credit').value) || 0;

    const resultDiv = document.getElementById('result');
    const requiredScoreSpan = document.getElementById('required-score');
    const currentGradeSpan = document.getElementById('current-grade-score');
    const messageP = document.getElementById('result-message');

    if (isNaN(targetGrade) || isNaN(finalWeight)) {
        if (isExplicitClick) alert("Please fill out your Target Grade and Final Exam Weight.");
        return;
    }

    let totalWeightCalculated = finalWeight;
    let currentEarnedPoints = 0;

    // Process each category block
    for (const sec of sections) {
        const isIndividual = document.getElementById(`check-${sec.id}`).checked;
        const scoreElements = document.querySelectorAll(`.${sec.id}-score`);
        
        let validScores = [];
        let individualWeights = [];
        let totalIndividualWeight = 0;

        // Gather filled elements
        scoreElements.forEach((el, index) => {
            const scoreVal = parseFloat(el.value);
            if (!isNaN(scoreVal)) {
                validScores.push(scoreVal);
                
                if (isIndividual) {
                    const weightElements = document.querySelectorAll(`.${sec.id}-weight`);
                    const weightVal = parseFloat(weightElements[index].value) || 0;
                    individualWeights.push(weightVal);
                    totalIndividualWeight += weightVal;
                }
            }
        });

        if (validScores.length === 0) continue; 

        if (isIndividual) {
            totalWeightCalculated += totalIndividualWeight;
            for (let i = 0; i < validScores.length; i++) {
                currentEarnedPoints += (validScores[i] * (individualWeights[i] / 100));
            }
        } else {
            const groupWeight = parseFloat(document.getElementById(`total-weight-${sec.id}`).value);
            if (isNaN(groupWeight)) {
                if (isExplicitClick) alert(`Please enter a group category weight for ${sec.name}, or choose Individual Weights.`);
                return;
            }
            totalWeightCalculated += groupWeight;
            
            const avgScore = validScores.reduce((a, b) => a + b, 0) / validScores.length;
            currentEarnedPoints += (avgScore * (groupWeight / 100));
        }
    }

    // Strict 100% boundary validations (Only blocks execution if user manually clicks Calculate)
    if (totalWeightCalculated > 100) {
        if (isExplicitClick) alert(`Error: Your setup totals ${totalWeightCalculated}%. This exceeds a normal 100% class composition.`);
        return;
    }
    if (totalWeightCalculated < 100) {
        if (isExplicitClick) alert(`Error: Total weights sum up to only ${totalWeightCalculated}%. They must equal exactly 100% to evaluate correctly.`);
        return;
    }

    // Run final algebra equation
    const pointsNeeded = targetGrade - currentEarnedPoints - extraCredit;
    const requiredFinal = (pointsNeeded / (finalWeight / 100)).toFixed(2);

    // Calculate current class grade
    const weightWithoutFinal = totalWeightCalculated - finalWeight;
    let currentClassGrade = 0;
    if (weightWithoutFinal > 0) {
        currentClassGrade = ((currentEarnedPoints + extraCredit) / (weightWithoutFinal / 100)).toFixed(2);
    }

    // Render outputs
    currentGradeSpan.innerText = currentClassGrade;
    requiredScoreSpan.innerText = requiredFinal;
    resultDiv.classList.remove('hidden');

    if (requiredFinal > 100) {
        messageP.innerText = "You'll need extra credit or a curve to reach this target.";
        messageP.style.color = "var(--danger)";
    } else if (requiredFinal <= 0) {
        requiredScoreSpan.innerText = "0";
        messageP.innerText = "Fantastic! You have mathematically clinched your target score already.";
        messageP.style.color = "var(--success)";
    } else if (requiredFinal <= 50){
        messageP.innerText = "You're in a great spot!";
        messageP.style.color = "var(--text)";
    } else if (requiredFinal <= 75){
        messageP.innerText = "Perfectly doable. Good Luck!";
        messageP.style.color = "var(--text)";
    } else if (requiredFinal <= 90){
        messageP.innerText = "You got this! Study Hard!!";
        messageP.style.color = "var(--text)";
    } else {
        messageP.innerText = "It's going to be tough. Lock in!";
        messageP.style.color = "var(--text)";
    }
}