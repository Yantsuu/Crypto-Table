import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement);

export default function CryptoTable() {
  const [toast, setToast] = useState(null);
  const [cryptos, setCryptos] = useState([]);
  const [visibleCount, setVisibleCount] = useState(10);

  useEffect(() => {
    fetch('http://localhost:5000/api/cryptos')
      .then((res) => res.json())
      .then((data) => {
        console.log('BACKEND RESPONSE:', data);
        setCryptos(data);
      });
  }, []);

  async function handleTrack(coin) {
    const check = await fetch('http://localhost:5000/api/check-chat').then(
      (r) => r.json()
    );

    if (!check.chat_connected) {
      if (!localStorage.getItem('tg_opened')) {
        window.open('https://t.me/CryptoMonitorAlertBot', '_blank');
        localStorage.setItem('tg_opened', 'true');
      }

      alert('👉 Натисни /start у Telegram, щоб активувати сповіщення');
      return;
    }

    const res = await fetch('http://localhost:5000/api/tracked', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        coin_id: coin.id,
        name: coin.name,
        symbol: coin.symbol,
      }),
    });

    if (res.ok) {
      setToast(`${coin.name} added to Watchlist`);
      setTimeout(() => setToast(null), 2000);
    }
  }

  return (
    <div className="p-4 sm:p-6 w-full overflow-x-auto">
      {toast && (
        <div
          className="
            fixed top-20 right-6
            bg-green-600 text-white px-4 py-2
            rounded shadow-lg z-50 animate-fade
          "
        >
          {toast}
        </div>
      )}

      <h1 className="text-3xl font-bold mb-6 dark:text-white">Crypto Prices</h1>

      <div
        className="
          rounded-none sm:rounded-xl shadow-lg overflow-hidden 
          bg-white dark:bg-[#161b22] w-full
        "
      >
        <table className="w-full text-xs sm:text-sm md:text-base table-auto">
          <thead>
            <tr className="text-gray-600 dark:text-gray-300 text-xs sm:text-sm">
              <th className="p-4 text-left">Coin</th>
              <th className="p-4 text-left">Price</th>
              <th className="p-4 text-left">24h %</th>
              <th className="p-4 text-left">7d Chart</th>
              <th className="p-4 pr-6 text-right w-24">Track</th>
            </tr>
          </thead>

          <tbody>
            {cryptos.slice(0, visibleCount).map((c) => (
              <tr
                key={c.id}
                className="text-xs sm:text-sm md:text-base transition hover:bg-gray-100 dark:hover:bg-[#1e242b]"
              >
                <td className="px-2 sm:px-3 py-2 flex items-center gap-2">
                  <img
                    src={c.image}
                    alt={c.name}
                    className="w-4 h-4 sm:w-6 sm:h-6 md:w-8 md:h-8"
                  />
                  <Link
                    className="text-blue-600 dark:text-blue-400 text-sm"
                    to={`/crypto/${c.id}`}
                  >
                    {c.name}
                  </Link>
                </td>

                <td className="px-2 sm:px-3 py-3 sm:py-2 text-gray-900 dark:text-white text-sm">
                  ${c.current_price.toLocaleString()}
                </td>

                <td
                  className={`px-3 py-2 font-semibold text-sm ${
                    c.price_change_percentage_24h > 0
                      ? 'text-green-600'
                      : c.price_change_percentage_24h < 0
                      ? 'text-red-600'
                      : 'text-gray-400'
                  }`}
                >
                  {c.price_change_percentage_24h != null
                    ? c.price_change_percentage_24h.toFixed(2) + '%'
                    : 'N/A'}
                </td>

                <td className="px-2 sm:px-3 py-3 sm:py-2 w-40">
                  <div className="h-[30px] sm:h-[40px] md:h-[60px] lg:h-[80px]">
                    <Line
                      data={{
                        labels: c.sparkline_in_7d.price.map((_, i) => i),
                        datasets: [
                          {
                            data: c.sparkline_in_7d.price,
                            borderWidth: 1.3,
                            borderColor: 'red',
                            pointRadius: 0,
                          },
                        ],
                      }}
                      options={{
                        plugins: { legend: { display: false } },
                        scales: {
                          x: { display: false },
                          y: { display: false },
                        },
                        elements: { line: { tension: 0.3 } },
                        maintainAspectRatio: false,
                      }}
                    />
                  </div>
                </td>
                <td className="px-3 pr-6 py-2 text-right w-24">
                  <button
                    onClick={() => handleTrack(c)}
                    className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                  >
                    Track
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {visibleCount < cryptos.length && (
          <div className="text-center py-4">
            <button
              onClick={() => setVisibleCount((prev) => prev + 10)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            >
              Load more
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
