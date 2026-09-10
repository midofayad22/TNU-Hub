import {
  AlertCircle,
  CheckCircle2,
  GraduationCap,
  Loader2,
  Mail,
  RefreshCw,
  Search,
  User,
  Users,
  X,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";

interface Student {
  id: string;
  full_name: string | null;
  email: string | null;
  faculty: string | null;
  program: string | null;
  academic_year: string | null;
  created_at: string | null;
}

export default function AdminStudents() {
  const { profile } = useAuth();

  const [students, setStudents] =
    useState<Student[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [selectedStudent, setSelectedStudent] =
    useState<Student | null>(null);

  /*
   * =========================================
   * ROOT ADMIN ONLY
   * =========================================
   *
   * إدارة الطلاب مختلفة عن باقي أقسام الإدارة.
   *
   * لا تعتمد على admin_permissions.
   *
   * الطلاب يمكن إدارتهم ومراجعة بياناتهم
   * بواسطة Root Admin فقط.
   */
  const isRootAdmin =
    profile?.role === "root_admin";

  /*
   * =========================================
   * LOAD STUDENTS
   * =========================================
   *
   * مصدر البيانات الوحيد هنا هو:
   *
   * public.profiles
   *
   * وبالتالي أي بيانات يقوم الطالب بتعديلها
   * من Profile.tsx ستظهر هنا تلقائيًا بعد التحديث.
   */
  const loadStudents = useCallback(
    async () => {
      if (!isRootAdmin) {
        return;
      }

      setLoading(true);
      setError("");
      setSuccess("");

      try {
        const {
          data,
          error: studentsError,
        } = await supabase
          .from("profiles")
          .select(
            "id, full_name, email, faculty, program, academic_year, created_at",
          )
          .eq("role", "student")
          .order("created_at", {
            ascending: false,
          });

        if (studentsError) {
          throw studentsError;
        }

        setStudents(data ?? []);
      } catch (err) {
        console.error(
          "Admin students load error:",
          err,
        );

        setError(
          "تعذر تحميل بيانات الطلاب. حاول مرة أخرى.",
        );
      } finally {
        setLoading(false);
      }
    },
    [isRootAdmin],
  );

  /*
   * =========================================
   * INITIAL LOAD
   * =========================================
   */

  useEffect(() => {
    if (!profile?.id || !isRootAdmin) {
      setLoading(false);
      return;
    }

    void loadStudents();
  }, [
    profile?.id,
    isRootAdmin,
    loadStudents,
  ]);

  /*
   * =========================================
   * SEARCH
   * =========================================
   */

  const filteredStudents = useMemo(() => {
    const normalizedSearch =
      search.trim().toLowerCase();

    if (!normalizedSearch) {
      return students;
    }

    return students.filter(
      (student) => {
        const values = [
          student.full_name,
          student.email,
          student.faculty,
          student.program,
          student.academic_year,
          student.id,
        ];

        return values.some(
          (value) =>
            value
              ?.toLowerCase()
              .includes(normalizedSearch),
        );
      },
    );
  }, [students, search]);

  /*
   * =========================================
   * DATE FORMAT
   * =========================================
   */

  const formatDate = (
    date: string | null,
  ) => {
    if (!date) {
      return "—";
    }

    return new Intl.DateTimeFormat(
      "ar-EG",
      {
        year: "numeric",
        month: "short",
        day: "numeric",
      },
    ).format(new Date(date));
  };

  /*
   * =========================================
   * PROFILE COMPLETION
   * =========================================
   */

  const getStudentCompletion = (
    student: Student,
  ) => {
    const fields = [
      student.full_name,
      student.email,
      student.faculty,
      student.program,
      student.academic_year,
    ];

    const completed = fields.filter(
      (value) =>
        value?.trim() !== "",
    ).length;

    return Math.round(
      (completed / fields.length) * 100,
    );
  };

  /*
   * =========================================
   * CLOSE STUDENT MODAL
   * =========================================
   */

  const closeStudentDetails = () => {
    setSelectedStudent(null);
  };

  /*
   * =========================================
   * AUTH CHECK
   * =========================================
   */

  if (!profile) {
    return null;
  }

  /*
   * الطلاب Root Admin فقط
   *
   * حتى لو كان المستخدم Admin عادي
   * فلن يستطيع الوصول لهذه الصفحة.
   */
  if (!isRootAdmin) {
    return (
      <div
        className="admin-page"
        dir="rtl"
      >
        <section className="admin-panel admin-panel--empty">
          <div className="admin-empty-state">
            <AlertCircle size={30} />

            <h2>غير مصرح لك</h2>

            <p>
              إدارة الطلاب متاحة لـ Root Admin
              فقط.
            </p>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div
      className="admin-page admin-students-page"
      dir="rtl"
    >
      {/* =========================================
          HEADER
          ========================================= */}

      <section className="admin-page__header">
        <div>
          <span className="admin-page__kicker">
            إدارة المستخدمين
          </span>

          <h1>الطلاب</h1>

          <p>
            عرض ومتابعة بيانات الطلاب
            المسجلين في منصة TNU Hub.
          </p>
        </div>

        <div className="admin-page__header-actions">
          <button
            type="button"
            className="admin-secondary-button"
            onClick={() =>
              void loadStudents()
            }
            disabled={loading}
          >
            <RefreshCw
              size={17}
              className={
                loading
                  ? "admin-spin"
                  : ""
              }
            />

            <span>تحديث</span>
          </button>
        </div>
      </section>

      {/* =========================================
          ERROR
          ========================================= */}

      {error && (
        <div
          className="admin-alert admin-alert--error"
          role="alert"
        >
          <AlertCircle size={18} />

          <span>{error}</span>

          <button
            type="button"
            className="admin-alert__retry"
            onClick={() => {
              setError("");
              void loadStudents();
            }}
          >
            إعادة المحاولة
          </button>
        </div>
      )}

      {/* =========================================
          SUCCESS
          ========================================= */}

      {success && (
        <div
          className="admin-alert admin-alert--success"
          role="status"
        >
          <CheckCircle2 size={18} />

          <span>{success}</span>

          <button
            type="button"
            onClick={() =>
              setSuccess("")
            }
            className="admin-alert__close"
            aria-label="إغلاق"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* =========================================
          STATS
          ========================================= */}

      <section className="admin-stats-grid admin-students-stats">
        <article className="admin-stat-card">
          <div className="admin-stat-card__top">
            <span>الطلاب</span>

            <div className="admin-stat-card__icon">
              <Users size={19} />
            </div>
          </div>

          <div className="admin-stat-card__value">
            {loading
              ? "..."
              : new Intl.NumberFormat(
                  "ar-EG",
                ).format(
                  students.length,
                )}
          </div>

          <div className="admin-stat-card__bottom">
            <span>
              إجمالي الطلاب المسجلين
            </span>
          </div>
        </article>

        <article className="admin-stat-card">
          <div className="admin-stat-card__top">
            <span>الملفات المكتملة</span>

            <div className="admin-stat-card__icon">
              <CheckCircle2 size={19} />
            </div>
          </div>

          <div className="admin-stat-card__value">
            {loading
              ? "..."
              : new Intl.NumberFormat(
                  "ar-EG",
                ).format(
                  students.filter(
                    (student) =>
                      getStudentCompletion(
                        student,
                      ) === 100,
                  ).length,
                )}
          </div>

          <div className="admin-stat-card__bottom">
            <span>
              طلاب أكملوا بياناتهم
            </span>
          </div>
        </article>
      </section>

      {/* =========================================
          STUDENTS
          ========================================= */}

      <section className="admin-dashboard-grid admin-students-grid">
        <div className="admin-panel">
          <div className="admin-panel__header">
            <div>
              <span className="admin-panel__kicker">
                الطلاب
              </span>

              <h2>قائمة الطلاب</h2>
            </div>

            <span className="admin-status admin-status--completed">
              {loading
                ? "..."
                : `${students.length} طالب`}
            </span>
          </div>

          {/* Search */}

          <div className="admin-students-toolbar">
            <div className="admin-search">
              <Search size={17} />

              <input
                type="search"
                placeholder="ابحث بالاسم أو البريد أو الكلية..."
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value,
                  )
                }
              />

              {search && (
                <button
                  type="button"
                  onClick={() =>
                    setSearch("")
                  }
                  aria-label="مسح البحث"
                >
                  <X size={15} />
                </button>
              )}
            </div>
          </div>

          {/* Search result count */}

          {!loading &&
            students.length > 0 && (
              <div className="admin-students-result-count">
                عرض{" "}
                <strong>
                  {filteredStudents.length}
                </strong>{" "}
                من{" "}
                <strong>
                  {students.length}
                </strong>{" "}
                طالب
              </div>
            )}

          {/* Loading */}

          {loading ? (
            <div className="admin-empty-state">
              <Loader2
                size={28}
                className="admin-spin"
              />

              <h2>
                جاري تحميل الطلاب
              </h2>

              <p>
                يتم جلب بيانات الطلاب
                من قاعدة البيانات.
              </p>
            </div>
          ) : filteredStudents.length ===
            0 ? (
            <div className="admin-empty-state">
              <Users size={30} />

              <h2>
                {search
                  ? "لا توجد نتائج"
                  : "لا يوجد طلاب"}
              </h2>

              <p>
                {search
                  ? "جرّب البحث باستخدام بيانات مختلفة."
                  : "لم يتم العثور على أي حسابات طلاب حتى الآن."}
              </p>
            </div>
          ) : (
            <div className="admin-students-list">
              {filteredStudents.map(
                (student) => {
                  const completion =
                    getStudentCompletion(
                      student,
                    );

                  return (
                    <article
                      key={student.id}
                      className="admin-student-item"
                      onClick={() =>
                        setSelectedStudent(
                          student,
                        )
                      }
                      role="button"
                      tabIndex={0}
                      onKeyDown={(event) => {
                        if (
                          event.key ===
                            "Enter" ||
                          event.key ===
                            " "
                        ) {
                          event.preventDefault();

                          setSelectedStudent(
                            student,
                          );
                        }
                      }}
                    >
                      {/* Avatar */}

                      <div className="admin-student-item__icon">
                        {student.full_name
                          ?.trim()
                          ? student.full_name
                              .trim()
                              .charAt(0)
                          : "؟"}
                      </div>

                      {/* Main information */}

                      <div className="admin-student-item__content">
                        <strong>
                          {student.full_name?.trim() ||
                            "بدون اسم"}
                        </strong>

                        <span>
                          {student.email ||
                            "لا يوجد بريد إلكتروني"}
                        </span>

                        <small>
                          {student.faculty ||
                            "الكلية غير محددة"}

                          {" • "}

                          {student.program ||
                            "البرنامج غير محدد"}
                        </small>
                      </div>

                      {/* Meta */}

                      <div className="admin-student-item__meta">
                        <span>
                          {student.academic_year ||
                            "السنة غير محددة"}
                        </span>

                        <small>
                          {formatDate(
                            student.created_at,
                          )}
                        </small>

                        <small>
                          اكتمال {completion}%
                        </small>
                      </div>
                    </article>
                  );
                },
              )}
            </div>
          )}
        </div>
      </section>

      {/* =========================================
          STUDENT DETAILS MODAL
          ========================================= */}

      {selectedStudent && (
        <div
          className="profile-modal-backdrop"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeStudentDetails();
            }
          }}
        >
          <section
            className="profile-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="student-details-title"
          >
            <div className="profile-modal__header">
              <div>
                <span>
                  إدارة الطلاب
                </span>

                <h2 id="student-details-title">
                  بيانات الطالب
                </h2>

                <p>
                  البيانات الحالية المحفوظة
                  في ملف الطالب.
                </p>
              </div>

              <button
                type="button"
                className="profile-modal__close"
                onClick={
                  closeStudentDetails
                }
                aria-label="إغلاق"
              >
                <X size={18} />
              </button>
            </div>

            <div className="admin-student-details">
              {/* Name */}

              <div className="admin-student-detail">
                <div className="admin-student-detail__icon">
                  <User size={18} />
                </div>

                <div>
                  <span>
                    الاسم
                  </span>

                  <strong>
                    {selectedStudent.full_name?.trim() ||
                      "غير محدد"}
                  </strong>
                </div>
              </div>

              {/* Email */}

              <div className="admin-student-detail">
                <div className="admin-student-detail__icon">
                  <Mail size={18} />
                </div>

                <div>
                  <span>
                    البريد الإلكتروني
                  </span>

                  <strong dir="ltr">
                    {selectedStudent.email ||
                      "غير محدد"}
                  </strong>
                </div>
              </div>

              {/* Faculty */}

              <div className="admin-student-detail">
                <div className="admin-student-detail__icon">
                  <GraduationCap
                    size={18}
                  />
                </div>

                <div>
                  <span>
                    الكلية
                  </span>

                  <strong>
                    {selectedStudent.faculty ||
                      "غير محددة"}
                  </strong>
                </div>
              </div>

              {/* Program */}

              <div className="admin-student-detail">
                <div className="admin-student-detail__icon">
                  <GraduationCap
                    size={18}
                  />
                </div>

                <div>
                  <span>
                    البرنامج
                  </span>

                  <strong>
                    {selectedStudent.program ||
                      "غير محدد"}
                  </strong>
                </div>
              </div>

              {/* Academic year */}

              <div className="admin-student-detail">
                <div className="admin-student-detail__icon">
                  <Users size={18} />
                </div>

                <div>
                  <span>
                    العام الدراسي
                  </span>

                  <strong>
                    {selectedStudent.academic_year ||
                      "غير محدد"}
                  </strong>
                </div>
              </div>

              {/* Created */}

              <div className="admin-student-detail">
                <div className="admin-student-detail__icon">
                  <CheckCircle2
                    size={18}
                  />
                </div>

                <div>
                  <span>
                    تاريخ التسجيل
                  </span>

                  <strong>
                    {formatDate(
                      selectedStudent.created_at,
                    )}
                  </strong>
                </div>
              </div>
            </div>

            <div className="profile-modal__footer">
              <button
                type="button"
                className="profile-modal__cancel"
                onClick={
                  closeStudentDetails
                }
              >
                إغلاق
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}