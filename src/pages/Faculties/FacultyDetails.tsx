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

import { faculties } from "../../data/faculties";

export default function FacultyDetails() {
  const { id } = useParams();

  const faculty = faculties.find(
    (item) => item.id === id
  );

  if (!faculty) {
    return (
      <div
        className="page-shell"
        dir="rtl"
      >
        <div className="empty-state">

          <Building2 size={34} />

          <h1>
            الكلية غير موجودة
          </h1>

          <p>
            لم نتمكن من العثور على الكلية
            التي تبحث عنها.
          </p>

          <Link
            to="/faculties"
            className="primary-button"
          >
            العودة إلى الكليات
          </Link>

        </div>
      </div>
    );
  }

  return (
    <div
      className="page-shell academic-page"
      dir="rtl"
    >

      {/* =========================
          BACK
          ========================= */}

      <Link
        to="/faculties"
        className="back-link"
      >
        <ArrowRight size={17} />

        العودة إلى الكليات
      </Link>


      {/* =========================
          HERO
          ========================= */}

      <section className="faculty-details-hero">

        <div className="faculty-details-hero__icon">
          {faculty.icon}
        </div>

        <div>

          <span className="page-kicker">
            الكليات والبرامج
          </span>

          <h1>
            {faculty.name}
          </h1>

          <p>
            {faculty.description}
          </p>

        </div>

      </section>


      {/* =========================
          PROGRAMS
          ========================= */}

      <section className="content-section">

        <div className="section-title-row">

          <div>

            <span className="page-kicker">
              البرامج الأكاديمية
            </span>

            <h2>
              البرامج المتاحة
            </h2>

          </div>

          <div className="academic-program-count">
            <BookOpen size={17} />

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
            (program) => (
              <article
                className="program-card"
                key={program.id}
              >

                <div className="program-card__icon">
                  <GraduationCap
                    size={22}
                  />
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

                <CheckCircle2
                  size={20}
                />

              </article>
            )
          )}

        </div>

      </section>


      {/* =========================
          INFO
          ========================= */}

      <section className="academic-info-box">

        <div className="academic-info-box__icon">
          <BookOpen size={24} />
        </div>

        <div>

          <h2>
            عن البرامج الأكاديمية
          </h2>

          <p>
            يمكنك استكشاف البرامج المتاحة
            والتعرف على المجال الأكاديمي
            الذي يناسب اهتماماتك وخططك
            المستقبلية.
          </p>

        </div>

      </section>

    </div>
  );
}