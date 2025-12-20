import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
    subsets: ["latin"],
    variable: "--font-inter",
    display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
    subsets: ["latin"],
    variable: "--font-mono",
    display: "swap",
});

export const metadata: Metadata = {
    title: "AI Dev Updates | Vibe Coder News",
    description: "Daily AI news for developers. Track model launches (GPT, Claude, Llama), IDE updates (Cursor, Copilot, Windsurf), and AI agent frameworks. Stay ahead as a vibe coder.",
    keywords: [
        "AI news",
        "vibe coding",
        "Cursor IDE",
        "GitHub Copilot",
        "Windsurf",
        "GPT-4",
        "Claude 3.5",
        "Llama 3",
        "LLM",
        "AI agents",
        "LangChain",
        "OpenAI",
        "Anthropic",
    ],
    authors: [{ name: "AI Dev Updates" }],
    creator: "AI Dev Updates",
    openGraph: {
        title: "AI Dev Updates | Vibe Coder News",
        description: "Daily AI news for developers. Model launches, IDE updates, and more.",
        type: "website",
        locale: "en_US",
    },
    twitter: {
        card: "summary_large_image",
        title: "AI Dev Updates",
        description: "Daily AI news for vibe coders",
    },
    robots: {
        index: true,
        follow: true,
    },
};

export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
    themeColor: "#0a0a0a",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className="dark">
            <body
                className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased bg-background text-foreground`}
            >
                {children}
            </body>
        </html>
    );
}
