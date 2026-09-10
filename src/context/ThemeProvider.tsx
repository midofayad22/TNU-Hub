import {
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import {
  ThemeContext,
  type Theme,
} from "./ThemeContext";

const storageKey = "student-platform-theme";

const getInitialTheme = (): Theme => {
  if (typeof window === "undefined") {
    return "light";
  }

  try {
    const savedTheme = localStorage.getItem(storageKey);

    if (
      savedTheme === "dark" ||
      savedTheme === "light"
    ) {
      return savedTheme;
    }
  } catch (error) {
    console.error(
      "Failed to read saved theme:",
      error
    );
  }

  return "light";
};

export function ThemeProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [theme, setThemeState] =
    useState<Theme>(getInitialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;

    try {
      localStorage.setItem(storageKey, theme);
    } catch (error) {
      console.error(
        "Failed to save theme:",
        error
      );
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setThemeState((currentTheme) =>
      currentTheme === "light"
        ? "dark"
        : "light"
    );
  }, []);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
  }, []);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        toggleTheme,
        setTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}