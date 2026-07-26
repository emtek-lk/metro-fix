import { jsx as _jsx } from "react/jsx-runtime";
import { useTheme } from './ThemeProvider';
export function ThemeToggle({ compact = false }) {
    const { theme, setTheme, resolvedTheme } = useTheme();
    const modeLabel = theme === 'system' ? `System (${resolvedTheme})` : theme[0].toUpperCase() + theme.slice(1);
    const icon = resolvedTheme === 'dark' ? '☾' : '☼';
    const cycleTheme = () => {
        setTheme(theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light');
    };
    return (_jsx("button", { type: "button", "aria-label": `Theme: ${modeLabel}. Click to cycle theme.`, title: `Theme: ${modeLabel}`, onClick: cycleTheme, style: styles.iconButton, children: _jsx("span", { "aria-hidden": "true", style: styles.iconGlyph, children: icon }) }));
}
const styles = {
    iconButton: {
        width: '36px',
        height: '36px',
        borderRadius: '12px',
        border: '1px solid var(--border-subtle)',
        background: 'var(--surface-strong)',
        color: 'var(--text-primary)',
        display: 'grid',
        placeItems: 'center',
        cursor: 'pointer',
        boxShadow: 'var(--shadow-elevated)',
    },
    iconGlyph: {
        fontSize: '1rem',
        lineHeight: 1,
    },
};
export default ThemeToggle;
