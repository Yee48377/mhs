import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#1E293B",
        mist: "#EFF4F8",
        cloud: "#F7FAFC",
        line: "#D7E0E9",
        accent: {
          50: "#F3F8FF",
          100: "#E0ECFF",
          200: "#BED4FA",
          300: "#92B8EE",
          400: "#6E9CDC",
          500: "#4E7ABB",
          600: "#3E6499"
        }
      },
      boxShadow: {
        card: "none",
        soft: "none"
      },
      borderRadius: {
        panel: "24px"
      },
      fontFamily: {
        sans: [
          "\"SF Pro Text\"",
          "\"PingFang SC\"",
          "\"Hiragino Sans GB\"",
          "\"Microsoft YaHei\"",
          "\"Noto Sans SC\"",
          "system-ui",
          "sans-serif"
        ],
        display: [
          "\"SF Pro Display\"",
          "\"Avenir Next\"",
          "\"Segoe UI\"",
          "\"PingFang SC\"",
          "system-ui",
          "sans-serif"
        ]
      }
    }
  },
  plugins: []
};

export default config;
