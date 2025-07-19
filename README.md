# 💰 FinCon - Financial Confidence Made Easy!

A user-friendly financial calculator Progressive Web App (PWA) designed specifically for Malaysians to plan their retirement and understand loan payments. Built with vanilla HTML, CSS, and JavaScript for fast performance and native app-like experience.

## 🌟 Live Demo

**[Try FinCon Now!](https://rickysoo.github.io/FinCon/)**

📱 **Install as App**: Look for the "Install" button in your browser or "Add to Home Screen" option to install FinCon as a native app on your device!

## 🔧 Setup for Dynamic AI Explanations

FinCon now supports dynamic, personalized explanations powered by OpenAI's GPT-3.5-turbo. To enable this feature:

### Method 1: Configuration File (Recommended for developers)
1. Copy `config.example.js` to `config.js`
2. Add your OpenAI API key to the `config.js` file
3. The `config.js` file is automatically ignored by git for security

### Method 2: Browser Input (For end users)
1. Enter your API key in the input field at the top of the app
2. The key will be stored securely in your browser's localStorage
3. Clear the field to disable dynamic explanations

### Getting an OpenAI API Key
1. Visit [OpenAI Platform](https://platform.openai.com/api-keys)
2. Create an account and generate an API key
3. Add billing information (GPT-3.5-turbo costs ~$0.002 per explanation)

**Note**: Without an API key, the app works perfectly with pre-written static explanations.

## 🚀 Features

### 🏝️ Retirement Dreams Calculator
- **Retirement Corpus Calculation**: Determine how much you need to save for a comfortable retirement
- **Monthly Savings Planner**: Calculate exactly how much to save each month to reach your goal
- **Inflation Adjustment**: Accounts for Malaysia's inflation rate to give realistic projections
- **Investment Growth Modeling**: Factors in expected returns from Malaysian equity funds and investments

### 🏠 Loan Calculator
- **Monthly Payment Calculator**: Calculate your exact monthly loan payments
- **Total Interest Breakdown**: See how much interest you'll pay over the loan term
- **Amortization Schedule**: View detailed payment breakdown for the first 12 months
- **Malaysian Context**: Tailored for Malaysian banking practices and interest rates

### 📱 Progressive Web App (PWA) Features
- **Install as Native App**: Install directly from browser to home screen
- **Offline Functionality**: Works without internet connection after installation
- **App Shortcuts**: Direct shortcuts to Retirement and Loan calculators
- **Fast Loading**: Cached resources for instant access
- **Auto-Updates**: Seamless updates when new features are added

## 🎯 Benefits

### For Individuals
- **Financial Clarity**: Understand exactly how much you need to save for retirement
- **Goal Setting**: Set realistic financial goals with data-driven insights
- **Loan Planning**: Make informed decisions about home loans and financing
- **Malaysian-Specific**: Calculations tailored for Malaysian financial landscape

### For Financial Planning
- **Free Tool**: No subscription or registration required
- **Privacy-First**: All calculations done locally in your browser
- **Mobile-Friendly**: Works seamlessly on all devices
- **Educational**: Learn financial concepts through easy-to-understand explanations
- **Always Available**: Install once, use anywhere - even offline!

## 📱 How to Install & Use

### Installing as a PWA
1. **Visit** https://rickysoo.github.io/FinCon/ on your device
2. **Look for Install Prompt**: 
   - **Chrome/Edge**: Click "Install" button in address bar or banner
   - **Safari (iOS)**: Tap Share → "Add to Home Screen"
   - **Android**: Tap "Add to Home Screen" in browser menu
3. **Launch**: Open from home screen like any other app
4. **Enjoy**: Works offline and loads instantly!

### Using the Calculators

#### Retirement Calculator
1. **Enter Your Details**:
   - Current age
   - Desired retirement age
   - Monthly living expenses (in RM)
   - Expected inflation rate (default: 3%)
   - Expected investment return (default: 8%)

2. **Click "Calculate My Freedom Fund!"**

3. **Review Your Results**:
   - Total corpus needed for retirement
   - Monthly savings required
   - Future monthly expenses (inflation-adjusted)
   - Detailed action plan with Malaysian investment tips

#### Loan Calculator
1. **Enter Loan Details**:
   - Loan amount (in RM)
   - Annual interest rate (%)
   - Loan term (years)

2. **Click "Show Me My Payment Plan!"**

3. **Analyze Results**:
   - Monthly payment amount
   - Total interest over loan term
   - Total amount to be paid
   - First 12 months payment schedule

## 🔧 Technical Features

### Core Features
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile
- **Real-time Validation**: Input validation with helpful error messages
- **Keyboard Support**: Press Enter to calculate
- **Smooth Animations**: Enhanced user experience with CSS animations
- **Malaysian Ringgit Formatting**: Proper currency formatting for RM
- **Default Values**: Pre-filled with realistic Malaysian examples

### PWA Features
- **Service Worker**: Caches app for offline use
- **Web App Manifest**: Enables installation and app shortcuts
- **Install Prompts**: Guides users to install the app
- **Offline Support**: Full functionality without internet
- **Auto-Cache Updates**: Seamless updates when app changes
- **Background Sync**: Ready for future data sync features

## 🏗️ Technical Details

### Built With
- **HTML5**: Semantic structure and accessibility
- **CSS3**: Modern styling with Flexbox and Grid
- **Vanilla JavaScript**: No frameworks, pure performance
- **Google Fonts**: Poppins font for clean typography
- **PWA Technologies**: Service Worker, Web App Manifest, Cache API

### Key Calculations
- **Retirement Corpus**: Uses the 25x annual expenses rule (4% withdrawal rate)
- **Monthly Savings**: Future Value of Annuity formula
- **Loan Payments**: Standard amortization formula
- **Inflation Adjustment**: Compound growth calculations

### Browser Compatibility
- **Chrome 80+** (Full PWA support)
- **Firefox 75+** (Full PWA support)
- **Safari 13+** (Add to Home Screen support)
- **Edge 80+** (Full PWA support)
- **Samsung Internet 10+** (Full PWA support)

## 🌏 Malaysian Context

### Retirement Planning
- **EPF Integration**: Considers Malaysia's EPF system
- **Investment Options**: References Malaysian unit trusts, ETFs, and REITs
- **Inflation Rate**: Uses Malaysia's historical inflation data (2-4% annually)
- **Healthcare Costs**: Factors in Malaysian healthcare considerations

### Loan Calculations
- **Malaysian Banking**: Aligned with local banking practices
- **Interest Rates**: Reflects current Malaysian home loan rates (3.5-5.5%)
- **Loan Terms**: Common Malaysian loan periods (25-35 years)
- **Legal Considerations**: Mentions Malaysian-specific loan features

## 🎨 Design Philosophy

- **User-Friendly**: Clear, jargon-free language with Malaysian context
- **Educational**: Explains financial concepts alongside calculations
- **Encouraging**: Positive messaging to motivate financial planning
- **Accessible**: Works for users of all technical skill levels

## 📊 Easter Eggs

- Click the FinCon logo 5 times for a motivational message!
- Hover effects and smooth transitions throughout the app
- Default values pre-loaded for quick testing

## 🔒 Privacy & Security

- **No Data Collection**: All calculations performed locally
- **No Registration**: Use immediately without signing up
- **No Tracking**: Respects user privacy completely
- **Offline Capable**: Works without internet once loaded

## 🚀 Getting Started

### Web Version
1. Visit **[https://rickysoo.github.io/FinCon/](https://rickysoo.github.io/FinCon/)**
2. Choose your calculator (Retirement or Loan)
3. Enter your details
4. Get instant results and actionable insights!

### App Version (Recommended)
1. Visit **[https://rickysoo.github.io/FinCon/](https://rickysoo.github.io/FinCon/)**
2. Click "Install" when prompted (or use browser's "Add to Home Screen")
3. Launch from home screen like any other app
4. Enjoy offline access and faster loading!

## 💡 Tips for Best Results

### Retirement Planning
- Be realistic about your expected lifestyle
- Consider healthcare costs increasing with age
- Factor in inflation - money loses value over time
- Start early - compound interest is powerful
- Review and adjust your plan every 2-3 years

### Loan Planning
- Shop around for the best interest rates
- Consider making extra payments to reduce interest
- Factor in additional costs (legal fees, insurance, maintenance)
- Don't forget about property taxes and assessments

## 🤝 Contributing

This is an open-source project. Feel free to:
- Report bugs or suggest improvements
- Fork and create your own version
- Translate to other languages
- Add more financial calculators

## 📞 Support

For questions or feedback about FinCon, please visit the [GitHub repository](https://github.com/rickysoo/FinCon).

---

**Disclaimer**: This calculator provides estimates based on the inputs provided. Always consult with a qualified financial advisor for personalized financial planning advice. Past performance does not guarantee future results.

**Made with ❤️ for Malaysians** | Start your financial journey today!