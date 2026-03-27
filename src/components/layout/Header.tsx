import { Moon, Sun, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAppStore } from '@/stores/useAppStore'
import { supabase } from '@/lib/supabase'
import { useNavigate } from 'react-router-dom'

export function Header() {
  const { theme, setTheme } = useAppStore()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  return (
    <header className="flex h-14 items-center justify-between border-b bg-background px-3 sm:px-4 md:px-6">
      {/* Mobile: show app name since sidebar is hidden */}
      <div className="flex items-center gap-2 md:hidden">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-xs">
          TL
        </div>
        <span className="font-semibold">TradeLog</span>
      </div>
      <div className="hidden md:block" />
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" onClick={toggleTheme}>
          {theme === 'dark' ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </Button>
        <Button variant="ghost" size="icon" onClick={handleLogout}>
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  )
}
