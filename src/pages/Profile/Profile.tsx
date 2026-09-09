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

import { useState } from "react";
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

  const [isEditing, setIsEditing] = useState(false);

  const selectedFaculty = faculties.find(
    (faculty) => faculty.name === formData.faculty
  );

  const availablePrograms =
    selectedFaculty?.programs ?? [];

  const isProfileComplete =
    profile.name.trim() !== "" &&
    profile.faculty.trim() !== "" &&
    profile.program.trim() !== "" &&
    profile.academicYear.trim() !== "";

  const openEditProfile = () => {
    setFormData(profile);
    setIsEditing(true);
  };

  const closeEditProfile = () => {
    setFormData(profile);
    setIsEditing(false);
  };

  const saveProfile = () => {
    const cleanedProfile: ProfileData = {
      name: formData.name.trim(),
      faculty: formData.faculty.trim(),
      program: formData.program.trim(),
      academicYear: formData.academicYear.trim(),
    };

    updateProfile(cleanedProfile);
    setIsEditing(false);
  };

  const updateField = (
    field: keyof ProfileData,
    value: string
  ) => {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const updateFaculty = (facultyName: string) => {
    setFormData((current) => ({
      ...current,
      faculty: facultyName,
      program: "",
    }));
  };

  const avatarLetter =
    profile.name.trim().charAt(0) || "؟";

  return (
    <main
      className="page-shell profile-page"
      dir="rtl"
    >
      {/* Profile Header */}

      <section className="profile-header">
        <div className="profile-avatar">
          {avatarLetter}
        </div>

        <div className="profile-main">
          <span className="page-kicker">
            حساب الطالب
          </span>

          <h1>
            {profile.name || "أكمل ملفك الشخصي"}
          </h1>

          <p>
            {isProfileComplete
              ? `طالب جامعي · ${profile.program}`
              : "أضف بياناتك الأكاديمية لتخصيص تجربتك."}
          </p>
        </div>

        <div className="profile-header__actions">
          <button
            type="button"
            className="profile-edit-button"
            onClick={openEditProfile}
          >
            <Edit3 size={16} />

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
            <Settings size={17} />
          </Link>
        </div>
      </section>

      {/* Quick Stats */}

      <section className="profile-stats">
        <div className="profile-stat">
          <div className="profile-stat__icon">
            <CheckCircle2 size={19} />
          </div>

          <div>
            <strong>—</strong>
            <span>طلبات تم حلها</span>
          </div>
        </div>

        <div className="profile-stat">
          <div className="profile-stat__icon">
            <CalendarDays size={19} />
          </div>

          <div>
            <strong>—</strong>
            <span>فعاليات مسجلة</span>
          </div>
        </div>

        <div className="profile-stat">
          <div className="profile-stat__icon">
            <Bell size={19} />
          </div>

          <div>
            <strong>مفعلة</strong>
            <span>الإشعارات</span>
          </div>
        </div>
      </section>

      {/* Main Grid */}

      <div className="profile-grid">
        {/* Academic Information */}

        <section className="profile-card">
          <div className="profile-card__header">
            <div>
              <span>الدراسة</span>
              <h2>المعلومات الأكاديمية</h2>
            </div>

            <GraduationCap size={21} />
          </div>

          <div className="profile-row">
            <div className="profile-row__icon">
              <GraduationCap size={18} />
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
              <BookOpen size={18} />
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
              <CalendarDays size={18} />
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

        {/* Account Information */}

        <section className="profile-card">
          <div className="profile-card__header">
            <div>
              <span>الحساب</span>
              <h2>معلومات الحساب</h2>
            </div>

            <User size={21} />
          </div>

          <div className="profile-row">
            <div className="profile-row__icon">
              <User size={18} />
            </div>

            <div className="profile-row__content">
              <span>نوع الحساب</span>
              <strong>طالب</strong>
            </div>
          </div>

          <div className="profile-row">
            <div className="profile-row__icon">
              <Bell size={18} />
            </div>

            <div className="profile-row__content">
              <span>الإشعارات</span>

              <strong className="profile-status">
                مفعلة
              </strong>
            </div>
          </div>

          <div className="profile-row">
            <div className="profile-row__icon">
              <CheckCircle2 size={18} />
            </div>

            <div className="profile-row__content">
              <span>حالة الحساب</span>

              <strong className="profile-status">
                {isProfileComplete
                  ? "الملف مكتمل"
                  : "الملف غير مكتمل"}
              </strong>
            </div>
          </div>
        </section>
      </div>

      {/* Profile Completion */}

      {!isProfileComplete && (
        <section className="profile-completion">
          <div className="profile-completion__icon">
            <User size={20} />
          </div>

          <div>
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

      {/* Activity */}

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
            <CalendarDays size={21} />
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

      {/* Edit Profile Modal */}

      {isEditing && (
        <div
          className="profile-modal-backdrop"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget
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
              </div>

              <button
                type="button"
                className="profile-modal__close"
                onClick={closeEditProfile}
                aria-label="إغلاق"
              >
                <X size={18} />
              </button>
            </div>

            <div className="profile-form">
              {/* Name */}

              <label>
                <span>الاسم</span>

                <input
                  type="text"
                  value={formData.name}
                  onChange={(event) =>
                    updateField(
                      "name",
                      event.target.value
                    )
                  }
                  placeholder="اكتب اسمك"
                />
              </label>

              {/* Faculty */}

              <label>
                <span>الكلية</span>

                <select
                  value={formData.faculty}
                  onChange={(event) =>
                    updateFaculty(
                      event.target.value
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

              {/* Program */}

              <label>
                <span>البرنامج</span>

                <select
                  value={formData.program}
                  onChange={(event) =>
                    updateField(
                      "program",
                      event.target.value
                    )
                  }
                  disabled={!formData.faculty}
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
                    )
                  )}
                </select>
              </label>

              {/* Academic Year */}

              <label>
                <span>العام الدراسي</span>

                <select
                  value={formData.academicYear}
                  onChange={(event) =>
                    updateField(
                      "academicYear",
                      event.target.value
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
            </div>

            <div className="profile-modal__footer">
              <button
                type="button"
                className="profile-modal__cancel"
                onClick={closeEditProfile}
              >
                إلغاء
              </button>

              <button
                type="button"
                className="profile-modal__save"
                onClick={saveProfile}
                disabled={
                  !formData.name.trim() ||
                  !formData.faculty ||
                  !formData.program ||
                  !formData.academicYear
                }
              >
                <Save size={16} />
                حفظ البيانات
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}