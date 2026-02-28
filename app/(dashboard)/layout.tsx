import { Sidebar } from '@/components/sidebar';
import { AuthGuard } from '@/components/auth-guard';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        {/* Main content — offset by sidebar width on desktop */}
        <main className="flex-1 md:ml-60 p-6 md:p-8 min-w-0">
          {children}
        </main>
      </div>
    </AuthGuard>
  );
}
