module.exports = {
    content: [
        './app/**/*.{js,ts,jsx,tsx,mdx}',
        './components/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['var(--font-geist-sans)', 'sans-serif'],
            },
            borderRadius: {
                'md': '0.375rem', // 6px
                'lg': '0.5rem',   // 8px
                'xl': '0.75rem',  // 12px
                '2xl': '0.75rem', // 12px (Hard override to max 12px)
                '3xl': '0.75rem', // 12px (Hard override to max 12px)
                'full': '9999px',
            },
            boxShadow: {
                'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                'md': '0 4px 6px -1px rgba(0, 0, 0, 0.01), 0 2px 4px -1px rgba(0, 0, 0, 0.01)',
                'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.01), 0 4px 6px -2px rgba(0, 0, 0, 0.01)',
                'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.01), 0 10px 10px -5px rgba(0, 0, 0, 0.01)',
                '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.01)', // Almost no shadows
                'none': 'none',
            },
            borderWidth: {
                DEFAULT: '1px',
                '0': '0',
                '1': '1px',
                '2': '2px',
                '4': '4px',
                '8': '8px',
            },
            borderColor: {
                DEFAULT: 'rgba(0, 0, 0, 0.05)', // Standard neutral border
            }
        },
    },
    plugins: [],
}

