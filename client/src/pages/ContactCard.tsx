export default function ContactCard() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        {/* Logo */}
        <div className="mb-8">
          <img 
            src="https://cdn.gigitekai.com/gigitekai-logo.webp" 
            alt="GigitekAI" 
            className="w-40 h-auto mx-auto"
          />
        </div>

        {/* QR Code */}
        <div className="my-8">
          <img 
            src="https://cdn.gigitekai.com/qr-contact-with-text.png" 
            alt="QR Code" 
            className="w-64 h-auto mx-auto border border-gray-200 rounded-lg"
          />
          <p className="text-xs text-gray-500 mt-2">Scan to save contact</p>
        </div>

        {/* Name */}
        <h1 className="text-3xl font-bold text-black my-6">Harry Henry-Santiago</h1>

        {/* Website */}
        <div className="my-5">
          <a 
            href="https://www.gigitekai.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-2xl font-semibold text-blue-600 hover:text-blue-800 hover:underline"
          >
            https://www.gigitekai.com
          </a>
        </div>

        {/* Contact Info */}
        <div className="space-y-4 mt-8">
          {/* Phone */}
          <a 
            href="tel:+17273825776"
            className="block text-lg text-blue-600 hover:text-blue-800 font-medium"
          >
            📞 (727) 382-5776
          </a>

          {/* Email */}
          <a 
            href="mailto:harry@gigitekai.com"
            className="block text-lg text-black hover:text-blue-600 font-medium"
          >
            ✉️ harry@gigitekai.com
          </a>
        </div>
      </div>
    </div>
  );
}
