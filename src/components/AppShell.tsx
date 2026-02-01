export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <aside className="w-64 border-r p-4">Sidebar</aside>
      <main className="flex-1">
        <header className="border-b p-4">Top Nav</header>
        <div className="p-6">{children}</div>
      </main>
    </div>
  )
}
