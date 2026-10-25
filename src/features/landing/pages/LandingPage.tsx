import { useEffect, useState } from 'react'
import { LazyMotion } from 'motion/react'

import { authSession } from '../../auth/api/authApi'
import { Icon } from '../../../shared/components/Icon'
import { LanguageToggle } from '../../../shared/components/LanguageToggle'
import { useI18n } from '../../../shared/i18n'
import { landingMessages } from '../content'
import { resolveCreateRequestTarget } from '../resolveCreateRequestTarget'
import { ChatbotWidget } from '../components/ChatbotWidget'
import { landingPageMessages } from './LandingPage.messages'
import { MonitoringJourney } from '../showcase/MonitoringJourney'
import { ProductShowcase } from '../components/ProductShowcase'
import { industryIcons } from '../presentation'
import { benefitIds, benefitMessages } from '../components/benefitMessages'
import { ScrollReveal } from '../components/ScrollReveal'
import { mediaSource } from '../media'
import { WorkflowShowcase } from '../components/WorkflowShowcase'

const loadMotionFeatures = () =>
  import('framer-motion').then((module) => module.domAnimation)
import '../landing.css'

function Logo() {
  const { t } = useI18n(landingMessages)
  const { lang } = useI18n(landingPageMessages)
  return (
    <a
      className="lp-logo"
      href="#top"
      aria-label={
        lang === 'en' ? `${t.brandName} home` : `${t.brandName} - trang chủ`
      }
    >
      <img src="/images/logo-new.png" alt="" className="lp-logo-img" />
      <span className="lp-logo-text">
        <span className="lp-logo-primary">OnDemand</span>
        <span className="lp-logo-accent">Monitor</span>
      </span>
    </a>
  )
}

function Header({ createRequestTarget }: { createRequestTarget: string }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(() => window.scrollY > 24)
  const { t: copy } = useI18n(landingMessages)
  const { t } = useI18n(landingPageMessages)
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false)
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [])
  useEffect(() => {
    const updateScrolled = () => setScrolled(window.scrollY > 24)
    window.addEventListener('scroll', updateScrolled, { passive: true })
    return () => window.removeEventListener('scroll', updateScrolled)
  }, [])
  return (
    <header className={`lp-header${scrolled ? ' lp-header--scrolled' : ''}`}>
      <div className="lp-container lp-header-inner">
        <Logo />
        <nav
          className={`lp-nav ${menuOpen ? 'lp-nav--open' : ''}`}
          id="lp-main-nav"
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
          <div className="lp-nav-actions">
            <a className="lp-btn-o" href="#auth/login">
              {t.login}
            </a>
            <a className="lp-btn-p" href={createRequestTarget}>
              {t.createRequest}
            </a>
          </div>
        </nav>
        <span className="lp-spacer" />
        <LanguageToggle className="lp-lang-toggle" />
        <div className="lp-header-actions">
          <a className="lp-btn-o" href="#auth/login">
            {t.login}
          </a>
          <a className="lp-btn-p" href={createRequestTarget}>
            {t.createRequest}
          </a>
        </div>
        <button
          className="lp-menu-btn"
          type="button"
          aria-label={menuOpen ? t.closeMenu : t.openMenu}
          aria-expanded={menuOpen}
          aria-controls="lp-main-nav"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <Icon name={menuOpen ? 'x' : 'menu'} />
        </button>
      </div>
    </header>
  )
}

function SectionIntro({
  eyebrow,
  title,
  copy,
  align = 'left',
}: {
  eyebrow: string
  title: string
  copy?: string
  align?: 'left' | 'center'
}) {
  return (
    <ScrollReveal>
      <div className={`lp-section-intro lp-section-intro--${align}`}>
        <p className="lp-eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
        {copy && <p className="lp-section-copy">{copy}</p>}
      </div>
    </ScrollReveal>
  )
}

