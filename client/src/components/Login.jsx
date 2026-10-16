import { useState } from "react";
import { api } from "../api.js";

export default function Login({ onLogin }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  const entrar = (e) => {
    e.preventDefault();
    setEnviando(true);
    setError("");
    api
      .login(password)
      .then(onLogin)
      .catch((e) => setError(e.message))
      .finally(() => setEnviando(false));
  };

  return (
    <main className="login">
      <form className="panel login__form" onSubmit={entrar}>
        <h2 className="panel__title">Entrar</h2>
        <label className="field">
          <span>Contraseña</span>
          <input
            type="password"
            autoComplete="current-password"
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {error && <div className="alert">{error}</div>}
        <button className="btn btn--primary btn--block" disabled={!password || enviando}>
          {enviando ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </main>
  );
}
