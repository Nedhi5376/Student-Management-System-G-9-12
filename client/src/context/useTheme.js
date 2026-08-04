import { useContext } from 'react';
import { ThemeContext } from '../context/theme-context.js';

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used inside a ThemeProvider');
  return context;
}