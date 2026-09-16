import React, { forwardRef, useEffect, useRef } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { AlertCircle, CheckCircle2, ChevronLeft, ChevronRight, Clock3, Inbox, Loader2, Search, X } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Button ---
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'gold';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'icon';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    const variants = {
      primary: 'border border-[#0d526b] bg-[#0d526b] text-white shadow-[0_6px_16px_rgba(7,59,92,0.18)] hover:-translate-y-px hover:bg-[#073b5c] hover:shadow-[0_10px_24px_rgba(7,59,92,0.24)] active:scale-[0.98]',
      secondary: 'border border-[#d5e1e3] bg-[#f6faf9] text-[#12354a] shadow-sm hover:-translate-y-px hover:border-[#b8ccd0] hover:bg-white active:scale-[0.98]',
      outline: 'border border-[#cbd9dc] bg-white/75 text-[#23465b] shadow-[0_3px_10px_rgba(7,59,92,0.04)] hover:-translate-y-px hover:border-[#b08a3e] hover:bg-[#fffdf8] hover:shadow-[0_7px_16px_rgba(7,59,92,0.1)]',
      ghost: 'text-[#486271] hover:bg-[#edf3f5] hover:text-[#073b5c]',
      danger: 'border border-[#f3c9c3] bg-[#fff5f3] text-[#a63e35] hover:bg-[#ffe9e5]',
      gold: 'border border-[#c3a25a] bg-[#b08a3e] text-white shadow-[0_6px_18px_rgba(176,138,62,0.24)] hover:-translate-y-px hover:bg-[#98752f] hover:shadow-[0_10px_24px_rgba(176,138,62,0.3)] active:scale-[0.98]',
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
          'inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b08a3e] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
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
    "relative rounded-xl border border-[#d5e1e3] bg-white/92 text-[#12354a] shadow-[0_10px_28px_rgba(7,59,92,0.07)] before:pointer-events-none before:absolute before:inset-x-6 before:top-0 before:h-px before:bg-[#c3a25a]/35",
    hoverEffect && "transition-all duration-300 ease-out hover:-translate-y-1 hover:border-[#c5d6d9] hover:shadow-[0_20px_44px_rgba(7,59,92,0.14)]",
    className
  )} {...props}>
    {children}
  </div>
);

export const CardHeader = ({ className, children }: { className?: string; children?: React.ReactNode }) => (
  <div className={cn("flex flex-col space-y-1 p-5 pb-3", className)}>{children}</div>
);

export const CardTitle = ({ className, children }: { className?: string; children?: React.ReactNode }) => (
  <h3 className={cn("font-bold leading-tight tracking-tight text-[#12354a]", className)}>{children}</h3>
);

export const CardContent = ({ className, children }: { className?: string; children?: React.ReactNode }) => (
  <div className={cn("p-5 pt-4", className)}>{children}</div>
);

// --- Badge ---
export const Badge = ({ children, variant = 'default', className }: { children?: React.ReactNode; variant?: 'default' | 'success' | 'warning' | 'danger' | 'purple' | 'blue'; className?: string }) => {
  const styles = {
    default: 'bg-[#edf3f5] text-[#486271]',
    success: 'bg-[#eaf7f1] text-[#19704b] border border-[#c8ead9]',
    warning: 'bg-[#fff7e7] text-[#8b641b] border border-[#f0ddb1]',
    danger: 'bg-[#fff1ef] text-[#a63e35] border border-[#f3c9c3]',
    purple: 'bg-[#f2eff8] text-[#665083] border border-[#ded5ee]',
    blue: 'bg-[#eaf3f7] text-[#1e627d] border border-[#cce1e8]',
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
          "flex h-10 w-full rounded-xl border border-[#cbd9dc] bg-white/80 px-3 py-2 text-sm text-[#12354a] shadow-[inset_0_1px_2px_rgba(7,59,92,0.03)] file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-[#8aa0aa] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b08a3e]/30 focus-visible:border-[#b08a3e] disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export const Select = forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <select ref={ref} className={cn('flex h-10 w-full rounded-xl border border-[#cbd9dc] bg-white/90 px-3 py-2 text-sm text-[#12354a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b08a3e]/30 focus-visible:border-[#b08a3e] disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200', className)} {...props}>
      {children}
    </select>
  )
);
Select.displayName = 'Select';

