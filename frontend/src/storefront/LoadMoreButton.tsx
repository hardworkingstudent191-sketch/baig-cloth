export default function LoadMoreButton({
  onClick,
  loading,
  shownCount,
}: {
  onClick: () => void;
  loading: boolean;
  shownCount: number;
}) {
  return (
    <div className="mt-6 text-center">
      <button
        onClick={onClick}
        disabled={loading}
        className="border border-[#dde1e8] rounded-full px-6 py-2.5 text-sm text-[#1f2937] hover:border-[#223c80]/40 hover:text-[#223c80] transition-colors disabled:opacity-60"
      >
        {loading ? "Loading…" : `Load more (showing ${shownCount})`}
      </button>
    </div>
  );
}
