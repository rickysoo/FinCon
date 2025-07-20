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

// Backend API integration for dynamic explanations
async function generateDynamicExplanation(calculationType, data) {
    try {
        // Try backend API first
        const response = await fetch('/api/explain', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                calculationType,
                data
            })
        });

        if (!response.ok) {
            console.warn('Backend API unavailable, falling back to client-side API');
            return await generateClientSideExplanation(calculationType, data);
        }

        const result = await response.json();
        return result.explanation;
    } catch (error) {
        console.warn('Backend API error, falling back to client-side API:', error);
        return await generateClientSideExplanation(calculationType, data);
    }
}

// Fallback to client-side API if backend is unavailable
async function generateClientSideExplanation(calculationType, data) {
    if (!OPENAI_API_KEY) {
        console.warn('No API key available. Using static explanations.');
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
                        content: 'You are a friendly Malaysian financial advisor. Write ONLY in proper English using simple HTML tags (h3, strong, ul, li, p, br). Keep explanations SHORT, practical and encouraging. Use Malaysian financial context and investment options. Do NOT include ```html code blocks or local slang words. Always end with a disclaimer about consulting a financial planner. Use professional, clear English throughout.'
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
        console.error('Error generating client-side explanation:', error);
        return null;
    }
}

// EPF RIA Framework Constants
const EPF_RIA_TIERS = {
    basic: 390000,
    adequate: 650000,
    enhanced: 1300000
};

const EPF_RIA_MONTHLY_INCOME = {
    adequate: { year1: 2708, year20: 7389 },
    enhanced: { year1: 5417, year20: 14779 }
};

// EPF RIA Calculator
async function calculateEPFRIA() {
    setCalculateButtonLoading('.tab-content.active .calculate-btn', true, 'Calculate My RIA Status! 📈', 'Calculating your RIA status... ⏳');
    
    try {
        const currentAge = parseInt(document.getElementById('riaCurrentAge').value);
        const currentSavings = parseFloat(document.getElementById('riaCurrentSavings').value);
        const monthlyContribution = parseFloat(document.getElementById('riaMonthlyContribution').value);
        const expectedReturn = parseFloat(document.getElementById('riaExpectedReturn').value) / 100;
        const targetTier = document.getElementById('riaTargetTier').value;
        
        // Validate inputs
        if (!currentAge || currentSavings < 0 || !monthlyContribution || expectedReturn < 0) {
            alert('Please fill in all fields with valid numbers!');
            setCalculateButtonLoading('.tab-content.active .calculate-btn', false, 'Calculate My RIA Status! 📈', '');
            return;
        }
        
        if (currentAge >= 60) {
            alert('This calculator is for planning retirement savings. Please enter an age below 60.');
            setCalculateButtonLoading('.tab-content.active .calculate-btn', false, 'Calculate My RIA Status! 📈', '');
            return;
        }

        // Track calculation event
        if (typeof gtag !== 'undefined') {
            gtag('event', 'epf_ria_calculation', {
                'event_category': 'Calculator',
                'event_label': 'EPF RIA Planning',
                'value': Math.round(currentSavings),
                'custom_parameters': {
                    'age': currentAge,
                    'target_tier': targetTier,
                    'monthly_contribution': monthlyContribution,
                    'expected_return': expectedReturn * 100
                }
            });
        }
        
        // Calculate years to retirement (age 60)
        const yearsToRetirement = 60 - currentAge;
        const monthsToRetirement = yearsToRetirement * 12;
        
        // Calculate projected savings at 60 using compound interest
        // Formula: FV = PV(1+r)^n + PMT[((1+r)^n - 1)/r]
        const monthlyRate = expectedReturn / 12;
        
        let projectedSavings;
        if (expectedReturn === 0) {
            projectedSavings = currentSavings + (monthlyContribution * monthsToRetirement);
        } else {
            const futureValueCurrent = currentSavings * Math.pow(1 + monthlyRate, monthsToRetirement);
            const futureValueContributions = monthlyContribution * (Math.pow(1 + monthlyRate, monthsToRetirement) - 1) / monthlyRate;
            projectedSavings = futureValueCurrent + futureValueContributions;
        }
        
        // Determine current RIA status
        let currentRIAStatus = '';
        if (projectedSavings >= EPF_RIA_TIERS.enhanced) {
            currentRIAStatus = '🥇 Enhanced Savings Track';
        } else if (projectedSavings >= EPF_RIA_TIERS.adequate) {
            currentRIAStatus = '🥈 Adequate Savings Track';
        } else if (projectedSavings >= EPF_RIA_TIERS.basic) {
            currentRIAStatus = '🥉 Basic Savings Track';
        } else {
            currentRIAStatus = '⚠️ Below Basic Savings';
        }
        
        // Calculate additional monthly savings needed for target tier
        const targetAmount = EPF_RIA_TIERS[targetTier];
        let additionalSavingsNeeded = 0;
        
        if (projectedSavings < targetAmount) {
            const shortfall = targetAmount - projectedSavings;
            if (expectedReturn === 0) {
                additionalSavingsNeeded = shortfall / monthsToRetirement;
            } else {
                additionalSavingsNeeded = shortfall / ((Math.pow(1 + monthlyRate, monthsToRetirement) - 1) / monthlyRate);
            }
        }
        
        // Display results
        document.getElementById('currentRIAStatus').textContent = currentRIAStatus;
        document.getElementById('projectedSavings').textContent = formatCurrency(projectedSavings);
        document.getElementById('additionalSavingsNeeded').textContent = additionalSavingsNeeded > 0 ? formatCurrency(additionalSavingsNeeded) : 'On Track! 🎯';
        
        // Generate tier progress visualization
        generateRIATierProgress(projectedSavings);
        
        // Show loading state for explanation
        const explanationElement = document.getElementById('riaExplanation');
        explanationElement.innerHTML = '<div class="loading-explanation">🤖 Generating your personalized EPF RIA roadmap...</div>';
        
        // Generate dynamic explanation
        const calculationData = {
            currentAge,
            currentSavings,
            monthlyContribution,
            expectedReturn: expectedReturn * 100,
            yearsToRetirement,
            projectedSavings,
            targetTier,
            targetAmount,
            additionalSavingsNeeded,
            currentRIAStatus
        };
        
        try {
            const dynamicExplanation = await generateDynamicExplanation('epf-ria', calculationData);
            
            if (dynamicExplanation) {
                explanationElement.innerHTML = dynamicExplanation;
            } else {
                // Fallback to static explanation
                const staticExplanation = generateEPFRIAStaticExplanation(calculationData);
                explanationElement.innerHTML = staticExplanation;
            }
        } catch (error) {
            console.error('Error generating explanation:', error);
            const staticExplanation = generateEPFRIAStaticExplanation(calculationData);
            explanationElement.innerHTML = staticExplanation;
        }
        
        // Show results with animation
        const resultSection = document.getElementById('riaResult');
        resultSection.style.display = 'block';
        resultSection.classList.add('success-animation');
        
        // Scroll to results
        resultSection.scrollIntoView({ behavior: 'smooth' });
        
    } catch (error) {
        console.error('Error in EPF RIA calculation:', error);
        alert('An error occurred during calculation. Please try again.');
    } finally {
        setCalculateButtonLoading('.tab-content.active .calculate-btn', false, 'Calculate My RIA Status! 📈', '');
    }
}

