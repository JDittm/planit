import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type Theme = 'purple-light' | 'warm-sunset' | 'cool-ocean';

interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setTheme] = useState<Theme>(() => {
        const stored = localStorage.getItem('app-theme') as Theme;
        return stored || 'purple-light';
    });

    useEffect(() => {
        const root = document.documentElement;
        
        // Remove all theme classes
        root.classList.remove('purple-light', 'warm-sunset', 'cool-ocean');
        
        // Add current theme class
        root.classList.add(theme);
        
        // Save to localStorage
        localStorage.setItem('app-theme', theme);
    }, [theme]);

    return (
        <ThemeContext.Provider value={{ theme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
