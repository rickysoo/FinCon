// Tab switching functionality
function showTab(tabName) {
    // Hide all tab contents
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Remove active class from all tab buttons
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected tab content
    document.getElementById(tabName).classList.add('active');
    
    // Add active class to clicked button
    event.target.classList.add('active');
}

// Format currency for Malaysian Ringgit
function formatCurrency(amount) {
    return new Intl.NumberFormat('ms-MY', {
        style: 'currency',
        currency: 'MYR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

// Format number with commas
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// Retirement Calculator
function calculateRetirement() {
    // Get input values
    const currentAge = parseInt(document.getElementById('currentAge').value);
    const retirementAge = parseInt(document.getElementById('retirementAge').value);
    const monthlyExpenses = parseFloat(document.getElementById('monthlyExpenses').value);
    const inflationRate = parseFloat(document.getElementById('inflationRate').value) / 100;
    const expectedReturn = parseFloat(document.getElementById('expectedReturn').value) / 100;
    
    // Validate inputs
    if (!currentAge || !retirementAge || !monthlyExpenses || inflationRate < 0 || expectedReturn < 0) {
        alert('Please fill in all fields with valid numbers! 😊');
        return;
    }
    
    if (currentAge >= retirementAge) {
        alert('Your retirement age should be higher than your current age! 😉');
        return;
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
    
    // Generate explanation
    const explanation = `
        Great news! Here's your retirement roadmap: 🗺️<br><br>
        
        <strong>The Math Behind It:</strong><br>
        • You have ${yearsToRetirement} years to save up<br>
        • With ${(inflationRate * 100).toFixed(1)}% inflation, your current RM${formatNumber(monthlyExpenses)} monthly expenses will become RM${formatNumber(Math.round(futureMonthlyExpenses))} by retirement<br>
        • Using the 25x rule (withdraw 4% annually), you'll need ${formatCurrency(corpusNeeded)} as your retirement fund<br><br>
        
        <strong>Your Action Plan:</strong><br>
        • Save RM${formatNumber(Math.round(monthlySavingsRequired))} every month<br>
        • That's ${((monthlySavingsRequired / monthlyExpenses) * 100).toFixed(1)}% of your current monthly expenses<br>
        • Invest in a diversified portfolio targeting ${(expectedReturn * 100).toFixed(1)}% annual returns<br><br>
        
        <strong>Pro Tips:</strong><br>
        • Start with EPF contributions - they're giving you free money!<br>
        • Consider unit trusts, ETFs, or REITS for diversification<br>
        • Review and adjust your plan every 2-3 years<br>
        • Don't forget about healthcare costs - they tend to be higher during retirement!
    `;
    
    document.getElementById('retirementExplanation').innerHTML = explanation;
    
    // Show results with animation
    const resultSection = document.getElementById('retirementResult');
    resultSection.style.display = 'block';
    resultSection.classList.add('success-animation');
    
    // Scroll to results
    resultSection.scrollIntoView({ behavior: 'smooth' });
}

// Loan Calculator
function calculateLoan() {
    // Get input values
    const loanAmount = parseFloat(document.getElementById('loanAmount').value);
    const annualRate = parseFloat(document.getElementById('interestRate').value) / 100;
    const loanTermYears = parseInt(document.getElementById('loanTerm').value);
    
    // Validate inputs
    if (!loanAmount || !annualRate || !loanTermYears || loanAmount <= 0 || annualRate < 0 || loanTermYears <= 0) {
        alert('Please fill in all fields with valid numbers! 😊');
        return;
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
    
    // Generate explanation
    const interestPercentage = (totalInterest / loanAmount * 100).toFixed(1);
    const explanation = `
        Here's the real talk about your loan: 💰<br><br>
        
        <strong>The Numbers:</strong><br>
        • Monthly payment: RM${formatNumber(Math.round(monthlyPayment))}<br>
        • Total interest over ${loanTermYears} years: RM${formatNumber(Math.round(totalInterest))}<br>
        • That's ${interestPercentage}% extra on top of your original loan!<br><br>
        
        <strong>What This Means:</strong><br>
        • Out of every RM100 you pay monthly, about RM${Math.round((monthlyRate * loanAmount / monthlyPayment) * 100)} goes to interest initially<br>
        • Good news: As time goes on, more of your payment goes to the actual loan amount<br>
        • Consider paying extra towards principal to save on interest!<br><br>
        
        <strong>Malaysian Context:</strong><br>
        • Most banks allow early partial payments without penalty<br>
        • Consider refinancing if rates drop significantly<br>
        • Don't forget to factor in legal fees, valuation costs, and insurance!
    `;
    
    document.getElementById('loanExplanation').innerHTML = explanation;
    
    // Generate amortization schedule for first 12 months
    generateAmortizationSchedule(loanAmount, monthlyRate, monthlyPayment, totalPayments);
    
    // Show results with animation
    const resultSection = document.getElementById('loanResult');
    resultSection.style.display = 'block';
    resultSection.classList.add('success-animation');
    
    // Scroll to results
    resultSection.scrollIntoView({ behavior: 'smooth' });
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

// Add some interactive features
document.addEventListener('DOMContentLoaded', function() {
    // Add input validation and real-time feedback
    const inputs = document.querySelectorAll('input[type="number"]');
    
    inputs.forEach(input => {
        input.addEventListener('input', function() {
            if (this.value < 0) {
                this.style.borderColor = '#e74c3c';
            } else {
                this.style.borderColor = '#e0e0e0';
            }
        });
        
        input.addEventListener('focus', function() {
            this.parentElement.classList.add('highlight');
        });
        
        input.addEventListener('blur', function() {
            this.parentElement.classList.remove('highlight');
        });
    });
    
    // Add Enter key support for calculations
    document.getElementById('retirement').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            calculateRetirement();
        }
    });
    
    document.getElementById('loan').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            calculateLoan();
        }
    });
    
    // Add some default values for demo
    document.getElementById('currentAge').value = 25;
    document.getElementById('retirementAge').value = 60;
    document.getElementById('monthlyExpenses').value = 3000;
    document.getElementById('inflationRate').value = 3;
    document.getElementById('expectedReturn').value = 8;
    
    document.getElementById('loanAmount').value = 500000;
    document.getElementById('interestRate').value = 4.5;
    document.getElementById('loanTerm').value = 30;
});

// Add some fun easter eggs
let clickCount = 0;
document.querySelector('.logo').addEventListener('click', function() {
    clickCount++;
    if (clickCount === 5) {
        alert('🎉 You found the easter egg! Remember: The best time to invest was yesterday, the second best time is today! 💪');
        clickCount = 0;
    }
});

// Add loading animation for calculations
function showLoading(elementId) {
    const element = document.getElementById(elementId);
    element.innerHTML = '<div class="loading">🔄</div> Calculating your financial future...';
}

// Smooth scrolling for better UX
function smoothScrollTo(elementId) {
    document.getElementById(elementId).scrollIntoView({
        behavior: 'smooth',
        block: 'start'
    });
}