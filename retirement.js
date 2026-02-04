
// Retirement Calculator
async function calculateRetirement() {
    // Set button to loading state
    setCalculateButtonLoading('.tab-content.active .calculate-btn', true, 'Calculate My Freedom Fund! 🚀', 'Calculating... Please wait ⏳');
    
    try {
        // Get input values
        const currentAge = parseInt(document.getElementById('currentAge').value);
        const retirementAge = parseInt(document.getElementById('retirementAge').value);
        const monthlyExpenses = parseFloat(document.getElementById('monthlyExpenses').value);
        const inflationRate = parseFloat(document.getElementById('inflationRate').value) / 100;
        const expectedReturn = parseFloat(document.getElementById('expectedReturn').value) / 100;
        
        // Validate inputs
        if (!currentAge || !retirementAge || !monthlyExpenses || inflationRate < 0 || expectedReturn < 0) {
            alert('Please fill in all fields with valid numbers!');
            setCalculateButtonLoading('.tab-content.active .calculate-btn', false, 'Calculate My Freedom Fund! 🚀', '');
            return;
        }
        
        if (currentAge >= retirementAge) {
            alert('Your retirement age should be higher than your current age!');
            setCalculateButtonLoading('.tab-content.active .calculate-btn', false, 'Calculate My Freedom Fund! 🚀', '');
            return;
        }
    
    // Track calculation event
    if (typeof gtag !== 'undefined') {
        gtag('event', 'retirement_calculation', {
            'event_category': 'Calculator',
            'event_label': 'Retirement Planning',
            'value': Math.round(monthlyExpenses),
            'custom_parameters': {
                'age_range': `${currentAge}-${retirementAge}`,
                'years_to_retirement': retirementAge - currentAge,
                'inflation_rate': inflationRate * 100,
                'expected_return': expectedReturn * 100
            }
        });
    }
    
    // Calculate years to retirement
    const yearsToRetirement = retirementAge - currentAge;
    
    // Calculate future monthly expenses (adjusted for inflation)
    const futureMonthlyExpenses = monthlyExpenses * Math.pow(1 + inflationRate, yearsToRetirement);
    
    // Calculate annual expenses at retirement
    const annualExpensesAtRetirement = futureMonthlyExpenses * 12;
    
    // Calculate corpus needed (assuming 25x annual expenses rule)
    const corpusNeeded = annualExpensesAtRetirement * 25;
    
    // Calculate monthly savings required
    const monthlyInterestRate = expectedReturn / 12;
    const totalMonths = yearsToRetirement * 12;
    
    let monthlySavingsRequired;
    if (expectedReturn === 0) {
        monthlySavingsRequired = corpusNeeded / totalMonths;
    } else {
        // Future Value of Annuity formula: FV = PMT * [((1 + r)^n - 1) / r]
        monthlySavingsRequired = corpusNeeded / (((Math.pow(1 + monthlyInterestRate, totalMonths) - 1) / monthlyInterestRate));
    }
    
    // Display results
    document.getElementById('totalCorpus').textContent = formatCurrency(corpusNeeded);
    document.getElementById('monthlySavings').textContent = formatCurrency(monthlySavingsRequired);
    document.getElementById('futureExpenses').textContent = formatCurrency(futureMonthlyExpenses);
    
    // Show loading state for explanation
    const explanationElement = document.getElementById('retirementExplanation');
    explanationElement.innerHTML = '<div class="loading-explanation">🤖 Generating your personalized retirement roadmap...</div>';
    
    // Generate dynamic explanation using LLM
    const calculationData = {
        currentAge,
        retirementAge,
        monthlyExpenses,
        inflationRate: inflationRate * 100,
        expectedReturn: expectedReturn * 100,
        yearsToRetirement,
        futureMonthlyExpenses,
        corpusNeeded,
        monthlySavingsRequired
    };
    
    try {
        const dynamicExplanation = await generateDynamicExplanation('retirement', calculationData);
        
        if (dynamicExplanation) {
            explanationElement.innerHTML = dynamicExplanation;
        } else {
            // Fallback to enhanced static explanation
            const savingsPercentage = ((monthlySavingsRequired / monthlyExpenses) * 100).toFixed(1);
            
            let timelineMessage = '';
            if (yearsToRetirement > 30) {
                timelineMessage = 'Excellent! Starting early gives you a significant advantage with compound growth.';
            } else if (yearsToRetirement > 20) {
                timelineMessage = 'Good timing! You have sufficient time to build a solid retirement fund.';
            } else if (yearsToRetirement > 10) {
                timelineMessage = 'Time to accelerate your retirement planning, but it\'s definitely achievable.';
            } else {
                timelineMessage = 'You\'re in the final stretch - every contribution counts significantly now.';
            }
            
            const staticExplanation = `
                <h3>Your Retirement Analysis</h3>
                <p>${timelineMessage}</p>
                
                <strong>Your Financial Picture:</strong>
                <ul>
                    <li>Time to retirement: ${yearsToRetirement} years</li>
                    <li>Monthly savings required: RM${formatNumber(Math.round(monthlySavingsRequired))} (${savingsPercentage}% of current expenses)</li>
                    <li>Retirement corpus target: ${formatCurrency(corpusNeeded)}</li>
                    <li>Future monthly expenses: RM${formatNumber(Math.round(futureMonthlyExpenses))} (adjusted for ${(inflationRate * 100).toFixed(1)}% inflation)</li>
                </ul>
                
                <strong>Malaysian Investment Strategy:</strong>
                <ul>
                    <li>Maximize EPF contributions - employer matching provides immediate returns</li>
                    <li>Consider unit trust funds from local providers (Public Mutual, CIMB Principal)</li>
                    <li>ASB/ASW for stable, tax-free returns (if eligible)</li>
                    <li>REITs for diversified property exposure</li>
                </ul>
                
                <strong>Next Steps:</strong>
                <ul>
                    <li>Set up automatic monthly transfers to investment accounts</li>
                    <li>Review and adjust your plan annually</li>
                    <li>Consider increasing contributions with salary increments</li>
                </ul>
                
                <p><em><strong>Disclaimer:</strong> This calculation provides general guidance only. Please consult with a qualified financial planner for personalized advice tailored to your specific situation.</em></p>
            `;
            explanationElement.innerHTML = staticExplanation;
        }
    } catch (error) {
        console.error('Error generating explanation:', error);
        // Fallback to basic explanation
        explanationElement.innerHTML = `
            <strong>Your Plan:</strong> Save RM${formatNumber(Math.round(monthlySavingsRequired))} monthly for ${yearsToRetirement} years to reach your ${formatCurrency(corpusNeeded)} retirement goal.
        `;
    }
    
        // Show results with animation
        const resultSection = document.getElementById('retirementResult');
        resultSection.style.display = 'block';
        resultSection.classList.add('success-animation');
        
        // Scroll to results
        resultSection.scrollIntoView({ behavior: 'smooth' });
        
    } catch (error) {
        console.error('Error in retirement calculation:', error);
        alert('An error occurred during calculation. Please try again.');
    } finally {
        // Reset button state
        setCalculateButtonLoading('.tab-content.active .calculate-btn', false, 'Calculate My Freedom Fund! 🚀', '');
    }
}