// Generate RIA Tier Progress Visualization
function generateRIATierProgress(projectedSavings) {
    const progressContainer = document.getElementById('riaTierProgress');
    progressContainer.innerHTML = '';
    
    const tiers = [
        { name: 'Basic Savings', amount: EPF_RIA_TIERS.basic, icon: '🥉' },
        { name: 'Adequate Savings', amount: EPF_RIA_TIERS.adequate, icon: '🥈' },
        { name: 'Enhanced Savings', amount: EPF_RIA_TIERS.enhanced, icon: '🥇' }
    ];
    
    tiers.forEach(tier => {
        const progressPercentage = Math.min((projectedSavings / tier.amount) * 100, 100);
        const isAchieved = projectedSavings >= tier.amount;
        const statusClass = isAchieved ? 'achieved' : (progressPercentage > 0 ? 'in-progress' : 'not-started');
        const statusText = isAchieved ? 'Achieved! ✅' : (progressPercentage > 0 ? `${progressPercentage.toFixed(1)}% Complete` : 'Not Started');
        
        const progressBar = document.createElement('div');
        progressBar.className = 'tier-progress-bar';
        progressBar.innerHTML = `
            <div class="tier-progress-header">
                <span class="tier-progress-name">${tier.icon} ${tier.name}</span>
                <span class="tier-progress-amount">${formatCurrency(tier.amount)}</span>
            </div>
            <div class="progress-bar-container">
                <div class="progress-bar-fill" style="width: ${progressPercentage}%"></div>
            </div>
            <div class="tier-status ${statusClass}">${statusText}</div>
        `;
        
        progressContainer.appendChild(progressBar);
    });
}

