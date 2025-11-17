export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900 mb-4">
          Welcome to <span className="text-indigo-600">EMall</span>
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Your Local Merchants Marketplace
        </p>
        <div className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg shadow-lg">
          <span className="text-lg font-semibold">Setup in Progress...</span>
        </div>
      </div>
    </div>
  );
}
