import { useState } from "react";
import type { FormEvent } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { supabase } from "../../lib/supabase";

export default function Register() {
  const navigate = useNavigate();
  const location = useLocation();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const from = (location.state as { from?: string } | null)?.from ?? null;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (loading) return;

    setError("");
    setSuccess("");

    const normalizedName = fullName.trim();
    const normalizedEmail = email.trim();

    if (!normalizedName) {
      setError("من فضلك أدخل اسمك الكامل.");
      return;
    }

    if (!normalizedEmail) {
      setError("من فضلك أدخل البريد الإلكتروني.");
      return;
    }

    if (!password) {
      setError("من فضلك أدخل كلمة المرور.");
      return;
    }

    if (password.length < 6) {
      setError("كلمة المرور يجب أن تكون 6 أحرف على الأقل.");
      return;
    }

    if (password !== confirmPassword) {
      setError("كلمتا المرور غير متطابقتين.");
      return;
    }

    setLoading(true);

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          data: {
            full_name: normalizedName,
          },
        },
      });

      if (signUpError) {
        console.error("Registration error:", signUpError);

        if (signUpError.message.toLowerCase().includes("already registered")) {
          setError("هذا البريد الإلكتروني مسجل بالفعل. جرّب تسجيل الدخول.");
        } else {
          setError("تعذر إنشاء الحساب. حاول مرة أخرى.");
        }

        return;
      }

      if (!data.user) {
        setError("تعذر إنشاء الحساب. حاول مرة أخرى.");
        return;
      }

      /*
       * The database trigger automatically creates
       * the student's profiles row with:
       *
       * id = auth.users.id
       * role = student
       */

      if (!data.session) {
        setSuccess(
          "تم إنشاء الحساب بنجاح. تحقق من بريدك الإلكتروني لتفعيل الحساب ثم سجّل الدخول.",
        );

        setTimeout(() => {
          navigate("/login", {
            replace: true,
            state: from ? { from } : undefined,
          });
        }, 1800);

        return;
      }

      setSuccess("تم إنشاء حسابك بنجاح. يمكنك الآن إكمال ملفك الشخصي.");

      setTimeout(() => {
        navigate("/profile", {
          replace: true,
        });
      }, 1200);
    } catch (registrationError) {
      console.error("Unexpected registration error:", registrationError);

      setError("حدث خطأ غير متوقع. حاول مرة أخرى.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-page register-page" dir="rtl">
      <div className="login-shell">
        {/* =================================================
            BRAND / VISUAL SIDE
        ================================================= */}

        <section className="login-showcase">
          <div className="login-showcase__glow" />

          <div className="login-showcase__brand">
            <div className="login-showcase__brand-mark">
              <ShieldCheck size={22} aria-hidden="true" />
            </div>

            <span>TNU Hub</span>
          </div>

          <div className="login-showcase__content">
            <span className="login-showcase__eyebrow">
              <Sparkles size={15} aria-hidden="true" />
              انضم إلى المنصة
            </span>

            <h1>
              حسابك الجامعي
              <span>يبدأ من هنا.</span>
            </h1>

            <p>
              أنشئ حسابك في TNU Hub للوصول إلى الخدمات والفعاليات والإعلانات
              والمصادر وكل ما تحتاجه داخل المنصة.
            </p>
          </div>

          <div className="login-showcase__features">
            <div className="login-showcase__feature">
              <div className="login-showcase__feature-icon">
                <CheckCircle2 size={17} aria-hidden="true" />
              </div>

              <div>
                <strong>حساب طالب</strong>

                <span>مخصص لاستخدامك الجامعي</span>
              </div>
            </div>

            <div className="login-showcase__feature">
              <div className="login-showcase__feature-icon">
                <ShieldCheck size={17} aria-hidden="true" />
              </div>

              <div>
                <strong>وصول آمن</strong>

                <span>بياناتك مرتبطة بحسابك</span>
              </div>
            </div>
          </div>

          <div className="login-showcase__footer">
            <span>Tanta University Student Hub</span>
          </div>
        </section>

        {/* =================================================
            REGISTER FORM
        ================================================= */}

        <section className="login-panel">
          <div className="login-card">
            <div className="login-card__icon">
              <UserRound size={28} aria-hidden="true" />
            </div>

            <div className="login-card__header">
              <span className="login-card__eyebrow">حساب طالب جديد</span>

              <h2>إنشاء حساب</h2>

              <p>أنشئ حسابك للبدء في استخدام TNU Hub.</p>
            </div>

            <form onSubmit={handleSubmit} className="login-form" noValidate>
              {/* Full Name */}

              <div className="login-field">
                <label htmlFor="full-name">الاسم الكامل</label>

                <div className="login-input-wrapper">
                  <UserRound size={18} aria-hidden="true" />

                  <input
                    id="full-name"
                    type="text"
                    value={fullName}
                    onChange={(event) => {
                      setFullName(event.target.value);

                      if (error) {
                        setError("");
                      }
                    }}
                    placeholder="أدخل اسمك الكامل"
                    autoComplete="name"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Email */}

              <div className="login-field">
                <label htmlFor="register-email">البريد الإلكتروني</label>

                <div className="login-input-wrapper">
                  <Mail size={18} aria-hidden="true" />

                  <input
                    id="register-email"
                    type="email"
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value);

                      if (error) {
                        setError("");
                      }
                    }}
                    placeholder="example@email.com"
                    autoComplete="email"
                    inputMode="email"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Password */}

              <div className="login-field">
                <label htmlFor="register-password">كلمة المرور</label>

                <div className="login-input-wrapper">
                  <LockKeyhole size={18} aria-hidden="true" />

                  <input
                    id="register-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value);

                      if (error) {
                        setError("");
                      }
                    }}
                    placeholder="أدخل كلمة المرور"
                    autoComplete="new-password"
                    disabled={loading}
                  />

                  <button
                    type="button"
                    className="login-password-toggle"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={
                      showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"
                    }
                    aria-pressed={showPassword}
                    disabled={loading}
                  >
                    {showPassword ? (
                      <EyeOff size={18} aria-hidden="true" />
                    ) : (
                      <Eye size={18} aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}

              <div className="login-field">
                <label htmlFor="confirm-password">تأكيد كلمة المرور</label>

                <div className="login-input-wrapper">
                  <LockKeyhole size={18} aria-hidden="true" />

                  <input
                    id="confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(event) => {
                      setConfirmPassword(event.target.value);

                      if (error) {
                        setError("");
                      }
                    }}
                    placeholder="أعد إدخال كلمة المرور"
                    autoComplete="new-password"
                    disabled={loading}
                  />

                  <button
                    type="button"
                    className="login-password-toggle"
                    onClick={() => setShowConfirmPassword((value) => !value)}
                    aria-label={
                      showConfirmPassword
                        ? "إخفاء تأكيد كلمة المرور"
                        : "إظهار تأكيد كلمة المرور"
                    }
                    aria-pressed={showConfirmPassword}
                    disabled={loading}
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={18} aria-hidden="true" />
                    ) : (
                      <Eye size={18} aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>

              {/* Error */}

              {error && (
                <div className="login-error" role="alert">
                  <span className="login-error__dot" />

                  <p>{error}</p>
                </div>
              )}

              {/* Success */}

              {success && (
                <div className="login-info" role="status" aria-live="polite">
                  <CheckCircle2 size={17} aria-hidden="true" />

                  <span>{success}</span>
                </div>
              )}

              {/* Submit */}

              <button type="submit" className="login-submit" disabled={loading}>
                {loading ? (
                  <>
                    <span className="login-submit__spinner" />

                    <span>جاري إنشاء الحساب...</span>
                  </>
                ) : (
                  <>
                    <span>إنشاء الحساب</span>

                    <ArrowLeft size={17} aria-hidden="true" />
                  </>
                )}
              </button>
            </form>

            <div className="login-card__footer">
              <span>لديك حساب بالفعل؟</span>

              <Link to="/login">تسجيل الدخول</Link>
            </div>

            <div className="login-card__footer">
              <Link to="/">
                <ArrowLeft size={15} aria-hidden="true" />

                <span>العودة إلى الرئيسية</span>
              </Link>
            </div>
          </div>

          <p className="login-panel__note">
            TNU Hub · بوابتك الرقمية للحياة الجامعية
          </p>
        </section>
      </div>
    </main>
  );
}
