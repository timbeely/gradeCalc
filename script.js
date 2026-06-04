function calculateGrade() {
    const targetGrade = parseFloat(document.getElementById('target-grade').value);
    const finalWeight = parseFloat(document.getElementById('final-weight').value);
    const extraCredit = parseFloat(document.getElementById('extra-credit').value) || 0;

    if (isNaN(targetGrade) || isNaN(finalWeight)) {
        alert("Please fill out the Target Grade and Final Exam Weight.");
        return;
    }

    // Grab all rows of data
    const scores = document.querySelectorAll('.score');
    const weights = document.querySelectorAll('.weight');

    let currentEarnedPoints = 0;
    let totalWeightEntered = 0;

    // Loop through homework, assignments, quizzes, midterms
    for (let i = 0; i < scores.length; i++) {
        const score = parseFloat(scores[i].value);
        const weight = parseFloat(weights[i].value);

        // Only calculate if both score and weight are filled for that category
        if (!isNaN(score) && !isNaN(weight)) {
            currentEarnedPoints += (score * (weight / 100));
            totalWeightEntered += weight;
        }
    }

    // Add the final exam weight to check total weight
    const overallWeight = totalWeightEntered + finalWeight;

    if (overallWeight > 100) {
        alert(`Warning: Your total weights add up to ${overallWeight}%. They should total 100%.`);
    }

    // Math: Calculate required final exam grade
    // Formula: (Target - CurrentEarnedPoints - ExtraCredit) / (FinalWeight / 100)
    const pointsNeeded = targetGrade - currentEarnedPoints - extraCredit;
    const requiredFinal = (pointsNeeded / (finalWeight / 100)).toFixed(2);

    // Display the results
    const resultDiv = document.getElementById('result');
    const requiredScoreSpan = document.getElementById('required-score');
    const messageP = document.getElementById('result-message');

    requiredScoreSpan.innerText = requiredFinal;
    resultDiv.classList.remove('hidden');

    // Fun conditional messaging based on the outcome
    if (requiredFinal > 100) {
        messageP.innerText = "Oof. You'll need some serious extra credit or a curve to hit this target.";
        messageP.style.color = "#b91c1c";
    } else if (requiredFinal <= 0) {
        requiredScoreSpan.innerText = "0";
        messageP.innerText = "Good news! You've already secured your target grade. You can sleep through the final.";
        messageP.style.color = "#15803d";
    } else {
        messageP.innerText = "You've got this! Study hard.";
        messageP.style.color = "#374151";
    }
}