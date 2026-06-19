import { ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KPICardProps {
  title: string;
  value: number | string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  icon?: React.ReactNode;
  className?: string;
}

export function KPICard({ title, value, trend, icon, className }: KPICardProps) {
  return (
    <div className={cn(
      "rounded-lg border border-slate-800 bg-slate-900 p-6",
      className
    )}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-400">{title}</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-100">{value}</span>
            {trend && (
              <div className="flex items-center gap-1">
                {trend.isPositive ? (
                  <ArrowUp className="h-4 w-4 text-green-500" />
                ) : (
                  <ArrowDown className="h-4 w-4 text-red-500" />
                )}
                <span className={cn(
                  "text-sm font-medium",
                  trend.isPositive ? "text-green-500" : "text-red-500"
                )}>
                  {Math.abs(trend.value)}%
                </span>
              </div>
            )}
          </div>
        </div>
        {icon && (
          <div className="text-3xl opacity-50">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
