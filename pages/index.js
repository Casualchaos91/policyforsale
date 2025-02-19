import Head from 'next/head';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center">
      <Head>
        <title>Policy For Sale</title>
        <meta name="description" content="Exposing Political Corruption Worldwide" />
      </Head>
      <header className="text-center p-6">
        <h1 className="text-4xl font-bold text-gray-900">Policy For Sale</h1>
        <p className="text-lg text-gray-700 mt-2">Tracking political influence and corruption globally</p>
      </header>
    </div>
  );
}