export const SearchBox = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <div className="relative w-full">
      <Search aria-hidden="true" size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#78909a]" />
      <Input ref={ref} type="search" className={cn('pl-10', className)} {...props} />
    </div>
  )
);
SearchBox.displayName = 'SearchBox';

export const StatusBadge = ({ status, children, className }: { status: 'success' | 'warning' | 'danger' | 'info' | 'neutral'; children?: React.ReactNode; className?: string }) => {
  const styles = { success: 'bg-[#eaf7f1] text-[#19704b] border-[#c8ead9]', warning: 'bg-[#fff7e7] text-[#8b641b] border-[#f0ddb1]', danger: 'bg-[#fff1ef] text-[#a63e35] border-[#f3c9c3]', info: 'bg-[#eaf3f7] text-[#1e627d] border-[#cce1e8]', neutral: 'bg-[#edf3f5] text-[#486271] border-[#d5e1e3]' };
  return <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold', styles[status], className)}><span className="h-1.5 w-1.5 rounded-full bg-current" />{children}</span>;
};

export const Avatar = ({ src, name, size = 'md', className }: { src?: string; name: string; size?: 'sm' | 'md' | 'lg'; className?: string }) => {
  const initials = name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();
  const sizes = { sm: 'h-8 w-8 text-[10px]', md: 'h-10 w-10 text-xs', lg: 'h-14 w-14 text-base' };
  return <span className={cn('inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#d9e9e9] font-bold text-[#0d526b] ring-2 ring-white', sizes[size], className)}>{src ? <img src={src} alt={name} className="h-full w-full object-cover" /> : initials}</span>;
};

// --- Table (Simple) ---
export const Table = ({ children, className, ...props }: React.TableHTMLAttributes<HTMLTableElement>) => (
  <div className="w-full overflow-x-auto rounded-xl border border-[#dce6e8] bg-white/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
    <table className={cn("w-full text-sm text-left", className)} {...props}>{children}</table>
  </div>
);

