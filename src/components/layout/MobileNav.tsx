import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  LineChart,
  BookOpen,
  Shield,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/trades', label: 'Giao dịch', icon: LineChart },
  { to: '/journal', label: 'Nhật ký', icon: BookOpen },
  { to: '/rules', label: 'Kỷ luật', icon: Shield },
]

export function MobileNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex md:hidden border-t bg-background safe-bottom">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            cn(
              'flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors',
              isActive
                ? 'text-primary'
                : 'text-muted-foreground'
            )
          }
        >
          <item.icon className="h-5 w-5" />
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
