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

// Function to set OpenAI API key
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
    
    // Show loading state for explanation
    const explanationElement = document.getElementById('retirementExplanation');
    explanationElement.innerHTML = '<div class="loading-explanation">🤖 Generating personalized explanation...</div>';
    
    // Generate dynamic explanation
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
            // Fallback to static explanation
            const staticExplanation = `
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
            explanationElement.innerHTML = staticExplanation;
        }
    } catch (error) {
        console.error('Error generating explanation:', error);
        // Fallback to static explanation on error
        const staticExplanation = `
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
        explanationElement.innerHTML = staticExplanation;
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
    explanationElement.innerHTML = '<div class="loading-explanation">🤖 Generating personalized explanation...</div>';
    
    // Generate dynamic explanation
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
            // Fallback to static explanation
            const interestPercentage = (totalInterest / loanAmount * 100).toFixed(1);
            const staticExplanation = `
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
            explanationElement.innerHTML = staticExplanation;
        }
    } catch (error) {
        console.error('Error generating explanation:', error);
        // Fallback to static explanation on error
        const interestPercentage = (totalInterest / loanAmount * 100).toFixed(1);
        const staticExplanation = `
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
        explanationElement.innerHTML = staticExplanation;
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
    // Initialize API key from config or localStorage
    initializeAPIKey();
    
    // Update UI to show if key is already configured
    if (OPENAI_API_KEY) {
        const apiKeyInput = document.getElementById('apiKey');
        if (window.FINCON_CONFIG && window.FINCON_CONFIG.OPENAI_API_KEY && window.FINCON_CONFIG.OPENAI_API_KEY !== 'your-openai-api-key-here') {
            apiKeyInput.value = '✅ API key configured in config.js';
            apiKeyInput.disabled = true;
            apiKeyInput.type = 'text';
        } else {
            apiKeyInput.value = OPENAI_API_KEY;
        }
    }
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