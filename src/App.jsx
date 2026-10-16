import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { portfolio } from './data.js'
import OrbitCanvas from './OrbitCanvas.jsx'

const ease = 'power3.out'

function Arrow({ diagonal = false }) {
  return <span className={`arrow ${diagonal ? 'arrow--diagonal' : ''}`} aria-hidden="true">↗</span>
}

function Glyph({ type = 'plus' }) {
  const glyphs = { plus: '+', close: '×', sound: '◖', menu: '≡' }
  return <span aria-hidden="true">{glyphs[type]}</span>
}

function useSound() {
  const [soundOn, setSoundOn] = useState(false)
  const blip = (frequency = 440) => {
    if (!soundOn) return
    try {
      const context = new (window.AudioContext || window.webkitAudioContext)()
      const oscillator = context.createOscillator()
      const gain = context.createGain()
      oscillator.frequency.setValueAtTime(frequency, context.currentTime)
      gain.gain.setValueAtTime(0.025, context.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.08)
      oscillator.connect(gain).connect(context.destination)
      oscillator.start(); oscillator.stop(context.currentTime + 0.08)
      oscillator.addEventListener('ended', () => context.close())
    } catch { /* Browsers that deny audio still keep the control useful. */ }
  }
  return { soundOn, setSoundOn, blip }
}

