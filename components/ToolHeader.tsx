export function ToolHeader({
  title,
  description,
  eyebrow,
}: {
  title: string;
  description?: string;
  eyebrow?: string;
}) {
  return (
    <header className="border-b border-border pb-6 mb-8">
      {eyebrow && <div className="text-eyebrow mb-2">{eyebrow}</div>}
      <h1 className="h-title mb-2">{title}</h1>
      {description && (
        <p className="text-muted text-sm max-w-2xl">{description}</p>
      )}
    </header>
  );
}
