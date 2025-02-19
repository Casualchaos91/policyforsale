import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-10">
      <h1 className="text-4xl font-bold">PolicyForSale - Exposing Political Corruption</h1>
      <p className="mt-4 text-lg">Investigating and exposing corruption worldwide.</p>
      <Link href="/news">
        <button className="mt-6 px-6 py-3 bg-red-600 hover:bg-red-700 rounded">
          View Corruption News
        </button>
      </Link>
      <Link href="/contact">
        <button className="mt-6 ml-4 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded">
          Submit a Tip
        </button>
      </Link>
    </div>
  );
}