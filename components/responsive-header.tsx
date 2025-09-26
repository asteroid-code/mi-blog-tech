"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Menu, X, Sun, Moon } from "lucide-react"
import { useTheme } from "next-themes"
import { SearchInput } from "@/components/search-input" // Import SearchInput
import { Category } from "@/lib/contentService" // Import Category interface

interface ResponsiveHeaderProps {
  categories: Category[] | null;
}

export function ResponsiveHeader({ categories }: ResponsiveHeaderProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false) // Add mounted state
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    setMounted(true); // Set mounted to true on client side
    if (typeof window !== "undefined") {
      const storedTheme = localStorage.getItem("theme")
      if (storedTheme) {
        setTheme(storedTheme)
      } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        setTheme("dark")
      } else {
        setTheme("light")
      }

      const handleEscapeKey = (event: KeyboardEvent) => {
        if (event.key === "Escape") {
          setIsOpen(false)
        }
      }

      document.addEventListener("keydown", handleEscapeKey)
      return () => {
        document.removeEventListener("keydown", handleEscapeKey)
      }
    }
  }, [setTheme])

  const toggleMenu = () => {
    setIsOpen(!isOpen)
  }

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md transition-colors duration-300">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-75">
          <Image
            src="/placeholder-logo.svg" // Replace with your logo path
            alt="TechAI News Logo"
            width={32}
            height={32}
            className="h-8 w-8"
          />
          <span className="text-lg font-bold">TechAI News</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex md:flex-1 md:justify-center">
          <ul className="flex space-x-6">
            <li>
              <Link href="/" className="text-foreground transition-colors hover:text-primary">
                Inicio
              </Link>
            </li>
            {categories?.map((category) => (
              <li key={category.id}>
                <Link
                  href={`/category/${category.slug}`}
                  className="text-foreground transition-colors hover:text-primary"
                >
                  {category.name}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/articles" className="text-foreground transition-colors hover:text-primary">
                Artículos
              </Link>
            </li>
            <li>
              <Link href="/about" className="text-foreground transition-colors hover:text-primary">
                Acerca de
              </Link>
            </li>
          </ul>
        </nav>

        {/* Search Bar & Mobile Menu Button & Theme Toggle */}
        <div className="flex items-center gap-4 md:gap-6">
          <div className="hidden md:block">
            <SearchInput />
          </div>
          {mounted && (
            <button
              onClick={toggleTheme}
              className="rounded-full p-2 transition-colors hover:bg-muted"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <Sun className="h-5 w-5 text-foreground" />
              ) : (
                <Moon className="h-5 w-5 text-foreground" />
              )}
            </button>
          )}
          <button
            onClick={toggleMenu}
            className="rounded-full p-2 transition-colors hover:bg-muted md:hidden"
            aria-label="Toggle mobile menu"
          >
            {isOpen ? (
              <X className="h-6 w-6 text-foreground" />
            ) : (
              <Menu className="h-6 w-6 text-foreground" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? "max-h-screen opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <nav className="pb-4">
          <ul className="flex flex-col items-center space-y-4">
            <li>
              <Link href="/" className="text-foreground transition-colors hover:text-primary" onClick={() => setIsOpen(false)}>
                Inicio
              </Link>
            </li>
            {categories?.map((category) => (
              <li key={category.id}>
                <Link
                  href={`/category/${category.slug}`}
                  className="text-foreground transition-colors hover:text-primary"
                  onClick={() => setIsOpen(false)}
                >
                  {category.name}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/articles" className="text-foreground transition-colors hover:text-primary" onClick={() => setIsOpen(false)}>
                Artículos
              </Link>
            </li>
            <li>
              <Link href="/about" className="text-foreground transition-colors hover:text-primary" onClick={() => setIsOpen(false)}>
                Acerca de
              </Link>
            </li>
          </ul>
        </nav>
        <div className="flex justify-center pb-4 md:hidden">
          <SearchInput />
        </div>
      </div>

      {/* Overlay for closing mobile menu */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}
    </header>
  )
}