// Generate static explanation for EPF RIA
function generateEPFRIAStaticExplanation(data) {
    const tierMessages = {
        basic: 'covers essential retirement needs',
        adequate: 'provides a reasonable standard of living',
        enhanced: 'supports financial independence and higher quality of life'
    };
    
    const projectionMessage = data.projectedSavings >= data.targetAmount 
        ? `Excellent! You're on track to achieve ${data.targetTier} savings by age 60.`
        : `You need to increase your monthly savings by RM${formatNumber(Math.round(data.additionalSavingsNeeded))} to reach your ${data.targetTier} tier goal.`;
    
    let actionableAdvice = '';
    if (data.additionalSavingsNeeded > 0) {
        actionableAdvice = `
            <strong>Action Plan to Bridge the Gap:</strong>
            <ul>
                <li>Consider increasing your EPF voluntary contributions (Account 1)</li>
                <li>Maximize your annual EPF voluntary contribution tax relief (up to RM60,000)</li>
                <li>Look into EPF i-Invest or i-Saraan for potentially higher returns</li>
                <li>Review your salary increment strategy to boost EPF contributions</li>
            </ul>
        `;
    } else {
        actionableAdvice = `
            <strong>Congratulations! You're on the right track:</strong>
            <ul>
                <li>Continue your current savings pattern</li>
                <li>Consider aiming for the next tier for even better retirement security</li>
                <li>Explore EPF i-Invest for potentially higher returns on excess savings</li>
                <li>Review your plan annually and adjust for salary increases</li>
            </ul>
        `;
    }
    
    return `
        <h3>Your EPF RIA Analysis</h3>
        <p><strong>Current Projection:</strong> ${data.currentRIAStatus}</p>
        <p>${projectionMessage}</p>
        
        <strong>Your Financial Timeline:</strong>
        <ul>
            <li>Years to retirement: ${data.yearsToRetirement} years</li>
            <li>Current EPF savings: ${formatCurrency(data.currentSavings)}</li>
            <li>Monthly contribution: ${formatCurrency(data.monthlyContribution)}</li>
            <li>Projected savings at 60: ${formatCurrency(data.projectedSavings)}</li>
            <li>Target tier: ${data.targetTier} savings (${tierMessages[data.targetTier]})</li>
        </ul>
        
        ${actionableAdvice}
        
        <strong>EPF RIA Framework Benefits:</strong>
        <ul>
            <li>Clear retirement savings benchmarks based on Malaysian living costs</li>
            <li>Graduated approach allowing flexible retirement lifestyle planning</li>
            <li>Integration with existing EPF dividend and investment schemes</li>
            <li>Regular framework updates every 3 years to stay relevant</li>
        </ul>
        
        <p><em><strong>Note:</strong> The EPF RIA Framework officially launches in January 2026. Current calculations are based on the announced framework. This analysis provides general guidance only - please consult with EPF directly or a qualified financial planner for personalized advice.</em></p>
    `;
}

// Create prompts for different calculation types
function createPromptForCalculation(type, data) {
    if (type === 'epf-ria') {
        const tierDescription = {
            basic: 'Basic Savings (essential needs)',
            adequate: 'Adequate Savings (reasonable living standard)',
            enhanced: 'Enhanced Savings (financial independence)'
        };
        
        return `Provide a SHORT EPF RIA analysis for a ${data.currentAge}-year-old Malaysian planning for retirement using the new EPF Retirement Income Adequacy Framework.

Key numbers:
- Current EPF savings: RM${Math.round(data.currentSavings).toLocaleString()}
- Monthly contribution: RM${Math.round(data.monthlyContribution).toLocaleString()}
- Target tier: ${tierDescription[data.targetTier]} (RM${Math.round(data.targetAmount).toLocaleString()})
- Projected savings at 60: RM${Math.round(data.projectedSavings).toLocaleString()}
- Additional monthly savings needed: RM${Math.round(data.additionalSavingsNeeded).toLocaleString()}

Format with HTML tags. Include:
- Assessment of their current EPF RIA trajectory
- 2-3 specific Malaysian EPF strategies (voluntary contributions, i-Invest, i-Saraan)
- One actionable next step for their specific situation
- EPF RIA framework consultation disclaimer

Keep it under 250 words with an encouraging, professional tone in proper English.`;
    } else if (type === 'retirement') {
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

Keep it under 250 words with an encouraging, professional tone in proper English.`;
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

Keep it under 250 words with a practical, professional tone in proper English.`;
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

// Button state management for loading states
function setCalculateButtonLoading(buttonSelector, isLoading, originalText, loadingText) {
    const button = document.querySelector(buttonSelector);
    if (!button) return;
    
    if (isLoading) {
        button.disabled = true;
        button.style.opacity = '0.7';
        button.style.cursor = 'not-allowed';
        button.innerHTML = loadingText;
    } else {
        button.disabled = false;
        button.style.opacity = '1';
        button.style.cursor = 'pointer';
        button.innerHTML = originalText;
    }
}

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
    
    document.getElementById('epf-ria').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            calculateEPFRIA();
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
    
    // EPF RIA default values
    document.getElementById('riaCurrentAge').value = 30;
    document.getElementById('riaCurrentSavings').value = 80000;
    document.getElementById('riaMonthlyContribution').value = 600;
    document.getElementById('riaExpectedReturn').value = 6;
    
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