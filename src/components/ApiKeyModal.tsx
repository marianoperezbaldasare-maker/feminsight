'use client';

import { useState } from 'react';

interface PasswordGateProps {
  onUnlock: (username: string, password: string) => void;
  error: boolean;
}

export default function PasswordGate({ onUnlock, error }: PasswordGateProps) {
  const [username, setUsername] = useState('');
  const [value, setValue] = useState('');
  const [show, setShow] = useState(false);
  const [usernameError, setUsernameError] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim()) {
      setUsernameError(true);
      return;
    }
    if (value.trim()) onUnlock(username.trim(), value.trim());
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#F5F6FA]">
      <div className="w-full max-w-sm px-6">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-10">
          <div className="w-10 h-10 rounded-xl bg-[#7C3AED] flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <div className="text-gray-900 font-bold text-xl">FemInsight</div>
            <div className="text-gray-400 text-xs">Synthetic Focus Group</div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name field */}
          <div>
            <label className="block text-gray-600 text-sm font-medium mb-2">
              Tu nombre
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => { setUsername(e.target.value); setUsernameError(false); }}
              placeholder="¿Cómo te llamás?"
              autoFocus
              className={`w-full bg-white border rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 text-sm focus:outline-none transition-all ${
                usernameError
                  ? 'border-red-400 focus:border-red-500'
                  : 'border-gray-200 focus:border-[#7C3AED]'
              }`}
            />
            {usernameError && (
              <p className="mt-2 text-red-500 text-xs flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Por favor ingresá tu nombre
              </p>
            )}
          </div>

          {/* Password field */}
          <div>
            <label className="block text-gray-600 text-sm font-medium mb-2">
              Contraseña de acceso
            </label>
            <div className="relative">
              <input
                type={show ? 'text' : 'password'}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="Ingresá la contraseña"
                className={`w-full bg-white border rounded-xl px-4 py-3 pr-12 text-gray-900 placeholder-gray-400 text-sm focus:outline-none transition-all ${
                  error
                    ? 'border-red-400 focus:border-red-500'
                    : 'border-gray-200 focus:border-[#7C3AED]'
                }`}
              />
              <button
                type="button"
                onClick={() => setShow(!show)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {show ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            {error && (
              <p className="mt-2 text-red-500 text-xs flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Contraseña incorrecta
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={!value.trim() || !username.trim()}
            className="w-full bg-[#7C3AED] hover:bg-[#6D28D9] disabled:opacity-30 disabled:cursor-not-allowed text-white font-semibold rounded-xl px-6 py-3 text-sm transition-all"
          >
            Entrar
          </button>
        </form>

        <p className="text-center text-gray-400 text-xs mt-6">
          Pedile la contraseña a tu admin
        </p>
      </div>
    </div>
  );
}
