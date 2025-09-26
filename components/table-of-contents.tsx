"use client";

import React, { useEffect, useState } from 'react';

interface Heading {
  id: string;
  text: string;
  level: number;
}

export function TableOfContents() {
  const [headings, setHeadings] = useState<Heading[]>([]);

  useEffect(() => {
    const headingElements = Array.from(
      document.querySelectorAll('h2, h3, h4, h5, h6')
    ).map((heading) => ({
      id: heading.id,
      text: heading.textContent || '',
      level: parseInt(heading.tagName.substring(1)),
    }));
    setHeadings(headingElements);
  }, []);

  if (headings.length === 0) {
    return null;
  }

  return (
    <nav className="sticky top-20 hidden xl:block space-y-2">
      <h3 className="text-lg font-semibold mb-3">Contenido</h3>
      <ul className="space-y-2">
        {headings.map((heading) => (
          <li key={heading.id} className={`text-sm ${heading.level > 2 ? 'ml-4' : ''}`}>
            <a
              href={`#${heading.id}`}
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
