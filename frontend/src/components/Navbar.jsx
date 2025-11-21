import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function Header() {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setShowResults(false);
      return;
    }

    fetch('http://localhost:5000/api/cryptos')
      .then((res) => res.json())
      .then((data) => {
        const filtered = data.filter(
          (coin) =>
            coin.name.toLowerCase().includes(query.toLowerCase()) ||
            coin.symbol.toLowerCase().includes(query.toLowerCase())
        );
        setResults(filtered.slice(0, 5));
        setShowResults(true);
      })
      .catch(() => setResults([]));
  }, [query]);

  const handleSelect = (id) => {
    setQuery('');
    setShowResults(false);
    navigate(`/crypto/${id}`);
  };

  return (
    <header
      className="
        flex justify-between items-center 
        px-8 py-5 bg-[#0d1117] dark:bg-[#0d1117] 
        text-white shadow-lg relative z-50 
        transition-all duration-300 
        hover:shadow-xl hover:scale-[1.01] hover:bg-[#111520]
      "
    >
      <Link
        to="/"
        className="
    flex items-center gap-4 
    text-3xl sm:text-4xl font-extrabold 
    bg-gradient-to-r from-blue-400 to-emerald-400 
    text-transparent bg-clip-text 
    hover:scale-105 transition-all duration-300
  "
      >
        <img
          src="./logo.svg"
          alt="logo"
          className="w-20 h-20 drop-shadow-lg hover:scale-105 transition-transform duration-300"
        />
        Crypto Monitor
      </Link>
      <div className="flex items-center gap-4">
        <div className="relative w-60 sm:w-72 md:w-80">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setShowResults(true)}
            onBlur={() => setTimeout(() => setShowResults(false), 150)}
            placeholder="Search coin..."
            className="
              w-full p-2.5 rounded-lg text-sm sm:text-base font-medium
              transition-all duration-200
              bg-gray-100 dark:bg-[#1c1f26]
              text-gray-900 dark:text-gray-200
              focus:outline-none focus:ring-2 focus:ring-blue-500
              focus:bg-white dark:focus:bg-[#2a2f3a]
              hover:ring-1 hover:ring-gray-400 dark:hover:ring-gray-600
            "
          />

          {showResults && results.length > 0 && (
            <ul
              className="
                absolute bg-white dark:bg-[#161b22] rounded-lg shadow-lg mt-1 w-full z-50 
                border border-gray-200 dark:border-gray-700
                animate-fadeIn
              "
            >
              {results.map((coin) => (
                <li
                  key={coin.id}
                  onClick={() => handleSelect(coin.id)}
                  className="px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-900 dark:text-gray-200 flex items-center gap-2 transition-all"
                >
                  <img src={coin.image} alt={coin.symbol} className="w-5 h-5" />
                  {coin.name}{' '}
                  <span className="opacity-70">
                    ({coin.symbol.toUpperCase()})
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <Link
          to="/watchlist"
          className="px-4 py-2 bg-black/20 dark:bg-white/10 
             rounded-lg font-semibold hover:bg-black/30 
             dark:hover:bg-white/20 transition text-white"
        >
          Watchlist
        </Link>
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="
            flex items-center gap-2 px-4 py-2 text-base font-semibold border border-gray-500 rounded-lg
            hover:bg-gray-700 dark:hover:bg-gray-600
            active:scale-95 transition-all duration-200
          "
        >
          {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
        </button>
      </div>
    </header>
  );
}
