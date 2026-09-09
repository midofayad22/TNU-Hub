import {
  Bell,
  ChevronLeft,
  Globe2,
  LockKeyhole,
  Moon,
  ShieldCheck,
  Sun,
  UserRound,
} from "lucide-react";

import { useState } from "react";
import { Link } from "react-router-dom";

import { useTheme } from "../../context/useTheme";

export default function Settings() {
  const {
    theme,
    setTheme,
  } = useTheme();

  const [notificationsEnabled, setNotificationsEnabled] =
    useState(true);

  const [language, setLanguage] =
    useState("العربية");

  const [savedMessage, setSavedMessage] =
    useState("");

  const handleThemeChange = (
    newTheme: "light" | "dark"
  ) => {
    setTheme(newTheme);

    setSavedMessage(
      newTheme === "dark"
        ? "تم تفعيل الوضع الداكن"
        : "تم تفعيل الوضع الفاتح"
    );

    window.setTimeout(() => {
      setSavedMessage("");
    }, 2200);
  };

  return (
    <main
      className="page-shell settings-page"
      dir="rtl"
    >
      {/* =====================================================
          HEADER
      ===================================================== */}

      <section className="page-hero settings-hero">

        <div>

          <span className="page-kicker">
            تفضيلاتك
          </span>

          <h1>
            الإعدادات
          </h1>

          <p>
            تحكم في مظهر المنصة والإشعارات وبعض
            التفضيلات الخاصة بحسابك.
          </p>

        </div>

        <div className="page-hero__icon">
          <ShieldCheck size={30} />
        </div>

      </section>

      {/* =====================================================
          SAVE MESSAGE
      ===================================================== */}

      {savedMessage && (
        <div className="settings-save-message">
          <ShieldCheck size={17} />
          {savedMessage}
        </div>
      )}

      {/* =====================================================
          APPEARANCE
      ===================================================== */}

      <section className="settings-section">

        <div className="settings-section__heading">

          <div className="settings-section__heading-icon">
            {theme === "dark" ? (
              <Moon size={20} />
            ) : (
              <Sun size={20} />
            )}
          </div>

          <div>

            <span>
              المظهر
            </span>

            <h2>
              مظهر المنصة
            </h2>

          </div>

        </div>

        <div className="settings-theme">

          <button
            type="button"
            className={`settings-theme-option ${
              theme === "light"
                ? "settings-theme-option--active"
                : ""
            }`}
            onClick={() =>
              handleThemeChange("light")
            }
            aria-pressed={
              theme === "light"
            }
          >

            <div className="settings-theme-option__icon">
              <Sun size={21} />
            </div>

            <div>

              <strong>
                الوضع الفاتح
              </strong>

              <span>
                مظهر مشرق وواضح
              </span>

            </div>

            <span className="settings-radio">
              {theme === "light" && (
                <span />
              )}
            </span>

          </button>

          <button
            type="button"
            className={`settings-theme-option ${
              theme === "dark"
                ? "settings-theme-option--active"
                : ""
            }`}
            onClick={() =>
              handleThemeChange("dark")
            }
            aria-pressed={
              theme === "dark"
            }
          >

            <div className="settings-theme-option__icon">
              <Moon size={21} />
            </div>

            <div>

              <strong>
                الوضع الداكن
              </strong>

              <span>
                مظهر مريح للعين في الإضاءة المنخفضة
              </span>

            </div>

            <span className="settings-radio">
              {theme === "dark" && (
                <span />
              )}
            </span>

          </button>

        </div>

      </section>

      {/* =====================================================
          NOTIFICATIONS
      ===================================================== */}

      <section className="settings-section">

        <div className="settings-section__heading">

          <div className="settings-section__heading-icon">
            <Bell size={20} />
          </div>

          <div>

            <span>
              التنبيهات
            </span>

            <h2>
              الإشعارات
            </h2>

          </div>

        </div>

        <div className="settings-row">

          <div className="settings-row__icon">
            <Bell size={19} />
          </div>

          <div className="settings-row__content">

            <strong>
              إشعارات المنصة
            </strong>

            <p>
              استقبل تنبيهات عن الإعلانات والفعاليات
              والتحديثات المهمة.
            </p>

          </div>

          <button
            type="button"
            className={`settings-switch ${
              notificationsEnabled
                ? "settings-switch--active"
                : ""
            }`}
            onClick={() =>
              setNotificationsEnabled(
                (value) => !value
              )
            }
            aria-label={
              notificationsEnabled
                ? "إيقاف الإشعارات"
                : "تفعيل الإشعارات"
            }
            aria-pressed={
              notificationsEnabled
            }
          >

            <span />

          </button>

        </div>

      </section>

      {/* =====================================================
          LANGUAGE
      ===================================================== */}

      <section className="settings-section">

        <div className="settings-section__heading">

          <div className="settings-section__heading-icon">
            <Globe2 size={20} />
          </div>

          <div>

            <span>
              اللغة
            </span>

            <h2>
              لغة المنصة
            </h2>

          </div>

        </div>

        <div className="settings-row">

          <div className="settings-row__icon">
            <Globe2 size={19} />
          </div>

          <div className="settings-row__content">

            <strong>
              اللغة الحالية
            </strong>

            <p>
              اختر اللغة التي تريد استخدامها داخل المنصة.
            </p>

          </div>

          <select
            value={language}
            onChange={(event) =>
              setLanguage(
                event.target.value
              )
            }
            className="settings-select"
            aria-label="لغة المنصة"
          >
            <option>
              العربية
            </option>

            <option>
              English
            </option>
          </select>

        </div>

      </section>

      {/* =====================================================
          ACCOUNT
      ===================================================== */}

      <section className="settings-section">

        <div className="settings-section__heading">

          <div className="settings-section__heading-icon">
            <UserRound size={20} />
          </div>

          <div>

            <span>
              الحساب
            </span>

            <h2>
              حسابك
            </h2>

          </div>

        </div>

        <div className="settings-links">

          <Link
            to="/profile"
            className="settings-link"
          >

            <div className="settings-link__icon">
              <UserRound size={18} />
            </div>

            <div>

              <strong>
                الملف الشخصي
              </strong>

              <span>
                تعديل بياناتك الأكاديمية والشخصية
              </span>

            </div>

            <ChevronLeft size={18} />

          </Link>

          <button
            type="button"
            className="settings-link"
          >

            <div className="settings-link__icon">
              <LockKeyhole size={18} />
            </div>

            <div>

              <strong>
                الأمان والخصوصية
              </strong>

              <span>
                إدارة إعدادات الأمان والخصوصية
              </span>

            </div>

            <ChevronLeft size={18} />

          </button>

        </div>

      </section>

    </main>
  );
}