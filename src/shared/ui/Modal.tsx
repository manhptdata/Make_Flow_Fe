import { X } from "lucide-react";
import { Button } from "@/shared/ui/Button";

const sizeClasses = {
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
} as const;

export function Modal({
  open,
  title,
  children,
  onClose,
  size = "md",
}: {
  open: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  size?: keyof typeof sizeClasses;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className={`flex max-h-[90vh] w-full ${sizeClasses[size]} flex-col rounded-2xl bg-white shadow-2xl`}>
        <header className="flex shrink-0 items-center justify-between border-b p-5">
          <h2 className="text-lg font-bold">{title}</h2>
          <Button aria-label="Đóng" variant="ghost" size="sm" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </header>
        <div className="overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}
