import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from "lucide-react";

import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const { profile } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setError("");

    if (!email.trim() || !password) {
      setError("من فضلك أدخل البريد الإلكتروني وكلمة المرور.");
      return;
    }

    setLoading(true);

    const { data, error: loginError } =
      await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

    if (loginError) {
      setError("البريد الإلكتروني أو كلمة المرور غير صحيحة.");
      setLoading(false);
      return;
    }

    if (!data.user) {
      setError("حدث خطأ أثناء تسجيل الدخول.");
      setLoading(false);
      return;
    }

    /*
     * نجيب بيانات الـ profile بعد نجاح تسجيل الدخول.
     */
    const { data: userProfile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single();

    if (profileError || !userProfile) {
      setError("تم تسجيل الدخول، ولكن لم يتم العثور على بيانات الحساب.");
      await supabase.auth.signOut();
      setLoading(false);
      return;
    }

    if (
      userProfile.role === "admin" ||
      userProfile.role === "root_admin"
    ) {
      navigate("/admin");
    } else {
      navigate("/");
    }

    setLoading(false);
  };

  return (
    <div className="login-page" dir="rtl">
      <div className="login-card">

        <div className="login-card__icon">
          <ShieldCheck size={30} />
        </div>

        <div className="login-card__header">
          <p className="login-card__eyebrow">
            TNU Hub
          </p>

          <h1>تسجيل الدخول</h1>

          <p>
            سجّل الدخول للوصول إلى حسابك في المنصة.
          </p>
        </div>

        {profile && (
          <div className="login-info">
            أنت مسجل الدخول بالفعل.
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">

          <div className="login-field">
            <label htmlFor="email">
              البريد الإلكتروني
            </label>

            <div className="login-input-wrapper">
              <Mail size={19} />

              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="example@email.com"
                autoComplete="email"
                disabled={loading}
              />
            </div>
          </div>

          <div className="login-field">
            <label htmlFor="password">
              كلمة المرور
            </label>

            <div className="login-input-wrapper">
              <LockKeyhole size={19} />

              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="أدخل كلمة المرور"
                autoComplete="current-password"
                disabled={loading}
              />

              <button
                type="button"
                className="login-password-toggle"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={
                  showPassword
                    ? "إخفاء كلمة المرور"
                    : "إظهار كلمة المرور"
                }
              >
                {showPassword ? (
                  <EyeOff size={19} />
                ) : (
                  <Eye size={19} />
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="login-error" role="alert">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="login-submit"
            disabled={loading}
          >
            {loading ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
          </button>
        </form>

        <div className="login-card__footer">
          <Link to="/">
            العودة إلى الرئيسية
          </Link>
        </div>

      </div>
    </div>
  );
}