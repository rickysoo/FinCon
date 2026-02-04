
// Loan Calculator
async function calculateLoan() {
    // Set button to loading state
    setCalculateButtonLoading('.tab-content.active .calculate-btn', true, 'Show Me My Payment Plan! 🏡', 'Calculating... Please wait ⏳');
    
    try {
        // Get input values
        const loanAmount = parseFloat(document.getElementById('loanAmount').value);
        const annualRate = parseFloat(document.getElementById('interestRate').value) / 100;
        const loanTermYears = parseInt(document.getElementById('loanTerm').value);
        
        // Validate inputs
        if (!loanAmount || !annualRate || !loanTermYears || loanAmount <= 0 || annualRate < 0 || loanTermYears <= 0) {
            alert('Please fill in all fields with valid numbers!');
            setCalculateButtonLoading('.tab-content.active .calculate-btn', false, 'Show Me My Payment Plan! 🏡', '');
            return;
        }
    
    // Track calculation event
    if (typeof gtag !== 'undefined') {
        gtag('event', 'loan_calculation', {
            'event_category': 'Calculator',
            'event_label': 'Loan Planning',
            'value': Math.round(loanAmount),
            'custom_parameters': {
                'loan_amount_range': getLoanAmountRange(loanAmount),
                'interest_rate': annualRate * 100,
                'loan_term_years': loanTermYears
            }
        });
    }
    
    // Calculate monthly payment
    const monthlyRate = annualRate / 12;
    const totalPayments = loanTermYears * 12;
    
    let monthlyPayment;
    if (annualRate === 0) {
        monthlyPayment = loanAmount / totalPayments;
    } else {
        // Monthly payment formula: M = P * [r(1+r)^n] / [(1+r)^n - 1]
        monthlyPayment = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, totalPayments)) / 
                        (Math.pow(1 + monthlyRate, totalPayments) - 1);
    }
    
    // Calculate total amount paid and total interest
    const totalAmountPaid = monthlyPayment * totalPayments;
    const totalInterest = totalAmountPaid - loanAmount;
    
    // Display results
    document.getElementById('monthlyPayment').textContent = formatCurrency(monthlyPayment);
    document.getElementById('totalInterest').textContent = formatCurrency(totalInterest);
    document.getElementById('totalPaid').textContent = formatCurrency(totalAmountPaid);
    
    // Show loading state for explanation
    const explanationElement = document.getElementById('loanExplanation');
    explanationElement.innerHTML = '<div class="loading-explanation">🤖 Analyzing your loan and generating personalized advice...</div>';
    
    // Generate dynamic explanation using LLM
    const calculationData = {
        loanAmount,
        interestRate: annualRate * 100,
        loanTermYears,
        monthlyPayment,
        totalInterest,
        totalAmountPaid
    };
    
    try {
        const dynamicExplanation = await generateDynamicExplanation('loan', calculationData);
        
        if (dynamicExplanation) {
            explanationElement.innerHTML = dynamicExplanation;
        } else {
            // Fallback to enhanced static explanation
            const interestPercentage = (totalInterest / loanAmount * 100).toFixed(1);
            
            let assessmentMessage = '';
            if (loanAmount < 300000) {
                assessmentMessage = 'This loan amount is reasonable for most Malaysian households.';
            } else if (loanAmount < 600000) {
                assessmentMessage = 'This is a substantial loan - ensure your monthly income can comfortably support the payments.';
            } else {
                assessmentMessage = 'This is a significant financial commitment - careful budget planning is essential.';
            }
            
            const staticExplanation = `
                <h3>Your Loan Analysis</h3>
                <p>${assessmentMessage}</p>
                
                <strong>Loan Details:</strong>
                <ul>
                    <li>Monthly payment: RM${formatNumber(Math.round(monthlyPayment))}</li>
                    <li>Total interest cost: RM${formatNumber(Math.round(totalInterest))} (${interestPercentage}% of loan amount)</li>
                    <li>Total amount to pay: RM${formatNumber(Math.round(totalAmountPaid))} over ${loanTermYears} years</li>
                </ul>
                
                <strong>Malaysian Banking Tips:</strong>
                <ul>
                    <li>Most banks allow early partial payments without penalties</li>
                    <li>Even RM100 extra monthly can reduce total interest significantly</li>
                    <li>Consider refinancing options after lock-in period (typically 2-5 years)</li>
                    <li>Flexi home loans offer payment flexibility for variable income</li>
                </ul>
                
                <strong>Interest Reduction Strategies:</strong>
                <ul>
                    <li>Use annual bonuses for lump sum principal payments</li>
                    <li>Round up monthly payments to the nearest hundred</li>
                    <li>Review and compare rates with other banks regularly</li>
                </ul>
                
                <p><em><strong>Disclaimer:</strong> This analysis provides general guidance only. Please consult with a qualified financial planner for personalized advice tailored to your specific financial situation.</em></p>
            `;
            explanationElement.innerHTML = staticExplanation;
        }
    } catch (error) {
        console.error('Error generating explanation:', error);
        // Fallback to basic explanation
        explanationElement.innerHTML = `
            <strong>Your Loan:</strong> RM${formatNumber(Math.round(monthlyPayment))} monthly for ${loanTermYears} years. Total interest: RM${formatNumber(Math.round(totalInterest))}.
        `;
    }
    
        // Generate amortization schedule for first 12 months
        generateAmortizationSchedule(loanAmount, monthlyRate, monthlyPayment, totalPayments);
        
        // Show results with animation
        const resultSection = document.getElementById('loanResult');
        resultSection.style.display = 'block';
        resultSection.classList.add('success-animation');
        
        // Scroll to results
        resultSection.scrollIntoView({ behavior: 'smooth' });
        
    } catch (error) {
        console.error('Error in loan calculation:', error);
        alert('An error occurred during calculation. Please try again.');
    } finally {
        // Reset button state
        setCalculateButtonLoading('.tab-content.active .calculate-btn', false, 'Show Me My Payment Plan! 🏡', '');
    }
}

// Generate Amortization Schedule
function generateAmortizationSchedule(principalAmount, monthlyRate, monthlyPayment, totalPayments) {
    const scheduleBody = document.getElementById('scheduleBody');
    scheduleBody.innerHTML = '';
    
    let remainingBalance = principalAmount;
    
    // Generate first 12 months
    for (let month = 1; month <= Math.min(12, totalPayments); month++) {
        const interestPayment = remainingBalance * monthlyRate;
        const principalPayment = monthlyPayment - interestPayment;
        remainingBalance -= principalPayment;
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${month}</td>
            <td>RM ${formatNumber(Math.round(monthlyPayment))}</td>
            <td>RM ${formatNumber(Math.round(interestPayment))}</td>
            <td>RM ${formatNumber(Math.round(principalPayment))}</td>
            <td>RM ${formatNumber(Math.round(remainingBalance))}</td>
        `;
        
        scheduleBody.appendChild(row);
    }
}
