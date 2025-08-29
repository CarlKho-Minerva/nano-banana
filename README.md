# Pixel AI Photoshop 🍌✨

> **Magic Eraser for All Your Photos** - Professional AI-powered photo editing with Google Pixel-like features for everyone.

[![Live Demo](https://img.shields.io/badge/Live_Demo-🚀_Try_Now-blue?style=for-the-badge)](https://nanobanana.vercel.app)
[![License](https://img.shields.io/badge/License-Apache_2.0-green?style=for-the-badge)](LICENSE)

## ✨ Features

- **🎯 Magic Eraser** - Remove unwanted objects with AI precision
- **🔄 Before/After Slider** - Interactive comparison tool
- **💳 Secure Payments** - Stripe-powered credit system
- **📱 Responsive Design** - Works perfectly on all devices
- **🔒 Privacy First** - No data stored, secure processing
- **⚡ Fast Processing** - Powered by Google Gemini AI

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Stripe account (for payments)
- Google Gemini API key

### Frontend Setup
```bash
# Clone the repository
git clone https://github.com/your-username/nano-banana.git
cd nano-banana

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your API keys

# Start development server
npm run dev
```

### Backend Setup
```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Start server
npm start
```

## 🔧 Environment Variables

### Frontend (.env)
```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_key
VITE_BACKEND_URL=http://localhost:3001
```

### Backend (.env)
```env
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
GEMINI_API_KEY=your_gemini_api_key
FRONTEND_URL=http://localhost:5173
PORT=3001
```

## 🏗️ Architecture

- **Frontend**: React + TypeScript + Vite
- **Backend**: Node.js + Express
- **AI Processing**: Google Gemini API
- **Payments**: Stripe Checkout
- **Deployment**: Vercel (Frontend) + Render (Backend)

## 💳 Payment Flow

1. Users get 3 free credits to start
2. Additional credits available via Stripe Checkout
3. Secure session management preserves work during payment
4. Automatic credit deduction per AI operation

## 🔒 Security

- API keys secured server-side only
- Input validation and sanitization
- XOR-encrypted local storage
- No sensitive data persistence
- Secure payment processing via Stripe

## 🚀 Deployment

### Frontend (Vercel)
```bash
npm run build
# Deploy to Vercel via GitHub integration
```

### Backend (Render)
- Connect GitHub repository
- Set environment variables
- Deploy with automatic builds

## 📖 API Reference

### POST `/api/create-checkout-session`
Creates Stripe checkout session for credit purchase.

### POST `/api/gemini/edit`
Processes image editing via Gemini AI (authenticated).

### GET `/api/user/:userId/credits`
Retrieves user's current credit balance.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Google Gemini AI for image processing
- Stripe for secure payment processing
- Unsplash photographers for demo images

---

<div align="center">
  <strong>Made with ❤️ by the NanoBanana team</strong>
</div>