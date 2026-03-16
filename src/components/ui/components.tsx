import React, { forwardRef } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Button ---
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'icon';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    const variants = {
      primary: 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow active:scale-[0.98]',
      secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200 active:scale-[0.98]',
      outline: 'border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 hover:border-slate-300',
      ghost: 'hover:bg-slate-100 text-slate-600',
      danger: 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-100',
    };
    const sizes = {
      xs: 'h-7 px-2 text-xs rounded-md',
      sm: 'h-8 px-3 text-xs rounded-lg',
      md: 'h-10 px-4 py-2 rounded-lg text-sm',
      lg: 'h-12 px-6 text-base rounded-xl',
      icon: 'h-9 w-9 p-0 flex items-center justify-center rounded-lg',
    };

    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 disabled:pointer-events-none disabled:opacity-50',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

// --- Card ---
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverEffect?: boolean;
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const Card = ({ className, children, hoverEffect = false, ...props }: CardProps) => (
  <div className={cn(
    "rounded-2xl border border-slate-200 bg-white text-slate-950 shadow-[0_2px_4px_rgba(0,0,0,0.02)]",
    hoverEffect && "transition-all duration-300 hover:shadow-[0_8px_16px_rgba(0,0,0,0.04)] hover:-translate-y-1",
    className
  )} {...props}>
    {children}
  </div>
);

export const CardHeader = ({ className, children }: { className?: string; children?: React.ReactNode }) => (
  <div className={cn("flex flex-col space-y-1 p-5 pb-2", className)}>{children}</div>
);

export const CardTitle = ({ className, children }: { className?: string; children?: React.ReactNode }) => (
  <h3 className={cn("font-bold leading-none tracking-tight text-slate-900", className)}>{children}</h3>
);

export const CardContent = ({ className, children }: { className?: string; children?: React.ReactNode }) => (
  <div className={cn("p-5 pt-4", className)}>{children}</div>
);

// --- Badge ---
export const Badge = ({ children, variant = 'default', className }: { children?: React.ReactNode; variant?: 'default' | 'success' | 'warning' | 'danger' | 'purple' | 'blue'; className?: string }) => {
  const styles = {
    default: 'bg-slate-100 text-slate-600',
    success: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
    warning: 'bg-amber-50 text-amber-700 border border-amber-100',
    danger: 'bg-rose-50 text-rose-700 border border-rose-100',
    purple: 'bg-violet-50 text-violet-700 border border-violet-100',
    blue: 'bg-blue-50 text-blue-700 border border-blue-100',
  };
  return (
    <span className={cn("inline-flex items-center rounded-md px-2 py-0.5 text-[10px] uppercase font-bold tracking-wide transition-colors", styles[variant], className)}>
      {children}
    </span>
  );
};

// --- Input ---
export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50 transition-all",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

// --- Table (Simple) ---
export const Table = ({ children, className, ...props }: React.TableHTMLAttributes<HTMLTableElement>) => (
  <div className="w-full overflow-hidden rounded-xl border border-slate-200">
    <table className={cn("w-full text-sm text-left", className)} {...props}>{children}</table>
  </div>
);

export const TableHeader = ({ children, className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) => (
  <thead className={cn("bg-slate-50/80 text-slate-500 font-medium border-b border-slate-200", className)} {...props}>
    {children}
  </thead>
);

export const TableRow = ({ children, className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) => (
  <tr className={cn("border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors group", className)} {...props}>
    {children}
  </tr>
);

export const TableHead = ({ children, className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) => (
  <th className={cn("h-10 px-4 align-middle font-semibold text-xs uppercase tracking-wider text-slate-500 [&:has([role=checkbox])]:pr-0", className)} {...props}>
    {children}
  </th>
);

export const TableCell = ({ children, className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) => (
  <td className={cn("p-4 align-middle [&:has([role=checkbox])]:pr-0 text-slate-700", className)} {...props}>
    {children}
  </td>
);

// --- Dialog ---
interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

export const Dialog = ({ open, onOpenChange, children }: DialogProps) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div onClick={() => onOpenChange(false)} className="absolute inset-0" />
      <div onClick={(e) => e.stopPropagation()} className="relative">
        {children}
      </div>
    </div>
  );
};

// --- Label ---
interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  children?: React.ReactNode;
}

export const Label = forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, children, ...props }, ref) => (
    <label
      ref={ref}
      className={cn("text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70", className)}
      {...props}
    >
      {children}
    </label>
  )
);
Label.displayName = 'Label';