// Define the 4 custom core sections
const sections = [
    { id: 'homework', name: 'Homework' },
    { id: 'assignments', name: 'Assignments' },
    { id: 'quizzes', name: 'Quizzes' },
    { id: 'midterms', name: 'Midterms' }
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
                <button type="button" class="btn-add" onclick="addRow('${sec.id}')">+ Add ${sec.name}</button>
                <label>
                    <input type="checkbox" id="check-${sec.id}" onchange="toggleWeightMode('${sec.id}')"> Individual Weights
                </label>
                <div class="input-unit" id="total-weight-wrapper-${sec.id}">
                    <input type="number" id="total-weight-${sec.id}" placeholder="Total Class Weight" min="0" max="100">
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

// 2. Add an assignment row to a category
function addRow(sectionId) {
    sectionCounts[sectionId]++;
    const count = sectionCounts[sectionId];
    const rowsContainer = document.getElementById(`rows-${sectionId}`);
    const isIndividual = document.getElementById(`check-${sectionId}`).checked;

    const row = document.createElement('div');
    row.className = `section-row ${isIndividual ? '' : 'shared-weight'}`;
    row.id = `row-${sectionId}-${count}`;
    
    row.innerHTML = `
        <span>Item #${count}</span>
        <div class="input-unit">
            <input type="number" class="${sectionId}-score" placeholder="Score" min="0">
            <span>%</span>
        </div>
        <div class="input-unit ${isIndividual ? '' : 'hidden'}" id="weight-input-wrapper-${sectionId}-${count}">
            <input type="number" class="${sectionId}-weight" placeholder="Weight" min="0">
            <span>%</span>
        </div>
    `;
    rowsContainer.appendChild(row);
}

// 3. Handle toggling between Individual weights vs Single Group weight
function toggleWeightMode(sectionId) {
    const isIndividual = document.getElementById(`check-${sectionId}`).checked;
    
    // Toggle overall section weight input visibility
    document.getElementById(`total-weight-wrapper-${sectionId}`).classList.toggle('hidden', isIndividual);
    
    // Toggle individual weight input visibilities across rows
    const rows = document.getElementById(`rows-${sectionId}`).children;
    for (let i = 0; i < rows.length; i++) {
        const rowId = rows[i].id.split('-').pop();
        const weightWrapper = document.getElementById(`weight-input-wrapper-${sectionId}-${rowId}`);
        
        if (isIndividual) {
            rows[i].classList.remove('shared-weight');
            weightWrapper.classList.remove('hidden');
        } else {
            rows[i].classList.add('shared-weight');
            weightWrapper.classList.add('hidden');
        }
    }
}

// 4. Heavy Math Calculations
function calculateGrade() {
    const targetGrade = parseFloat(document.getElementById('target-grade').value);
    const finalWeight = parseFloat(document.getElementById('final-weight').value);
    const extraCredit = parseFloat(document.getElementById('extra-credit').value) || 0;

    if (isNaN(targetGrade) || isNaN(finalWeight)) {
        alert("Please fill out your Target Grade and Final Exam Weight.");
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
        };);

        if (validScores.length === 0) continue; // Skip category entirely if left blank

        if (isIndividual) {
            // Logic for uniquely weighted assignments
            totalWeightCalculated += totalIndividualWeight;
            for (let i = 0; i < validScores.length; i++) {
                currentEarnedPoints += (validScores[i] * (individualWeights[i] / 100));
            }
        } else {
            // Logic for evenly split assignments under one global weight
            const groupWeight = parseFloat(document.getElementById(`total-weight-${sec.id}`).value);
            if (isNaN(groupWeight)) {
                alert(`Please enter a group category weight for ${sec.name}, or choose Individual Weights.`);
                return;
            }
            totalWeightCalculated += groupWeight;
            
            // Average the scores together, then multiply by category weight contribution
            const avgScore = validScores.reduce((a, b) => a + b, 0) / validScores.length;
            currentEarnedPoints += (avgScore * (groupWeight / 100));
        }
    }

    // Strict 100% boundary validations
    if (totalWeightCalculated > 100) {
        alert(`Error: Your setup totals ${totalWeightCalculated}%. This exceeds a normal 100% class composition.`);
        return;
    }
    if (totalWeightCalculated < 100) {
        alert(`Error: Total weights sum up to only ${totalWeightCalculated}%. They must equal exactly 100% to evaluate correctly.`);
        return;
    }

    // Run final algebra equation
    const pointsNeeded = targetGrade - currentEarnedPoints - extraCredit;
    const requiredFinal = (pointsNeeded / (finalWeight / 100)).toFixed(2);

    // Render output
    const resultDiv = document.getElementById('result');
    const requiredScoreSpan = document.getElementById('required-score');
    const messageP = document.getElementById('result-message');

    requiredScoreSpan.innerText = requiredFinal;
    resultDiv.classList.remove('hidden');

    if (requiredFinal > 100) {
        messageP.innerText = "You'll need extra credit or a curve to reach this target.";
        messageP.style.color = "var(--danger)";
    } else if (requiredFinal <= 0) {
        requiredScoreSpan.innerText = "0";
        messageP.innerText = "Fantastic! You have mathematically clinched your target score already.";
        messageP.style.color = "var(--success)";
    } else {
        messageP.innerText = "Perfectly doable. Best of luck on your preparation!";
        messageP.style.color = "var(--text)";
    }
}