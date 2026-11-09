import { useEffect, useState } from 'react'
import { authSession } from '../../auth/api/authApi'
import { Icon } from '../../../shared/components/Icon'
import { LanguageToggle } from '../../../shared/components/LanguageToggle'
import { useI18n } from '../../../shared/i18n'
import { landingMessages } from '../content'
import { ChatbotWidget } from '../components/ChatbotWidget'
import { resolveCreateRequestTarget } from '../resolveCreateRequestTarget'
import { FlightMissionExperience } from '../showcase/FlightMissionExperience'
import { landingPageMessages } from './LandingPage.messages'
import '../landing.css'

function Logo() {
  const { t } = useI18n(landingMessages)
  const { lang } = useI18n(landingPageMessages)

  return (
    <a
      className="lpx-logo"
      href="#top"
      aria-label={
        lang === 'en' ? `${t.brandName} home` : `${t.brandName} - trang chủ`
      }
    >
      <img src="/images/logo-new.png" alt="" width="46" height="46" />
      <span>
        <b>OnDemand</b>
        <b>Monitor</b>
      </span>
    </a>
  )
}

function Header({ createRequestTarget }: { createRequestTarget: string }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const { t: copy } = useI18n(landingMessages)
  const { t } = useI18n(landingPageMessages)

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false)
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [])

  return (
    <header className="lpx-header">
      <div className="lpx-container lpx-header-inner">
        <Logo />
        <nav
          className={`lpx-nav${menuOpen ? ' lpx-nav--open' : ''}`}
          id="lpx-main-nav"
          aria-label={t.mainNavAriaLabel}
        >
          {copy.navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </a>
          ))}
          <a
            className="lpx-button lpx-button--primary lpx-nav-cta"
            href={createRequestTarget}
            onClick={() => setMenuOpen(false)}
          >
            {t.createRequest}
            <span className="lpx-nav-cta-arrow" aria-hidden="true">
              →
            </span>
          </a>
        </nav>
        <div className="lpx-header-tools">
          <LanguageToggle className="lpx-language" />
          <button
            className="lpx-menu-button"
            type="button"
            aria-label={menuOpen ? t.closeMenu : t.openMenu}
            aria-expanded={menuOpen}
            aria-controls="lpx-main-nav"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <Icon name={menuOpen ? 'x' : 'menu'} />
          </button>
        </div>
      </div>
    </header>
  )
}

export function LandingPage() {
  const createRequestTarget = resolveCreateRequestTarget(authSession.getUser())
  const { lang, t } = useI18n(landingPageMessages)
  const { t: copy } = useI18n(landingMessages)

  useEffect(() => {
    document.documentElement.lang = lang
    document.title =
      lang === 'en'
        ? 'OnDemand Monitor — Track missions from request to result'
        : 'OnDemand Monitor — Theo dõi nhiệm vụ từ yêu cầu đến kết quả'

    const description =
      lang === 'en'
        ? 'Follow site requests through planning, pre-flight preparation, and Manager review of post-flight records.'
        : 'Theo dõi yêu cầu hiện trường qua các bước lập kế hoạch, chuẩn bị trước bay và Manager rà soát hồ sơ sau bay.'
    let meta = document.querySelector<HTMLMetaElement>(
      'meta[name="description"]',
    )
    if (!meta) {
      meta = document.createElement('meta')
      meta.name = 'description'
      document.head.append(meta)
    }
    meta.content = description
  }, [lang])

  return (
    <div id="top" className="odm odm-landing lp-immersive lpx-page">
      <a className="lp-skip-link" href="#main-content">
        {t.skipLink}
      </a>
      <Header createRequestTarget={createRequestTarget} />
      <main id="main-content">
        <FlightMissionExperience
          lang={lang}
          createRequestTarget={createRequestTarget}
          heroChip={t.heroChip}
          heroTitleLines={t.heroTitleLines}
          heroLede={copy.hero.lead}
          createRequestCta={t.createRequestCta}
          seeHowItWorks={t.seeHowItWorks}
        />
      </main>
      <ChatbotWidget />
    </div>
  )
}
