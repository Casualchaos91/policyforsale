export default function Contact() {
  return (
    <div className="min-h-screen p-10 bg-gray-900 text-white">
      <h2 className="text-2xl">Submit a Tip</h2>
      <form action="https://formspree.io/f/your-form-id" method="POST" className="mt-4">
        <label className="block mb-2">Your Message:</label>
        <textarea name="message" required className="w-full p-2 rounded bg-gray-800 text-white"></textarea>
        <button type="submit" className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded">
          Submit Anonymously
        </button>
      </form>
    </div>
  );
}