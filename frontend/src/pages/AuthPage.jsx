import { useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Button from '../components/common/Button.jsx';
import ErrorBanner from '../components/common/ErrorBanner.jsx';
import Input from '../components/common/Input.jsx';
import PageFrame from '../components/layout/PageFrame.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { BackendUnreachableError } from '../api/client.js';

function validate(values, isRegister) {
  const errors = {};
  if (isRegister && !values.displayName.trim()) {
    errors.displayName = 'Enter your name.';
  }
  if (!values.email.trim()) {
    errors.email = 'Enter your email address.';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    errors.email = 'Enter a valid email address.';
  }
  if (!values.password) {
    errors.password = 'Enter your password.';
  }
  return errors;
}

export default function AuthPage({ mode }) {
  const isRegister = mode === 'register';
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const formRef = useRef(null);
  const [values, setValues] = useState({ displayName: '', email: '', password: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  function updateField(event) {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    setFieldErrors((current) => ({ ...current, [name]: undefined }));
    setFormError(null);
  }

  async function submit(event) {
    event.preventDefault();
    const errors = validate(values, isRegister);
    setFieldErrors(errors);
    setFormError(null);
    if (Object.keys(errors).length > 0) {
      return;
    }

    setSubmitting(true);
    try {
      const credentials = isRegister
        ? { displayName: values.displayName.trim(), email: values.email.trim(), password: values.password }
        : { email: values.email.trim(), password: values.password };
      if (isRegister) {
        await register(credentials);
      } else {
        await login(credentials);
      }
      navigate(location.state?.from?.pathname || '/', { replace: true });
    } catch (error) {
      setFormError(error);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PageFrame>
      <section className="auth-panel" aria-labelledby="auth-title">
        <p className="eyebrow">TalkReady</p>
        <h1 id="auth-title">{isRegister ? 'Create your account' : 'Welcome back'}</h1>
        <p className="auth-intro">
          {isRegister
            ? 'Create a local account to keep your interview practice organized.'
            : 'Sign in to pick up your interview practice.'}
        </p>

        {location.state?.notice && (
          <p className="settings-success" role="status">{location.state.notice}</p>
        )}
        {location.state?.warning && (
          <ErrorBanner error={new Error(location.state.warning)} />
        )}

        <form ref={formRef} className="auth-form" onSubmit={submit} noValidate>
          {formError && (
            formError instanceof BackendUnreachableError ? (
              <ErrorBanner error={formError} onRetry={() => formRef.current?.requestSubmit()} />
            ) : (
              <div className="auth-error" role="alert">
                <span className="error-icon" aria-hidden="true">!</span>
                <span>{formError.message || 'We could not sign you in. Check your details and try again.'}</span>
              </div>
            )
          )}
          {isRegister && (
            <Input
              id="displayName"
              name="displayName"
              label="Your name"
              value={values.displayName}
              onChange={updateField}
              error={fieldErrors.displayName}
              autoComplete="name"
              maxLength={80}
              required
            />
          )}
          <Input
            id="email"
            name="email"
            label="Email address"
            type="email"
            value={values.email}
            onChange={updateField}
            error={fieldErrors.email}
            autoComplete="email"
            maxLength={254}
            required
          />
          <Input
            id="password"
            name="password"
            label="Password"
            type="password"
            value={values.password}
            onChange={updateField}
            error={fieldErrors.password}
            autoComplete={isRegister ? 'new-password' : 'current-password'}
            required
          />
          <Button className="auth-submit" type="submit" disabled={submitting}>
            {submitting
              ? (isRegister ? 'Creating account...' : 'Signing in...')
              : (isRegister ? 'Create account' : 'Sign in')}
          </Button>
        </form>

        <p className="auth-switch">
          {isRegister ? 'Already have an account?' : 'New to TalkReady?'}{' '}
          <Link to={isRegister ? '/login' : '/register'}>
            {isRegister ? 'Sign in' : 'Create an account'}
          </Link>
        </p>
      </section>
    </PageFrame>
  );
}
