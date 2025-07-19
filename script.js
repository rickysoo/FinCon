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
                model: 'gpt-3.5-turbo',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a friendly Malaysian financial advisor who explains complex financial concepts in simple, relatable terms. Use Malaysian context, local terms, and a warm, encouraging tone. Keep explanations practical and actionable.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: 500,
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
        return `Explain this retirement calculation in a friendly, Malaysian context:
        - Current age: ${data.currentAge}
        - Retirement age: ${data.retirementAge}
        - Current monthly expenses: RM${data.monthlyExpenses}
        - Inflation rate: ${data.inflationRate}%
        - Expected return: ${data.expectedReturn}%
        - Years to retirement: ${data.yearsToRetirement}
        - Future monthly expenses: RM${Math.round(data.futureMonthlyExpenses)}
        - Total corpus needed: RM${Math.round(data.corpusNeeded)}
        - Monthly savings required: RM${Math.round(data.monthlySavingsRequired)}
        
        Please provide a warm, encouraging explanation that includes:
        1. What these numbers mean in practical terms
        2. Actionable advice for a Malaysian investor
        3. Local investment options (EPF, unit trusts, etc.)
        4. Tips to make saving more achievable
        
        Use HTML formatting and keep it conversational with Malaysian terms like "lepak", "boleh", etc.`;
    } else if (type === 'loan') {
        return `Explain this loan calculation in a friendly, Malaysian context:
        - Loan amount: RM${data.loanAmount}
        - Interest rate: ${data.interestRate}%
        - Loan term: ${data.loanTermYears} years
        - Monthly payment: RM${Math.round(data.monthlyPayment)}
        - Total interest: RM${Math.round(data.totalInterest)}
        - Total amount paid: RM${Math.round(data.totalAmountPaid)}
        
        Please provide a clear explanation that includes:
        1. What the monthly payment means for their budget
        2. How the interest compounds over time
        3. Malaysian-specific advice (early payment options, refinancing, etc.)
        4. Tips to reduce total interest paid
        
        Use HTML formatting and keep it practical with Malaysian banking context.`;
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
    
    // Generate personalized explanation
    const explanationElement = document.getElementById('retirementExplanation');
    
    // Enhanced static explanation that feels dynamic
    const savingsPercentage = ((monthlySavingsRequired / monthlyExpenses) * 100).toFixed(1);
    const timeframe = yearsToRetirement;
    
    let personalizedMessage = '';
    if (timeframe > 30) {
        personalizedMessage = `Wah, you're starting early! That's fantastic - time is your biggest advantage. 💪`;
    } else if (timeframe > 20) {
        personalizedMessage = `Good timing! You still have plenty of time to build your retirement fund. 👍`;
    } else if (timeframe > 10) {
        personalizedMessage = `Time to get serious about retirement planning! But don't worry, it's still very doable. 🎯`;
    } else {
        personalizedMessage = `You're in the final stretch! Every ringgit saved now makes a big difference. 🚀`;
    }
    
    let savingsAdvice = '';
    if (savingsPercentage < 10) {
        savingsAdvice = `Great news! You only need to save ${savingsPercentage}% of your current expenses - that's very manageable! 😊`;
    } else if (savingsPercentage < 20) {
        savingsAdvice = `You'll need to save ${savingsPercentage}% of your current expenses. It's a bit of a stretch but totally achievable with the right plan! 💪`;
    } else if (savingsPercentage < 30) {
        savingsAdvice = `Saving ${savingsPercentage}% might seem challenging, but remember - this is for your freedom! Consider increasing your income or adjusting your retirement lifestyle. 🎯`;
    } else {
        savingsAdvice = `${savingsPercentage}% is quite ambitious! You might want to consider working a few extra years, reducing retirement expenses, or boosting your income. Every bit helps! 🚀`;
    }
    
    const explanation = `
        ${personalizedMessage}<br><br>
        
        <strong>Your Personal Retirement Picture:</strong><br>
        • You have ${yearsToRetirement} years to build your freedom fund<br>
        • With ${(inflationRate * 100).toFixed(1)}% inflation, your RM${formatNumber(monthlyExpenses)} lifestyle today will cost RM${formatNumber(Math.round(futureMonthlyExpenses))} when you retire<br>
        • Total target: ${formatCurrency(corpusNeeded)} (using the proven 25x rule for sustainable withdrawals)<br><br>
        
        <strong>Your Monthly Mission:</strong><br>
        • Save RM${formatNumber(Math.round(monthlySavingsRequired))} every month<br>
        • ${savingsAdvice}<br>
        • Invest wisely to achieve ${(expectedReturn * 100).toFixed(1)}% annual returns<br><br>
        
        <strong>Your Malaysian Advantage:</strong><br>
        • Max out your EPF - it's like free money from your employer!<br>
        • Consider unit trusts from local fund houses (Public Mutual, CIMB Principal)<br>
        • Look into REITs for property exposure without the hassle<br>
        • ASB/ASW for guaranteed returns (if you're eligible)<br><br>
        
        <strong>Smart Moves for Your Age Group:</strong><br>
        ${timeframe > 25 ? '• You have time for higher-risk, higher-reward investments<br>• Consider equity-heavy portfolios (70-80%)<br>• Start an emergency fund alongside retirement savings' : 
          timeframe > 15 ? '• Balance growth and stability (60-70% equity)<br>• Consider conservative debt funds for stability<br>• Review and rebalance annually' :
          '• Focus on capital preservation (40-50% equity)<br>• Prioritize stable, dividend-paying investments<br>• Consider gradually shifting to bonds as you approach retirement'}
    `;
    
    explanationElement.innerHTML = explanation;
    
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
    
    // Generate personalized explanation
    const explanationElement = document.getElementById('loanExplanation');
    
    // Enhanced static explanation that feels dynamic
    const interestPercentage = (totalInterest / loanAmount * 100).toFixed(1);
    const initialInterestRatio = Math.round((monthlyRate * loanAmount / monthlyPayment) * 100);
    
    let loanSizeMessage = '';
    if (loanAmount < 200000) {
        loanSizeMessage = `This is a reasonable loan size for most Malaysians. Smart borrowing! 👍`;
    } else if (loanAmount < 500000) {
        loanSizeMessage = `This is a substantial loan - make sure you're comfortable with the monthly commitment. 🏡`;
    } else if (loanAmount < 1000000) {
        loanSizeMessage = `This is a significant financial commitment. Ensure your income can comfortably support this payment. 💼`;
    } else {
        loanSizeMessage = `This is a major loan! Consider if you really need this amount or if you can increase your down payment. 🤔`;
    }
    
    let interestAdvice = '';
    if (interestPercentage < 30) {
        interestAdvice = `The interest cost is quite reasonable at ${interestPercentage}% of your loan amount. 😊`;
    } else if (interestPercentage < 50) {
        interestAdvice = `You'll pay ${interestPercentage}% extra in interest - that's typical for Malaysian home loans. 💡`;
    } else if (interestPercentage < 80) {
        interestAdvice = `The interest adds up to ${interestPercentage}% extra - consider shortening the loan term if possible. 🎯`;
    } else {
        interestAdvice = `Wow! ${interestPercentage}% extra in interest - definitely consider early payments or refinancing options. 🚀`;
    }
    
    const explanation = `
        ${loanSizeMessage}<br><br>
        
        <strong>Breaking Down Your Loan:</strong><br>
        • Monthly payment: RM${formatNumber(Math.round(monthlyPayment))}<br>
        • Over ${loanTermYears} years, you'll pay RM${formatNumber(Math.round(totalInterest))} in interest<br>
        • ${interestAdvice}<br><br>
        
        <strong>How Your Payments Work:</strong><br>
        • Initially, RM${initialInterestRatio} out of every RM100 goes to interest<br>
        • As you pay down the principal, more money goes toward reducing your debt<br>
        • In the later years, most of your payment reduces the actual loan amount<br><br>
        
        <strong>Malaysian Banking Tips:</strong><br>
        • Most banks allow you to pay extra toward principal without penalties<br>
        • Even RM100 extra per month can save you thousands in interest!<br>
        • Lock-in periods typically last 2-5 years, then you can refinance<br>
        • Consider flexi home loans if you have irregular income<br><br>
        
        <strong>Smart Strategies:</strong><br>
        ${loanTermYears > 25 ? '• Your loan term is quite long - consider paying extra monthly to reduce interest<br>• Every extra RM200/month can cut years off your loan<br>• Use windfalls (bonus, tax refund) to make lump sum payments' :
          loanTermYears > 15 ? '• Good loan term length - balances affordability with total interest<br>• Consider annual lump sum payments during bonus season<br>• Review refinancing options every 3-5 years' :
          '• Shorter loan term means higher monthly payments but much less total interest<br>• You\'re saving a lot on interest with this approach!<br>• Make sure your monthly budget can handle the payments comfortably'}
    `;
    
    explanationElement.innerHTML = explanation;
    
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