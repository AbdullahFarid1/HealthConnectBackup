interface PageHeaderProps {
  label?: string;
  title: string;
  description?: string;
  children?: React.ReactNode;
}

export function PageHeader({ label, title, description, children }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {label && (
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            {label}
          </p>
        )}
        <h1 className="mt-1 text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}
