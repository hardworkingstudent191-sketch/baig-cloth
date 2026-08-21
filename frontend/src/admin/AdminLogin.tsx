import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { api, setToken } from "./api";
import logoLight from "../assets/logo-light.png";

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
    <div className="min-h-screen bg-[#0b0f1a] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <img src={logoLight} alt="Baig Cloth" className="h-14 w-auto mx-auto mb-3" />
          <p className="font-mono text-xs tracking-[0.2em] text-[#7b879e] uppercase mb-2">
            Baig Cloth
          </p>
          <h1 className="font-serif text-3xl text-[#f2f3f5]">Admin</h1>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-[#12182a] border border-[#24304d] rounded-lg p-6 border-t-2 border-t-dashed border-t-[#3f5fc4]"
        >
          <div className="mb-4">
            <label className="block text-xs text-[#7b879e] mb-1.5" htmlFor="username">
              Username
            </label>
            <input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-[#0b0f1a] border border-[#24304d] rounded px-3 py-2 text-[#f2f3f5] focus:outline-none focus:ring-2 focus:ring-[#3f5fc4] focus:border-[#3f5fc4]"
              autoComplete="username"
              required
            />
          </div>

          <div className="mb-5">
            <label className="block text-xs text-[#7b879e] mb-1.5" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#0b0f1a] border border-[#24304d] rounded px-3 py-2 text-[#f2f3f5] focus:outline-none focus:ring-2 focus:ring-[#3f5fc4] focus:border-[#3f5fc4]"
              autoComplete="current-password"
              required
            />
          </div>

          {error && (
            <p className="text-[#c0392b] text-sm mb-4" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#3f5fc4] text-[#0b0f1a] font-medium rounded py-2.5 hover:bg-[#5470d6] transition-colors disabled:opacity-60"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
