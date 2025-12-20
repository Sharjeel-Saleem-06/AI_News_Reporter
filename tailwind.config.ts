import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                background: "var(--background)",
                foreground: "var(--foreground)",
                "accent-cyan": "var(--accent-cyan)",
                "accent-purple": "var(--accent-purple)",
                "glass-bg": "var(--glass-bg)",
                "glass-border": "var(--glass-border)",
            },
        },
    },
    plugins: [],
};
export default config;
