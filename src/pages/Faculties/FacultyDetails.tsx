import {
  ArrowRight,
  BookOpen,
  Building2,
  CheckCircle2,
  GraduationCap,
  Loader2,
} from "lucide-react";

import {
  Link,
  useParams,
} from "react-router-dom";

import { useEffect, useState } from "react";

import { supabase } from "../../lib/supabase";

interface Faculty {
  id: string;
  name: string;
  description: string;
  icon: string;
}

interface Program {
  id: string;
  faculty_id: string;
  name: string;
  description: string;
}

export default function FacultyDetails() {
  const { id } = useParams();

  const [faculty, setFaculty] =
    useState<Faculty | null>(null);

  const [programs, setPrograms] =
    useState<Program[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    const loadFacultyDetails = async () => {
      if (!id) {
        setError("معرّف الكلية غير موجود.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const {
          data: facultyData,
          error: facultyError,
        } = await supabase
          .from("faculties")
          .select(
            "id, name, description, icon"
          )
          .eq("id", id)
          .maybeSingle();

        if (facultyError) {
          throw facultyError;
        }

        if (!facultyData) {
          setFaculty(null);
          setPrograms([]);
          setLoading(false);
          return;
        }

        const {
          data: programsData,
          error: programsError,
        } = await supabase
          .from("programs")
          .select(
            "id, faculty_id, name, description"
          )
          .eq("faculty_id", id)
          .order("name", {
            ascending: true,
          });

        if (programsError) {
          throw programsError;
        }

        setFaculty(facultyData);
        setPrograms(programsData ?? []);
      } catch (err) {
        console.error(
          "Failed to load faculty details:",
          err
        );

        setError(
          "حدث خطأ أثناء تحميل بيانات الكلية. حاول مرة أخرى."
        );
      } finally {
        setLoading(false);
      }
    };

    void loadFacultyDetails();
  }, [id]);

  /* Loading */
  if (loading) {
    return (
      <main
        className="page-shell academic-page"
        dir="rtl"
      >
        <section className="academic-loading">
          <div className="academic-loading__icon">
            <Loader2
              size={30}
              aria-hidden="true"
            />
          </div>

          <h1>
            جاري تحميل بيانات الكلية
          </h1>

          <p>
            يتم الآن تحميل الكلية والبرامج
            الأكاديمية المتاحة...
          </p>
        </section>
      </main>
    );
  }

  /* Error */
  if (error) {
    return (
      <main
        className="page-shell academic-page"
        dir="rtl"
      >
        <div className="academic-details-empty">
          <div className="academic-details-empty__icon">
            <Building2
              size={32}
              aria-hidden="true"
            />
          </div>

          <span className="academic-kicker">
            الكليات والبرامج
          </span>

          <h1>
            تعذر تحميل بيانات الكلية
          </h1>

          <p>{error}</p>

          <Link
            to="/faculties"
            className="button button--primary"
          >
            <ArrowRight
              size={17}
              aria-hidden="true"
            />

            العودة إلى الكليات
          </Link>
        </div>
      </main>
    );
  }

  /* Faculty not found */
  if (!faculty) {
    return (
      <main
        className="page-shell academic-page"
        dir="rtl"
      >
        <div className="academic-details-empty">
          <div className="academic-details-empty__icon">
            <Building2
              size={32}
              aria-hidden="true"
            />
          </div>

          <span className="academic-kicker">
            الكليات والبرامج
          </span>

          <h1>
            الكلية غير موجودة
          </h1>

          <p>
            لم نتمكن من العثور على الكلية التي
            تبحث عنها. ربما تم تغيير الرابط أو
            أن الكلية غير متاحة حاليًا.
          </p>

          <Link
            to="/faculties"
            className="button button--primary"
          >
            <ArrowRight
              size={17}
              aria-hidden="true"
            />

            العودة إلى الكليات
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main
      className="page-shell academic-page faculty-details-page"
      dir="rtl"
    >
      {/* Back */}
      <Link
        to="/faculties"
        className="back-link faculty-details__back"
      >
        <ArrowRight
          size={17}
          aria-hidden="true"
        />

        العودة إلى الكليات
      </Link>

      {/* Faculty Hero */}
      <section className="faculty-details-hero">
        <div className="faculty-details-hero__icon">
          <span aria-hidden="true">
            {faculty.icon}
          </span>
        </div>

        <div className="faculty-details-hero__content">
          <span className="page-kicker">
            الكليات والبرامج
          </span>

          <h1>{faculty.name}</h1>

          <p>
            {faculty.description}
          </p>

          <div className="faculty-details-hero__stats">
            <div>
              <strong>
                {programs.length}
              </strong>

              <span>
                {programs.length === 1
                  ? "برنامج أكاديمي"
                  : "برامج أكاديمية"}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Programs */}
      <section className="content-section academic-programs-section">
        <div className="section-title-row">
          <div>
            <span className="page-kicker">
              البرامج الأكاديمية
            </span>

            <h2>
              البرامج المتاحة
            </h2>

            <p>
              تعرّف على البرامج والتخصصات
              المتاحة داخل {faculty.name}.
            </p>
          </div>

          <div className="academic-program-count">
            <BookOpen
              size={17}
              aria-hidden="true"
            />

            <span>
              {programs.length}{" "}
              {programs.length === 1
                ? "برنامج"
                : "برامج"}
            </span>
          </div>
        </div>

        {programs.length > 0 ? (
          <div className="program-grid">
            {programs.map(
              (program, index) => (
                <article
                  className="program-card"
                  key={program.id}
                  style={
                    {
                      "--program-index": index,
                    } as React.CSSProperties
                  }
                >
                  <div className="program-card__top">
                    <div className="program-card__icon">
                      <GraduationCap
                        size={22}
                        aria-hidden="true"
                      />
                    </div>

                    <span className="program-card__number">
                      {String(index + 1).padStart(
                        2,
                        "0"
                      )}
                    </span>
                  </div>

                  <div className="program-card__content">
                    <span>
                      برنامج أكاديمي
                    </span>

                    <h3>
                      {program.name}
                    </h3>

                    <p>
                      {program.description}
                    </p>
                  </div>

                  <div className="program-card__footer">
                    <span>
                      برنامج متاح
                    </span>

                    <CheckCircle2
                      size={19}
                      aria-hidden="true"
                    />
                  </div>
                </article>
              )
            )}
          </div>
        ) : (
          <div className="academic-empty">
            <div className="academic-empty__icon">
              <BookOpen
                size={26}
                aria-hidden="true"
              />
            </div>

            <h2>
              لا توجد برامج متاحة حاليًا
            </h2>

            <p>
              لم تتم إضافة برامج أكاديمية لهذه
              الكلية حتى الآن.
            </p>
          </div>
        )}
      </section>

      {/* Information */}
      <section className="academic-info-box">
        <div className="academic-info-box__icon">
          <BookOpen
            size={24}
            aria-hidden="true"
          />
        </div>

        <div>
          <span>
            دليل أكاديمي
          </span>

          <h2>
            استكشف البرنامج المناسب لك
          </h2>

          <p>
            يمكنك استكشاف البرامج المتاحة داخل
            الكلية والتعرف على المجالات
            الأكاديمية المختلفة لمساعدتك في فهم
            الخيارات المتاحة أمامك.
          </p>
        </div>
      </section>
    </main>
  );
}