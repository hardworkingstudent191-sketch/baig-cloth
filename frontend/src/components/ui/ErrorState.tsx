import { RefreshCw } from "lucide-react";
import { Button } from "./Button";

export default function ErrorState({ message = "Couldn't load this right now.", onRetry, className = "" }: { message?: string; onRetry?: () => void; className?: string }) {
  return (
    <div className={`border border-dashed border-sand rounded-card p-10 text-center ${className}`} role="alert">
      <p className="text-[15px] text-charcoal mb-4 text-pretty">{message}</p>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          <RefreshCw size={16} /> Try again
        </Button>
      )}
    </div>
  );
}

export function EmptyState({ title, body, action }: { title: string; body?: string; action?: React.ReactNode }) {
  return (
    <div className="border border-dashed border-sand rounded-card px-6 py-14 text-center">
      <p className="font-display text-2xl mb-2">{title}</p>
      {body && <p className="text-muted text-[15px] max-w-sm mx-auto text-pretty">{body}</p>}
      {action && <div className="mt-6 flex justify-center">{action}</div>}
    </div>
  );
}
