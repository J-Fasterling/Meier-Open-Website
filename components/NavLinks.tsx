'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

type NavItem = {
  href: string
  label: string
  cta?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { href: '/turniere', label: 'Turniere' },
  { href: '/sponsoren', label: 'Sponsoren' },
  { href: '/admin/login', label: 'Admin' },
  { href: '/ueben', label: 'Training', cta: true },
]

function isActivePath(pathname: string, href: string) {
  if (href === '/') {
    return pathname === '/'
  }
  return pathname === href || pathname.startsWith(`${href}/`)
}

export default function NavLinks() {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  return (
    <>
      <button
        type="button"
        className="nav-toggle"
        aria-expanded={menuOpen}
        aria-controls="site-nav-links"
        onClick={() => setMenuOpen((value) => !value)}
      >
        Menü
      </button>
      <nav id="site-nav-links" className={`nav-links ${menuOpen ? 'is-open' : ''}`}>
        {NAV_ITEMS.map((item) => {
          const isActive = isActivePath(pathname, item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`${item.cta ? 'cta' : ''} ${isActive ? 'is-active' : ''}`.trim()}
              aria-current={isActive ? 'page' : undefined}
            >
              {item.label}
            </Link>
          )
        })}
      </nav>
    </>
  )
}
