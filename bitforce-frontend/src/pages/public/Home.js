import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./Home.css";

/* =======================================================
   CONTADOR — animación al entrar en pantalla
   ======================================================= */
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
const nf = new Intl.NumberFormat("es-AR");

function AnimatedStat({ target = 0, duration = 1200, prefix = "", suffix = "" }) {
  const [value, setValue] = useState(0);
  const ref = React.useRef(null);
  const startedRef = React.useRef(false);

  useEffect(() => {
    const prefersReduced =
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

    const start = () => {
      if (startedRef.current) return;
      startedRef.current = true;

      if (prefersReduced) {
        setValue(target);
        return;
      }

      const startTime = performance.now();
      let rafId;
      const tick = (now) => {
        const p = Math.min((now - startTime) / duration, 1);
        const eased = easeOutCubic(p);
        setValue(Math.floor(eased * target));
        if (p < 1) rafId = requestAnimationFrame(tick);
      };
      rafId = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(rafId);
    };

    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && start()),
      { threshold: 0.35 }
    );
    if (ref.current) io.observe(ref.current);
    return () => io.disconnect();
  }, [target, duration]);

  return (
    <div ref={ref}>
      <h3 className="bf-metric-number">
        {prefix}
        {nf.format(value)}
        {suffix}
      </h3>
    </div>
  );
}

/* =======================================================
   CARRUSEL — autoplay + touch + accesible
   (reutilizable; lo usamos dentro del HERO)
   ======================================================= */
