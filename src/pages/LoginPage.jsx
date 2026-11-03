import { useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import Hanger from "../components/Hanger";

const MIN_PASSWORD_LENGTH = 8;

export default function LoginPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // The landing page's Sign up buttons open /login?mode=signup.
  let startMode = "login";
  if (searchParams.get("mode") === "signup") {
    startMode = "signup";
  }

  // 1. State
  const [mode, setMode] = useState(startMode); // "login" | "signup"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Already logged in: nothing to do here.
  if (auth.isLoggedIn) {
    return <Navigate to="/jobs" replace />;
  }

  // 2. Handlers
  function switchMode(newMode) {
    setMode(newMode);
    setFormError("");
    setEmailError("");
    setPasswordError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError("");

    // Check both boxes first, so the user sees every problem at once.
    let hasProblem = false;
    if (!email.includes("@")) {
      setEmailError("Enter your email address, like name@example.com.");
      hasProblem = true;
    } else {
      setEmailError("");
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      setPasswordError("Password must be at least 8 characters long.");
      hasProblem = true;
    } else {
      setPasswordError("");
    }
    if (hasProblem) {
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === "signup") {
        await auth.signUp(email, password);
        navigate("/welcome");
      } else {
        await auth.logIn(email, password);
        navigate("/jobs");
      }
    } catch (error) {
      setFormError(error.message);
      setIsSubmitting(false);
    }
  }

  // 3. Decide the words for this mode
  let title = "Welcome back";
  let submitLabel = "Log in";
  let note = "Forgot your password? Ask in the Jora Discord for now.";
  let passwordAutocomplete = "current-password";
  if (mode === "signup") {
    passwordAutocomplete = "new-password";
    title = "Make your account";
    submitLabel = "Create account";
    note = "Next you'll upload your CV and set what jobs you want.";
  }
  if (isSubmitting) {
    submitLabel = "Please wait…";
  }

  // 4. Render
  return (
    <div className="frame">
      <div className="auth">
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <Link className="logo" to="/">jora<span>.</span></Link>
          <h1>{title}</h1>
          <div className="tabs" role="tablist">
            <button type="button" role="tab" id="tab-login" aria-selected={mode === "login"} aria-controls="auth-panel" onClick={function () { switchMode("login"); }}>Log in</button>
            <button type="button" role="tab" id="tab-signup" aria-selected={mode === "signup"} aria-controls="auth-panel" onClick={function () { switchMode("signup"); }}>Sign up</button>
          </div>
          <div className="auth-fields" role="tabpanel" id="auth-panel" aria-labelledby={"tab-" + mode}>
            <div className="field">
              <label htmlFor="email">Email</label>
              <input
                className="input"
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                aria-invalid={emailError !== ""}
                aria-describedby="email-error"
                onChange={function (event) { setEmail(event.target.value); }}
              />
              {emailError !== "" && <span className="err" id="email-error">{emailError}</span>}
            </div>
            <div className="field">
              <label htmlFor="password">Password</label>
              <input
                className="input"
                id="password"
                type="password"
                autoComplete={passwordAutocomplete}
                value={password}
                aria-invalid={passwordError !== ""}
                aria-describedby="password-error"
                onChange={function (event) { setPassword(event.target.value); }}
              />
              {passwordError !== "" && <span className="err" id="password-error">{passwordError}</span>}
            </div>
            {formError !== "" && <p className="err" role="alert">{formError}</p>}
            <button className="btn dark wide" type="submit" disabled={isSubmitting} aria-busy={isSubmitting}>{submitLabel}</button>
            <p className="auth-note">{note}</p>
          </div>
        </form>
        <div className="auth-art">
          <div className="auth-rack" aria-hidden="true">
            <div className="rail"></div>
            <div className="swing">
              <Hanger />
              <div className="sheet"><i></i><i></i><i></i><i className="hi"></i><i className="s"></i><i></i><i className="hi s"></i><i></i><i></i><i className="s"></i></div>
            </div>
          </div>
          <p>Upload your CV once. Every tailored copy hangs on your rail, ready to send.</p>
        </div>
      </div>
    </div>
  );
}
