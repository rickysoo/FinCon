
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
        ? `Excellent! You\'re on track to achieve ${data.targetTier} savings by age 60.`
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
            <strong>Congratulations! You\'re on the right track:</strong>
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