function Carousel({ images = [], interval = 4000, aspect = "16/9" }) {
  const [index, setIndex] = React.useState(0);
  const [paused, setPaused] = React.useState(false);
  const touch = React.useRef({ x: 0, y: 0 });

  const go = (dir) => setIndex((i) => (i + dir + images.length) % images.length);

  React.useEffect(() => {
    if (paused || images.length <= 1) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % images.length), interval);
    return () => clearInterval(id);
  }, [paused, images.length, interval]);

  React.useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const onTouchStart = (e) => {
    const t = e.touches[0];
    touch.current = { x: t.clientX, y: t.clientY };
  };
  const onTouchEnd = (e) => {
    const t = e.changedTouches[0];
    const dx = t.clientX - touch.current.x;
    if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
  };

  return (
    <div
      className="bf-carousel u-gradient-border"
      style={{ aspectRatio: aspect }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      aria-roledescription="Carrusel"
    >
      <div className="bf-carousel-track" style={{ transform: `translateX(-${index * 100}%)` }}>
        {images.map((img, i) => (
          <figure className="bf-carousel-slide" key={i} aria-hidden={i !== index}>
            <img
              src={img.src}
              alt={img.alt || `Imagen ${i + 1}`}
              loading="lazy"
              decoding="async"
              onError={(e) =>
                (e.currentTarget.src =
                  "https://images.unsplash.com/photo-1558611848-73f7eb4001a1?q=80&w=1200&auto=format&fit=crop")
              }
            />
            {img.caption && <figcaption className="bf-carousel-cap">{img.caption}</figcaption>}
          </figure>
        ))}
      </div>

      {images.length > 1 && (
        <>
          <button className="bf-carousel-btn prev" aria-label="Anterior" onClick={() => go(-1)}>
            ‹
          </button>
          <button className="bf-carousel-btn next" aria-label="Siguiente" onClick={() => go(1)}>
            ›
          </button>

          <div className="bf-carousel-dots" role="tablist" aria-label="Selector de slide">
            {images.map((_, i) => (
              <button
                key={i}
                role="tab"
                aria-selected={i === index}
                className={`dot ${i === index ? "is-active" : ""}`}
                onClick={() => setIndex(i)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* =======================================================
   HOME
   ======================================================= */
export default function Home() {
  const onImgError = (e) => {
    e.currentTarget.src =
      "https://images.unsplash.com/photo-1558611848-73f7eb4001a1?q=80&w=1200&auto=format&fit=crop";
  };

  return (
    <>
      {/* ===== HERO ===== */}
      <section className="bf-hero bf-section" aria-labelledby="home-hero-title">
        <div className="container">
          <div className="row align-items-center g-5">
            {/* Columna Izquierda: título + CTA */}
            <div className="col-lg-6">
              <h1 id="home-hero-title" className="fw-bold mb-3 bf-hero-title">
                <span className="gradient-text">Entrená mejor</span>, viví{" "}
                <span className="bf-accent-violet">más fuerte</span>.
              </h1>
              <p className="lead bf-text-soft mb-4">
                Entrenamientos diseñados para mejorar fuerza, movilidad y
                bienestar. Unite a nuestra comunidad y transformá tu rutina.
              </p>

              <div className="cta-wrap">
                <Link to="/register" className="btn btn-bf btn-lg px-4">
                  Empezar ahora
                </Link>
                <Link to="/login" className="btn btn-ghost btn-lg px-4">
                  Ya tengo cuenta
                </Link>
              </div>

              <ul className="bf-cta-badges" aria-label="Razones para elegirnos">
                <li>Coaches certificados</li>
                <li>Planes para todos los niveles</li>
                <li>Seguimiento de progreso</li>
              </ul>
            </div>

            {/* Columna Derecha: CARRUSEL en el HERO */}
            <div className="col-lg-6">
              <div className="bf-hero-carousel">
                <Carousel
                  aspect="4/3"
                  interval={4200}
                  images={[
                    {
                      src: "https://images.unsplash.com/photo-1521805103424-d8f8430e8933?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1470",
                    },
                    {
                      src: "https://images.unsplash.com/photo-1536922246289-88c42f957773?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=904",
                      caption: "HIIT & Funcional: intensidad inteligente.",
                    },
                    {
                      src: "https://images.unsplash.com/photo-1758875569612-94d5e0f1a35f?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1032",
                    },
                  ]}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== MÉTRICAS ===== */}
      <section className="bf-metrics">
        <div className="container">
          <div className="row text-center g-4">
            <div className="col-12 col-md-4">
              <AnimatedStat target={450} prefix="+" duration={1400} />
              <p className="bf-metric-label">Alumnos activos</p>
            </div>
            <div className="col-12 col-md-4">
              <AnimatedStat target={12} duration={1100} />
              <p className="bf-metric-label">Coaches certificados</p>
            </div>
            <div className="col-12 col-md-4">
              <AnimatedStat target={3} duration={1000} />
              <p className="bf-metric-label">Sedes operativas</p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== SOBRE NOSOTROS ===== */}
<section
  className="bf-about bf-section"
  aria-labelledby="about-title"
  style={{ paddingTop: "0,5rem" }}  // <- subí el valor si querés más separación
>
  <div className="container text-center">
    <h2 id="about-title" className="fw-bold mb-3">
      BitForce Gym
    </h2>
    <p className="lead bf-text-soft mx-auto">
      Somos un centro de entrenamiento integral. Clases guiadas por
      coaches certificados, seguimiento real de tu progreso y una
      comunidad que te empuja a dar tu mejor versión.
    </p>
  </div>
</section>


      {/* ===== CLASES / ACTIVIDADES ===== */}
      <section className="bf-classes bf-section" aria-labelledby="classes-title">
        <div className="container">
          <div className="text-center mb-5">
  <h2 id="classes-title" className="fw-bold mb-2 gradient-text">
    Nuestras clases
  </h2>
  <p className="bf-text-soft">
    Descubrí las experiencias de entrenamiento que te van a transformar.
  </p>
</div>

          <div className="row g-4">
            {[
              {
                title: "Funcional",
                desc: "Full body con circuitos y trabajo de core. 60 min.",
                bg: "rgba(124,58,237,.12)",
              },
              {
                title: "Fuerza",
                desc: "Progresiones con barra y mancuernas. Técnicas seguras.",
                bg: "rgba(16,185,129,.12)",
              },
              {
                title: "Yoga",
                desc: "Movilidad, respiración y foco. Ideal para complementar.",
                bg: "rgba(255,255,255,.08)",
              },
              {
                title: "HIIT",
                desc: "Interválicos de alta intensidad. Quemás calorías rápido.",
                bg: "rgba(255,255,255,.08)",
              },
            ].map((c) => (
              <div key={c.title} className="col-12 col-sm-6 col-lg-3 d-flex">
                <div className="bf-class-card w-100" style={{ background: c.bg }}>
                  <h5 className="fw-bold mb-2">{c.title}</h5>
                  <p className="mb-0 bf-text-soft small">{c.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== PAQUETES / PRICING ===== */}
      <section className="bf-pricing bf-section" aria-labelledby="pricing-title">
        <div className="container">
          <h2 id="pricing-title" className="fw-bold text-center mb-4">
            Paquetes
          </h2>
          <p className="text-center bf-text-soft mb-4">
            Elegí el plan que mejor se adapte a tus objetivos. Todos incluyen
            warm-up guiado y asistencia técnica.
          </p>

          <div className="row g-4 align-items-stretch">
            {[
              {
                name: "Start",
                price: "22.000",
                period: "/mes",
                bullets: ["8 clases al mes", "Acceso a 1 sede", "Asistencia técnica"],
                badge: "Ideal para empezar",
                featured: false,
              },
              {
                name: "Plus",
                price: "32.000",
                period: "/mes",
                bullets: ["12 clases al mes", "Acceso a 3 sedes", "WODs personalizados"],
                badge: "Más elegido",
                featured: true,
              },
              {
                name: "Pro",
                price: "43.000",
                period: "/mes",
                bullets: ["Ilimitadas", "Acceso total", "Plan de fuerza + check mensual"],
                badge: "Para ir a fondo",
                featured: false,
              },
            ].map((p) => (
              <div key={p.name} className="col-12 col-md-4 d-flex">
                <article className={`bf-price-card w-100 ${p.featured ? "is-featured" : ""}`}>
                  <div className="bf-price-card__header">
                    <span className="bf-price-badge">{p.badge}</span>
                    <h3 className="mb-1">{p.name}</h3>
                    <div className="bf-price">
                      <span className="bf-price-amount">${p.price}</span>
                      <span className="bf-price-period">{p.period}</span>
                    </div>
                  </div>
                  <ul className="bf-price-list">
                    {p.bullets.map((b) => (
                      <li key={b}>{b}</li>
                    ))}
                  </ul>
                  <div className="mt-auto">
                    <Link to="/register" className="btn btn-bf  btn-plan">
                      Probar este plan
                    </Link>
                  </div>
                </article>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== COACHES / PROFES ===== */}
      <section className="bf-trainers bf-section" aria-labelledby="trainers-title">
        <div className="container">
          <h2 id="trainers-title" className="fw-bold text-center mb-4">
            Nuestros coaches
          </h2>
          <div className="row g-4">
            {[
              {
                name: "María López",
                role: "Entrenadora Funcional",
                img: "https://plus.unsplash.com/premium_photo-1664910928301-b8f734dff1c0?q=80&w=900&auto=format&fit=crop",
              },
              {
                name: "Carlos Díaz",
                role: "Coach de Fuerza",
                img: "https://images.unsplash.com/photo-1653773869760-5b0f846231fb?q=80&w=900&auto=format&fit=crop",
              },
              {
                name: "Lucía Pérez",
                role: "Profesora de Yoga",
                img: "https://images.unsplash.com/photo-1552196563-55cd4e45efb3?q=80&w=900&auto=format&fit=crop",
              },
            ].map((t) => (
              <div key={t.name} className="col-12 col-md-4 d-flex">
                <div className="bf-card p-3 w-100">
                  <figure className="bf-trainer-figure">
                    <img
                      className="bf-trainer-img"
                      src={t.img}
                      alt={t.name}
                      loading="lazy"
                      decoding="async"
                      onError={onImgError}
                    />
                  </figure>
                  <div className="pt-3 text-center">
                    <h5 className="fw-bold mb-1">{t.name}</h5>
                    <p className="bf-text-soft small mb-0">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section className="bf-faq bf-section" aria-labelledby="faq-title">
        <div className="container">
          <h2 id="faq-title" className="fw-bold text-center mb-4">
            Preguntas frecuentes
          </h2>
          <div className="bf-faq-list">
            <details className="bf-faq-item">
              <summary>
                <span className="bf-faq-icon" aria-hidden>?</span>
                ¿Necesito experiencia previa?
              </summary>
              <p>No, adaptamos cargas y progresiones a tu nivel actual.</p>
            </details>
            <details className="bf-faq-item">
              <summary>
                <span className="bf-faq-icon" aria-hidden>?</span>
                ¿Puedo probar una clase?
              </summary>
              <p>Sí, registrate y coordinamos tu clase de prueba.</p>
            </details>
            <details className="bf-faq-item">
              <summary>
                <span className="bf-faq-icon" aria-hidden>?</span>
                ¿Trabajan con objetivos específicos?
              </summary>
              <p>Fuerza, recomposición corporal, movilidad, rendimiento y más.</p>
            </details>
          </div>
        </div>
      </section>
    </>
  );
}
