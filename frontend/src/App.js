import Navbar from './components/Navbar';
import { useEffect, useState } from 'react';
import CryptoTable from './components/CryptoTable';
import CryptoPage from './pages/CryptoPage';
import Watchlist from './pages/Watchlist';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

function App() {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetch('http://localhost:5000/api/cryptos')
      .then((res) => res.json())
      .then((d) => {
        console.log('SERVER DATA:', d);
        setData(d);
      })
      .catch((err) => console.error('FETCH ERROR:', err));
  }, []);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-900 text-white">
        <Navbar />
        <div className="w-full px-4 sm:px-6 mt-6">
          <Routes>
            <Route path="/watchlist" element={<Watchlist />} />
            <Route path="/" element={<CryptoTable data={data} />} />
            <Route path="/crypto/:id" element={<CryptoPage />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
