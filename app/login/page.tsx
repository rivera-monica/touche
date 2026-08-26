import { signIn } from './actions';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const { error, next } = await searchParams;

  return (
    <div className="login-wrap">
      <form className="login-card" action={signIn}>
        <div className="login-brand">
          <h1>Touché</h1>
          <p>Master recipe dashboard</p>
        </div>
        <input type="hidden" name="next" value={next || '/'} />
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" autoComplete="username" required />
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
        </div>
        {error ? <div className="login-error">{error}</div> : null}
        <button className="btn primary login-submit" type="submit">
          Sign in
        </button>
        <p className="login-hint">
          Ask whoever set up this dashboard for an account — new accounts are created in the
          Supabase dashboard, not here.
        </p>
      </form>
    </div>
  );
}
