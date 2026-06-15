/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,js,jsx}"
  ],
  theme: {
    extend: {
      // ── "Tech Premium" dark + indigo palette (named tokens, never hardcode hex) ──
      colors: {
        background: '#0F172A',        // page background
        surface: '#1E293B',           // cards, panels, inputs-on-surface
        'surface-raised': '#243049',  // hover fills, secondary buttons, steppers
        'row-hover': '#223049',       // table row hover

        primary: '#6366F1',           // primary accent
        'primary-hover': '#818CF8',   // accent hover
        'primary-soft': 'rgba(99, 102, 241, 0.15)', // tinted accent bg / active chips
        'primary-light': '#A5B4FC',   // light indigo text
        'primary-lighter': '#C7D2FE', // lighter indigo text / badges

        content: '#F1F5F9',           // primary text
        muted: '#94A3B8',             // secondary text
        dim: '#64748B',               // tertiary / meta / placeholder

        line: '#334155',              // default borders
        'line-subtle': '#283548',     // hairline dividers between rows
        'line-aria': '#2A3854',       // aria panel border / bubble borders

        success: '#10B981',
        'success-text': '#34D399',
        warning: '#FCD34D',
        error: '#F43F5E',
        'error-text': '#FDA4AF',
      },
      fontFamily: {
        sans: ['Geist', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"Geist Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      borderRadius: {
        card: '16px',     // cards / panels
        'card-lg': '18px', // large hero / auth cards
        panel: '20px',    // aria panel
        btn: '12px',      // buttons
      },
      boxShadow: {
        'card-hover': '0 14px 36px rgba(0, 0, 0, 0.4)',
        auth: '0 24px 60px rgba(0, 0, 0, 0.4)',
        aria: '0 24px 80px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(99, 102, 241, 0.12)',
        fab: '0 10px 34px rgba(99, 102, 241, 0.45)',
        toast: '0 16px 40px rgba(0, 0, 0, 0.5)',
      },
      backgroundImage: {
        'logo-gradient': 'linear-gradient(135deg, #6366F1, #818CF8)',
        'avatar-stage':
          'radial-gradient(300px 210px at 50% 92%, rgba(99,102,241,.3), rgba(15,23,42,0) 72%), linear-gradient(180deg, #141E38, #0F172A)',
        'auth-glow':
          'radial-gradient(640px 420px at 50% -5%, rgba(99,102,241,.14), rgba(15,23,42,0))',
      },
      gridTemplateRows: {
        '[auto,auto,1fr]': 'auto auto 1fr',
      },
      keyframes: {
        'viss-ping': {
          '0%': { transform: 'scale(1)', opacity: '0.7' },
          '100%': { transform: 'scale(1.8)', opacity: '0' },
        },
        'viss-bounce': {
          '0%, 80%, 100%': { transform: 'translateY(0)', opacity: '0.45' },
          '40%': { transform: 'translateY(-4px)', opacity: '1' },
        },
        'viss-fade-up': {
          from: { transform: 'translateY(10px)' },
          to: { transform: 'translateY(0)' },
        },
        'viss-pulse': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.4' },
        },
      },
      animation: {
        'ring-fab': 'viss-ping 2.6s ease-out infinite',
        'ring-mic': 'viss-ping 1.4s ease-out infinite',
        'dot-bounce': 'viss-bounce 1.2s infinite',
        'fade-up': 'viss-fade-up 0.25s ease-out',
        'pulse-dot': 'viss-pulse 1.6s ease-in-out infinite',
      },
    },
  },
  plugins: [require('@tailwindcss/aspect-ratio'), require('@tailwindcss/forms')],
}
