import { useEffect, useState } from "react";
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
} from "lucide-react";
import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";

import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const { profile, loading: authLoading } =
    useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const from =
    (
      location.state as
        | { from?: string }
        | null
    )?.from ?? null;

  useEffect(() => {
    if (!authLoading && profile) {
      // المستخدم مسجل بالفعل.
      // لا نعمل redirect تلقائي هنا حتى لا
      // نمنع المستخدم من رؤية الصفحة بشكل مفاجئ.
    }
  }, [authLoading, profile]);

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (loading) return;

    setError("");

    const normalizedEmail =
      email.trim();

    if (!normalizedEmail || !password) {
      setError(
        "من فضلك أدخل البريد الإلكتروني وكلمة المرور.",
      );
      return;
    }

    setLoading(true);

    try {
      const {
        data,
        error: loginError,
      } =
        await supabase.auth.signInWithPassword(
          {
            email: normalizedEmail,
            password,
          },
        );

      if (loginError) {
        setError(
          "البريد الإلكتروني أو كلمة المرور غير صحيحة.",
        );
        return;
      }

      if (!data.user) {
        setError(
          "حدث خطأ أثناء تسجيل الدخول. حاول مرة أخرى.",
        );
        return;
      }

      /*
       * نتحقق من وجود Profile للمستخدم
       * بعد نجاح تسجيل الدخول.
       */
      const {
        data: userProfile,
        error: profileError,
      } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .single();

      if (
        profileError ||
        !userProfile
      ) {
        setError(
          "تم تسجيل الدخول، ولكن لم يتم العثور على بيانات الحساب.",
        );

        await supabase.auth.signOut();
        return;
      }

      const isAdmin =
        userProfile.role === "admin" ||
        userProfile.role ===
          "root_admin";

      /*
       * لو المستخدم كان متوجه لصفحة محمية
       * قبل تسجيل الدخول، نرجعه لها.
       *
       * الـAdmin يظل له مساره الخاص.
       */
      if (isAdmin) {
        navigate("/admin", {
          replace: true,
        });
        return;
      }

      if (
        from &&
        from !== "/login" &&
        !from.startsWith("/admin")
      ) {
        navigate(from, {
          replace: true,
        });
        return;
      }

      navigate("/", {
        replace: true,
      });
    } catch (submitError) {
      console.error(
        "Login error:",
        submitError,
      );

      setError(
        "حدث خطأ غير متوقع. حاول مرة أخرى.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      className="login-page"
      dir="rtl"
    >
      <div className="login-shell">

        {/* =================================================
            BRAND / VISUAL SIDE
        ================================================= */}

        <section className="login-showcase">
          <div className="login-showcase__glow" />

          <div className="login-showcase__brand">
            <div className="login-showcase__brand-mark">
              <ShieldCheck
                size={22}
                aria-hidden="true"
              />
            </div>

            <span>
              TNU Hub
            </span>
          </div>

          <div className="login-showcase__content">
            <span className="login-showcase__eyebrow">
              <Sparkles
                size={15}
                aria-hidden="true"
              />

              بوابتك إلى المنصة
            </span>

            <h1>
              رحلتك الجامعية
              <span>
                تبدأ من هنا.
              </span>
            </h1>

            <p>
              سجّل الدخول للوصول إلى
              الخدمات والفعاليات والإعلانات
              والمصادر وكل ما تحتاجه داخل
              TNU Hub.
            </p>
          </div>

          <div className="login-showcase__features">

            <div className="login-showcase__feature">
              <div className="login-showcase__feature-icon">
                <CheckCircle2
                  size={17}
                  aria-hidden="true"
                />
              </div>

              <div>
                <strong>
                  منصة واحدة
                </strong>

                <span>
                  لكل احتياجاتك الجامعية
                </span>
              </div>
            </div>

            <div className="login-showcase__feature">
              <div className="login-showcase__feature-icon">
                <ShieldCheck
                  size={17}
                  aria-hidden="true"
                />
              </div>

              <div>
                <strong>
                  وصول آمن
                </strong>

                <span>
                  حسابك وبياناتك في مكان آمن
                </span>
              </div>
            </div>

          </div>

          <div className="login-showcase__footer">
            <span>
              Tanta University Student Hub
            </span>
          </div>
        </section>

        {/* =================================================
            LOGIN FORM
        ================================================= */}

        <section className="login-panel">
          <div className="login-card">

            <div className="login-card__icon">
              <ShieldCheck
                size={28}
                aria-hidden="true"
              />
            </div>

            <div className="login-card__header">
              <span className="login-card__eyebrow">
                مرحبًا بعودتك
              </span>

              <h2>
                تسجيل الدخول
              </h2>

              <p>
                أدخل بيانات حسابك للوصول إلى
                TNU Hub.
              </p>
            </div>

            {profile && (
              <div
                className="login-info"
                role="status"
              >
                <CheckCircle2
                  size={17}
                  aria-hidden="true"
                />

                <span>
                  أنت مسجل الدخول بالفعل.
                </span>
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className="login-form"
              noValidate
            >

              {/* Email */}

              <div className="login-field">
                <label htmlFor="email">
                  البريد الإلكتروني
                </label>

                <div className="login-input-wrapper">
                  <Mail
                    size={18}
                    aria-hidden="true"
                  />

                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) => {
                      setEmail(
                        event.target.value,
                      );

                      if (error) {
                        setError("");
                      }
                    }}
                    placeholder="example@email.com"
                    autoComplete="email"
                    inputMode="email"
                    disabled={loading}
                    aria-invalid={Boolean(error)}
                  />
                </div>
              </div>

              {/* Password */}

              <div className="login-field">
                <div className="login-field__label-row">
                  <label htmlFor="password">
                    كلمة المرور
                  </label>
                </div>

                <div className="login-input-wrapper">
                  <LockKeyhole
                    size={18}
                    aria-hidden="true"
                  />

                  <input
                    id="password"
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    value={password}
                    onChange={(event) => {
                      setPassword(
                        event.target.value,
                      );

                      if (error) {
                        setError("");
                      }
                    }}
                    placeholder="أدخل كلمة المرور"
                    autoComplete="current-password"
                    disabled={loading}
                  />

                  <button
                    type="button"
                    className="login-password-toggle"
                    onClick={() =>
                      setShowPassword(
                        (value) =>
                          !value,
                      )
                    }
                    aria-label={
                      showPassword
                        ? "إخفاء كلمة المرور"
                        : "إظهار كلمة المرور"
                    }
                    aria-pressed={
                      showPassword
                    }
                    disabled={loading}
                  >
                    {showPassword ? (
                      <EyeOff
                        size={18}
                        aria-hidden="true"
                      />
                    ) : (
                      <Eye
                        size={18}
                        aria-hidden="true"
                      />
                    )}
                  </button>
                </div>
              </div>

              {/* Error */}

              {error && (
                <div
                  className="login-error"
                  role="alert"
                >
                  <span className="login-error__dot" />

                  <p>{error}</p>
                </div>
              )}

              {/* Submit */}

              <button
                type="submit"
                className="login-submit"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="login-submit__spinner" />

                    <span>
                      جاري تسجيل الدخول...
                    </span>
                  </>
                ) : (
                  <>
                    <span>
                      تسجيل الدخول
                    </span>

                    <ArrowLeft
                      size={17}
                      aria-hidden="true"
                    />
                  </>
                )}
              </button>

            </form>

            {/* =================================================
                REGISTER LINK
            ================================================= */}

            <div className="login-register">
              <span>
                ليس لديك حساب؟
              </span>

              <Link to="/register">
                إنشاء حساب جديد
                <ArrowLeft
                  size={15}
                  aria-hidden="true"
                />
              </Link>
            </div>

            {/* =================================================
                FOOTER
            ================================================= */}

            <div className="login-card__footer">
              <Link to="/">
                <ArrowLeft
                  size={15}
                  aria-hidden="true"
                />

                <span>
                  العودة إلى الرئيسية
                </span>
              </Link>
            </div>

          </div>

          <p className="login-panel__note">
            TNU Hub · بوابتك الرقمية للحياة
            الجامعية
          </p>
        </section>

      </div>
    </main>
  );
}