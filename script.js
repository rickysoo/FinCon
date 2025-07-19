// OpenAI API Configuration
let OPENAI_API_KEY = '';
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

// Initialize API key from config or localStorage
function initializeAPIKey() {
    // First try to get from config file
    if (window.FINCON_CONFIG && window.FINCON_CONFIG.OPENAI_API_KEY && window.FINCON_CONFIG.OPENAI_API_KEY !== 'your-openai-api-key-here') {
        OPENAI_API_KEY = window.FINCON_CONFIG.OPENAI_API_KEY;
        console.log('OpenAI API key loaded from config file');
        return;
    }
    
    // Fallback to localStorage
    const savedApiKey = localStorage.getItem('fincon_openai_key');
    if (savedApiKey) {
        OPENAI_API_KEY = savedApiKey;
        console.log('OpenAI API key loaded from localStorage');
    }
}

// Function to set OpenAI API key (for developers only)
function setOpenAIKey(key) {
    OPENAI_API_KEY = key.trim();
    if (OPENAI_API_KEY) {
        localStorage.setItem('fincon_openai_key', OPENAI_API_KEY);
        console.log('OpenAI API key configured for dynamic explanations');
    } else {
        localStorage.removeItem('fincon_openai_key');
        console.log('OpenAI API key removed - using static explanations');
    }
}

