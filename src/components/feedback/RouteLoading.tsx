export default function RouteLoading() {
  return (
    <div className="space-y-4 p-6 pt-20 md:pt-6 animate-pulse">
      <div className="h-8 w-1/3 rounded bg-gray-200" />
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="h-32 rounded-lg bg-gray-200" />
        ))}
      </div>
      <div className="h-64 rounded-lg bg-gray-200" />
    </div>
  );
}
