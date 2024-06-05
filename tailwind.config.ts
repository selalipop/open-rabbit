import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      boxShadow: {
        'inner': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.1)', // Adjust these values to fit your design

        'dramatic': '0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -2px rgba(0, 0, 0, 0.4)',
        'inner-lifted': 'inset 0 2px 2px -3px rgba(255, 255, 255, 0.75), inset 0 4px 6px -2px rgba(255, 255, 255, 0.5)',
        'inner-depressed': 'inset 0 10px 15px -3px rgba(0, 0, 0, 0.75), inset 0 4px 6px -2px rgba(0, 0, 0, 0.5)',
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
    },
  },
  variants: {
    extend: {
      boxShadow: ['responsive', 'hover', 'focus'],
    },
  },
  plugins: [],
};
export default config;