// OpenAI API integration for dynamic explanations
async function generateDynamicExplanation(calculationType, data) {
    if (!OPENAI_API_KEY) {
        console.warn('OpenAI API key not set. Using static explanations.');
        return null;
    }

    const prompt = createPromptForCalculation(calculationType, data);
    
    try {
        const response = await fetch(OPENAI_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: window.FINCON_CONFIG?.OPENAI_MODEL || 'gpt-4o-mini',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a friendly Malaysian financial advisor. Write ONLY in English using simple HTML tags (h3, strong, ul, li, p, br). Keep explanations SHORT, practical and encouraging. Use Malaysian financial context. Do NOT include ```html code blocks. Always end with a disclaimer about consulting a financial planner. Use occasional Malaysian slang like "boleh" or "wah" for local flavor.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: 400,
                temperature: 0.7
            })
        });

        if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
        }

        const result = await response.json();
        return result.choices[0].message.content;
    } catch (error) {
        console.error('Error generating dynamic explanation:', error);
        return null;
    }
}

// Create prompts for different calculation types
function createPromptForCalculation(type, data) {
    if (type === 'retirement') {
        const savingsPercentage = ((data.monthlySavingsRequired / data.monthlyExpenses) * 100).toFixed(1);
        return `Provide a SHORT retirement analysis for a ${data.currentAge}-year-old Malaysian planning to retire at ${data.retirementAge}.

Key numbers:
- Monthly savings needed: RM${Math.round(data.monthlySavingsRequired).toLocaleString()} (${savingsPercentage}% of current RM${data.monthlyExpenses.toLocaleString()} expenses)
- Retirement corpus target: RM${Math.round(data.corpusNeeded).toLocaleString()}

Format with HTML tags. Include:
- Quick assessment of the savings challenge
- 2-3 specific Malaysian investment tips (EPF, ASB, unit trusts)
- One actionable next step
- Financial planner consultation disclaimer

Keep it under 250 words, encouraging tone, and use "boleh" or "wah" naturally.`;
    } else if (type === 'loan') {
        const interestPercentage = (data.totalInterest / data.loanAmount * 100).toFixed(1);
        return `Provide a SHORT loan analysis for a Malaysian borrower.

Key numbers:
- Loan: RM${data.loanAmount.toLocaleString()} at ${data.interestRate}% for ${data.loanTermYears} years
- Monthly payment: RM${Math.round(data.monthlyPayment).toLocaleString()}
- Total interest: RM${Math.round(data.totalInterest).toLocaleString()} (${interestPercentage}% extra cost)

Format with HTML tags. Include:
- Quick assessment if this is reasonable for Malaysian standards
- 2-3 specific tips to reduce interest (early payment, refinancing)
- One budget management tip
- Financial planner consultation disclaimer

Keep it under 250 words, practical tone, and use "boleh" naturally.`;
    }
}

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
    
    // Track tab switching event
    if (typeof gtag !== 'undefined') {
        gtag('event', 'tab_switch', {
            'event_category': 'Navigation',
            'event_label': tabName === 'retirement' ? 'Retirement Calculator' : 'Loan Calculator',
            'value': 1
        });
    }
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
async function calculateRetirement() {
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
            const staticExplanation = `
                <strong>Your Retirement Roadmap:</strong><br><br>
                
                • You have ${yearsToRetirement} years to build your freedom fund<br>
                • With ${(inflationRate * 100).toFixed(1)}% inflation, your RM${formatNumber(monthlyExpenses)} lifestyle will cost RM${formatNumber(Math.round(futureMonthlyExpenses))} when you retire<br>
                • Target corpus: ${formatCurrency(corpusNeeded)} using the 25x rule<br>
                • Monthly savings needed: RM${formatNumber(Math.round(monthlySavingsRequired))} (${savingsPercentage}% of current expenses)<br><br>
                
                <strong>Malaysian Investment Options:</strong><br>
                • Max out EPF contributions - employer matching is free money!<br>
                • Consider unit trusts (Public Mutual, CIMB Principal)<br>
                • ASB/ASW for guaranteed returns (if eligible)<br>
                • REITs for property exposure without the hassle
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
}

// Loan Calculator
async function calculateLoan() {
    // Get input values
    const loanAmount = parseFloat(document.getElementById('loanAmount').value);
    const annualRate = parseFloat(document.getElementById('interestRate').value) / 100;
    const loanTermYears = parseInt(document.getElementById('loanTerm').value);
    
    // Validate inputs
    if (!loanAmount || !annualRate || !loanTermYears || loanAmount <= 0 || annualRate < 0 || loanTermYears <= 0) {
        alert('Please fill in all fields with valid numbers! 😊');
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
            const staticExplanation = `
                <strong>Your Loan Breakdown:</strong><br><br>
                
                • Monthly payment: RM${formatNumber(Math.round(monthlyPayment))}<br>
                • Total interest over ${loanTermYears} years: RM${formatNumber(Math.round(totalInterest))}<br>
                • Interest adds ${interestPercentage}% to your loan cost<br><br>
                
                <strong>Malaysian Banking Tips:</strong><br>
                • Most banks allow extra principal payments without penalty<br>
                • Even RM100 extra monthly can save thousands in interest<br>
                • Consider refinancing after lock-in period (2-5 years)<br>
                • Flexi loans offer payment flexibility for irregular income
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

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('/sw.js')
            .then(function(registration) {
                console.log('FinCon: Service Worker registered successfully:', registration.scope);
            })
            .catch(function(error) {
                console.log('FinCon: Service Worker registration failed:', error);
            });
    });
}

// PWA Install prompt
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    showInstallPromotion();
});

function showInstallPromotion() {
    const installBanner = document.createElement('div');
    installBanner.innerHTML = `
        <div style="position: fixed; top: 0; left: 0; right: 0; background: #2c3e50; color: white; padding: 10px; text-align: center; z-index: 1000;">
            <span>📱 Install FinCon app for offline access!</span>
            <button id="installBtn" style="margin-left: 10px; padding: 5px 10px; background: #3498db; color: white; border: none; border-radius: 3px; cursor: pointer;">Install</button>
            <button id="dismissBtn" style="margin-left: 5px; padding: 5px 10px; background: transparent; color: white; border: 1px solid white; border-radius: 3px; cursor: pointer;">Later</button>
        </div>
    `;
    document.body.appendChild(installBanner);
    
    document.getElementById('installBtn').addEventListener('click', installApp);
    document.getElementById('dismissBtn').addEventListener('click', () => {
        document.body.removeChild(installBanner);
    });
}

function installApp() {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                console.log('FinCon: User accepted the install prompt');
                // Track PWA install event
                if (typeof gtag !== 'undefined') {
                    gtag('event', 'pwa_install', {
                        'event_category': 'PWA',
                        'event_label': 'Install Accepted',
                        'value': 1
                    });
                }
            } else {
                console.log('FinCon: User dismissed the install prompt');
                // Track PWA install dismissal
                if (typeof gtag !== 'undefined') {
                    gtag('event', 'pwa_install_dismissed', {
                        'event_category': 'PWA',
                        'event_label': 'Install Dismissed',
                        'value': 1
                    });
                }
            }
            deferredPrompt = null;
        });
    }
}

// Handle app shortcuts
if ('serviceWorker' in navigator) {
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get('tab');
    if (tab) {
        setTimeout(() => {
            showTab(tab);
        }, 100);
    }
}

// Add some interactive features
document.addEventListener('DOMContentLoaded', function() {
    // Initialize API key from config (developers only)
    initializeAPIKey();
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

// Helper function to categorize loan amounts
function getLoanAmountRange(amount) {
    if (amount < 100000) return 'Under 100k';
    if (amount < 300000) return '100k-300k';
    if (amount < 500000) return '300k-500k';
    if (amount < 1000000) return '500k-1M';
    return 'Over 1M';
}

// Track page load event
if (typeof gtag !== 'undefined') {
    gtag('event', 'page_view', {
        'event_category': 'Engagement',
        'event_label': 'App Load',
        'value': 1
    });
}

// Add some fun easter eggs
let clickCount = 0;
document.querySelector('.logo').addEventListener('click', function() {
    clickCount++;
    if (clickCount === 5) {
        alert('🎉 You found the easter egg! Remember: The best time to invest was yesterday, the second best time is today! 💪');
        // Track easter egg discovery
        if (typeof gtag !== 'undefined') {
            gtag('event', 'easter_egg_found', {
                'event_category': 'Engagement',
                'event_label': 'Logo Click Easter Egg',
                'value': 1
            });
        }
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