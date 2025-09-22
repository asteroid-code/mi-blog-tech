import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function Header() {
  return (
    <header className="sticky top-0 z-50 glassmorphism border-b border-border/50">
      <nav className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground text-lg">⚡</span>
            </div>
            <h1 className="text-xl font-bold gradient-text">TechAI News</h1>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <nav className="flex items-center space-x-6">
              <a href="#" className="text-sm font-medium hover:text-primary transition-colors">
                Inicio
              </a>
              <a href="#" className="text-sm font-medium hover:text-primary transition-colors">
                Inteligencia Artificial
              </a>
              <a href="#" className="text-sm font-medium hover:text-primary transition-colors">
                Tecnología
              </a>
              <a href="#" className="text-sm font-medium hover:text-primary transition-colors">
                Análisis
              </a>
              <a href="#" className="text-sm font-medium hover:text-primary transition-colors">
                Tendencias
              </a>
            </nav>
          </div>

          {/* Search Bar */}
          <div className="hidden md:flex items-center space-x-4">
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">🔍</span>
              <Input
                placeholder="Buscar noticias..."
                className="pl-10 w-64 bg-input border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300"
              />
            </div>
          </div>

          {/* Mobile Menu Button */}
          <Button variant="ghost" size="icon" className="md:hidden">
            <span className="text-lg">☰</span>
          </Button>
        </div>
      </nav>
    </header>
  )
}
