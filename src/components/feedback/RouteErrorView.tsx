'use client';

interface RouteErrorViewProps {
  error: Error;
  reset: () => void;
}

export default function RouteErrorView({ error, reset }: RouteErrorViewProps) {
  return (
    <div className="p-6 pt-20 text-center md:pt-6">
      <p className="mb-4 text-red-600">데이터를 불러오는 중 오류가 발생했습니다.</p>
      <p className="mb-4 text-sm text-gray-500">{error.message}</p>
      <button
        type="button"
        onClick={reset}
        className="rounded-lg bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700"
      >
        다시 시도
      </button>
    </div>
  );
}
