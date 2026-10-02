// Palet "dial jam tangan": slate = biru malam (blue dial), cyan = champagne/kuningan.
// Semua class slate-* dan cyan-* yang sudah ada di markup otomatis ikut berganti.
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,html}'],
  theme: {
    extend: {
      colors: {
        slate: {
          50: '#F4F6FA', 100: '#E8ECF3', 200: '#D3DAE6', 300: '#B2BCCF', 400: '#8693AD',
          500: '#5F6E8C', 600: '#44516D', 700: '#2E3A55', 800: '#1B2540', 900: '#111A31', 950: '#0A1226'
        },
        cyan: {
          50: '#FBF6EA', 100: '#F5EAD0', 200: '#EBD6A6', 300: '#E0C07C', 400: '#D3AB5C',
          500: '#C29A45', 600: '#8F6C23', 700: '#75571B', 800: '#573F13', 900: '#3D2C0D', 950: '#241A07'
        }
      },
      fontFamily: {
        sans: ['"Instrument Sans"', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        display: ['"Bodoni Moda"', 'Didot', 'Georgia', 'serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace']
      }
    }
  },
  plugins: []
};
