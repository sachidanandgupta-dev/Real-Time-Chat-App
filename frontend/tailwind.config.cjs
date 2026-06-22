/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: "#0b0d12",
        panel: "#12151c",
        elevated: "#1b1f29",
        "elevated-2": "#232838",
        hairline: "#262b36",
        text: "#edeff3",
        "text-muted": "#8a91a3",
        "text-faint": "#565d6e",
        accent: "#ff7a59",
        "accent-dim": "#c75b3f",
        online: "#34d399",
      },
      fontFamily: {
        display: '"Space Grotesk", "Inter", sans-serif',
        body: '"Inter", sans-serif',
        mono: '"JetBrains Mono", monospace',
      },
    },
  },
  plugins: [],
}
