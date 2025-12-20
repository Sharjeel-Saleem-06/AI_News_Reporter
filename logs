# DocConverter Pro — AI-Powered Document Platform

Modern document conversion and AI editing platform with 26+ formats, intelligent document processing, and real-time collaboration features.

## 🌟 Live Demo
- 🚀 **Production**: https://docconverter-pro-app.netlify.app/

## ✨ Features

### 📄 Document Conversion
- **26+ format conversions**: PDF, DOCX, XLSX, PPTX, images, markdown, and more
- **Batch processing**: convert multiple files simultaneously
- **ZIP download**: bundle converted files for easy distribution
- **Smart format detection**: auto-detects file types from content
- **Conversion history**: track, re-download, or manage past conversions
- **Client-side processing**: files never leave your browser for privacy

### 🤖 AI Document Editor
- **LLM-powered editing**: Grammar fixes, tone adjustments, text expansion/summarization
- **Real-time streaming**: see AI suggestions as they're generated
- **Multiple AI actions**: Fix grammar, change tone (professional/casual/formal), expand/shorten text
- **Smart suggestions**: context-aware writing improvements
- **Content generation**: Quick templates for emails, tweets, LinkedIn posts
- **Document analysis**: readability scores, sentiment analysis, key topics extraction
- **Multi-language support**: translate documents to 15+ languages
- **Writing styles**: apply different writing styles (professional, creative, technical, academic)

### 👤 User Management
- **Supabase Authentication**: secure user accounts and data storage
- **Profile management**: track conversion history and preferences
- **Document history**: access all your converted files
- **Settings**: customize your experience

### 🎨 User Experience
- **Modern UI**: clean, intuitive interface with TailwindCSS + shadcn/ui
- **Dark/light mode**: seamless theme switching
- **Drag-and-drop**: easy file uploads
- **Progress feedback**: real-time conversion status
- **Responsive design**: works perfectly on mobile, tablet, and desktop
- **Smooth animations**: Framer Motion for polished transitions

## 🛠️ Technology Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **Build tool**: Vite for lightning-fast development
- **Routing**: React Router v6

### UI & Styling
- **CSS Framework**: TailwindCSS
- **Components**: shadcn/ui (Radix UI)
- **Animations**: Framer Motion
- **Icons**: Lucide React

### AI & Backend
- **LLM Provider**: Groq (Llama 3.3 70B)
- **AI Framework**: LangChain.js
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth

### Conversion Libraries
- **PDF**: jsPDF, pdf-lib
- **Documents**: Mammoth (DOCX), XLSX, Papa Parse (CSV)
- **Images**: html2canvas, image compression
- **Markdown**: markdown-it
- **Compression**: JSZip

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account (for auth & database)
- Groq API key (for AI features)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/DocConverter.git
cd DocConverter

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env with your keys:
# - VITE_SUPABASE_URL=your-supabase-project-url
# - VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
# - VITE_GROQ_API_KEY=your-groq-api-key

# Run database migrations
# Go to Supabase Dashboard → SQL Editor
# Run the SQL from supabase-schema.sql

# Start development server
npm run dev        # http://localhost:5173

# Build for production
npm run build      # outputs to dist/

# Preview production build
npm run preview
```

### Environment Variables

Required environment variables (see `.env.example`):

```bash
# Supabase (Authentication & Database)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Groq AI (LLM for AI features)
VITE_GROQ_API_KEY=gsk_your-api-key
VITE_GROQ_MODEL=llama-3.3-70b-versatile

# Optional: LangChain debugging
VITE_LANGCHAIN_TRACING_V2=false
VITE_LANGCHAIN_PROJECT=doc-editor-ai
```

## 📁 Project Structure

```
DocConverter/
├── public/              # Static assets
│   ├── images/          # App images
│   ├── logo.svg
│   └── _redirects       # Netlify redirects
├── src/
│   ├── components/      # React components
│   │   ├── converter/   # Conversion UI
│   │   ├── editor/      # AI Editor components
│   │   ├── layout/      # Header, Footer
│   │   └── ui/          # shadcn/ui components
│   ├── contexts/        # React contexts
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Utility libraries
│   │   ├── langchain/   # AI/LLM integration
│   │   ├── supabase.ts  # Supabase client
│   │   └── utils.ts     # Helper functions
│   ├── pages/           # Route pages
│   ├── services/        # Business logic
│   └── utils/           # Utility functions
├── .env.example         # Environment template
├── supabase-schema.sql  # Database schema
├── netlify.toml         # Netlify configuration
└── package.json         # Dependencies
```

## 🎯 Key Features Explained

### AI Document Editor
The AI editor uses Groq's Llama 3.3 model through LangChain to provide:
- **Grammar corrections** with context awareness
- **Tone adjustments** for different audiences
- **Content expansion** with relevant details
- **Smart summarization** keeping key points
- **Translation** to multiple languages
- **Template generation** for common document types

### Document Conversion
Supports bidirectional conversion between:
- PDF ↔ DOCX ↔ TXT ↔ Markdown
- XLSX ↔ CSV ↔ JSON
- Images ↔ PDF
- And many more combinations

### Privacy & Security
- All document conversions happen client-side
- Files never uploaded to external servers (except AI features which use Groq)
- Supabase provides secure authentication and data storage
- Environment variables keep API keys safe

## 🚢 Deployment

### Netlify (Recommended)

The project is pre-configured for Netlify deployment:

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Deploy
netlify deploy --prod
```

Or connect your GitHub repository to Netlify for automatic deployments.

**Important**: Add environment variables in Netlify Dashboard:
- Site settings → Build & deploy → Environment

### Other Platforms

The app works on any static hosting (Vercel, AWS S3, GitHub Pages, etc.):

```bash
npm run build
# Deploy the dist/ folder
```

## 📊 Database Setup

1. Create a Supabase project at https://supabase.com
2. Go to SQL Editor
3. Run the contents of `supabase-schema.sql`
4. Add your Supabase URL and anon key to `.env`

## 🤝 Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 👨‍💻 Developer

**Muhammad Sharjeel**
- Portfolio: https://muhammad-sharjeel-portfolio.netlify.app/
- Email: sharry00010@gmail.com
- GitHub: https://github.com/Sharjeel-Saleem-06

## 🙏 Acknowledgments

- shadcn/ui for beautiful components
- Groq for fast LLM inference
- Supabase for backend infrastructure
- The open-source community for amazing libraries

---

Made by Muhammad Sharjeel
