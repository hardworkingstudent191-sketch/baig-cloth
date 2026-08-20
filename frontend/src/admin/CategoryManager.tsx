import { useEffect, useState, type FormEvent } from "react";
import { api } from "./api";
import type { Category, Gender } from "./types";
import AdminLayout from "./AdminLayout";

export default function CategoryManager() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [newName, setNewName] = useState("");
  const [newGender, setNewGender] = useState<Gender>("men");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setCategories(await api.listCategories());
  }

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setError(null);
    try {
      const sameGender = categories.filter((c) => c.gender === newGender);
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
    await api.updateCategory(category.id, { name: name.trim() });
    load();
  }

  async function handleDelete(category: Category) {
    if (!confirm(`Delete "${category.name}"? Products must be reassigned first.`)) return;
    try {
      await api.deleteCategory(category.id);
      load();
    } catch {
      setError(`"${category.name}" still has products in it — move or delete those first.`);
    }
  }

  function renderGroup(gender: Gender, label: string) {
    const items = categories
      .filter((c) => c.gender === gender)
      .sort((a, b) => a.sort_order - b.sort_order);

    return (
      <div className="bg-[#1f1c16] border border-[#322d24] rounded-lg p-5">
        <h3 className="font-serif text-lg mb-3">{label}</h3>
        {items.length === 0 ? (
          <p className="text-[#948b7a] text-sm">No categories yet.</p>
        ) : (
          <ul className="space-y-2">
            {items.map((c) => (
              <li key={c.id} className="flex items-center gap-2">
                <input
                  defaultValue={c.name}
                  onBlur={(e) => handleRename(c, e.target.value)}
                  className="flex-1 bg-[#16140f] border border-[#322d24] rounded px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#c1652f]"
                />
                <button
                  onClick={() => handleDelete(c)}
                  className="text-[#948b7a] hover:text-[#b3543f] text-xs px-1"
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
        className="flex gap-2 mb-6 items-end bg-[#1f1c16] border border-[#322d24] rounded-lg p-4 border-t-2 border-t-dashed border-t-[#c1652f]"
      >
        <div className="flex-1">
          <label className="block text-xs text-[#948b7a] mb-1.5">New category</label>
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="e.g. Lawn"
            className="admin-input"
          />
        </div>
        <div>
          <label className="block text-xs text-[#948b7a] mb-1.5">For</label>
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
          className="bg-[#c1652f] text-[#16140f] font-medium rounded px-4 py-2 text-sm hover:bg-[#d17640] transition-colors"
        >
          Add
        </button>
      </form>

      {error && <p className="text-[#b3543f] text-sm mb-4">{error}</p>}

      <div className="grid grid-cols-2 gap-4">
        {renderGroup("men", "Men")}
        {renderGroup("women", "Women")}
      </div>

      <p className="text-[#948b7a] text-xs mt-4">
        Rename a category by editing its name and clicking away. New categories can be added anytime —
        no code changes needed as your fabric range grows.
      </p>
    </AdminLayout>
  );
}
