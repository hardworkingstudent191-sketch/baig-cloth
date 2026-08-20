import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { api, setToken } from "./api";

export default function AdminLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { access_token } = await api.login(username, password);
      setToken(access_token);
      navigate("/admin");
    } catch {
      setError("Username or password is wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#16140f] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <p className="font-mono text-xs tracking-[0.2em] text-[#948b7a] uppercase mb-2">
            Baig Cloth
          </p>
          <h1 className="font-serif text-3xl text-[#ede7db]">Admin</h1>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-[#1f1c16] border border-[#322d24] rounded-lg p-6 border-t-2 border-t-dashed border-t-[#c1652f]"
        >
          <div className="mb-4">
            <label className="block text-xs text-[#948b7a] mb-1.5" htmlFor="username">
              Username
            </label>
            <input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-[#16140f] border border-[#322d24] rounded px-3 py-2 text-[#ede7db] focus:outline-none focus:ring-2 focus:ring-[#c1652f] focus:border-[#c1652f]"
              autoComplete="username"
              required
            />
          </div>

          <div className="mb-5">
            <label className="block text-xs text-[#948b7a] mb-1.5" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#16140f] border border-[#322d24] rounded px-3 py-2 text-[#ede7db] focus:outline-none focus:ring-2 focus:ring-[#c1652f] focus:border-[#c1652f]"
              autoComplete="current-password"
              required
            />
          </div>

          {error && (
            <p className="text-[#b3543f] text-sm mb-4" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#c1652f] text-[#16140f] font-medium rounded py-2.5 hover:bg-[#d17640] transition-colors disabled:opacity-60"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
