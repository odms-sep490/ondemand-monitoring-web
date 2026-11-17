import { useEffect, useRef, useState } from 'react'

import { Icon, type IconName } from '../../../shared/components/Icon'
import { LanguageToggle } from '../../../shared/components/LanguageToggle'
import { useI18n } from '../../../shared/i18n'
import { authSession } from '../../auth/api/authApi'
import { ChatbotWidget } from '../components/ChatbotWidget'
import { resolveCreateRequestTarget } from '../resolveCreateRequestTarget'
import { landingPageMessages } from './LandingPage.messages'
import '../landing.css'

const SERVICE_ICONS: readonly IconName[] = [
  'clipboard',
  'shield',
  'camera',
  'check',
]

function BrandMark({
  brandName,
  lang,
}: {
  brandName: string
  lang: 'vi' | 'en'
}) {
  return (
    <a
      className="lpx-logo"
      href="#top"
      aria-label={lang === 'en' ? `${brandName} home` : `${brandName} — trang chủ`}
    >
      <img src="/images/logo-new.png" alt="" width="34" height="34" />
      <span className="lpx-logo-text">
        <b>OnDemand</b>
        <span>Monitor</span>
      </span>
    </a>
  )
}

function PrimaryCta({ href, label }: { href: string; label: string }) {
  return (
    <a className="lpx-cta-mint" href={href}>
      <span>{label}</span>
      <Icon name="arrow-up-right" className="lpx-cta-icon" />
    </a>
  )
}

function useRevealOnScroll<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [state, setState] = useState<'idle' | 'ready' | 'visible'>('idle')

  useEffect(() => {
    const node = ref.current
    if (!node) return
    if (
      typeof IntersectionObserver === 'undefined' ||
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    ) {
      return
    }

    setState('ready')
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setState('visible')
            observer.unobserve(node)
            break
          }
        }
      },
      { threshold: 0.14, rootMargin: '0px 0px -36px 0px' },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return { ref, state }
}

