import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  Building2,
  ChevronLeft,
  Loader2,
  Search,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";

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

interface FacultyWithPrograms extends Faculty {
  programs: Program[];
}

export default function Faculties() {
  const [faculties, setFaculties] = useState<
    FacultyWithPrograms[]
  >([]);

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadFaculties = async () => {
      try {
        setLoading(true);
        setError("");

        const { data: facultiesData, error: facultiesError } =
          await supabase
            .from("faculties")
            .select("id, name, description, icon")
            .order("name", { ascending: true });

        if (facultiesError) {
          throw facultiesError;
        }

        const { data: programsData, error: programsError } =
          await supabase
            .from("programs")
            .select("id, faculty_id, name, description")
            .order("name", { ascending: true });

        if (programsError) {
          throw programsError;
        }

        const formattedFaculties: FacultyWithPrograms[] =
          (facultiesData ?? []).map((faculty) => ({
            ...faculty,
            programs: (programsData ?? []).filter(
              (program) =>
                program.faculty_id === faculty.id
            ),
          }));

        setFaculties(formattedFaculties);
      } catch (err) {
        console.error(
          "Failed to load faculties:",
          err
        );

        setError(
          "حدث خطأ أثناء تحميل الكليات والبرامج. حاول مرة أخرى."
        );
      } finally {
        setLoading(false);
      }
    };

    void loadFaculties();
  }, []);

  const filteredFaculties = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) {
      return faculties;
    }

    return faculties.filter((faculty) => {
      const facultyText = [
        faculty.name,
        faculty.description,
      ]
        .join(" ")
        .toLowerCase();

      const programText = faculty.programs
        .map((program) =>
          [
            program.name,
            program.description,
          ].join(" ")
        )
        .join(" ")
        .toLowerCase();

      return (
        facultyText.includes(value) ||
        programText.includes(value)
      );
    });
  }, [search, faculties]);

  const totalPrograms = useMemo(() => {
    return faculties.reduce(
      (total, faculty) =>
        total + faculty.programs.length,
      0
    );
  }, [faculties]);

  const clearSearch = () => {
    setSearch("");
  };

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

          <h1>جاري تحميل الهيكل الأكاديمي</h1>

          <p>
            يتم الآن تحميل الكليات والبرامج المتاحة...
          </p>
        </section>
      </main>
    );
  }

  if (error) {
    return (
      <main
        className="page-shell academic-page"
        dir="rtl"
      >
        <section className="academic-details-empty">
          <div className="academic-details-empty__icon">
            <Building2
              size={32}
              aria-hidden="true"
            />
          </div>

          <span className="academic-kicker">
            الهيكل الأكاديمي
          </span>

          <h1>تعذر تحميل الكليات</h1>

          <p>{error}</p>

          <button
            type="button"
            className="button button--primary"
            onClick={() =>
              window.location.reload()
            }
          >
            إعادة المحاولة
          </button>
        </section>
      </main>
    );
  }

  return (
    <main
      className="page-shell academic-page"
      dir="rtl"
    >
      {/* Hero */}
      <section className="academic-hero">
        <div className="academic-hero__content">
          <span className="academic-kicker">
            الهيكل الأكاديمي
          </span>

          <h1>الكليات والبرامج</h1>

          <p>
            استكشف كليات الجامعة والبرامج الأكاديمية
            والتخصصات المتاحة للطلاب، واعثر على المجال
            الذي يناسب اهتماماتك وطموحاتك.
          </p>

          <div className="academic-hero__stats">
            <div className="academic-hero__stat">
              <strong>{faculties.length}</strong>

              <span>كلية</span>
            </div>

            <div className="academic-hero__stat-divider" />

            <div className="academic-hero__stat">
              <strong>{totalPrograms}</strong>

              <span>برنامج أكاديمي</span>
            </div>
          </div>
        </div>

        <div className="academic-hero__icon">
          <Building2
            size={32}
            aria-hidden="true"
          />
        </div>
      </section>

      {/* Search */}
      <section className="academic-toolbar">
        <div className="academic-search">
          <Search
            className="academic-search__icon"
            size={19}
            aria-hidden="true"
          />

          <input
            type="search"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="ابحث عن كلية أو برنامج أو تخصص..."
            aria-label="البحث عن كلية أو برنامج"
            autoComplete="off"
          />

          {search && (
            <button
              type="button"
              className="academic-search__clear"
              onClick={clearSearch}
              aria-label="مسح البحث"
            >
              <X
                size={16}
                aria-hidden="true"
              />
            </button>
          )}
        </div>

        <div
          className="academic-count"
          aria-live="polite"
        >
          <strong>
            {filteredFaculties.length}
          </strong>

          <span>
            {filteredFaculties.length === 1
              ? "كلية"
              : "كليات"}
          </span>
        </div>
      </section>

      {/* Section heading */}
      <section className="academic-content">
        <div className="section-heading">
          <div>
            <span className="section-heading__eyebrow">
              استكشف الهيكل الأكاديمي
            </span>

            <h2>
              {search.trim()
                ? `نتائج البحث عن "${search.trim()}"`
                : "كليات جامعة طنطا"}
            </h2>
          </div>
        </div>

        {/* Faculties */}
        {filteredFaculties.length > 0 ? (
          <div className="faculty-grid">
            {filteredFaculties.map(
              (faculty, index) => (
                <Link
                  key={faculty.id}
                  to={`/faculties/${faculty.id}`}
                  className="faculty-card"
                  style={
                    {
                      "--faculty-index": index,
                    } as React.CSSProperties
                  }
                >
                  <div className="faculty-card__top">
                    <div className="faculty-card__icon">
                      <span aria-hidden="true">
                        {faculty.icon}
                      </span>
                    </div>

                    <div className="faculty-card__arrow">
                      <ChevronLeft
                        size={18}
                        aria-hidden="true"
                      />
                    </div>
                  </div>

                  <div className="faculty-card__body">
                    <span className="faculty-card__eyebrow">
                      كلية أكاديمية
                    </span>

                    <h2>{faculty.name}</h2>

                    <p>
                      {faculty.description}
                    </p>
                  </div>

                  <div className="faculty-card__footer">
                    <div className="faculty-card__programs">
                      <BookOpen
                        size={15}
                        aria-hidden="true"
                      />

                      <span>
                        {faculty.programs.length}{" "}
                        {faculty.programs.length === 1
                          ? "برنامج"
                          : "برامج"}
                      </span>
                    </div>

                    <span className="faculty-card__explore">
                      عرض البرامج

                      <ArrowLeft
                        size={14}
                        aria-hidden="true"
                      />
                    </span>
                  </div>
                </Link>
              )
            )}
          </div>
        ) : (
          <div className="academic-empty">
            <div className="academic-empty__icon">
              <Search
                size={26}
                aria-hidden="true"
              />
            </div>

            <h2>لم يتم العثور على نتائج</h2>

            <p>
              لم نجد كلية أو برنامجًا يطابق بحثك.
              جرّب استخدام كلمة مختلفة.
            </p>

            <button
              type="button"
              onClick={clearSearch}
            >
              عرض جميع الكليات
            </button>
          </div>
        )}
      </section>
    </main>
  );
}