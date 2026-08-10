import { Calendar, ExternalLink, Instagram, MapPin, Twitter } from 'lucide-react'
import UserAvatar from './UserAvatar'

export function ProfileIdentityCard({ profile, memberSince, actions, label = 'Member profile' }) {
  const socialLinks = profile?.social_links || profile?.socialLinks || {}

  return (
    <section className="relative overflow-hidden border-y border-white/10 bg-[#11120f]">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-[#e85d4a] via-[#e85d4a]/40 to-transparent" />
      <div className="grid gap-6 px-5 py-7 sm:px-7 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:items-center lg:px-8">
        <UserAvatar
          src={profile?.avatar}
          name={profile?.name}
          username={profile?.username}
          className="h-24 w-24 border border-white/15 object-cover sm:h-28 sm:w-28"
          fallbackClassName="font-display text-4xl"
        />

        <div className="min-w-0">
          <p className="ui-eyebrow text-[#e85d4a]">{label}</p>
          <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h1 className="font-display text-4xl leading-none text-[#f3efe6] sm:text-5xl">
              {profile?.name || profile?.username}
            </h1>
            {profile?.username && <span className="font-mono text-sm text-[#77756f]">@{profile.username}</span>}
          </div>

          {profile?.bio ? (
            <p className="mt-4 max-w-2xl text-sm leading-6 text-[#aaa79f]">{profile.bio}</p>
          ) : (
            <p className="mt-4 text-sm italic text-[#66645f]">No profile note has been added yet.</p>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-[#77756f]">
            {profile?.location && (
              <span className="inline-flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5" />
                {profile.location}
              </span>
            )}
            {memberSince && (
              <span className="inline-flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5" />
                Member since {new Date(memberSince).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
              </span>
            )}
            {socialLinks.twitter && <SocialLink href={`https://twitter.com/${socialLinks.twitter}`} label="Twitter" icon={Twitter} />}
            {socialLinks.instagram && <SocialLink href={`https://instagram.com/${socialLinks.instagram}`} label="Instagram" icon={Instagram} />}
            {socialLinks.letterboxd && <SocialLink href={`https://letterboxd.com/${socialLinks.letterboxd}`} label="Letterboxd" icon={ExternalLink} />}
          </div>
        </div>

        {actions && <div className="flex flex-wrap gap-2 lg:max-w-72 lg:justify-end">{actions}</div>}
      </div>
    </section>
  )
}

export function ProfileStats({ items }) {
  const layout = items.length === 3 ? 'sm:grid-cols-3' : items.length >= 4 ? 'sm:grid-cols-2 lg:grid-cols-4' : 'sm:grid-cols-2'

  return (
    <div className={`grid overflow-hidden border-b border-white/10 bg-[#0f100e] ${layout}`}>
      {items.map((item) => {
        const Icon = item.icon
        return (
          <div key={item.label} className="-ml-px -mt-px flex items-center gap-4 border-l border-t border-white/10 px-5 py-4">
            {Icon && <Icon className="h-5 w-5 text-[#e85d4a]" strokeWidth={1.4} />}
            <div>
              <span className="font-display text-2xl text-[#f3efe6]">{item.value ?? 0}</span>
              <span className="ml-2 text-xs text-[#77756f]">{item.label}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function SocialLink({ href, label, icon: Icon }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 transition hover:text-[#f3efe6]">
      <Icon className="h-3.5 w-3.5" />
      {label}
    </a>
  )
}
