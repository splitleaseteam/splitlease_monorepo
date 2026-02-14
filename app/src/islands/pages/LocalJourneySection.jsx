export default function LocalJourneySection({ onExploreRentals }) {
  const features = [
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      ),
      title: 'Move-in Ready',
      description: 'Fully-furnished spaces ensure move-in is a breeze. No need to buy furniture or set up utilities. Just bring your suitcase.',
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
          <line x1="12" y1="22.08" x2="12" y2="12" />
        </svg>
      ),
      title: 'Everything You Need',
      description: 'Store items like toiletries, a second monitor, work attire, and more. Your space is ready when you return.',
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v6l4 2" />
        </svg>
      ),
      title: 'Total Flexibility',
      description: 'Switch neighborhoods seasonally, or keep your spot indefinitely. Discover the freedom of a second-home lifestyle.',
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        </svg>
      ),
      title: 'Business Ready',
      description: 'High-speed Wi-Fi and dedicated workspaces in every unit. Perfect for the hybrid commuter.',
    }
  ];

  return (
    <section className="local-journey-section">
      <div className="local-journey-content">
        <div className="local-journey-header">
          <span className="local-journey-eyebrow">Flexible Living</span>
          <h2>Choose when to be a local</h2>
          <p>Enjoy a second-home lifestyle on your schedule. Stay in the city on the days you need, relax in fully-set spaces.</p>
        </div>

        <div className="local-journey-grid" role="list">
          {features.map((feature, index) => (
            <article
              key={feature.title}
              className="local-journey-card"
              role="listitem"
            >
              <div className="local-journey-card-number" aria-hidden="true">
                <span>{String(index + 1).padStart(2, '0')}</span>
              </div>
              <div className="local-journey-icon">
                {feature.icon}
              </div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </article>
          ))}

          <article className="local-journey-card cta-card" role="listitem">
            <div className="cta-card-content">
              <h3>Ready to start?</h3>
              <p>Find your perfect split lease today.</p>
              <button className="local-journey-button" onClick={onExploreRentals}>
                <span>Explore Rentals</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
