import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";

// Theme Context - Manages dark/light mode with system preference support
const ThemeContext = createContext({
  theme: "system",
  resolvedTheme: "light",
  setTheme: () => {},
  toggleTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

// Storage key for persisting user preference
const THEME_STORAGE_KEY = "cycls_theme_preference";

// Get the system preference
const getSystemTheme = () => {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

// Get stored preference or default to system
const getStoredTheme = () => {
  if (typeof window === "undefined") return "system";
  try {
    return localStorage.getItem(THEME_STORAGE_KEY) || "system";
  } catch {
    return "system";
  }
};

// Apply theme to document
const applyTheme = (theme, resolvedTheme) => {
  const root = document.documentElement;

  // Remove existing theme classes
  root.classList.remove("light", "dark");
  root.removeAttribute("data-theme");

  if (theme === "system") {
    // Let CSS media query handle it - no class needed
    // But we still set data-theme for components that need to know
    root.setAttribute("data-resolved-theme", resolvedTheme);
  } else {
    // Manual override - add class
    root.classList.add(theme);
    root.setAttribute("data-theme", theme);
    root.setAttribute("data-resolved-theme", theme);
  }
};

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState(() => getStoredTheme());
  const [resolvedTheme, setResolvedTheme] = useState(() => {
    const stored = getStoredTheme();
    return stored === "system" ? getSystemTheme() : stored;
  });

  // Update resolved theme when system preference changes
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = (e) => {
      if (theme === "system") {
        const newResolved = e.matches ? "dark" : "light";
        setResolvedTheme(newResolved);
        applyTheme("system", newResolved);
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]);

  // Apply theme on mount and when theme changes
  useEffect(() => {
    const resolved = theme === "system" ? getSystemTheme() : theme;
    applyTheme(theme, resolved);

    // Use requestAnimationFrame to defer state update
    requestAnimationFrame(() => {
      setResolvedTheme(resolved);
    });
  }, [theme]);

  // Set theme and persist
  const setTheme = useCallback((newTheme) => {
    setThemeState(newTheme);
    try {
      if (newTheme === "system") {
        localStorage.removeItem(THEME_STORAGE_KEY);
      } else {
        localStorage.setItem(THEME_STORAGE_KEY, newTheme);
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  // Toggle between light and dark (skipping system)
  const toggleTheme = useCallback(() => {
    const newTheme = resolvedTheme === "dark" ? "light" : "dark";
    setTheme(newTheme);
  }, [resolvedTheme, setTheme]);

  const value = {
    theme, // "system" | "light" | "dark"
    resolvedTheme, // "light" | "dark" (actual applied theme)
    setTheme,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

// Theme Toggle Component
export const ThemeToggle = ({ className = "" }) => {
  const { resolvedTheme, toggleTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <button
      onClick={toggleTheme}
      className={`
        theme-toggle
        inline-flex items-center justify-center
        rounded-xl p-2
        hover:bg-[var(--bg-hover)] active:bg-[var(--bg-active)]
        focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--text-primary)]/20
        transition-colors duration-200
        ${className}
      `}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Light mode" : "Dark mode"}
    >
      {isDark ? (
        // Sun icon for dark mode (click to go light)
        <svg
          className="theme-toggle-icon w-5 h-5 text-[var(--text-primary)]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2" />
          <path d="M12 20v2" />
          <path d="M4.93 4.93l1.41 1.41" />
          <path d="M17.66 17.66l1.41 1.41" />
          <path d="M2 12h2" />
          <path d="M20 12h2" />
          <path d="M6.34 17.66l-1.41 1.41" />
          <path d="M19.07 4.93l-1.41 1.41" />
        </svg>
      ) : (
        // Moon icon for light mode (click to go dark)
        <svg
          className="theme-toggle-icon w-5 h-5 text-[var(--text-primary)]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
        </svg>
      )}
    </button>
  );
};

export default ThemeContext;
