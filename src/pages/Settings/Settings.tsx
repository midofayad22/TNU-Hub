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
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

import { useTheme } from "../../context/useTheme";

type Theme = "light" | "dark";

export default function Settings() {
  const { theme, setTheme } = useTheme();

  const [notificationsEnabled, setNotificationsEnabled] =
    useState(true);

  const [language, setLanguage] = useState("العربية");
  const [savedMessage, setSavedMessage] = useState("");

  const messageTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (messageTimeoutRef.current !== null) {
        window.clearTimeout(messageTimeoutRef.current);
      }
    };
  }, []);

  const showSavedMessage = (message: string) => {
    setSavedMessage(message);

    if (messageTimeoutRef.current !== null) {
      window.clearTimeout(messageTimeoutRef.current);
    }

    messageTimeoutRef.current = window.setTimeout(() => {
      setSavedMessage("");
      messageTimeoutRef.current = null;
    }, 2200);
  };

  const handleThemeChange = (newTheme: Theme) => {
    if (theme === newTheme) return;

    setTheme(newTheme);

    showSavedMessage(
      newTheme === "dark"
        ? "تم تفعيل الوضع الداكن"
        : "تم تفعيل الوضع الفاتح",
    );
  };

  const handleNotificationsChange = () => {
    setNotificationsEnabled((current) => {
      const nextValue = !current;

      showSavedMessage(
        nextValue
          ? "تم تفعيل إشعارات المنصة"
          : "تم إيقاف إشعارات المنصة",
      );

      return nextValue;
    });
  };

  const handleLanguageChange = (
    value: string,
  ) => {
    setLanguage(value);

    showSavedMessage(
      value === "العربية"
        ? "تم اختيار اللغة العربية"
        : "تم اختيار اللغة الإنجليزية",
    );
  };

  return (
    <main
      className="page-shell settings-page"
      dir="rtl"
    >
      {/* =====================================================
          HERO
      ====================================================== */}

      <section className="settings-hero">
        <div className="settings-hero__content">
          <span className="page-kicker">
            تفضيلاتك
          </span>

          <div className="settings-hero__title-row">
            <div className="settings-hero__icon">
              <ShieldCheck
                size={23}
                aria-hidden="true"
              />
            </div>

            <h1>الإعدادات</h1>
          </div>

          <p>
            خصص طريقة استخدامك للمنصة وتحكم في
            المظهر والإشعارات وبعض تفضيلات حسابك.
          </p>
        </div>

        <div
          className="settings-hero__visual"
          aria-hidden="true"
        >
          <ShieldCheck
            size={62}
            strokeWidth={1.25}
          />
        </div>
      </section>

      {/* =====================================================
          SAVE MESSAGE
      ====================================================== */}

      {savedMessage && (
        <div
          className="settings-save-message"
          role="status"
          aria-live="polite"
        >
          <div className="settings-save-message__icon">
            <ShieldCheck
              size={17}
              aria-hidden="true"
            />
          </div>

          <span>{savedMessage}</span>
        </div>
      )}

      {/* =====================================================
          APPEARANCE
      ====================================================== */}

      <section className="settings-section">
        <div className="settings-section__heading">
          <div className="settings-section__heading-icon">
            {theme === "dark" ? (
              <Moon
                size={20}
                aria-hidden="true"
              />
            ) : (
              <Sun
                size={20}
                aria-hidden="true"
              />
            )}
          </div>

          <div>
            <span>المظهر</span>
            <h2>مظهر المنصة</h2>
          </div>
        </div>

        <div
          className="settings-theme"
          role="group"
          aria-label="اختيار مظهر المنصة"
        >
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
            aria-pressed={theme === "light"}
          >
            <div className="settings-theme-option__icon">
              <Sun
                size={21}
                aria-hidden="true"
              />
            </div>

            <div className="settings-theme-option__content">
              <strong>الوضع الفاتح</strong>

              <span>
                مظهر مشرق وواضح للاستخدام اليومي
              </span>
            </div>

            <span
              className="settings-radio"
              aria-hidden="true"
            >
              {theme === "light" && <span />}
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
            aria-pressed={theme === "dark"}
          >
            <div className="settings-theme-option__icon">
              <Moon
                size={21}
                aria-hidden="true"
              />
            </div>

            <div className="settings-theme-option__content">
              <strong>الوضع الداكن</strong>

              <span>
                مظهر مريح للعين في الإضاءة المنخفضة
              </span>
            </div>

            <span
              className="settings-radio"
              aria-hidden="true"
            >
              {theme === "dark" && <span />}
            </span>
          </button>
        </div>
      </section>

      {/* =====================================================
          NOTIFICATIONS
      ====================================================== */}

      <section className="settings-section">
        <div className="settings-section__heading">
          <div className="settings-section__heading-icon">
            <Bell
              size={20}
              aria-hidden="true"
            />
          </div>

          <div>
            <span>التنبيهات</span>
            <h2>الإشعارات</h2>
          </div>
        </div>

        <div className="settings-row">
          <div
            className={`settings-row__icon ${
              notificationsEnabled
                ? "settings-row__icon--active"
                : ""
            }`}
          >
            <Bell
              size={19}
              aria-hidden="true"
            />
          </div>

          <div className="settings-row__content">
            <strong>إشعارات المنصة</strong>

            <p>
              استقبل تنبيهات عن الإعلانات والفعاليات
              والتحديثات المهمة.
            </p>

            <span
              className={`settings-row__state ${
                notificationsEnabled
                  ? "settings-row__state--active"
                  : ""
              }`}
            >
              {notificationsEnabled
                ? "الإشعارات مفعلة"
                : "الإشعارات متوقفة"}
            </span>
          </div>

          <button
            type="button"
            className={`settings-switch ${
              notificationsEnabled
                ? "settings-switch--active"
                : ""
            }`}
            onClick={handleNotificationsChange}
            aria-label={
              notificationsEnabled
                ? "إيقاف الإشعارات"
                : "تفعيل الإشعارات"
            }
            aria-pressed={notificationsEnabled}
          >
            <span />
          </button>
        </div>
      </section>

      {/* =====================================================
          LANGUAGE
      ====================================================== */}

      <section className="settings-section">
        <div className="settings-section__heading">
          <div className="settings-section__heading-icon">
            <Globe2
              size={20}
              aria-hidden="true"
            />
          </div>

          <div>
            <span>اللغة</span>
            <h2>لغة المنصة</h2>
          </div>
        </div>

        <div className="settings-row settings-row--language">
          <div className="settings-row__icon">
            <Globe2
              size={19}
              aria-hidden="true"
            />
          </div>

          <div className="settings-row__content">
            <strong>اللغة الحالية</strong>

            <p>
              اختر اللغة التي تريد استخدامها داخل
              المنصة.
            </p>
          </div>

          <label className="settings-select-wrapper">
            <span className="sr-only">
              لغة المنصة
            </span>

            <select
              value={language}
              onChange={(event) =>
                handleLanguageChange(
                  event.target.value,
                )
              }
              className="settings-select"
              aria-label="لغة المنصة"
            >
              <option value="العربية">
                العربية
              </option>

              <option value="English">
                English
              </option>
            </select>
          </label>
        </div>

        {language === "English" && (
          <div className="settings-coming-soon">
            <Globe2
              size={16}
              aria-hidden="true"
            />

            <span>
              النسخة الإنجليزية الكاملة للمنصة
              ستكون متاحة قريبًا.
            </span>
          </div>
        )}
      </section>

      {/* =====================================================
          ACCOUNT
      ====================================================== */}

      <section className="settings-section">
        <div className="settings-section__heading">
          <div className="settings-section__heading-icon">
            <UserRound
              size={20}
              aria-hidden="true"
            />
          </div>

          <div>
            <span>الحساب</span>
            <h2>حسابك</h2>
          </div>
        </div>

        <div className="settings-links">
          <Link
            to="/profile"
            className="settings-link"
          >
            <div className="settings-link__icon">
              <UserRound
                size={18}
                aria-hidden="true"
              />
            </div>

            <div className="settings-link__content">
              <strong>الملف الشخصي</strong>

              <span>
                تعديل بياناتك الأكاديمية والشخصية
              </span>
            </div>

            <ChevronLeft
              className="settings-link__arrow"
              size={18}
              aria-hidden="true"
            />
          </Link>

          <button
            type="button"
            className="settings-link settings-link--disabled"
            disabled
            aria-label="الأمان والخصوصية — قريبًا"
          >
            <div className="settings-link__icon">
              <LockKeyhole
                size={18}
                aria-hidden="true"
              />
            </div>

            <div className="settings-link__content">
              <strong>الأمان والخصوصية</strong>

              <span>
                إدارة إعدادات الأمان والخصوصية
              </span>
            </div>

            <span className="settings-link__soon">
              قريبًا
            </span>

            <ChevronLeft
              className="settings-link__arrow"
              size={18}
              aria-hidden="true"
            />
          </button>
        </div>
      </section>

      {/* =====================================================
          FOOTER NOTE
      ====================================================== */}

      <section className="settings-footer-note">
        <div className="settings-footer-note__icon">
          <ShieldCheck
            size={19}
            aria-hidden="true"
          />
        </div>

        <div>
          <strong>
            إعداداتك محفوظة على هذا الجهاز
          </strong>

          <p>
            سيتم الاحتفاظ بتفضيلات المظهر أثناء
            استخدامك للمنصة على هذا الجهاز.
          </p>
        </div>
      </section>
    </main>
  );
}