export const TableHeader = ({ children, className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) => (
  <thead className={cn("bg-[#f3f7f7] text-[#617984] font-medium border-b border-[#dce6e8]", className)} {...props}>
    {children}
  </thead>
);

export const TableRow = ({ children, className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) => (
  <tr className={cn("border-b border-[#edf3f5] last:border-0 hover:bg-[#f5f9f9] transition-colors duration-200 group", className)} {...props}>
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

export interface DataTableColumn<T> { key: string; header: React.ReactNode; render?: (row: T) => React.ReactNode; className?: string; }
export const DataTable = <T,>({ columns, data, getRowKey, emptyState = 'No records found.', className, onRowClick }: { columns: DataTableColumn<T>[]; data: T[]; getRowKey?: (row: T, index: number) => React.Key; emptyState?: React.ReactNode; className?: string; onRowClick?: (row: T) => void }) => (
  <Table className={className}>
    <TableHeader><TableRow>{columns.map((column) => <TableHead key={column.key} className={column.className}>{column.header}</TableHead>)}</TableRow></TableHeader>
    <tbody>{data.length === 0 ? <tr><td colSpan={columns.length} className="px-4 py-12 text-center text-sm text-[#78909a]">{emptyState}</td></tr> : data.map((row, index) => <TableRow key={getRowKey?.(row, index) ?? index} className={onRowClick ? 'cursor-pointer' : undefined} onClick={onRowClick ? () => onRowClick(row) : undefined}>{columns.map((column) => <TableCell key={column.key} className={column.className}>{column.render ? column.render(row) : String((row as Record<string, unknown>)[column.key] ?? '')}</TableCell>)}</TableRow>)}</tbody>
  </Table>
);

export const Pagination = ({ page, pageCount, onPageChange }: { page: number; pageCount: number; onPageChange: (page: number) => void }) => (
  <nav aria-label="Pagination" className="flex items-center justify-between gap-4 border-t border-[#e4ecec] px-1 pt-4 text-sm text-[#617984]">
    <span>Page {page} of {Math.max(pageCount, 1)}</span>
    <div className="flex gap-2"><Button variant="outline" size="icon" aria-label="Previous page" disabled={page <= 1} onClick={() => onPageChange(page - 1)}><ChevronLeft size={16} /></Button><Button variant="outline" size="icon" aria-label="Next page" disabled={page >= pageCount} onClick={() => onPageChange(page + 1)}><ChevronRight size={16} /></Button></div>
  </nav>
);

export const PageHeader = ({ title, description, actions }: { title: React.ReactNode; description?: React.ReactNode; actions?: React.ReactNode }) => <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#b08a3e]">FooDeeZ workspace</p><h1 className="text-2xl font-bold tracking-tight text-[#073b5c] sm:text-3xl">{title}</h1>{description && <p className="mt-2 max-w-2xl text-sm leading-6 text-[#617984]">{description}</p>}</div>{actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}</header>;
export const SectionHeader = ({ title, description, action }: { title: React.ReactNode; description?: React.ReactNode; action?: React.ReactNode }) => <div className="mb-4 flex items-start justify-between gap-4"><div><h2 className="text-lg font-bold text-[#12354a]">{title}</h2>{description && <p className="mt-1 text-sm text-[#78909a]">{description}</p>}</div>{action}</div>;
export const OceanCard = Card;
export const StatCard = ({ label, value, detail, icon, className }: { label: React.ReactNode; value: React.ReactNode; detail?: React.ReactNode; icon?: React.ReactNode; className?: string }) => <Card hoverEffect className={cn('relative overflow-hidden p-5', className)}><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#78909a]">{label}</p><p className="mt-3 text-2xl font-bold text-[#073b5c]">{value}</p>{detail && <p className="mt-1 text-xs text-[#617984]">{detail}</p>}</div>{icon && <span className="rounded-xl bg-[#eaf3f7] p-2.5 text-[#1e627d]">{icon}</span>}</div></Card>;
export const KpiCard = StatCard;

export const Tabs = ({ tabs, value, onChange }: { tabs: { value: string; label: React.ReactNode; disabled?: boolean }[]; value: string; onChange: (value: string) => void }) => <div role="tablist" className="flex gap-1 overflow-x-auto border-b border-[#dce6e8]">{tabs.map((tab) => <button key={tab.value} type="button" role="tab" aria-selected={value === tab.value} disabled={tab.disabled} onClick={() => onChange(tab.value)} className={cn('whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b08a3e] disabled:opacity-50', value === tab.value ? 'border-[#b08a3e] text-[#073b5c]' : 'border-transparent text-[#78909a] hover:border-[#bfd2d5] hover:text-[#12354a]')}>{tab.label}</button>)}</div>;
export const EmptyState = ({ title = 'Nothing here yet', description, action }: { title?: React.ReactNode; description?: React.ReactNode; action?: React.ReactNode }) => <div className="flex flex-col items-center justify-center px-6 py-12 text-center"><span className="mb-4 rounded-2xl bg-[#edf3f5] p-3 text-[#78909a]"><Inbox size={24} /></span><h3 className="font-bold text-[#12354a]">{title}</h3>{description && <p className="mt-2 max-w-sm text-sm text-[#78909a]">{description}</p>}{action && <div className="mt-5">{action}</div>}</div>;
export const LoadingState = ({ label = 'Loading...' }: { label?: string }) => <div role="status" className="flex items-center justify-center gap-2 py-12 text-sm text-[#617984]"><Loader2 size={18} className="animate-spin text-[#b08a3e]" />{label}</div>;
export const ErrorState = ({ message = 'Something went wrong.', onRetry }: { message?: React.ReactNode; onRetry?: () => void }) => <div role="alert" className="flex flex-col items-center justify-center gap-3 px-6 py-10 text-center text-sm text-[#a63e35]"><AlertCircle size={24} />{message}{onRetry && <Button variant="outline" size="sm" onClick={onRetry}>Try again</Button>}</div>;
export const Skeleton = ({ className }: { className?: string }) => <span aria-hidden="true" className={cn('block animate-pulse rounded-lg bg-[#e6eeee]', className)} />;

export const ProgressBar = ({ value, label, showValue = false }: { value: number; label?: string; showValue?: boolean }) => <div className="space-y-2">{(label || showValue) && <div className="flex justify-between text-xs font-semibold text-[#617984]"><span>{label}</span>{showValue && <span>{Math.round(value)}%</span>}</div>}<div className="h-2 overflow-hidden rounded-full bg-[#e6eeee]"><div className="h-full rounded-full bg-gradient-to-r from-[#0d7892] to-[#b08a3e] transition-[width] duration-300" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} /></div></div>;

export const Timeline = ({ items }: { items: { title: React.ReactNode; description?: React.ReactNode; date?: React.ReactNode; status?: 'done' | 'active' | 'pending' }[] }) => <ol className="space-y-5">{items.map((item, index) => <li key={index} className="relative flex gap-3"><span className={cn('mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border', item.status === 'done' ? 'border-[#b8e2d0] bg-[#eaf7f1] text-[#19704b]' : item.status === 'active' ? 'border-[#ead5a0] bg-[#fff7e7] text-[#8b641b]' : 'border-[#d5e1e3] bg-[#edf3f5] text-[#78909a]')}>{item.status === 'done' ? <CheckCircle2 size={15} /> : item.status === 'active' ? <Clock3 size={15} /> : <span className="h-2 w-2 rounded-full bg-current" />}</span><div className="min-w-0 flex-1"><div className="flex flex-wrap justify-between gap-2"><p className="text-sm font-semibold text-[#12354a]">{item.title}</p>{item.date && <time className="text-xs text-[#78909a]">{item.date}</time>}</div>{item.description && <p className="mt-1 text-sm text-[#78909a]">{item.description}</p>}</div></li>)}</ol>;

// --- Dialog ---
interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

export const Dialog = ({ open, onOpenChange, children }: DialogProps) => {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onOpenChange(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    dialogRef.current?.focus();
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onOpenChange]);

  if (!open) return null;

  const handleBackdropClick = () => onOpenChange(false);
  
  const handleBackdropKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Escape') onOpenChange(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#022337]/45 backdrop-blur-[2px]">
      <button
        type="button"
        aria-label="Close dialog"
        onClick={handleBackdropClick}
        onKeyDown={handleBackdropKeyDown}
        className="absolute inset-0"
      />
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        ref={dialogRef}
        className="relative"
      >
        {children}
      </div>
    </div>
  );
};

