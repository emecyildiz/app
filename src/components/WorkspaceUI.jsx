export function WorkspacePage({ eyebrow, title, description, badge, children }) {
  return (
    <main className="min-h-screen-dvh pt-24 pb-16">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <header className="border-b border-white/10 pb-8 sm:flex sm:items-end sm:justify-between sm:gap-8">
          <div className="max-w-3xl">
            <p className="ui-eyebrow text-[#e85d4a]">{eyebrow}</p>
            <h1 className="mt-3 font-display text-4xl leading-none text-[#f3efe6] sm:text-5xl">{title}</h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-[#918e86] sm:text-base">{description}</p>
          </div>
          {badge && (
            <div className="mt-5 inline-flex border border-[#e85d4a]/30 bg-[#e85d4a]/[0.07] px-3 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[#f48a79] sm:mt-0">
              {badge}
            </div>
          )}
        </header>
        {children}
      </div>
    </main>
  )
}

export function WorkspaceTabs({ items, active, onChange, label = 'Workspace sections' }) {
  return (
    <nav aria-label={label} className="mt-6 overflow-x-auto border-b border-white/10">
      <div className="flex min-w-max gap-7">
        {items.map((item) => {
          const Icon = item.icon
          const selected = active === item.id
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onChange(item.id)}
              aria-current={selected ? 'page' : undefined}
              className={`group flex items-center gap-2 border-b-2 py-4 text-sm transition ${
                selected
                  ? 'border-[#e85d4a] text-[#f3efe6]'
                  : 'border-transparent text-[#77756f] hover:text-[#d8d2c7]'
              }`}
            >
              {Icon && <Icon className={`h-4 w-4 ${selected ? 'text-[#e85d4a]' : 'text-current'}`} />}
              <span>{item.label}</span>
              {item.dot && <span className="h-2 w-2 rounded-full bg-[#e85d4a]" aria-label="New activity" />}
            </button>
          )
        })}
      </div>
    </nav>
  )
}

export function MetricStrip({ items, className = '' }) {
  return (
    <section className={`mt-8 grid overflow-hidden border-y border-white/10 bg-[#11120f] sm:grid-cols-2 lg:grid-cols-4 ${className}`}>
      {items.map((item, index) => {
        const Icon = item.icon
        return (
          <div
            key={item.label}
            className={`flex min-h-28 items-center justify-between gap-5 px-5 py-5 ${
              index > 0 ? 'border-t border-white/10' : ''
            } ${
              index % 2 === 1 ? 'sm:border-l' : ''
            } ${
              index >= 2 ? 'sm:border-t' : 'sm:border-t-0'
            } ${
              index > 0 ? 'lg:border-l lg:border-t-0' : 'lg:border-l-0 lg:border-t-0'
            }`}
          >
            <div>
              <p className="ui-eyebrow">{item.label}</p>
              <p className="mt-2 font-display text-3xl leading-none text-[#f3efe6]">{item.value ?? 0}</p>
              {item.note && <p className="mt-2 text-xs text-[#77756f]">{item.note}</p>}
            </div>
            {Icon && <Icon className="h-6 w-6 text-[#e85d4a]" strokeWidth={1.4} />}
          </div>
        )
      })}
    </section>
  )
}

export function WorkspacePanel({ eyebrow, title, description, action, children, className = '' }) {
  return (
    <section className={`ui-surface ${className}`}>
      {(eyebrow || title || description || action) && (
        <header className="border-b border-white/10 px-5 py-5 sm:flex sm:items-start sm:justify-between sm:gap-6 sm:px-6">
          <div>
            {eyebrow && <p className="ui-eyebrow text-[#e85d4a]">{eyebrow}</p>}
            {title && <h2 className="mt-1 font-display text-2xl text-[#f3efe6]">{title}</h2>}
            {description && <p className="mt-2 max-w-2xl text-sm leading-6 text-[#77756f]">{description}</p>}
          </div>
          {action && <div className="mt-4 shrink-0 sm:mt-0">{action}</div>}
        </header>
      )}
      {children}
    </section>
  )
}

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex min-h-52 flex-col items-center justify-center px-6 py-10 text-center">
      {Icon && <Icon className="h-8 w-8 text-[#e85d4a]" strokeWidth={1.4} />}
      <h3 className="mt-4 font-display text-2xl text-[#f3efe6]">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-[#77756f]">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
