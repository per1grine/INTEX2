import { Link } from 'react-router-dom'

const footerGroups = [
  {
    title: 'Explore',
    links: [
      { label: 'Home', to: '/' },
      { label: 'Impact dashboard', to: '/impact' },
      { label: 'Privacy policy', to: '/privacy' },
    ],
  },
  {
    title: 'Get Involved',
    links: [
      { label: 'Ways to help', to: '/donors' },
      { label: 'Volunteer pathways', to: '/donors#supporter-types' },
      { label: 'Board updates', to: '/impact#stewardship' },
    ],
  },
  {
    title: 'Operations',
    links: [
      { label: 'Admin dashboard', to: '/admin' },
      { label: 'Staff sign in', to: '/login' },
      { label: 'Create staff account', to: '/register' },
    ],
  },
]

const socialLinks = [
  { label: 'Instagram', href: '#', icon: '/icons/insta_icon.svg' },
  { label: 'Facebook', href: '#', icon: '/icons/fb_icon.svg' },
  { label: 'LinkedIn', href: '#', icon: '/icons/linkedin_icon.svg' },
  { label: 'YouTube', href: '#', icon: '/icons/youtube_icon.svg' },
  { label: 'X', href: '#', icon: null },
]

export function Footer() {
  return (
    <footer className="siteFooter">
      <div className="footerWrap">
        {footerGroups.map((group) => (
          <div key={group.title} className="footerGroup">
            <h2>{group.title}</h2>
            {group.links.map((link) => (
              <Link key={link.label} to={link.to}>
                {link.label}
              </Link>
            ))}
          </div>
        ))}

        <div className="footerGroup">
          <h2>Connect</h2>
          <div className="socialRow" aria-label="Social media links">
            {socialLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="socialButton"
                aria-label={link.label}
              >
                {link.icon ? <img src={link.icon} alt="" /> : <span>{link.label}</span>}
              </a>
            ))}
          </div>
        </div>

        <div className="footerBottom">
          <div className="footerIdentity">
            <img src="/logo/kid_stars.svg" alt="" className="footerIcon" />
            <strong>North Star</strong>
          </div>
          <div className="footerMeta">
            <button className="langToggle" type="button" aria-label="Switch language">
              EN | ES
            </button>
          </div>
          <p>
            North Star exists to provide immediate refuge, trauma-informed support, and stable
            pathways forward for children recovering from trafficking and abuse in Colombia.
          </p>
        </div>
      </div>
    </footer>
  )
}
