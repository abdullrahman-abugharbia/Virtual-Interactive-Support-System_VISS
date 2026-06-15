import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';
import { resetPasswordAsync, selectError, selectPasswordReset } from '../authSlice';

const inputCls =
  'w-full rounded-[10px] border border-line bg-background px-3.5 py-3 text-sm text-content outline-none transition-shadow focus:border-primary focus:ring-2 focus:ring-primary-soft';
const labelCls = 'mb-[7px] block text-[13px] font-medium text-[#CBD5E1]';

export default function ResetPassword() {
  const passwordReset = useSelector(selectPasswordReset);
  const error = useSelector(selectError);
  const query = new URLSearchParams(window.location.search);
  const token = query.get('token');
  const email = query.get('email');

  const dispatch = useDispatch();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  if (!(email && token)) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-auth-glow px-6 py-16">
        <p className="text-sm text-error-text">Incorrect Link</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-auth-glow px-6 py-16">
      <div className="w-[420px] max-w-full rounded-card-lg border border-line bg-surface p-9 shadow-auth">
        <div className="flex justify-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-logo-gradient text-[21px] font-bold text-white">
            V
          </span>
        </div>
        <h1 className="mt-[22px] text-center text-[22px] font-bold tracking-[-0.01em] text-content">
          Enter a new password
        </h1>
        <p className="mt-2 text-center text-[13.5px] text-muted">
          Choose a strong password for your account.
        </p>

        <form
          noValidate
          className="mt-7"
          onSubmit={handleSubmit((data) => {
            dispatch(resetPasswordAsync({ email, token, password: data.password }));
          })}
        >
          <div>
            <label htmlFor="password" className={labelCls}>New password</label>
            <input
              id="password"
              type="password"
              placeholder="8+ characters"
              className={inputCls}
              {...register('password', {
                required: 'password is required',
                pattern: {
                  value: /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/gm,
                  message:
                    '- at least 8 characters\n - must contain at least 1 uppercase letter, 1 lowercase letter, and 1 number\n - Can contain special characters',
                },
              })}
            />
            {errors.password && (
              <p className="mt-1.5 whitespace-pre-line text-[12.5px] text-error-text">
                {errors.password.message}
              </p>
            )}
          </div>

          <div className="mt-[18px]">
            <label htmlFor="confirmPassword" className={labelCls}>Confirm password</label>
            <input
              id="confirmPassword"
              type="password"
              placeholder="Repeat password"
              className={inputCls}
              {...register('confirmPassword', {
                required: 'confirm password is required',
                validate: (value, formValues) =>
                  value === formValues.password || 'password not matching',
              })}
            />
            {errors.confirmPassword && (
              <p className="mt-1.5 text-[12.5px] text-error-text">{errors.confirmPassword.message}</p>
            )}
            {passwordReset && (
              <p className="mt-1.5 text-[12.5px] text-success-text">Password reset</p>
            )}
            {error && (
              <p className="mt-1.5 text-[12.5px] text-error-text">
                {typeof error === 'string' ? error : error.message || 'Something went wrong. Please try again.'}
              </p>
            )}
          </div>

          <button
            type="submit"
            className="mt-[26px] w-full rounded-[11px] bg-primary px-6 py-[13px] text-[14.5px] font-semibold text-white transition-colors hover:bg-primary-hover"
          >
            Reset password
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link
            to="/login"
            className="text-[13.5px] font-medium text-primary-hover transition-colors hover:text-primary-light"
          >
            ← Back to login
          </Link>
        </div>
      </div>
    </main>
  );
}
