

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