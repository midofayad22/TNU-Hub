import { useMemo, useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  Building2,
  ChevronLeft,
  Search,
} from "lucide-react";
import { Link } from "react-router-dom";

import { faculties } from "../../data/faculties";

export default function Faculties() {
  const [search, setSearch] = useState("");

  const filteredFaculties = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) {
      return faculties;
    }

    return faculties.filter((faculty) => {
      const facultyMatch = faculty.name
        .toLowerCase()
        .includes(value);

      const programMatch = faculty.programs.some((program) =>
        program.name.toLowerCase().includes(value)
      );

      return facultyMatch || programMatch;
    });
  }, [search]);

  return (
    <div className="academic-page" dir="rtl">
      {/* Header */}
      <section className="academic-hero">
        <div className="academic-hero__content">
          <span className="academic-kicker">
            الهيكل الأكاديمي
          </span>

          <h1>الكليات والبرامج</h1>

          <p>
            استكشف كليات الجامعة والبرامج الأكاديمية
            والتخصصات المتاحة للطلاب.
          </p>
        </div>

        <div className="academic-hero__icon">
          <Building2 size={30} />
        </div>
      </section>

      {/* Search */}
      <section className="academic-toolbar">
        <div className="academic-search">
          <Search size={19} />

          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="ابحث عن كلية أو برنامج..."
            aria-label="البحث عن كلية أو برنامج"
          />
        </div>

        <span className="academic-count">
          {filteredFaculties.length} كليات
        </span>
      </section>

      {/* Faculties */}
      <section className="faculty-grid">
        {filteredFaculties.map((faculty) => (
          <Link
            key={faculty.id}
            to={`/faculties/${faculty.id}`}
            className="faculty-card"
          >
            <div className="faculty-card__top">
              <div className="faculty-card__icon">
                {faculty.icon}
              </div>

              <ChevronLeft size={18} />
            </div>

            <div className="faculty-card__body">
              <h2>{faculty.name}</h2>

              <p>{faculty.description}</p>
            </div>

            <div className="faculty-card__footer">
              <div>
                <BookOpen size={15} />

                <span>
                  {faculty.programs.length}{" "}
                  {faculty.programs.length === 1
                    ? "برنامج"
                    : "برامج"}
                </span>
              </div>

              <span className="faculty-card__explore">
                عرض البرامج
                <ArrowLeft size={14} />
              </span>
            </div>
          </Link>
        ))}
      </section>

      {/* Empty State */}
      {filteredFaculties.length === 0 && (
        <div className="academic-empty">
          <Search size={28} />

          <h2>لم يتم العثور على نتائج</h2>

          <p>
            جرّب البحث باسم كلية أو برنامج آخر.
          </p>

          <button
            type="button"
            onClick={() => setSearch("")}
          >
            عرض جميع الكليات
          </button>
        </div>
      )}
    </div>
  );
}