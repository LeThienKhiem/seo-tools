export function Badge({
  variant = "default",
  children,
}: {
  variant?: "default" | "success" | "warning" | "danger" | "info";
  children: React.ReactNode;
}) {
  return <span className={`badge-${variant}`}>{children}</span>;
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, "success" | "warning" | "danger" | "default"> = {
    completed: "success",
    running: "warning",
    pending: "warning",
    failed: "danger",
  };
  return (
    <Badge variant={map[status] || "default"}>
      {status === "running" && (
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
      )}
      {status}
    </Badge>
  );
}
