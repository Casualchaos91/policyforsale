import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function Home() {
  const [articles, setArticles] = useState([]);

  useEffect(() => {
    fetch(`https://newsapi.org/v2/everything?q=political corruption&apiKey=195395e526bc4adfadf437dd86461b21`)
      .then(response => response.json())
      .then(data => setArticles(data.articles.slice(0, 5)))
      .catch(error => console.error("Error fetching news:", error));
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center px-6 py-6">
      <Head>
        <title>Policy For Sale</title>
        <meta name="description" content="Exposing Political Corruption Worldwide" />
      </Head>
      
      <nav className="w-full bg-gray-800 py-4 flex justify-center space-x-6 text-lg">
        <Link href="/" className="text-yellow-400 hover:text-yellow-300">Home</Link>
        <Link href="/news" className="text-yellow-400 hover:text-yellow-300">News</Link>
        <Link href="/about" className="text-yellow-400 hover:text-yellow-300">About</Link>
        <Link href="/donate" className="text-yellow-400 hover:text-yellow-300">Donate</Link>
      </nav>

      <header className="text-center p-6">
        <h1 className="text-5xl font-extrabold text-yellow-400 drop-shadow-lg">Policy For Sale</h1>
        <p className="text-lg text-gray-300 mt-2 max-w-2xl">
          Tracking political influence and corruption globally. Stay informed with real-time updates.
        </p>
      </header>
      
      <section className="mt-6 w-full max-w-2xl">
        <h2 className="text-2xl font-bold text-yellow-400 mb-4">Latest Corruption News</h2>
        <ul>
          {articles.map((article, index) => (
            <li key={index} className="mb-4 border-b border-gray-700 pb-2">
              <a href={article.url} target="_blank" rel="noopener noreferrer" className="text-yellow-300 hover:underline">
                {article.title}
              </a>
            </li>
          ))}
        </ul>
      </section>
      
      <Link href="/donate" className="mt-6 px-6 py-3 bg-yellow-500 text-black font-semibold rounded-lg shadow-md hover:bg-yellow-600 transition">
        Donate with Crypto
      </Link>
    </div>
  );
}
