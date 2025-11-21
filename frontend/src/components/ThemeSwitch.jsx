import { useEffect, useState } from 'react';

export default function ThemeSwitch() {
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    const saved = localStorage.getItem('theme');

    if (saved) {
      setTheme(saved);
      document.documentElement.classList.toggle('dark', saved === 'dark');
    } else {
      const systemDark = window.matchMedia(
        '(prefers-color-scheme: dark)'
      ).matches;
      setTheme(systemDark ? 'dark' : 'light');
      document.documentElement.classList.toggle('dark', systemDark);
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';

    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);

    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  return (
    <button
      onClick={toggleTheme}
      className="w-14 h-8 flex items-center rounded-full p-1 
                 bg-gray-300 dark:bg-gray-700 transition-all duration-300"
    >
      <div
        className={`w-6 h-6 bg-white dark:bg-gray-300 rounded-full shadow-md 
                    transform transition-all duration-300 ${
                      theme === 'dark' ? 'translate-x-6' : ''
                    }`}
      ></div>
    </button>
  );
}
