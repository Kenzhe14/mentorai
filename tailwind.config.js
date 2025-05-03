/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: 'class',
    content: [
        "./src/**/*.{js,jsx,ts,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // Primary color - Blue (#0064b5)
                primary: {
                    50: '#e6f0f9',
                    100: '#cce1f4',
                    200: '#99c3e9',
                    300: '#66a5de',
                    400: '#3387d3',
                    500: '#0064b5',
                    600: '#005091',
                    700: '#003c6d',
                    800: '#002848',
                    900: '#001424',
                    950: '#000a12',
                },
                // Dark color - Dark Gray (#212121)
                dark: {
                    50: '#f2f2f2',
                    100: '#e6e6e6',
                    200: '#cccccc',
                    300: '#b3b3b3',
                    400: '#999999',
                    500: '#808080',
                    600: '#666666',
                    700: '#4d4d4d',
                    800: '#333333',
                    900: '#212121',
                    950: '#1a1a1a',
                },
                // Base colors
                base: {
                    white: '#ffffff',
                    black: '#212121',
                }
            },
            animation: {
                'bounce-slow': 'bounce 3s linear infinite',
                'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            },
            boxShadow: {
                'inner-lg': 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
                'message': '0 2px 4px rgba(0, 0, 0, 0.1)',
            },
            borderRadius: {
                'message': '1.5rem',
            },
        },
    },
    plugins: [],
}