export function LandingPage() {
  const createRequestTarget = resolveCreateRequestTarget(authSession.getUser())
  const { lang, t } = useI18n(landingPageMessages)
  const servicesReveal = useRevealOnScroll<HTMLElement>()
  const aboutReveal = useRevealOnScroll<HTMLElement>()

  useEffect(() => {
    document.documentElement.lang = lang
    document.title = t.pageTitle
    let meta = document.querySelector<HTMLMetaElement>('meta[name="description"]')
    if (!meta) {
      meta = document.createElement('meta')
      meta.name = 'description'
      document.head.appendChild(meta)
    }
    meta.content = t.pageDescription
  }, [lang, t.pageDescription, t.pageTitle])

  return (
    <div id="top" className="odm odm-landing lp-immersive lpx-page lp-editorial">
      <a className="lp-skip-link" href="#main-content">
        {t.skipLink}
      </a>

      <header className="lpx-header">
        <div className="lpx-container lpx-header-inner">
          <BrandMark brandName={t.brandName} lang={lang} />

          <nav className="lpx-nav" aria-label={t.mainNavAriaLabel}>
            {t.navLinks.map((link) => (
              <a key={link.href} href={link.href}>
                {link.label}
              </a>
            ))}
          </nav>

          <div className="lpx-header-tools">
            <LanguageToggle className="lpx-language" />
            <a className="lpx-nav-signin" href="#auth/login">
              {t.signIn}
            </a>
            <a className="lpx-header-cta" href={createRequestTarget}>
              {t.createRequestCta}
            </a>
          </div>
        </div>
      </header>

      <main id="main-content">
        <section className="lpx-hero" aria-labelledby="lpx-hero-heading">
          <img
            className="lpx-hero-media"
            src="/images/landing/landing-apron.webp"
            alt={t.heroImageAlt}
            width={1600}
            height={900}
          />
          <div className="lpx-hero-scrim" aria-hidden="true" />

          <div className="lpx-container lpx-hero-inner">
            <div className="lpx-hero-content">
              <h1 id="lpx-hero-heading" className="lpx-hero-title">
                <span>{t.heroTitleLine1}</span>{' '}
                <span>{t.heroTitleLine2}</span>
              </h1>
              <p className="lpx-hero-subtitle">{t.heroSubtitle}</p>
              <div className="lpx-hero-actions">
                <PrimaryCta href={createRequestTarget} label={t.createRequestCta} />
                <a className="lpx-text-link" href="#how-it-works">
                  {t.seeHowItWorks}
                </a>
              </div>
            </div>
          </div>
        </section>

        <section
          id="services"
          ref={servicesReveal.ref}
          className={`lpx-services${
            servicesReveal.state === 'ready'
              ? ' lpx-reveal-ready'
              : servicesReveal.state === 'visible'
                ? ' lpx-reveal-ready is-visible'
                : ''
          }`}
          aria-labelledby="lpx-services-heading"
        >
          <div className="lpx-container">
            <div className="lpx-section-eyebrow lpx-section-eyebrow--light">
              {t.servicesEyebrow}
            </div>

            <div className="lpx-services-layout">
              <div className="lpx-services-intro">
                <h2
                  id="lpx-services-heading"
                  className="lpx-section-title lpx-section-title--dark"
                >
                  {t.servicesHeading}
                </h2>
                <div className="lpx-section-action">
                  <PrimaryCta href={createRequestTarget} label={t.createRequestCta} />
                </div>
              </div>

              <div className="lpx-services-grid">
                {t.servicesItems.map((item, idx) => (
                  <article key={item.index} className="lpx-service-cell">
                    <div className="lpx-service-cell-head">
                      <span className="lpx-service-icon" aria-hidden="true">
                        <Icon name={SERVICE_ICONS[idx] ?? 'check'} />
                      </span>
                      <span className="lpx-service-index">{item.index}</span>
                    </div>
                    <h3 className="lpx-service-title">{item.title}</h3>
                    <p className="lpx-service-desc">{item.description}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section
          id="about"
          ref={aboutReveal.ref}
          className={`lpx-about${
            aboutReveal.state === 'ready'
              ? ' lpx-reveal-ready'
              : aboutReveal.state === 'visible'
                ? ' lpx-reveal-ready is-visible'
                : ''
          }`}
          aria-labelledby="lpx-about-heading"
        >
          <div className="lpx-container">
            <div className="lpx-section-eyebrow lpx-section-eyebrow--dark">
              {t.aboutEyebrow}
            </div>

            <div id="how-it-works" className="lpx-about-layout">
              <div className="lpx-about-media-wrap">
                <img
                  className="lpx-about-media"
                  src="/images/landing/wind-farm.webp"
                  alt={t.aboutImageAlt}
                  width={1600}
                  height={900}
                  loading="lazy"
                />
                <div className="lpx-reticle-box" aria-hidden="true">
                  <span className="lpx-reticle-tag">{t.aboutOverlayTag}</span>
                  <span className="lpx-reticle-scan" />
                </div>
                <div className="lpx-media-caption">
                  <span className="lpx-media-dot" aria-hidden="true" />
                  <span>{t.aboutOverlayCaption}</span>
                </div>
              </div>

              <div className="lpx-about-copy">
                <h2
                  id="lpx-about-heading"
                  className="lpx-section-title lpx-section-title--light"
                >
                  <span>{t.aboutHeadingLine1}</span>{' '}
                  <span>{t.aboutHeadingLine2}</span>
                </h2>
                <p className="lpx-about-body">{t.aboutBody}</p>

                <ol className="lpx-workflow-strip">
                  {t.aboutSteps.map((step) => (
                    <li key={step.code} className="lpx-workflow-step">
                      <span className="lpx-workflow-code">{step.code}</span>
                      <span className="lpx-workflow-label">{step.label}</span>
                    </li>
                  ))}
                </ol>

                <div className="lpx-section-action">
                  <PrimaryCta href={createRequestTarget} label={t.createRequestCta} />
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="lpx-footer">
        <div className="lpx-container lpx-footer-inner">
          <div className="lpx-footer-grid">
            <div className="lpx-footer-brand">
              <BrandMark brandName={t.brandName} lang={lang} />
              <p className="lpx-footer-tagline">{t.footerTagline}</p>
            </div>

            <nav className="lpx-footer-col" aria-label={t.footerNavAriaLabel}>
              <h3 className="lpx-footer-heading">{t.footerNavHeading}</h3>
              <ul>
                {t.navLinks.map((link) => (
                  <li key={link.href}>
                    <a href={link.href}>{link.label}</a>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="lpx-footer-col">
              <h3 className="lpx-footer-heading">{t.footerAccountHeading}</h3>
              <ul>
                <li>
                  <a href={createRequestTarget}>{t.createRequestCta}</a>
                </li>
                <li>
                  <a href="#auth/login">{t.signIn}</a>
                </li>
                <li>
                  <a href="#auth/register">{t.signUp}</a>
                </li>
              </ul>
            </div>

            <div className="lpx-footer-col">
              <h3 className="lpx-footer-heading">{t.footerSupportHeading}</h3>
              <ul>
                <li>
                  <a href="#help">{t.footerHelpCenter}</a>
                </li>
                <li>
                  <a href={`mailto:${t.footerSupport}`}>{t.footerSupport}</a>
                </li>
              </ul>
            </div>
          </div>

          <div className="lpx-footer-bottom">
            <p>{t.footerCopyright}</p>
            <span>{t.footerNote}</span>
          </div>
        </div>
      </footer>

      <ChatbotWidget />
    </div>
  )
}
