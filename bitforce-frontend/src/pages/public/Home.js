import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function Home() {
  const { user } = useAuth();

  return (
    <>
      <section className="bf-hero py-5">
        <div className="container">
          <div className="row align-items-center g-4">
            <div className="col-lg-6">
              <h1 className="display-5 mb-3">Entrená mejor, <br />más rápido y con propósito.</h1>
              <p className="lead bf-muted mb-4">
                Clases funcionales, fuerza y movilidad. Reservá tu lugar en segundos
                y llevá registro de tus turnos desde tu cuenta.
              </p>
              {!user ? (
                <div className="d-flex gap-2">
                  <Link className="btn btn-primary" to="/register">Crear cuenta</Link>
                  <Link className="btn btn-outline-secondary" to="/login">Ya tengo cuenta</Link>
                </div>
              ) : (
                <Link className="btn btn-primary" to="/">
                  Ir al panel
                </Link>
              )}
            </div>
            <div className="col-lg-6 text-center">
              {/* imagen decorativa opcional */}
              <img
                src="https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=1200&auto=format&fit=crop"
                alt="Entrenamiento funcional"
                className="img-fluid rounded-4 shadow-sm"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="py-5">
        <div className="container">
          <div className="row g-4">
            {[
              { t: "Clases Programadas", d: "Horarios claros y cupos visibles." },
              { t: "Reservas en 1 click", d: "Tomá y cancelá turnos fácil." },
              { t: "Profes certificados", d: "Coaches para cada objetivo." },
            ].map((c, i) => (
              <div key={i} className="col-md-4">
                <div className="bf-card p-4 h-100">
                  <h5 className="fw-semibold mb-2">{c.t}</h5>
                  <p className="bf-muted mb-0">{c.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