export const Modal = ({ open, onOpenChange, title, children, className }: DialogProps & { title?: React.ReactNode; className?: string }) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <div className={cn('max-h-[calc(100vh-2rem)] w-[min(100%-2rem,40rem)] overflow-y-auto rounded-2xl border border-white/70 bg-[#fffefa] p-6 shadow-[0_24px_80px_rgba(2,35,55,0.24)]', className)}>
      {title && <div className="mb-5 flex items-center justify-between gap-4 border-b border-[#e4ecec] pb-4"><h2 className="text-lg font-bold text-[#073b5c]">{title}</h2><button type="button" onClick={() => onOpenChange(false)} aria-label="Close dialog" className="rounded-lg p-1.5 text-[#78909a] transition-colors hover:bg-[#edf3f5] hover:text-[#12354a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b08a3e]"><X size={18} /></button></div>}
      {children}
    </div>
  </Dialog>
);

export const Drawer = ({ open, onOpenChange, title, children, side = 'right' }: DialogProps & { title?: React.ReactNode; side?: 'left' | 'right' }) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <div className={cn('fixed inset-y-0 w-[min(100%,28rem)] overflow-y-auto bg-[#fffefa] p-6 shadow-[-16px_0_50px_rgba(2,35,55,0.16)]', side === 'right' ? 'right-0' : 'left-0')}>
      <div className="mb-6 flex items-center justify-between gap-4 border-b border-[#e4ecec] pb-4"><h2 className="text-lg font-bold text-[#073b5c]">{title}</h2><button type="button" onClick={() => onOpenChange(false)} aria-label="Close drawer" className="rounded-lg p-1.5 text-[#78909a] transition-colors hover:bg-[#edf3f5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b08a3e]"><X size={18} /></button></div>
      {children}
    </div>
  </Dialog>
);

export const ConfirmationDialog = ({ open, onOpenChange, title = 'Are you sure?', description, confirmLabel = 'Confirm', onConfirm, destructive = false }: { open: boolean; onOpenChange: (open: boolean) => void; title?: React.ReactNode; description?: React.ReactNode; confirmLabel?: string; onConfirm: () => void; destructive?: boolean }) => (
  <Modal open={open} onOpenChange={onOpenChange} title={title} className="max-w-md">
    <p className="text-sm leading-6 text-[#617984]">{description}</p>
    <div className="mt-6 flex justify-end gap-2"><Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button><Button variant={destructive ? 'danger' : 'gold'} onClick={() => { onConfirm(); onOpenChange(false); }}>{confirmLabel}</Button></div>
  </Modal>
);

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