function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)
  const { t } = useI18n(landingMessages)
  return (
    <div className="lp-faq-list">
      {t.faqItems.map((item, index) => {
        const open = openIndex === index
        const id = `lp-faq-${index}`
        return (
          <div className="lp-faq-item" key={id}>
            <h3 className="lp-faq-question-wrap">
              <button
                id={`${id}-button`}
                className="lp-faq-question"
                type="button"
                aria-expanded={open}
                aria-controls={`${id}-panel`}
                onClick={() => setOpenIndex(open ? null : index)}
              >
                <span>{item.question}</span>
                <Icon name={open ? 'minus' : 'plus'} />
              </button>
            </h3>
            {open && (
              <div
                id={`${id}-panel`}
                role="region"
                aria-labelledby={`${id}-button`}
                className="lp-faq-answer"
              >
                {item.answer}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function IndustryIllustration({ variant }: { variant: number }) {
  const imageId = (['construction', 'infrastructure', 'landscape'] as const)[
    variant
  ]
  return (
    <div
      className={`lp-industry-visual lp-industry-visual--${variant}`}
      aria-hidden="true"
    >
      <img
        {...mediaSource(imageId)}
        sizes={
          variant === 2
            ? '(max-width: 620px) 90vw, 1200px'
            : '(max-width: 620px) 90vw, 700px'
        }
        alt=""
        loading="lazy"
        decoding="async"
      />
      <span className="lp-industry-photo-index">
        0{variant + 1}
        <Icon name="arrow-up-right" />
      </span>
    </div>
  )
}

export function LandingPage() {
  const createRequestTarget = resolveCreateRequestTarget(authSession.getUser())
  const { t: copy } = useI18n(landingMessages)
  const { t: benefits } = useI18n(benefitMessages)
  const { t, lang } = useI18n(landingPageMessages)

  // Keep browser metadata in sync with the visible language.
  useEffect(() => {
    document.title =
      lang === 'en'
        ? 'OnDemand Monitor — Safer site monitoring, clear reports'
        : 'OnDemand Monitor — Giám sát an toàn, báo cáo rõ ràng'
    const description =
      lang === 'en'
        ? 'Request site monitoring, track progress, and review inspection reports in one system.'
        : 'Gửi yêu cầu giám sát hiện trường, theo dõi tiến độ và xem báo cáo kiểm tra trên cùng một hệ thống.'
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
    <div id="top" className="odm odm-landing">
      <a className="lp-skip-link" href="#main-content">
        {t.skipLink}
      </a>
      <Header createRequestTarget={createRequestTarget} />
      <main id="main-content">
        <LazyMotion features={loadMotionFeatures}>
          <section className="lp-hero">
            <div className="lp-container lp-hero-grid">
              <div className="lp-hero-copy">
                <span className="lp-chip">
                  <span className="lp-chip-dot" />
                  {copy.heroChip}
                </span>
                <h1>
                  <span className="lp-hero-line lp-hero-line--first">
                    {copy.heroTitleLines[0]}
                  </span>
                  <br />
                  <span className="lp-hero-line lp-hero-line--accent">
                    {copy.heroTitleLines[1]}
                  </span>
                </h1>
                <p className="lp-hero-lede">{copy.heroLede}</p>
                <div className="lp-hero-actions">
                  <a className="lp-btn-p" href={createRequestTarget}>
                    {t.createRequestCta}
                    <Icon name="arrow-right" />
                  </a>
                  <a className="lp-btn-o" href="#how-it-works">
                    {t.seeHowItWorks}
                  </a>
                </div>
              </div>
            </div>
            <div className="lp-container">
              <ScrollReveal>
                <MonitoringJourney />
              </ScrollReveal>
            </div>
          </section>

          <section
            className="lp-section lp-benefits"
            aria-label={copy.workflowSection.title}
          >
            <div className="lp-container lp-benefit-grid">
              {benefitIds.map((id, index) => (
                <ScrollReveal key={id} delay={index * 0.08}>
                  <article className="lp-benefit">
                    <span>0{index + 1}</span>
                    <h2>{benefits[id].title}</h2>
                    <p>{benefits[id].detail}</p>
                  </article>
                </ScrollReveal>
              ))}
            </div>
          </section>

          <section id="how-it-works" className="lp-section">
            <div className="lp-container">
              <SectionIntro
                eyebrow={copy.workflowSection.eyebrow}
                title={copy.workflowSection.title}
                copy={copy.workflowSection.copy}
                align="center"
              />
              <WorkflowShowcase />
            </div>
          </section>

          <section id="results" className="lp-section">
            <div className="lp-container">
              <span id="features" className="lp-anchor-target" />
              <SectionIntro
                eyebrow={copy.featureSection.eyebrow}
                title={copy.featureSection.title}
                copy={copy.featureSection.copy}
                align="center"
              />
              <ScrollReveal>
                <ProductShowcase />
              </ScrollReveal>
            </div>
          </section>

          <section id="industries" className="lp-section lp-section-alt">
            <div className="lp-container">
              <SectionIntro
                eyebrow={copy.industriesSection.eyebrow}
                title={copy.industriesSection.title}
                copy={copy.industriesSection.copy}
                align="center"
              />
              <div className="lp-industries-grid">
                {copy.industries.map((card, index) => (
                  <ScrollReveal key={card.title} delay={index * 0.08}>
                    <article
                      className="odm-card lp-industry-card"
                      key={card.title}
                    >
                      <IndustryIllustration variant={index} />
                      <div className="lp-step-icon">
                        <Icon name={industryIcons[index]} />
                      </div>
                      <h3>{card.title}</h3>
                      <p>{card.detail}</p>
                      <span className="lp-industry-location">
                        <Icon name="arrow-up-right" />
                        {card.location}
                      </span>
                    </article>
                  </ScrollReveal>
                ))}
              </div>
              <p className="lp-media-notice">
                {copy.industriesSection.mediaNotice}
              </p>
            </div>
          </section>

          <section id="faq" className="lp-section">
            <div className="lp-container lp-faq">
              <SectionIntro
                eyebrow={copy.faqSection.eyebrow}
                title={copy.faqSection.title}
                copy={copy.faqSection.copy}
              />
              <FaqAccordion />
            </div>
          </section>

          <section className="lp-cta">
            <div className="lp-container lp-cta-inner">
              <p className="lp-eyebrow">{copy.ctaSection.eyebrow}</p>
              <h2>{copy.ctaSection.title}</h2>
              <div className="lp-cta-actions">
                <a className="lp-btn-p lp-btn-white" href={createRequestTarget}>
                  {t.createRequestCta}
                  <Icon name="arrow-right" />
                </a>
                <a className="lp-btn-o lp-btn-ghost" href="#auth/login">
                  {t.login}
                </a>
              </div>
            </div>
          </section>
        </LazyMotion>
      </main>
      <footer className="lp-footer">
        <div className="lp-container lp-footer-grid">
          <div className="lp-footer-brand">
            <div className="lp-footer-logo-wrap">
              <img
                src="/images/logo-new.png"
                alt=""
                className="lp-footer-logo-img"
              />
              <strong>{copy.brandName}</strong>
            </div>
            <p>{copy.footerDescription}</p>
          </div>
          {copy.footerGroups.map((group, groupIndex) => (
            <div key={group.title}>
              <h4>{group.title}</h4>
              <ul>
                {group.links.map((link, linkIndex) => {
                  const href =
                    groupIndex === 0
                      ? [createRequestTarget, '#results', '#results'][linkIndex]
                      : groupIndex === 1
                        ? '#industries'
                        : ['#faq', 'mailto:support@odms.vn', '#how-it-works'][
                            linkIndex
                          ]
                  return (
                    <li key={link}>
                      <a href={href}>{link}</a>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </div>
        <div className="lp-container lp-footer-bottom">
          <span>{copy.footerCopyright}</span>
          <span>{copy.footerLegal}</span>
        </div>
      </footer>
      <ChatbotWidget />
    </div>
  )
}
