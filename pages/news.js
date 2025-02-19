import { useEffect, useState } from "react";

export default function News() {
  const [articles, setArticles] = useState([]);

  useEffect(() => {
    async function fetchNews() {
      const res = await fetch(
        `https://newsapi.org/v2/everything?q=corruption&apiKey=195395e526bc4adfadf437dd86461b21`
      );
      const data = await res.json();
      setArticles(data.articles || []);
    }
    fetchNews();
  }, []);

  return (
    <div className="min-h-screen p-10 bg-gray-900 text-white">
      <h1 className="text-3xl font-bold">Latest Corruption News</h1>
      {articles.length > 0 ? (
        <ul className="mt-6 space-y-4">
          {articles.map((article, index) => (
            <li key={index} className="border p-4 rounded bg-gray-800">
              <a href={article.url} target="_blank" className="text-blue-400">
                {article.title}
              </a>
              <p>{article.description}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4">Loading news...</p>
      )}
    </div>
  );
}