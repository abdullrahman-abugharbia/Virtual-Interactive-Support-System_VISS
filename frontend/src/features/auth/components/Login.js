import { useSelector, useDispatch } from 'react-redux';
import { selectError, selectLoggedInUser } from '../authSlice';
import { Link, Navigate } from 'react-router-dom';
import { loginUserAsync } from '../authSlice';
import { useForm } from 'react-hook-form';

const inputCls =
  'w-full rounded-[10px] border border-line bg-background px-3.5 py-3 text-sm text-content outline-none transition-shadow focus:border-primary focus:ring-2 focus:ring-primary-soft';
const labelCls = 'mb-[7px] block text-[13px] font-medium text-[#CBD5E1]';

export default function Login() {
  const dispatch = useDispatch();
  const error = useSelector(selectError);
  const user = useSelector(selectLoggedInUser);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  return (
    <>
      {user && <Navigate to="/" replace={true}></Navigate>}
      <main className="flex min-h-screen items-center justify-center bg-auth-glow px-6 py-16">
        <div className="w-[420px] max-w-full rounded-card-lg border border-line bg-surface p-9 shadow-auth">
          <div className="flex justify-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-logo-gradient text-[21px] font-bold text-white">
              V
            </span>
          </div>
          <h1 className="mt-[22px] text-center text-[22px] font-bold tracking-[-0.01em] text-content">
            Welcome back
          </h1>
          <p className="mt-2 text-center text-[13.5px] text-muted">
            Log in to your VISS account
          </p>

          <form
            noValidate
            className="mt-7"
            onSubmit={handleSubmit((data) => {
              dispatch(
                loginUserAsync({ email: data.email, password: data.password })
              );
            })}
          >
            <div>
              <label htmlFor="email" className={labelCls}>
                Email address
              </label>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                className={inputCls}
                {...register('email', {
                  required: 'email is required',
                  pattern: {
                    value: /\b[\w.-]+@[\w.-]+\.\w{2,4}\b/gi,
                    message: 'email not valid',
                  },
                })}
              />
              {errors.email && (
                <p className="mt-1.5 text-[12.5px] text-error-text">{errors.email.message}</p>
              )}
            </div>

            <div className="mt-[18px]">
              <div className="mb-[7px] flex items-baseline justify-between">
                <label htmlFor="password" className="text-[13px] font-medium text-[#CBD5E1]">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-[12.5px] font-medium text-primary-hover transition-colors hover:text-primary-light"
                >
                  Forgot password?
                </Link>
              </div>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                className={inputCls}
                {...register('password', { required: 'password is required' })}
              />
              {errors.password && (
                <p className="mt-1.5 text-[12.5px] text-error-text">{errors.password.message}</p>
              )}
              {error && (
                <p className="mt-1.5 text-[12.5px] text-error-text">
                  {typeof error === 'string'
                    ? error
                    : error.message || 'Login failed. Please check your credentials and try again.'}
                </p>
              )}
            </div>

            <button
              type="submit"
              className="mt-[26px] w-full rounded-[11px] bg-primary px-6 py-[13px] text-[14.5px] font-semibold text-white transition-colors hover:bg-primary-hover"
            >
              Log in
            </button>
          </form>

          <div className="mt-6 border-t border-line-aria pt-[22px] text-center text-[13.5px] text-muted">
            New to VISS?{' '}
            <Link
              to="/signup"
              className="font-semibold text-primary-hover transition-colors hover:text-primary-light"
            >
              Create an account
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
