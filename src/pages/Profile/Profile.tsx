import {
  Bell,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Edit3,
  GraduationCap,
  Save,
  Settings,
  User,
  X,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";

import { Link } from "react-router-dom";

import { useProfile } from "../../context/useProfile";
import type { ProfileData } from "../../context/ProfileContext";
import { faculties } from "../../data/faculties";

const emptyProfile: ProfileData = {
  name: "",
  faculty: "",
  program: "",
  academicYear: "",
};

const academicYears = [
  "العام الأول",
  "العام الثاني",
  "العام الثالث",
  "العام الرابع",
  "العام الخامس",
  "الدراسات العليا",
];

export default function Profile() {
  const { profile, updateProfile } = useProfile();

  const [formData, setFormData] =
    useState<ProfileData>(emptyProfile);

  const [isEditing, setIsEditing] =
    useState(false);

  const selectedFaculty = useMemo(
    () =>
      faculties.find(
        (faculty) =>
          faculty.name === formData.faculty,
      ),
    [formData.faculty],
  );

  const availablePrograms =
    selectedFaculty?.programs ?? [];

  const completedFields = [
    profile.name,
    profile.faculty,
    profile.program,
    profile.academicYear,
  ].filter((value) => value.trim() !== "").length;

  const completionPercentage =
    completedFields * 25;

  const isProfileComplete =
    completionPercentage === 100;

  const avatarLetter =
    profile.name.trim().charAt(0) || "؟";

  const openEditProfile = () => {
    setFormData({
      name: profile.name,
      faculty: profile.faculty,
      program: profile.program,
      academicYear: profile.academicYear,
    });

    setIsEditing(true);
  };

  const closeEditProfile = () => {
    setFormData({
      name: profile.name,
      faculty: profile.faculty,
      program: profile.program,
      academicYear: profile.academicYear,
    });

    setIsEditing(false);
  };

  const saveProfile = (
    event?: FormEvent<HTMLFormElement>,
  ) => {
    event?.preventDefault();

    const cleanedProfile: ProfileData = {
      name: formData.name.trim(),
      faculty: formData.faculty.trim(),
      program: formData.program.trim(),
      academicYear: formData.academicYear.trim(),
    };

    if (
      !cleanedProfile.name ||
      !cleanedProfile.faculty ||
      !cleanedProfile.program ||
      !cleanedProfile.academicYear
    ) {
      return;
    }

    updateProfile(cleanedProfile);
    setIsEditing(false);
  };

  const updateField = (
    field: keyof ProfileData,
    value: string,
  ) => {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const updateFaculty = (
    facultyName: string,
  ) => {
    setFormData((current) => ({
      ...current,
      faculty: facultyName,
      program: "",
    }));
  };

  useEffect(() => {
    if (!isEditing) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeEditProfile();
      }
    };

    document.addEventListener(
      "keydown",
      handleKeyDown,
    );

    return () => {
      document.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, [isEditing, profile]);

  useEffect(() => {
    if (!isEditing) return;

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow =
        previousOverflow;
    };
  }, [isEditing]);

  const canSave =
    formData.name.trim() !== "" &&
    formData.faculty.trim() !== "" &&
    formData.program.trim() !== "" &&
    formData.academicYear.trim() !== "";

  return (
    <main
      className="page-shell profile-page"
      dir="rtl"
    >
      {/* =========================================
          PROFILE HERO
          ========================================= */}

      <section className="profile-header">
        <div className="profile-header__identity">
          <div
            className="profile-avatar"
            aria-hidden="true"
          >
            {avatarLetter}
          </div>

          <div className="profile-main">
            <span className="page-kicker">
              حساب الطالب
            </span>

            <h1>
              {profile.name.trim()
                ? profile.name
                : "أكمل ملفك الشخصي"}
            </h1>

            <p>
              {isProfileComplete
                ? `طالب جامعي · ${profile.program}`
                : "أضف بياناتك الأكاديمية لتخصيص تجربتك داخل المنصة."}
            </p>

            {profile.faculty && (
              <div className="profile-main__meta">
                <GraduationCap
                  size={15}
                  aria-hidden="true"
                />

                <span>
                  {profile.faculty}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="profile-header__actions">
          <button
            type="button"
            className="profile-edit-button"
            onClick={openEditProfile}
          >
            <Edit3
              size={16}
              aria-hidden="true"
            />

            <span>
              {isProfileComplete
                ? "تعديل الملف"
                : "إكمال الملف"}
            </span>
          </button>

          <Link
            to="/settings"
            className="profile-settings-button"
            aria-label="الإعدادات"
          >
            <Settings
              size={17}
              aria-hidden="true"
            />
          </Link>
        </div>
      </section>

      {/* =========================================
          PROFILE COMPLETION
          ========================================= */}

      <section className="profile-completion-card">
        <div className="profile-completion-card__top">
          <div className="profile-completion-card__identity">
            <div className="profile-completion-card__icon">
              <User
                size={19}
                aria-hidden="true"
              />
            </div>

            <div>
              <span>
                حالة الملف الشخصي
              </span>

              <strong>
                {isProfileComplete
                  ? "ملفك مكتمل"
                  : `اكتمال الملف ${completionPercentage}%`}
              </strong>
            </div>
          </div>

          <span className="profile-completion-card__percentage">
            {completionPercentage}%
          </span>
        </div>

        <div
          className="profile-progress"
          aria-label={`اكتمال الملف ${completionPercentage}%`}
        >
          <span
            style={{
              width: `${completionPercentage}%`,
            }}
          />
        </div>

        <p>
          {isProfileComplete
            ? "بياناتك الأكاديمية مكتملة ويمكن للمنصة تخصيص تجربتك بشكل أفضل."
            : "أكمل بياناتك الأكاديمية حتى تحصل على تجربة أكثر تخصيصًا داخل TNU Hub."}
        </p>
      </section>

      {/* =========================================
          QUICK STATS
          ========================================= */}

      <section className="profile-stats">
        <div className="profile-stat">
          <div className="profile-stat__icon">
            <CheckCircle2
              size={19}
              aria-hidden="true"
            />
          </div>

          <div>
            <strong>—</strong>
            <span>طلبات تم حلها</span>
          </div>
        </div>

        <div className="profile-stat">
          <div className="profile-stat__icon">
            <CalendarDays
              size={19}
              aria-hidden="true"
            />
          </div>

          <div>
            <strong>—</strong>
            <span>فعاليات مسجلة</span>
          </div>
        </div>

        <div className="profile-stat">
          <div className="profile-stat__icon">
            <Bell
              size={19}
              aria-hidden="true"
            />
          </div>

          <div>
            <strong>مفعلة</strong>
            <span>الإشعارات</span>
          </div>
        </div>
      </section>

      {/* =========================================
          INFORMATION GRID
          ========================================= */}

      <div className="profile-grid">
        {/* Academic */}

        <section className="profile-card">
          <div className="profile-card__header">
            <div>
              <span>الدراسة</span>
              <h2>المعلومات الأكاديمية</h2>
            </div>

            <div className="profile-card__header-icon">
              <GraduationCap
                size={21}
                aria-hidden="true"
              />
            </div>
          </div>

          <div className="profile-row">
            <div className="profile-row__icon">
              <GraduationCap
                size={18}
                aria-hidden="true"
              />
            </div>

            <div className="profile-row__content">
              <span>الكلية</span>

              <strong>
                {profile.faculty ||
                  "لم يتم تحديد الكلية"}
              </strong>
            </div>
          </div>

          <div className="profile-row">
            <div className="profile-row__icon">
              <BookOpen
                size={18}
                aria-hidden="true"
              />
            </div>

            <div className="profile-row__content">
              <span>البرنامج</span>

              <strong>
                {profile.program ||
                  "لم يتم تحديد البرنامج"}
              </strong>
            </div>
          </div>

          <div className="profile-row">
            <div className="profile-row__icon">
              <CalendarDays
                size={18}
                aria-hidden="true"
              />
            </div>

            <div className="profile-row__content">
              <span>العام الدراسي</span>

              <strong>
                {profile.academicYear ||
                  "لم يتم تحديد العام الدراسي"}
              </strong>
            </div>
          </div>
        </section>

        {/* Account */}

        <section className="profile-card">
          <div className="profile-card__header">
            <div>
              <span>الحساب</span>
              <h2>معلومات الحساب</h2>
            </div>

            <div className="profile-card__header-icon">
              <User
                size={21}
                aria-hidden="true"
              />
            </div>
          </div>

          <div className="profile-row">
            <div className="profile-row__icon">
              <User
                size={18}
                aria-hidden="true"
              />
            </div>

            <div className="profile-row__content">
              <span>نوع الحساب</span>
              <strong>طالب</strong>
            </div>
          </div>

          <div className="profile-row">
            <div className="profile-row__icon">
              <Bell
                size={18}
                aria-hidden="true"
              />
            </div>

            <div className="profile-row__content">
              <span>الإشعارات</span>

              <strong className="profile-status">
                <span />
                مفعلة
              </strong>
            </div>
          </div>

          <div className="profile-row">
            <div className="profile-row__icon">
              <CheckCircle2
                size={18}
                aria-hidden="true"
              />
            </div>

            <div className="profile-row__content">
              <span>حالة الحساب</span>

              <strong
                className={`profile-status ${
                  isProfileComplete
                    ? "profile-status--success"
                    : "profile-status--warning"
                }`}
              >
                <span />
                {isProfileComplete
                  ? "الملف مكتمل"
                  : "الملف غير مكتمل"}
              </strong>
            </div>
          </div>
        </section>
      </div>

      {/* =========================================
          INCOMPLETE PROFILE CTA
          ========================================= */}

      {!isProfileComplete && (
        <section className="profile-completion">
          <div className="profile-completion__icon">
            <User
              size={20}
              aria-hidden="true"
            />
          </div>

          <div className="profile-completion__content">
            <strong>
              أكمل ملفك الشخصي
            </strong>

            <p>
              أضف بياناتك الأكاديمية حتى نتمكن
              من تخصيص المحتوى والخدمات المناسبة لك.
            </p>
          </div>

          <button
            type="button"
            onClick={openEditProfile}
          >
            إكمال الآن
          </button>
        </section>
      )}

      {/* =========================================
          ACTIVITY
          ========================================= */}

      <section className="profile-activity">
        <div className="profile-activity__header">
          <div>
            <span>آخر نشاط</span>
            <h2>نشاطك على المنصة</h2>
          </div>

          <Link to="/requests">
            عرض الطلبات
          </Link>
        </div>

        <div className="profile-activity__empty">
          <div className="profile-activity__empty-icon">
            <CalendarDays
              size={21}
              aria-hidden="true"
            />
          </div>

          <div>
            <strong>
              لا يوجد نشاط جديد
            </strong>

            <p>
              سيظهر هنا آخر نشاط قمت به على المنصة.
            </p>
          </div>
        </div>
      </section>

      {/* =========================================
          EDIT PROFILE MODAL
          ========================================= */}

      {isEditing && (
        <div
          className="profile-modal-backdrop"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeEditProfile();
            }
          }}
        >
          <section
            className="profile-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="profile-modal-title"
          >
            <div className="profile-modal__header">
              <div>
                <span>الحساب</span>

                <h2 id="profile-modal-title">
                  بيانات الملف الشخصي
                </h2>

                <p>
                  حدّث بياناتك الأكاديمية لتخصيص
                  تجربتك داخل المنصة.
                </p>
              </div>

              <button
                type="button"
                className="profile-modal__close"
                onClick={closeEditProfile}
                aria-label="إغلاق"
              >
                <X
                  size={18}
                  aria-hidden="true"
                />
              </button>
            </div>

            <form
              className="profile-form"
              onSubmit={saveProfile}
            >
              <label className="profile-form__field">
                <span>الاسم</span>

                <input
                  type="text"
                  value={formData.name}
                  onChange={(event) =>
                    updateField(
                      "name",
                      event.target.value,
                    )
                  }
                  placeholder="اكتب اسمك"
                  autoComplete="name"
                  autoFocus
                />
              </label>

              <label className="profile-form__field">
                <span>الكلية</span>

                <select
                  value={formData.faculty}
                  onChange={(event) =>
                    updateFaculty(
                      event.target.value,
                    )
                  }
                >
                  <option value="">
                    اختر الكلية
                  </option>

                  {faculties.map((faculty) => (
                    <option
                      key={faculty.id}
                      value={faculty.name}
                    >
                      {faculty.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="profile-form__field">
                <span>البرنامج</span>

                <select
                  value={formData.program}
                  onChange={(event) =>
                    updateField(
                      "program",
                      event.target.value,
                    )
                  }
                  disabled={
                    !formData.faculty
                  }
                >
                  <option value="">
                    {!formData.faculty
                      ? "اختر الكلية أولًا"
                      : "اختر البرنامج"}
                  </option>

                  {availablePrograms.map(
                    (program) => (
                      <option
                        key={program.id}
                        value={program.name}
                      >
                        {program.name}
                      </option>
                    ),
                  )}
                </select>
              </label>

              <label className="profile-form__field">
                <span>العام الدراسي</span>

                <select
                  value={
                    formData.academicYear
                  }
                  onChange={(event) =>
                    updateField(
                      "academicYear",
                      event.target.value,
                    )
                  }
                >
                  <option value="">
                    اختر العام الدراسي
                  </option>

                  {academicYears.map((year) => (
                    <option
                      key={year}
                      value={year}
                    >
                      {year}
                    </option>
                  ))}
                </select>
              </label>

              <div className="profile-modal__footer">
                <button
                  type="button"
                  className="profile-modal__cancel"
                  onClick={closeEditProfile}
                >
                  إلغاء
                </button>

                <button
                  type="submit"
                  className="profile-modal__save"
                  disabled={!canSave}
                >
                  <Save
                    size={16}
                    aria-hidden="true"
                  />

                  حفظ البيانات
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}