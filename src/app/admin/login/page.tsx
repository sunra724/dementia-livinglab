'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        setErrorMessage(response.status === 401 ? '비밀번호가 올바르지 않습니다.' : '로그인에 실패했습니다.');
        return;
      }

      router.push('/admin');
      router.refresh();
    } catch (error) {
      console.error('Admin login failed:', error);
      setErrorMessage('로그인 요청 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-6">
          <p className="text-sm font-medium text-orange-500">관리자 전용</p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-950">관리자 로그인</h1>
          <p className="mt-2 text-sm text-slate-500">비밀번호를 입력하면 관리자 메인으로 이동합니다.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">비밀번호</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-orange-300 focus:ring-2 focus:ring-orange-200"
              placeholder="관리자 비밀번호"
            />
          </label>

          {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}

          <button
            type="submit"
            disabled={isSubmitting || password.trim() === ''}
            className="w-full rounded-2xl bg-orange-500 px-4 py-3 text-sm font-medium text-white transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:bg-orange-200"
          >
            {isSubmitting ? '로그인 중...' : '로그인'}
          </button>
        </form>
      </div>
    </div>
  );
}
