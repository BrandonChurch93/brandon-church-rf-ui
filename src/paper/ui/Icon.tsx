import {
  Accessibility, Archive, ArchiveRestore, ArrowDown, ArrowRight, ArrowUp, ArrowUpDown, Ban, Building2, Calendar, CalendarClock,
  CalendarDays, CalendarPlus, CalendarRange, Camera, Check, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, ChevronsUpDown,
  CircleAlert, CircleCheck, Clock, Compass, Copy, CopyPlus, CreditCard, Download, Ellipsis, EllipsisVertical, ExternalLink,
  FileText, Globe, GitBranch, GripVertical, ImagePlus, Info, KeyRound, Layers, LayoutGrid, List, ListChecks, Lock, LogOut, Mail,
  Map, MapPin, Menu, Mic, Minus, Monitor, MonitorSmartphone, Moon, Package, Pencil, Percent, Phone, Plus, RefreshCw, RotateCcw,
  Rows3, Search, SearchX, Send, SlidersHorizontal, Star, Store, Sun, Tag, Ticket, Trash2, TriangleAlert, Undo2, Upload, UserCheck,
  UserPlus, Users, X, ZoomIn, ZoomOut, type LucideIcon,
} from 'lucide-react';

// One icon set (Lucide), one stroke width. Names are kebab-case keys so call sites read plainly.
export const icons = {
  accessibility: Accessibility,
  archive: Archive,
  'archive-restore': ArchiveRestore,
  'arrow-down': ArrowDown,
  'arrow-right': ArrowRight,
  'arrow-up': ArrowUp,
  'arrow-up-down': ArrowUpDown,
  ban: Ban,
  building: Building2,
  calendar: Calendar,
  'calendar-clock': CalendarClock,
  'calendar-days': CalendarDays,
  'calendar-plus': CalendarPlus,
  'calendar-range': CalendarRange,
  camera: Camera,
  check: Check,
  'chevron-down': ChevronDown,
  'chevron-left': ChevronLeft,
  'chevron-right': ChevronRight,
  'chevron-up': ChevronUp,
  'chevrons-up-down': ChevronsUpDown,
  'circle-alert': CircleAlert,
  'circle-check': CircleCheck,
  clock: Clock,
  compass: Compass,
  copy: Copy,
  duplicate: CopyPlus,
  'credit-card': CreditCard,
  download: Download,
  ellipsis: Ellipsis,
  'ellipsis-vertical': EllipsisVertical,
  'external-link': ExternalLink,
  'file-text': FileText,
  globe: Globe,
  'git-branch': GitBranch,
  grip: GripVertical,
  'image-plus': ImagePlus,
  info: Info,
  'key-round': KeyRound,
  layers: Layers,
  grid: LayoutGrid,
  list: List,
  'list-checks': ListChecks,
  lock: Lock,
  'log-out': LogOut,
  mail: Mail,
  map: Map,
  'map-pin': MapPin,
  menu: Menu,
  mic: Mic,
  minus: Minus,
  monitor: Monitor,
  'monitor-smartphone': MonitorSmartphone,
  moon: Moon,
  package: Package,
  pencil: Pencil,
  percent: Percent,
  phone: Phone,
  plus: Plus,
  refresh: RefreshCw,
  'rotate-ccw': RotateCcw,
  rows: Rows3,
  search: Search,
  'search-x': SearchX,
  send: Send,
  sliders: SlidersHorizontal,
  star: Star,
  store: Store,
  sun: Sun,
  tag: Tag,
  ticket: Ticket,
  trash: Trash2,
  'triangle-alert': TriangleAlert,
  undo: Undo2,
  upload: Upload,
  'user-check': UserCheck,
  'user-plus': UserPlus,
  users: Users,
  x: X,
  'zoom-in': ZoomIn,
  'zoom-out': ZoomOut,
} satisfies Record<string, LucideIcon>;

export type IconName = keyof typeof icons;

interface IconProps {
  name: IconName;
  size?: number;
  /** Makes the icon meaningful to assistive tech. Without it the icon is decorative. */
  label?: string;
  className?: string;
  strokeWidth?: number;
}

export function Icon({ name, size = 18, label, className, strokeWidth = 1.75 }: IconProps) {
  const C = icons[name];
  return (
    <C
      size={size}
      strokeWidth={strokeWidth}
      className={className}
      aria-hidden={label ? undefined : true}
      aria-label={label}
      role={label ? 'img' : undefined}
      focusable="false"
    />
  );
}
