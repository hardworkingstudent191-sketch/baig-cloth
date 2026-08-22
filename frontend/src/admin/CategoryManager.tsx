import { useEffect, useState, type FormEvent } from "react";
import { api } from "./api";
import type { Category, Gender } from "./types";
import AdminLayout from "./AdminLayout";

export default function CategoryManager() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [newName, setNewName] = useState("");
  const [newGender, setNewGender] = useState<Gender>("men");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      setCategories(await api.listCategories());
    } catch {
      setError("Couldn't load categories. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setError(null);
    try {
      const sameGender = categories.filter((c) => c.gender === newGender);
      if (sameGender.some((c) => c.name.toLowerCase() === newName.trim().toLowerCase())) {
        setError(`"${newName.trim()}" already exists for ${newGender === "men" ? "Men" : "Women"}.`);
        return;
      }
      await api.createCategory({
        name: newName.trim(),
        gender: newGender,
        sort_order: sameGender.length,
      });
      setNewName("");
      load();
    } catch {
      setError("Couldn't add that category. Try again.");
    }
  }

  async function handleRename(category: Category, name: string) {
    if (!name.trim() || name === category.name) return;
    setError(null);
    try {
      await api.updateCategory(category.id, { name: name.trim() });
      load();
    } catch {
      setError(`Couldn't rename "${category.name}". Try again.`);
      load(); // resets the input back to the saved name
    }
  }

  async function handleDelete(category: Category) {
    if (!confirm(`Delete "${category.name}"? Products must be reassigned first.`)) return;
    setError(null);
    try {
      await api.deleteCategory(category.id);
      load();
    } catch {
      setError(`"${category.name}" still has products in it — move or delete those first.`);
    }
  }

  // Categories are shown ordered by sort_order, but there was previously no
  // way to actually change that order from the UI — "reorder" was promised
  // in the project plan but never built. Swapping sort_order with the
  // neighbor above/below is simpler and more reliable here than drag-and-drop.
  async function handleMove(category: Category, direction: -1 | 1) {
    const siblings = categories
      .filter((c) => c.gender === category.gender)
      .sort((a, b) => a.sort_order - b.sort_order);
    const index = siblings.findIndex((c) => c.id === category.id);
    const swapWith = siblings[index + direction];
    if (!swapWith) return;

    setError(null);
    try {
      await Promise.all([
        api.updateCategory(category.id, { sort_order: swapWith.sort_order }),
        api.updateCategory(swapWith.id, { sort_order: category.sort_order }),
      ]);
      load();
    } catch {
      setError("Couldn't reorder categories. Try again.");
    }
  }

  function renderGroup(gender: Gender, label: string) {
    const items = categories
      .filter((c) => c.gender === gender)
      .sort((a, b) => a.sort_order - b.sort_order);

    return (
      <div className="bg-[#12182a] border border-[#24304d] rounded-lg p-5">
        <h3 className="font-serif text-lg mb-3">{label}</h3>
        {items.length === 0 ? (
          <p className="text-[#7b879e] text-sm">No categories yet.</p>
        ) : (
          <ul className="space-y-2">
            {items.map((c, i) => (
              <li key={c.id} className="flex items-center gap-2">
                <div className="flex flex-col shrink-0">
                  <button
                    onClick={() => handleMove(c, -1)}
                    disabled={i === 0}
                    aria-label={`Move ${c.name} up`}
                    className="text-[#7b879e] hover:text-[#f2f3f5] disabled:opacity-20 disabled:hover:text-[#7b879e] leading-none text-xs h-3.5"
                  >
                    ▲
                  </button>
                  <button
                    onClick={() => handleMove(c, 1)}
                    disabled={i === items.length - 1}
                    aria-label={`Move ${c.name} down`}
                    className="text-[#7b879e] hover:text-[#f2f3f5] disabled:opacity-20 disabled:hover:text-[#7b879e] leading-none text-xs h-3.5"
                  >
                    ▼
                  </button>
                </div>
                <input
                  defaultValue={c.name}
                  onBlur={(e) => handleRename(c, e.target.value)}
                  className="flex-1 bg-[#0b0f1a] border border-[#24304d] rounded px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#3f5fc4]"
                />
                <button
                  onClick={() => handleDelete(c)}
                  className="text-[#7b879e] hover:text-[#c0392b] text-xs px-1"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  return (
    <AdminLayout>
      <h2 className="font-serif text-2xl mb-6">Categories</h2>

      <form
        onSubmit={handleAdd}
        className="flex flex-wrap gap-2 mb-6 items-end bg-[#12182a] border border-[#24304d] rounded-lg p-4 border-t-2 border-t-dashed border-t-[#3f5fc4]"
      >
        <div className="flex-1 min-w-[140px]">
          <label className="block text-xs text-[#7b879e] mb-1.5">New category</label>
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="e.g. Lawn"
            className="admin-input"
          />
        </div>
        <div>
          <label className="block text-xs text-[#7b879e] mb-1.5">For</label>
          <select
            value={newGender}
            onChange={(e) => setNewGender(e.target.value as Gender)}
            className="admin-input"
          >
            <option value="men">Men</option>
            <option value="women">Women</option>
          </select>
        </div>
        <button
          type="submit"
          className="bg-[#3f5fc4] text-[#0b0f1a] font-medium rounded px-4 py-2 text-sm hover:bg-[#5470d6] transition-colors"
        >
          Add
        </button>
      </form>

      {error && <p className="text-[#c0392b] text-sm mb-4">{error}</p>}

      {loading ? (
        <p className="text-[#7b879e] text-sm">Loading…</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {renderGroup("men", "Men")}
          {renderGroup("women", "Women")}
        </div>
      )}

      <p className="text-[#7b879e] text-xs mt-4">
        Rename a category by editing its name and clicking away. Use the arrows to reorder —
        this controls the order categories appear on the storefront. New categories can be added
        anytime — no code changes needed as your fabric range grows.
      </p>
    </AdminLayout>
  );
}
