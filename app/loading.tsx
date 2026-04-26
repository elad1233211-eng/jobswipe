export default function Loading() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center p-8">
      <div className="relative">
        <div className="w-16 h-16 rounded-full border-4 border-pink-200" />
        <div className="absolute inset-0 w-16 h-16 rounded-full border-4 border-transparent border-t-pink-500 animate-spin" />
      </div>
      <p className="mt-4 text-slate-500 text-sm">טוען…</p>
    </main>
  );
}
