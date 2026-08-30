import { SORT_LABELS, type SortOption } from "./sortProducts";

export default function SortSelect({
  value,
  onChange,
}: {
  value: SortOption;
  onChange: (value: SortOption) => void;
}) {
  return (
    <label className="text-sm text-[#6b7280] flex items-center gap-2">
      Sort
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as SortOption)}
        className="bg-[#eef0f3] border border-[#dde1e8] rounded-full pl-3 pr-8 py-1.5 text-sm text-[#101014] focus:outline-none focus:ring-1 focus:ring-[#223c80]"
      >
        {(Object.keys(SORT_LABELS) as SortOption[]).map((key) => (
          <option key={key} value={key}>
            {SORT_LABELS[key]}
          </option>
        ))}
      </select>
    </label>
  );
}
