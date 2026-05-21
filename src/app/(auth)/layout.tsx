export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1FBFB8]/10 to-slate-50 p-4">
      {children}
    </div>
  )
}
