'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@barber-saas/ui';
import { apiLogin } from '@/lib/api';
import { Scissors } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const params = useParams();
  const tenantSlug = params?.tenantSlug as string;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { data, error: err } = await apiLogin(tenantSlug, email, password);
    setLoading(false);
    if (err) {
      setError(err.status === 401 ? 'E-mail ou senha inválidos.' : err.message);
      return;
    }
    if (data) {
      const isCustomer = (data as { user?: { roles?: string[] } })?.user?.roles?.includes('CUSTOMER');
      router.push(isCustomer ? `/${tenantSlug}/client` : `/${tenantSlug}`);
    } else setError('Resposta inválida.');
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen px-4 bg-muted/30">
      <div className="w-full max-w-sm space-y-8">
        <div className="flex flex-col items-center">
          <Link href={`/${tenantSlug}`} className="flex items-center gap-2 text-foreground">
            <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-primary text-primary-foreground">
              <Scissors className="h-6 w-6" />
            </div>
            <span className="font-semibold text-xl">Entrar</span>
          </Link>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 p-6 rounded-lg border border-border bg-card shadow-sm">
          <div>
            <label htmlFor="email" className="block mb-1 font-medium text-sm text-foreground">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <div>
            <label htmlFor="password" className="block mb-1 font-medium text-sm text-foreground">
              Senha
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </Button>
        </form>
        <p className="text-center text-sm text-muted-foreground">
          Demo: owner@barbearia.com / owner123
        </p>
      </div>
    </main>
  );
}
