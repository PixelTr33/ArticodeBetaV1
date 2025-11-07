
import { createContext } from 'react';
import { Theme } from '../types';

export interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

export const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  setTheme: () => console.warn('no theme provider'),
});
