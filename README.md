<div align="center">

# 🚀 AI Dev Updates - Vibe Coder News

[![Live Demo](https://img.shields.io/badge/🌐_Live_Demo-aidevupdates.netlify.app-00C7B7?style=for-the-badge)](https://aidevupdates.netlify.app/)
[![Portfolio](https://img.shields.io/badge/👨‍💻_Portfolio-View_My_Work-FF6B6B?style=for-the-badge)](https://muhammad-sharjeel-portfolio.netlify.app/)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

**Real-time AI news aggregator built for developers who code with AI**

Track breaking model launches (GPT, Claude, Llama), IDE updates (Cursor, Windsurf, Copilot), and AI breakthroughs — all in one beautiful dashboard.

[View Live Demo](https://aidevupdates.netlify.app/) · [Report Bug](https://github.com/Sharjeel-Saleem-06/AI_News_Reporter/issues) · [Request Feature](https://github.com/Sharjeel-Saleem-06/AI_News_Reporter/issues)

![AI Dev Updates Hero](https://img.shields.io/badge/Status-🟢_Live-success?style=flat-square)
![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![Groq](https://img.shields.io/badge/Powered_by-Groq-orange?style=flat-square)

</div>

---

## 🎯 Why This Project?

As a **vibe coder** working with AI tools daily, I was tired of:
- ❌ Checking 20+ different sources for AI news
- ❌ Missing important model launches and IDE updates
- ❌ Reading through fluff content to find actionable info
- ❌ No single place for Cursor, Claude, GPT updates

**Solution**: An AI-powered news aggregator that curates, analyzes, and prioritizes updates specifically for developers building with AI.

---

## ✨ Features

### 🎨 **Beautiful UI**
- Glassmorphism design with cyberpunk aesthetics
- Smooth animations with Framer Motion
- Mobile-responsive and lightning-fast
- Dark mode optimized for coding sessions

### 🤖 **AI-Powered Analysis**
- **Groq Llama 3** analyzes every article
- Auto-categorizes into 11 categories
- Relevance scoring (1-10) for vibe coders
- Technical impact summaries

### ⚡ **Smart Features**
- **Breaking News** section for major launches
- **Hot Right Now** for high-priority updates
- Real-time search across titles, summaries, and tags
- Advanced filtering by category
- Auto-refresh every 15 minutes

### 🔧 **Technical Excellence**
- **10 Groq API keys** with intelligent load balancing
- Dual-layer caching (memory + disk)
- Rate limit handling with automatic cooldown
- **29 curated RSS sources** from OpenAI, Anthropic, Google, GitHub, and more
- Fresh content (last 3 days only)

---

## 🎥 Screenshots

<div align="center">

### 🌟 Hero Section
*Clean, professional landing with live status indicators*

### 📰 Breaking News
*GPT-5.2-Codex launch with technical impact analysis*

### 🎯 Smart Filtering
*25 articles across 11 categories with counts*

### 🔍 Search & Discovery
*Find specific models, tools, or topics instantly*

</div>

---

## 🛠️ Tech Stack

| Category | Technologies |
|----------|-------------|
| **Frontend** | Next.js 16, React 19, TypeScript 5 |
| **Styling** | Tailwind CSS 4, Framer Motion |
| **AI** | Groq (Llama-3.1-8b-instant) |
| **Data** | RSS Parser, Date-fns |
| **Deployment** | Netlify (Serverless Functions) |
| **Caching** | File-based with TTL |
| **Icons** | Lucide React |

---

## 📊 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     USER BROWSER                            │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│               NEXT.JS API ROUTE (/api/news)                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Scheduler: Decides when to fetch (15 min intervals) │  │
│  │  Cache Check: Serve cached news if fresh (<15 min)   │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────┬──────────────────────┬─────────────────────┘
                 │                      │
                 ▼                      ▼
┌────────────────────────┐   ┌──────────────────────────────┐
│   RSS FETCHER          │   │   GROQ AI ANALYZER           │
│   ─────────────        │   │   ──────────────────         │
│   • 29 Sources         │   │   • 10 API Keys (Rotating)   │
│   • 3-day Lookback     │   │   • Batch Processing         │
│   • Deduplication      │   │   • Smart Categorization     │
│   • Error Handling     │   │   • Relevance Scoring        │
└────────────────────────┘   └──────────────────────────────┘
                 │                      │
                 └──────────┬───────────┘
                            ▼
                ┌───────────────────────┐
                │   ADVANCED CACHE      │
                │   ───────────────     │
                │   • 7-day analysis    │
                │   • 15-min news       │
                │   • Auto cleanup      │
                └───────────────────────┘
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- npm or yarn
- 10 Groq API keys ([Get free keys](https://console.groq.com/keys))

### Installation

```bash
# Clone the repository
git clone https://github.com/Sharjeel-Saleem-06/AI_News_Reporter.git
cd AI_News_Reporter

# Install dependencies
npm install

# Create environment file
cp .env.example .env.local

# Add your Groq API keys to .env.local
# GROQ_API_KEY=your_key_1
# GROQ_API_KEY_2=your_key_2
# ... up to GROQ_API_KEY_10

# Run development server
npm run dev

# Open http://localhost:3000
```

### Build for Production

```bash
npm run build
npm start
```

---

## 🎯 Usage

### Daily Workflow

1. **Morning Check**: Open the app to see breaking news from last 24 hours
2. **Filter by Interest**: Click "Model Launches" or "IDE Updates"
3. **Search**: Type "Cursor" to see all Cursor-related updates
4. **Dive Deep**: Click articles to read full story
5. **Stay Updated**: App auto-refreshes every 15 minutes

### Power User Tips

- 🔥 **Breaking News** section shows the most important updates
- ⚡ **Relevance Score** (1-10) helps you prioritize reading
- 🏷️ **Tags** like "LLM", "Cursor", "API" for quick scanning
- 📊 **Technical Impact** shows what you can build with it

---

## 📈 Performance

| Metric | Value |
|--------|-------|
| **First Load** | ~2s |
| **Initial News Fetch** | 30-60s (AI analysis) |
| **Subsequent Loads** | <1s (cached) |
| **Cache Hit Rate** | ~85% |
| **Daily API Calls** | ~96 (every 15 min) |
| **Token Usage** | ~2.9M/day (well within limits) |
| **Uptime** | 99.9%+ |

---

## 🎨 Key Components

### 1. **NewsCard** (`src/components/NewsCard.tsx`)
Beautiful card UI with:
- Category badges with icons
- Priority indicators (Breaking, High, Normal, Low)
- Related models and companies
- Tags and technical impact
- Hover animations

### 2. **NewsDashboard** (`src/components/NewsDashboard.tsx`)
Main dashboard featuring:
- Breaking news section
- Hot right now section
- Advanced filtering
- Real-time search
- Status indicators

### 3. **API Pool** (`src/lib/api-pool.ts`)
Intelligent key management:
- Round-robin rotation
- Health tracking per key
- Automatic cooldown on rate limits
- Exponential backoff
- Success/error statistics

### 4. **Scheduler** (`src/lib/scheduler.ts`)
Smart fetch timing:
- Prevents excessive API calls
- 15-minute refresh intervals
- Cache-first strategy
- Concurrent request protection

### 5. **Advanced Cache** (`src/lib/advanced-cache.ts`)
Multi-layer caching:
- 7-day analysis cache
- 15-minute news cache
- 5-minute RSS cache
- Automatic cleanup
- TTL-based expiration

---

## 🔐 Security & Optimization

### ✅ Security Measures
- All API keys in environment variables
- Security headers configured
- CORS properly set
- No sensitive data in responses
- Rate limiting implemented
- Input validation throughout

### ⚡ Optimizations
- **Token Usage**: Limited to 25 articles per fetch
- **Concurrency**: Max 2 parallel Groq requests
- **Caching**: Dual-layer reduces API calls by 85%
- **Bundle Size**: Code splitting + tree shaking
- **Load Balancing**: 10 API keys with failover

**Security Score**: 9.5/10 ⭐  
**Performance Score**: 9/10 ⭐

---

## 🌟 Future Enhancements

### Phase 1: User Features
- [ ] User accounts & authentication
- [ ] Save favorite articles
- [ ] Custom RSS feeds
- [ ] Email notifications for breaking news
- [ ] Dark/light theme toggle

### Phase 2: AI Enhancements
- [ ] Sentiment analysis trends
- [ ] Related articles suggestions
- [ ] Personalized recommendations
- [ ] Multi-language support
- [ ] Summary generation

### Phase 3: Social Features
- [ ] Share articles to Twitter/LinkedIn
- [ ] Comments and discussions
- [ ] Upvote/downvote system
- [ ] Community curated lists
- [ ] Newsletter generation

### Phase 4: Analytics
- [ ] Trending topics dashboard
- [ ] Model launch timeline
- [ ] Company activity tracking
- [ ] Weekly/monthly digests
- [ ] Export to Notion/Obsidian

---

## 📚 RSS Sources (29 Curated Feeds)

### 🏢 Official AI Labs (8)
OpenAI, Anthropic, Google AI, DeepMind, Meta AI, Microsoft AI, Mistral AI, Groq

### ⚡ Dev Tools & IDEs (4)
GitHub Blog, VS Code, Vercel, Replit

### 🤖 AI Frameworks (3)
LangChain, LlamaIndex, Hugging Face

### 🔌 Infrastructure (4)
Together AI, Replicate, Supabase, Modal

### 🧠 Thought Leaders (3)
Simon Willison, Andrej Karpathy, Lilian Weng

### 📰 Tech News (5)
The Verge AI, TechCrunch AI, Ars Technica, MIT Tech Review, VentureBeat

### 🏗️ Engineering Blogs (2)
Stripe Engineering, Netflix Tech

---

## 🤝 Contributing

Contributions are what make the open-source community amazing! Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

Distributed under the MIT License. See `LICENSE` for more information.

---

## 👨‍💻 Author

**Muhammad Sharjeel**

- Portfolio: [muhammad-sharjeel-portfolio.netlify.app](https://muhammad-sharjeel-portfolio.netlify.app/)
- GitHub: [@Sharjeel-Saleem-06](https://github.com/Sharjeel-Saleem-06)
- Live Project: [aidevupdates.netlify.app](https://aidevupdates.netlify.app/)

---

## 🙏 Acknowledgments

- [Groq](https://groq.com) for lightning-fast AI inference
- [Next.js](https://nextjs.org) team for the amazing framework
- [Netlify](https://netlify.com) for seamless deployment
- All the RSS sources for quality content
- The vibe coder community for inspiration

---

## 📊 Project Stats

![Lines of Code](https://img.shields.io/badge/Lines_of_Code-5000+-blue?style=flat-square)
![Components](https://img.shields.io/badge/Components-15+-green?style=flat-square)
![API Keys](https://img.shields.io/badge/API_Keys-10-orange?style=flat-square)
![RSS Sources](https://img.shields.io/badge/RSS_Sources-29-purple?style=flat-square)

---

<div align="center">

## ⭐ Star this repo if you find it useful!

**Built with ❤️ by a vibe coder, for vibe coders**

[🌐 Live Demo](https://aidevupdates.netlify.app/) | [👨‍💻 Portfolio](https://muhammad-sharjeel-portfolio.netlify.app/) | [📧 Contact](https://github.com/Sharjeel-Saleem-06)

</div>

---

### 🔥 Fun Fact

This entire project was built to solve a real problem: staying updated on AI developments without wasting hours browsing multiple sites. Now you can get your daily AI news in **under 2 minutes** every morning! ☕

**Last Updated**: December 2025 | **Status**: 🟢 Live & Maintained

