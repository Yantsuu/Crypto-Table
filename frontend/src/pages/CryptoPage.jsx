import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend
);

export default function CryptoPage() {
  const { id } = useParams();

  const [info, setInfo] = useState(null);
  const [history, setHistory] = useState(null);
  const [details, setDetails] = useState(null);

  useEffect(() => {
    async function load() {
      const all = await fetch('http://localhost:5000/api/cryptos')
        .then((r) => r.json())
        .catch(() => null);

      if (!Array.isArray(all)) {
        console.error('❌ BACKEND ERROR: /api/cryptos не повертає масив:', all);
        return;
      }

      setInfo(all.find((c) => c.id.toLowerCase() === id.toLowerCase()));

      // 2. Історія з БД
      const historyRes = await fetch(`http://localhost:5000/api/history/${id}`);
      if (!historyRes.ok) {
        console.error('❌ HISTORY endpoint failed');
        return;
      }
      const historyJson = await historyRes.json();
      setHistory(historyJson);

      // 3. Деталі
      const detailsRes = await fetch(
        `http://localhost:5000/api/cryptos/${id}/details`
      );
      if (!detailsRes.ok) {
        console.error('❌ DETAILS endpoint failed');
        return;
      }
      const detJson = await detailsRes.json();
      setDetails(detJson);
    }

    load();
  }, [id]);

  if (!info || !history || !details) return <div>Loading...</div>;
  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-8 w-full">
      <div className="flex items-center gap-4 mb-6">
        <img src={info.image} alt={info.name} className="w-12 h-12" />
        <h1 className="text-4xl font-bold dark:text-white">{info.name}</h1>
        <span className="text-gray-400 text-xl">
          ({info.symbol.toUpperCase()})
        </span>
      </div>

      <div className="text-3xl font-semibold mb-6 text-gray-900 dark:text-[#ffffff] !text-white">
        ${info.current_price.toLocaleString()}
      </div>

      <div className="relative w-full overflow-x-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800 rounded-lg">
        <div className="min-w-[600px] sm:min-w-[800px] md:min-w-[1000px] lg:min-w-[1200px] h-[400px]">
          <Line
            data={{
              labels: history.map((p) =>
                new Date(p.recorded_at).toLocaleTimeString()
              ),
              datasets: [
                {
                  label: `${info.name} price`,
                  data: history.map((p) => p.price),
                  borderColor: '#f44336',
                  borderWidth: 2,
                  tension: 0.3,
                  pointRadius: 0,
                },
              ],
            }}
            options={{
              plugins: { legend: { display: false } },
              scales: {
                x: {
                  ticks: { color: '#888' },
                  grid: { color: 'rgba(255,255,255,0.05)' },
                },
                y: {
                  ticks: { color: '#888' },
                  grid: { color: 'rgba(255,255,255,0.05)' },
                },
              },
              maintainAspectRatio: false,
              responsive: true,
            }}
          />
        </div>
      </div>

      <div className="bg-white dark:bg-[#161b22] p-4 sm:p-6 rounded-xl shadow-md mb-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
          Market Info
        </h2>
        <p className="text-gray-900 dark:text-gray-300">
          <b>Market Cap Rank:</b> #{details.market_cap_rank}
        </p>
        <p className="text-gray-900 dark:text-gray-300">
          <b>Algorithm:</b> {details.hashing_algorithm}
        </p>
        <p className="text-gray-900 dark:text-gray-300">
          <b>Genesis Date:</b> {details.genesis_date}
        </p>
        <p className="text-gray-900 dark:text-gray-300">
          <b>Homepage:</b>{' '}
          <a
            href={details.homepage}
            target="_blank"
            rel="noreferrer"
            className="text-blue-400 underline"
          >
            {details.homepage}
          </a>
        </p>
      </div>
      <div className="bg-white dark:bg-[#161b22] p-4 sm:p-6 rounded-xl shadow-md mb-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
          About {info.name}
        </h2>
        <p
          className="text-gray-900 dark:text-gray-300 leading-relaxed"
          dangerouslySetInnerHTML={{
            __html: details.description.slice(0, 800) + '...',
          }}
        />
      </div>
    </div>
  );
}