function App() {
  const root = useRef(null)
  const [loading, setLoading] = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)
  const [activeSkill, setActiveSkill] = useState(0)
  const [activeProject, setActiveProject] = useState(null)
  const [progress, setProgress] = useState(0)
  const { soundOn, setSoundOn, blip } = useSound()

  useLayoutEffect(() => {
    const scope = gsap.context(() => {
      gsap.set('.hero-copy > *, .hero-meta, .hero-marker', { y: 36, opacity: 0 })
      gsap.set('.hero-orbit-wrap', { scale: 0.85, opacity: 0, rotate: -8 })
      gsap.set('.topbar', { y: -18, opacity: 0 })
    }, root)
    return () => scope.revert()
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const timeline = gsap.timeline({ defaults: { ease } })
      timeline.to('.loader', { yPercent: -100, duration: 0.85 })
        .to('.topbar', { y: 0, opacity: 1, duration: 0.55 }, '-=0.25')
        .to('.hero-copy > *, .hero-meta, .hero-marker', { y: 0, opacity: 1, stagger: 0.08, duration: 0.7 }, '-=0.2')
        .to('.hero-orbit-wrap', { scale: 1, opacity: 1, rotate: 0, duration: 1.1 }, '-=0.6')
      setLoading(false)
    }, 680)
    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    const onScroll = () => {
      const total = document.documentElement.scrollHeight - window.innerHeight
      setProgress(total > 0 ? (window.scrollY / total) * 100 : 0)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const targets = [...document.querySelectorAll('[data-reveal]')]
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return
        gsap.fromTo(entry.target, { y: 38, opacity: 0 }, { y: 0, opacity: 1, duration: 0.75, ease, overwrite: true })
        observer.unobserve(entry.target)
      })
    }, { threshold: 0.13 })
    targets.forEach((target) => observer.observe(target))
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const cursor = document.querySelector('.cursor')
    if (!cursor || !window.matchMedia('(pointer:fine)').matches) return undefined
    const move = (event) => gsap.to(cursor, { x: event.clientX, y: event.clientY, duration: 0.24, ease: 'power2.out' })
    const hover = () => cursor.classList.add('cursor--active')
    const leave = () => cursor.classList.remove('cursor--active')
    const interactive = [...document.querySelectorAll('button, a, .project-card')]
    window.addEventListener('pointermove', move)
    interactive.forEach((item) => item.addEventListener('pointerenter', hover))
    interactive.forEach((item) => item.addEventListener('pointerleave', leave))
    return () => {
      window.removeEventListener('pointermove', move)
      interactive.forEach((item) => item.removeEventListener('pointerenter', hover))
      interactive.forEach((item) => item.removeEventListener('pointerleave', leave))
    }
  }, [menuOpen, activeProject])

  const jumpTo = (id) => {
    document.querySelector(id)?.scrollIntoView({ behavior: 'smooth' })
    setMenuOpen(false)
    blip(620)
  }

  const selectSkill = (index) => {
    setActiveSkill(index)
    blip(340 + index * 90)
  }

  return (
    <div ref={root} className={loading ? 'app is-loading' : 'app'}>
      <div className="cursor"><i /></div>
      <div className="loader" aria-hidden="true">
        <div className="loader-word">ATELIER<span>_</span>PROTOCOL</div>
        <div className="loader-line"><i /></div>
        <small>CALIBRATING THE FIELD / 01—01</small>
      </div>
      <div className="progress" style={{ transform: `scaleX(${progress / 100})` }} />

      <header className="topbar">
        <button className="wordmark" onClick={() => jumpTo('#top')} aria-label="Back to top">
          <span className="wordmark-mark"><i /><i /><i /></span>
          <span>ARIA NOOR</span>
        </button>
        <div className="topbar-middle">DIGITAL MATTER / EST. 2017</div>
        <div className="topbar-actions">
          <button className="sound-toggle" onClick={() => { setSoundOn(!soundOn); blip(740) }} aria-pressed={soundOn}>
            <Glyph type="sound" /> SOUND {soundOn ? 'ON' : 'OFF'}
          </button>
          <button className="menu-toggle" onClick={() => { setMenuOpen(!menuOpen); blip(520) }} aria-expanded={menuOpen}>
            {menuOpen ? <Glyph type="close" /> : <Glyph type="menu" />} <span>INDEX</span>
          </button>
        </div>
      </header>

      <nav className={`nav-panel ${menuOpen ? 'is-open' : ''}`} aria-label="Site navigation">
        <p className="eyebrow">NAVIGATION / 00—04</p>
        {[
          ['01', 'Introduction', '#top'], ['02', 'Selected work', '#work'], ['03', 'Methods', '#methods'], ['04', 'Contact', '#contact'],
        ].map(([num, label, target]) => (
          <button key={num} onClick={() => jumpTo(target)}><small>{num}</small><span>{label}</span><Arrow /></button>
        ))}
        <p className="nav-note">A template for thoughtful portfolios, rather than a portfolio pretending to be a template.</p>
      </nav>

      <main>
        <section id="top" className="hero section-grid">
          <div className="hero-meta" aria-label="Portfolio status">
            <span className="status-dot" /> AVAILABLE FOR SELECT PARTNERSHIPS
            <span>BASED BETWEEN SCREENS &amp; STREETS</span>
          </div>
          <div className="hero-copy">
            <p className="eyebrow">PORTFOLIO / 2026</p>
            <h1>Making <em>the web</em><br />feel less<br />expected.</h1>
            <div className="hero-intro">
              <p>Aria Noor directs and builds memorable digital worlds for people with something meaningful to say.</p>
              <button className="text-button" onClick={() => jumpTo('#work')}>ENTER THE WORK <Arrow /></button>
            </div>
          </div>
          <div className="hero-orbit-wrap"><OrbitCanvas /><span className="orbit-caption orbit-caption--one">RESPONSIVE<br />OBJECT 001</span><span className="orbit-caption orbit-caption--two">DRAG / LOOK</span></div>
          <button className="hero-marker" onClick={() => jumpTo('#manifesto')} aria-label="Scroll to introduction"><span>SCROLL TO TUNE</span><b>↓</b></button>
        </section>

        <div className="ticker" aria-label="Services"><div>INTERACTION DESIGN <i>✦</i> CREATIVE DEVELOPMENT <i>✦</i> ART DIRECTION <i>✦</i> DIGITAL IDENTITY <i>✦</i> INTERACTION DESIGN <i>✦</i> CREATIVE DEVELOPMENT <i>✦</i></div></div>

        <section id="manifesto" className="manifesto section-grid">
          <p className="section-label" data-reveal>01 / A small introduction</p>
          <div className="manifesto-text" data-reveal>
            <p className="display-copy">I build <span className="ink">clear systems</span> with enough friction, color, and movement to be remembered.</p>
            <div className="manifesto-bottom">
              <p>Good work should make a person lean a little closer. I partner with cultural organisations, ambitious brands, and kind people who value a strong idea.</p>
              <a className="outlined-button" href="#contact">MORE ABOUT ARIA <Arrow /></a>
            </div>
          </div>
          <div className="portrait-note" data-reveal>
            <div className="portrait-window"><img src="./portrait-aria.png" alt="Aria Noor in a cobalt jacket" /></div>
            <p><b>FIELD PORTRAIT</b><br />Studio, 2026<br />Shot on borrowed film.</p>
          </div>
        </section>

        <section id="methods" className="signal-room">
          <div className="signal-top section-grid">
            <p className="section-label" data-reveal>02 / Choose a signal</p>
            <p className="signal-instruction" data-reveal>Every commission begins somewhere different. Select a practice to see what it unlocks.</p>
          </div>
          <div className="signal-layout section-grid">
            <div className="signal-dial" data-reveal>
              <div className="dial-lines"><i /><i /><i /><i /></div>
              <button className="dial-core" onClick={() => selectSkill((activeSkill + 1) % portfolio.capabilities.length)} aria-label="Cycle practices"><span>{String(activeSkill + 1).padStart(2, '0')}</span><b>SELECT</b></button>
              {portfolio.capabilities.map(([number, title], index) => (
                <button key={number} className={`dial-point dial-point--${index} ${activeSkill === index ? 'is-active' : ''}`} onClick={() => selectSkill(index)} aria-pressed={activeSkill === index}>
                  <small>{number}</small><span>{title}</span>
                </button>
              ))}
            </div>
            <article className="signal-output" data-reveal>
              <p className="eyebrow">ACTIVE PATH / {portfolio.capabilities[activeSkill][0]}</p>
              <h2>{portfolio.capabilities[activeSkill][1]}</h2>
              <p>{portfolio.capabilities[activeSkill][2]}</p>
              <div className="signal-meter"><span>COMPLEXITY</span><i><b style={{ width: `${48 + activeSkill * 14}%` }} /></i><strong>{48 + activeSkill * 14}%</strong></div>
              <button className="text-button" onClick={() => jumpTo('#work')}>VIEW RELATED STUDIES <Arrow /></button>
            </article>
          </div>
        </section>

        <section id="work" className="work section-grid">
          <div className="work-heading" data-reveal><p className="section-label">03 / Selected studies</p><h2>Built to<br /><i>be used.</i></h2></div>
          <div className="work-list">
            {portfolio.projects.map((project, index) => (
              <button className="project-card" style={{ '--project-color': project.color }} key={project.number} onClick={() => { setActiveProject(project); blip(480 + index * 100) }} data-reveal>
                <span className="project-number">{project.number}</span>
                <span className="project-orb"><i /><i /><i /></span>
                <span className="project-info"><small>{project.type}</small><b>{project.name}</b><em>{project.year}</em></span>
                <Arrow diagonal />
              </button>
            ))}
          </div>
          <div className="work-foot" data-reveal><span>ARCHIVE IS OPEN BY APPOINTMENT</span><a className="outlined-button" href={`mailto:${portfolio.email}?subject=Archive%20request`}>REQUEST ACCESS <Arrow /></a></div>
        </section>

        <section className="process">
          <div className="process-title section-grid" data-reveal><p className="section-label">04 / A practical ritual</p><h2>One idea.<br />Many <span>small tests.</span></h2></div>
          <div className="process-steps">
            {[
              ['A', 'Listen for the live wire', 'Not a moodboard dump. A shared language for what matters and why.'],
              ['B', 'Make the shape visible', 'Prototype early, name the rules, and leave room for the useful surprise.'],
              ['C', 'Tune the details', 'The pace, the writing, the cursor, and the two pixels everyone notices.'],
              ['D', 'Leave it stronger', 'A clean handoff, a resilient build, and a team that knows how to use it.'],
            ].map(([letter, title, text]) => <article key={letter} data-reveal><span>{letter}</span><h3>{title}</h3><p>{text}</p></article>)}
          </div>
        </section>

        <section className="testimonials section-grid">
          <p className="section-label" data-reveal>05 / In the room</p>
          <figure data-reveal><blockquote>“Aria gave the project a point of view we could all recognise in an instant — then she built it without sanding off the interesting parts.”</blockquote><figcaption><span className="quote-star">✦</span> MAYA RAZA / PROGRAM DIRECTOR, NEW COMMONS</figcaption></figure>
          <div className="testimonial-counter" data-reveal><span>01</span><i /><span>03</span></div>
        </section>

        <section id="contact" className="contact">
          <div className="contact-top section-grid" data-reveal><p className="section-label">06 / Start a conversation</p><p>Have a sharp brief, a strange thought, or a good question? Send it over.</p></div>
          <a className="contact-mail" href={`mailto:${portfolio.email}?subject=Hello%20Aria%20—%20new%20project`} data-reveal><span>HELLO@</span><strong>ARIANOOR.<i>STUDIO</i></strong><Arrow diagonal /></a>
          <div className="contact-bottom section-grid"><p>© 2026 ARIA NOOR<br />A READY-TO-EDIT PORTFOLIO TEMPLATE</p><div><a href="https://www.linkedin.com" target="_blank" rel="noreferrer">LINKEDIN ↗</a><a href="https://www.instagram.com" target="_blank" rel="noreferrer">INSTAGRAM ↗</a><button onClick={() => jumpTo('#top')}>BACK TO TOP ↑</button></div></div>
        </section>
      </main>

      {activeProject && <div className="project-modal" role="dialog" aria-modal="true" aria-label={`${activeProject.name} case study`}>
        <button className="modal-backdrop" onClick={() => setActiveProject(null)} aria-label="Close case study" />
        <article style={{ '--project-color': activeProject.color }}>
          <button className="modal-close" onClick={() => setActiveProject(null)}><Glyph type="close" /> CLOSE</button>
          <p className="eyebrow">CASE STUDY / {activeProject.number}</p>
          <div className="modal-shape"><i /><i /><i /></div>
          <h2>{activeProject.name}</h2><p className="modal-type">{activeProject.type} — {activeProject.year}</p><p className="modal-note">{activeProject.note} This is an editable case-study preview: replace the copy, cover, and target link in <code>src/data.js</code>.</p>
          <a href={activeProject.url} target="_blank" rel="noreferrer" className="outlined-button">OPEN PROJECT <Arrow /></a>
        </article>
      </div>}
    </div>
  )
}

export default App
