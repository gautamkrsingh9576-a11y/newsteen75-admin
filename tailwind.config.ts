import type { Config } from 'tailwindcss';
export default { content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'], theme: { extend: { colors: { brand: '#d3232a', ink: '#16191f' } } }, plugins: [] } satisfies Config;
