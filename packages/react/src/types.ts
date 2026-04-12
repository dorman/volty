// ─── Shared variant types ────────────────────────────────────────────────────

export type SemanticVariant = 'success' | 'warning' | 'danger' | 'info';
export type ButtonVariant   = 'outline' | 'ghost' | 'surface' | 'danger';
export type ButtonSize      = 'sm' | 'lg';
export type BadgeVariant    = SemanticVariant | 'outline' | 'solid' | 'surface';
export type AlertVariant    = SemanticVariant;
export type ModalVariant    = 'danger' | 'sm' | 'lg' | 'full';
export type ProgressVariant = SemanticVariant;
export type SpinnerSize     = 'xs' | 'sm' | 'lg' | 'xl';
export type Theme           = 'light' | 'dark' | 'system';
export type Brand           = 'violet' | 'emerald' | 'rose' | 'amber' | 'cyan';

// ─── Toast config ────────────────────────────────────────────────────────────

export interface ToastOptions {
  message: string;
  title?: string;
  variant?: 'success' | 'warning' | 'danger';
  duration?: number;
  dismissible?: boolean;
  progress?: boolean;
  icon?: string | null;
}

// ─── Nav link ────────────────────────────────────────────────────────────────

export interface NavLink {
  href: string;
  label: string;
  active?: boolean;
  external?: boolean;
}

// ─── Tab ─────────────────────────────────────────────────────────────────────

export interface TabItem {
  label: string;
  panel: React.ReactNode;
  disabled?: boolean;
}

// ─── Accordion item ──────────────────────────────────────────────────────────

export interface AccordionItem {
  title: string;
  content: React.ReactNode;
  defaultOpen?: boolean;
}

// ─── Dropdown item ───────────────────────────────────────────────────────────

export type DropdownItem =
  | { type: 'item';      label: string; href?: string; danger?: boolean; disabled?: boolean; onClick?: () => void }
  | { type: 'separator' }
  | { type: 'label';     label: string };
