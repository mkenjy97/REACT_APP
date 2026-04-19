import React from 'react';
import { 
  Home, 
  Search, 
  Map, 
  MessageSquare, 
  User, 
  Settings, 
  Bell, 
  HelpCircle, 
  LogOut, 
  Plus, 
  ChevronRight, 
  ChevronLeft,
  X,
  Check,
  AlertCircle,
  Info,
  MoreVertical,
  Mail,
  Lock,
  Eye,
  EyeOff,
  type LucideIcon,
  type LucideProps
} from 'lucide-react';

const ICON_MAP = {
  Home,
  Search,
  Map,
  Chat: MessageSquare,
  User,
  Settings,
  Notifications: Bell,
  Support: HelpCircle,
  Logout: LogOut,
  Add: Plus,
  ChevronRight,
  ChevronLeft,
  Close: X,
  Check,
  Error: AlertCircle,
  Info,
  More: MoreVertical,
  Email: Mail,
  Password: Lock,
  Show: Eye,
  Hide: EyeOff,
} as const;

export type IconName = keyof typeof ICON_MAP;

interface IconProps extends LucideProps {
  name: IconName;
}

export const Icon = React.memo(({ name, ...props }: IconProps) => {
  const LucideIcon = ICON_MAP[name] as LucideIcon;
  if (!LucideIcon) {
    console.warn(`Icon "${name}" not found in ICON_MAP`);
    return null;
  }
  return <LucideIcon {...props} />;
});

Icon.displayName = 'Icon';
