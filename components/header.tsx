import { Button } from "@/components/ui/button"
import { SearchInput } from "@/components/search-input"
import Link from "next/link"; // Import Link for navigation
import { Category } from "@/lib/contentService"; // Import Category interface

interface HeaderProps {
  categories: Category[] | null;
}

export function Header({ categories }: HeaderProps) {
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
              <Link href="/" className="text-sm font-medium hover:text-primary transition-colors">
                Inicio
              </Link>
              {categories?.map((category) => (
                <Link
                  key={category.id}
                  href={`/category/${category.slug}`}
                  className="text-sm font-medium hover:text-primary transition-colors"
                >
                  {category.name}
                </Link>
              ))}
            </nav>
          </div>

          {/* Search Bar */}
          <div className="hidden md:flex items-center space-x-4">
            <SearchInput />
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
