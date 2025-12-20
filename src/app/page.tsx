import NewsDashboard from '@/components/NewsDashboard';
import { Suspense } from 'react';

export default function Home() {
    return (
        <main className="min-h-screen pb-20 relative overflow-hidden">
            {/* Background Effects */}
            <div className="fixed inset-0 pointer-events-none">
                {/* Main gradient */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-900 via-[#0a0a0a] to-[#000000]" />

                {/* Animated orbs */}
                <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-accent-purple/20 rounded-full blur-[150px] animate-pulse-slow" />
                <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-accent-cyan/15 rounded-full blur-[150px] animate-pulse-slow" style={{ animationDelay: '2s' }} />

                {/* Grid pattern */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />

                {/* Scanline effect */}
                <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,0,0,0.1)_2px,rgba(0,0,0,0.1)_4px)] pointer-events-none opacity-20" />
            </div>

            {/* Content */}
            <div className="relative z-10">
                {/* Hero Section */}
                <section className="relative pt-12 md:pt-20 pb-6 md:pb-10 px-4 text-center overflow-hidden">
                    {/* Accent glow */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-accent-purple/20 blur-[120px] rounded-full opacity-30 pointer-events-none" />

                    <div className="relative z-10 max-w-4xl mx-auto">
                        {/* Live Badge */}
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-panel text-accent-cyan text-xs font-bold tracking-wider mb-6 animate-fade-in-up">
                            <span className="relative flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
                            </span>
                            VIBE CODER INTEL • FRESH DAILY
                        </div>

                        {/* Main Title */}
                        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black mb-4 tracking-tight leading-[1.1]">
                            <span className="bg-clip-text text-transparent bg-gradient-to-br from-white via-gray-200 to-gray-500">
                                AI Dev
                            </span>
                            {' '}
                            <span className="text-gradient">Updates</span>
                        </h1>

                        {/* Subtitle */}
                        <p className="text-base md:text-lg text-gray-400 max-w-2xl mx-auto mb-6 leading-relaxed">
                            Fresh AI news for developers. Model launches, IDE updates, 
                            <span className="text-white font-medium"> Cursor</span>, 
                            <span className="text-white font-medium"> Claude</span>, 
                            <span className="text-white font-medium"> GPT</span> — 
                            everything you need to stay ahead.
                        </p>

                        {/* Feature Pills */}
                        <div className="flex flex-wrap items-center justify-center gap-3 text-xs">
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                                <span className="text-base">🚀</span>
                                <span>Model Launches</span>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                                <span className="text-base">⚡</span>
                                <span>IDE Updates</span>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
                                <span className="text-base">🤖</span>
                                <span>AI Agents</span>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20">
                                <span className="text-base">📰</span>
                                <span>Last 3 Days</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* News Dashboard */}
                <Suspense fallback={<DashboardSkeleton />}>
                    <NewsDashboard />
                </Suspense>

                {/* Footer */}
                <footer className="mt-16 py-6 text-center border-t border-white/5">
                    <div className="max-w-4xl mx-auto px-4">
                        <p className="text-gray-500 text-sm mb-3">
                            Powered by <span className="text-accent-cyan">Groq Llama 3</span> • Curated for Vibe Coders
                        </p>
                        <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-gray-600">
                            <span>OpenAI</span>
                            <span>Anthropic</span>
                            <span>Google AI</span>
                            <span>GitHub</span>
                            <span>Vercel</span>
                            <span>LangChain</span>
                            <span>+15 more</span>
                        </div>
                    </div>
                </footer>
            </div>
        </main>
    );
}

function DashboardSkeleton() {
    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="h-12 w-full rounded-xl bg-white/5 animate-pulse mb-8" />
            <div className="h-48 w-full rounded-xl bg-white/5 animate-pulse mb-8" />
            <div className="flex gap-4 justify-center mb-10">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-10 w-24 rounded-xl bg-white/5 animate-pulse" />
                ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-72 rounded-2xl bg-white/5 animate-pulse" />
                ))}
            </div>
        </div>
    );
}
