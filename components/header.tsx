"use client"

import { ResponsiveHeader } from "./responsive-header"
import { Category } from "@/lib/contentService"

interface HeaderProps {
  categories: Category[] | null;
}

export function Header({ categories }: HeaderProps) {
  return <ResponsiveHeader categories={categories} />
}
