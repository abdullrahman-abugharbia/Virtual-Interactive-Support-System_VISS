import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';
import { resetPasswordRequestAsync, selectMailSent } from '../authSlice';

const inputCls =
  'w-full rounded-[10px] border border-line bg-background px-3.5 py-3 text-sm text-content outline-none transition-shadow focus:border-primary focus:ring-2 focus:ring-primary-soft';
const labelCls = 'mb-[7px] block text-[13px] font-medium text-[#CBD5E1]';

export default function ForgotPassword() {
  const mailSent = useSelector(selectMailSent);
  const dispatch = useDispatch();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  return (
    <main className="flex min-h-screen items-center justify-center bg-auth-glow px-6 py-16">
      <div className="w-[420px] max-w-full rounded-card-lg border border-line bg-surface p-9 shadow-auth">
        <div className="flex justify-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-logo-gradient text-[21px] font-bold text-white">
            V
          </span>
        </div>
        <h1 className="mt-[22px] text-center text-[22px] font-bold tracking-[-0.01em] text-content">
          Reset your password
        </h1>
        <p className="mt-2.5 text-center text-[13.5px] leading-relaxed text-muted">
          Enter the email tied to your account and we'll send you a reset link.
        </p>

        <form
          noValidate
          className="mt-7"
          onSubmit={handleSubmit((data) => {
            dispatch(resetPasswordRequestAsync(data.email));
          })}
        >
          <div>
            <label htmlFor="email" className={labelCls}>Email address</label>
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
            {mailSent && (
              <p className="mt-1.5 text-[12.5px] text-success-text">Mail sent</p>
            )}
          </div>

          <button
            type="submit"
            className="mt-[26px] w-full rounded-[11px] bg-primary px-6 py-[13px] text-[14.5px] font-semibold text-white transition-colors hover:bg-primary-hover"
          >
            Send reset link
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
