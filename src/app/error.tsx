'use client';

import RouteErrorView from '@/components/feedback/RouteErrorView';

export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return <RouteErrorView error={error} reset={reset} />;
}
