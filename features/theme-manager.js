class ThemeManager {
  constructor() {
    this.themes = {
      light: this.getLightTheme(),
      dark: this.getDarkTheme(),
      custom: this.loadCustomTheme()
    };
    this.currentTheme = 'light';
  }

  getLightTheme() {
    return {
      colors: {
        primary: '#007bff',
        secondary: '#6c757d',
        background: '#ffffff',
        surface: '#f8f9fa',
        text: '#212529',
        border: '#dee2e6'
      },
      spacing: {
        small: '8px',
        medium: '16px',
        large: '24px'
      },
      typography: {
        fontFamily: '"Segoe UI", system-ui, sans-serif',
        fontSize: {
          small: '12px',
          medium: '14px',
          large: '16px',
          xlarge: '20px'
        }
      },
      shadows: {
        small: '0 2px 4px rgba(0,0,0,0.1)',
        medium: '0 4px 6px rgba(0,0,0,0.1)',
        large: '0 8px 16px rgba(0,0,0,0.1)'
      }
    };
  }

  getDarkTheme() {
    return {
      colors: {
        primary: '#0d6efd',
        secondary: '#6c757d',
        background: '#212529',
        surface: '#343a40',
        text: '#f8f9fa',
        border: '#495057'
      },
      spacing: {
        small: '8px',
        medium: '16px',
        large: '24px'
      },
      typography: {
        fontFamily: '"Segoe UI", system-ui, sans-serif',
        fontSize: {
          small: '12px',
          medium: '14px',
          large: '16px',
          xlarge: '20px'
        }
      },
      shadows: {
        small: '0 2px 4px rgba(0,0,0,0.2)',
        medium: '0 4px 6px rgba(0,0,0,0.2)',
        large: '0 8px 16px rgba(0,0,0,0.2)'
      }
    };
  }

  applyTheme(themeName) {
    const theme = this.themes[themeName];
    if (!theme) return;

    this.currentTheme = themeName;
    this.updateCustomProperties(theme);
    this.saveThemePreference(themeName);
  }

  updateCustomProperties(theme) {
    const root = document.documentElement;

    // Colors
    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value);
    });

    // Spacing
    Object.entries(theme.spacing).forEach(([key, value]) => {
      root.style.setProperty(`--spacing-${key}`, value);
    });

    // Typography
    root.style.setProperty('--font-family', theme.typography.fontFamily);
    Object.entries(theme.typography.fontSize).forEach(([key, value]) => {
      root.style.setProperty(`--font-size-${key}`, value);
    });

    // Shadows
    Object.entries(theme.shadows).forEach(([key, value]) => {
      root.style.setProperty(`--shadow-${key}`, value);
    });
  }

  saveThemePreference(themeName) {
    localStorage.setItem('preferred-theme', themeName);
  }

  loadCustomTheme() {
    const saved = localStorage.getItem('custom-theme');
    return saved ? JSON.parse(saved) : this.getLightTheme();
  }

  saveCustomTheme(theme) {
    this.themes.custom = theme;
    localStorage.setItem('custom-theme', JSON.stringify(theme));
  }
}