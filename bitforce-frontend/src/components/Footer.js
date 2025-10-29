import "./Footer.css";
import React from "react";
import { Link } from "react-router-dom";
import {
  FaInstagram,
  FaFacebookF,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaClock,
  FaArrowRight,
} from "react-icons/fa";

export default function Footer() {
  const onSubmit = (e) => e.preventDefault(); // demo

  return (
    <footer className="bf-footer-pro">
      <div className="container">
        {/* TOP */}
        <div className="bf-footer-pro__top">
          {/* Brand */}
          <div className="bf-foot-col brand">
            <h4 className="brand-title">
              BitForce <span>Gym</span>
            </h4>
            <p className="brand-desc">
              Entrenamientos funcionales, fuerza y movilidad. Unite a nuestra
              comunidad y transformá tu rutina.
            </p>

            <div className="social">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram"
                className="social-btn"
              >
                <FaInstagram />
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noreferrer"
                aria-label="Facebook"
                className="social-btn"
              >
                <FaFacebookF />
              </a>
            </div>
          </div>

          {/* Links */}
          <div className="bf-foot-col links">
            <h6>Explorar</h6>
            <ul>
              <li><a href="#classes">Clases</a></li>
              <li><a href="#pricing">Planes</a></li>
              <li><a href="#coaches">Coaches</a></li>
              <li><Link to="/register">Crear cuenta</Link></li>
              <li><Link to="/login">Ingresar</Link></li>
            </ul>
          </div>

          {/* Contacto */}
          <div className="bf-foot-col contact">
            <h6>Contacto</h6>
            <ul className="contact-list">
              <li><FaEnvelope /> contacto@bitforce.com</li>
              <li><FaPhone /> +54 11 2345-6789</li>
              <li><FaMapMarkerAlt /> Buenos Aires, Argentina</li>
              <li><FaClock /> Lun–Vie 7–22 · Sáb 9–14</li>
            </ul>
          </div>

          {/* Newsletter / CTA */}
          <div className="bf-foot-col cta">
            <h6>Probá una clase</h6>
            <form className="news-form" onSubmit={onSubmit}>
              <input
                type="email"
                placeholder="Tu email"
                aria-label="Correo electrónico"
                required
              />
              <button className="btn-cta" type="submit">
                Enviar <FaArrowRight className="ms-1" />
              </button>
            </form>
            <small className="muted">Sin spam. Podés cancelar cuando quieras.</small>
          </div>
        </div>

        <hr className="foot-divider" />

        {/* BOTTOM */}
        <div className="bf-footer-pro__bottom">
          <span>© 2025 <strong>BitForce Gym</strong> — Todos los derechos reservados.</span>
          <ul className="mini-links">
            <li><a href="#terminos">Términos</a></li>
            <li><a href="#privacidad">Privacidad</a></li>
            <li><a href="#cookies">Cookies</a></li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
