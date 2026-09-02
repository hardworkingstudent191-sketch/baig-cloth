import { useState, type FormEvent } from "react";
import { api, ApiError } from "./api";
import AdminLayout from "./AdminLayout";
import { usePageMeta } from "../usePageMeta";

/**
 * Self-service password change — the only account-recovery path this
 * single-admin app has. scripts/create_admin.py deliberately skips an
 * already-existing username rather than resetting its password (so a
 * misfired re-run of it in production can't silently overwrite a real
 * admin's password), which means without this page the only way to change
 * or recover a lost password was direct database access.
 */
export default function AccountPage() {
  usePageMeta({ title: "Account · Admin", noindex: true });

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New password and confirmation don't match.");
      return;
    }

    setLoading(true);
    try {
      await api.changePassword(currentPassword, newPassword);
      setSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError("Current password is incorrect.");
      } else if (err instanceof ApiError && err.status === 429) {
        setError(err.message);
      } else {
        setError("Couldn't change the password. Try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <AdminLayout>
      <h2 className="font-serif text-2xl mb-1">Account</h2>
      <p className="text-[#7b879e] text-sm mb-6">Change the password used to sign in to this admin panel.</p>

      <form
        onSubmit={handleSubmit}
        className="bg-[#12182a] border border-[#24304d] rounded-lg p-6 max-w-sm"
      >
        <div className="mb-4">
          <label className="block text-xs text-[#7b879e] mb-1.5" htmlFor="current-password">
            Current password
          </label>
          <input
            id="current-password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="admin-input w-full"
            autoComplete="current-password"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-xs text-[#7b879e] mb-1.5" htmlFor="new-password">
            New password
          </label>
          <input
            id="new-password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="admin-input w-full"
            autoComplete="new-password"
            minLength={8}
            required
          />
        </div>

        <div className="mb-5">
          <label className="block text-xs text-[#7b879e] mb-1.5" htmlFor="confirm-password">
            Confirm new password
          </label>
          <input
            id="confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="admin-input w-full"
            autoComplete="new-password"
            minLength={8}
            required
          />
        </div>

        {error && (
          <p className="text-[#c0392b] text-sm mb-4" role="alert">
            {error}
          </p>
        )}
        {success && (
          <p className="text-[#3f8f63] text-sm mb-4" role="status">
            Password changed.
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#3f5fc4] text-[#0b0f1a] font-medium rounded py-2.5 hover:bg-[#5470d6] transition-colors disabled:opacity-60"
        >
          {loading ? "Changing…" : "Change password"}
        </button>
      </form>
    </AdminLayout>
  );
}
