import {
  ArrowRight,
  BookOpen,
  Building2,
  CheckCircle2,
  GraduationCap,
} from "lucide-react";

import {
  Link,
  useParams,
} from "react-router-dom";

import { type CSSProperties } from "react";

import { faculties } from "../../data/faculties";
export default function FacultyDetails() {
  const { id } = useParams();

  const faculty = faculties.find(
    (item) => item.id === id
  );

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

          <h1>الكلية غير موجودة</h1>

          <p>
            لم نتمكن من العثور على الكلية التي تبحث
            عنها. ربما تم تغيير الرابط أو أن الكلية
            غير متاحة حاليًا.
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

          <p>{faculty.description}</p>

          <div className="faculty-details-hero__stats">
            <div>
              <strong>
                {faculty.programs.length}
              </strong>

              <span>
                {faculty.programs.length === 1
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

            <h2>البرامج المتاحة</h2>

            <p>
              تعرّف على البرامج والتخصصات المتاحة
              داخل {faculty.name}.
            </p>
          </div>

          <div className="academic-program-count">
            <BookOpen
              size={17}
              aria-hidden="true"
            />

            <span>
              {faculty.programs.length}{" "}
              {faculty.programs.length === 1
                ? "برنامج"
                : "برامج"}
            </span>
          </div>
        </div>

        <div className="program-grid">
          {faculty.programs.map(
            (program, index) => (
              <article
                className="program-card"
                key={program.id}
                style={
                  {
                    "--program-index": index,
                  } as CSSProperties
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
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>

                <div className="program-card__content">
                  <span>
                    برنامج أكاديمي
                  </span>

                  <h3>{program.name}</h3>

                  <p>
                    {program.description}
                  </p>
                </div>

                <div className="program-card__footer">
                  <span>برنامج متاح</span>

                  <CheckCircle2
                    size={19}
                    aria-hidden="true"
                  />
                </div>
              </article>
            )
          )}
        </div>
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
          <span>دليل أكاديمي</span>

          <h2>
            استكشف البرنامج المناسب لك
          </h2>

          <p>
            يمكنك استكشاف البرامج المتاحة داخل
            الكلية والتعرف على المجالات الأكاديمية
            المختلفة لمساعدتك في فهم الخيارات
            المتاحة أمامك.
          </p>
        </div>
      </section>
    </main>
  );
}