import Link from 'next/link'
import Image from 'next/image'
import NavLinks from '@/components/NavLinks'

export default function Navbar() {
  return (
    <header className="site-header">
      <div className="container nav-inner">
        <Link className="brand" href="/" aria-label="Meier Open Startseite">
          <Image
            src="/logo.png"
            alt="Meier Open"
            width={72}
            height={72}
            priority
          />
        </Link>

        <NavLinks />
      </div>
    </header>
  )
}
