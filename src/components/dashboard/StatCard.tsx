import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string;
  icon?: LucideIcon;
  trend?: string;
  className?: string;
}

export function StatCard({ title, value, icon: Icon, trend, className }: StatCardProps) {
  return (
    <Card className={cn("group relative overflow-hidden hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/10", className)}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              {title}
            </p>
            <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">
              {value}
            </p>
            {trend && (
              <p className="mt-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                {trend}
              </p>
            )}
          </div>
          {Icon && (
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition-all duration-300 group-hover:bg-primary/20 group-hover:scale-110">
              <Icon className="h-5 w-5" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
