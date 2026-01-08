export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex">
      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>

      {/* Right side - Branding */}
      <div className="hidden lg:flex lg:flex-1 bg-gradient-to-br from-whatsapp-primary to-whatsapp-dark items-center justify-center p-12">
        <div className="max-w-md text-white text-center">
          <div className="text-7xl mb-6">💬</div>
          <h1 className="text-3xl font-bold mb-4">
            WhatsApp Business Platform
          </h1>
          <p className="text-lg text-white/80">
            Connect with your customers through WhatsApp Business API.
            Manage conversations, send broadcasts, and automate responses.
          </p>
        </div>
      </div>
    </div>
  )
}
