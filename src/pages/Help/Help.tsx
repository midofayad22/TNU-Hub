import type { CSSProperties } from "react";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  Building2,
  ChevronDown,
  GraduationCap,
  Laptop,
  Lightbulb,
  MessageSquareWarning,
  Search,
  Users,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";

import { helpCategories } from "../../data/helpCategories";
import { faqs } from "../../data/faqs";

const icons = {
  GraduationCap,
  Laptop,
  Building2,
  Users,
  MessageSquareWarning,
  Lightbulb,
};

function getResultLabel(count: number) {
  if (count === 0) return "لا توجد نتائج";
  if (count === 1) return "نتيجة واحدة";
  if (count === 2) return "نتيجتان";
  if (count >= 3 && count <= 10) return `${count} نتائج`;
  return `${count} نتيجة`;
}

function getQuestionLabel(count: number) {
  if (count === 0) return "لا توجد أسئلة";
  if (count === 1) return "سؤال واحد";
  if (count === 2) return "سؤالان";
  if (count >= 3 && count <= 10) return `${count} أسئلة`;
  return `${count} سؤالًا`;
}

export default function Help() {
  const [search, setSearch] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState("الكل");

  const normalizedSearch = search.trim().toLowerCase();

  const filteredFaqs = useMemo(() => {
    return faqs.filter((faq) => {
      const matchesSearch =
        !normalizedSearch ||
        faq.question.toLowerCase().includes(normalizedSearch) ||
        faq.answer.toLowerCase().includes(normalizedSearch) ||
        faq.category.toLowerCase().includes(normalizedSearch);

      const matchesCategory =
        activeCategory === "الكل" || faq.category === activeCategory;

      return matchesSearch && matchesCategory;
    });
  }, [normalizedSearch, activeCategory]);

  const faqCategories = useMemo(() => {
    return ["الكل", ...new Set(faqs.map((faq) => faq.category))];
  }, []);

  const clearSearch = () => {
    setSearch("");
    setOpenFaq(null);
  };

  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
    setOpenFaq(null);
  };

  return (
    <main className="page-shell help-page" dir="rtl">
      {/* Hero */}
      <section className="page-hero help-hero">
        <div className="help-hero__content">
          <span className="page-kicker">الدعم والمساعدة</span>

          <h1>مركز المساعدة</h1>

          <p>
            ماذا تحتاج اليوم؟ ابحث عن إجابتك أو اختر نوع المساعدة
            التي تحتاجها وسنساعدك في الوصول للحل المناسب.
          </p>

          <div className="help-hero__meta">
            <span>
              <MessageSquareWarning size={15} />
              {faqs.length} سؤالًا شائعًا
            </span>

            <span>
              <Lightbulb size={15} />
              {helpCategories.length} أقسام للمساعدة
            </span>
          </div>
        </div>

        <div className="page-hero__icon help-hero__icon">
          <MessageSquareWarning size={30} />
        </div>
      </section>

      {/* Search */}
      <section className="help-search-wrapper">
        <div className="page-search help-search">
          <Search size={19} className="help-search__icon" />

          <input
            type="search"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setOpenFaq(null);
            }}
            placeholder="ابحث عن سؤال أو مشكلة..."
            aria-label="البحث في مركز المساعدة"
          />

          {search && (
            <button
              type="button"
              className="help-search__clear"
              onClick={clearSearch}
              aria-label="مسح البحث"
              title="مسح البحث"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {search && (
          <span className="help-search-result" aria-live="polite">
            {getResultLabel(filteredFaqs.length)}
          </span>
        )}
      </section>

      {/* Help Categories */}
      <section className="content-section help-section">
        <div className="section-title-row">
          <div>
            <span className="page-kicker">اختر ما يناسبك</span>
            <h2>كيف يمكننا مساعدتك؟</h2>
            <p className="help-section__description">
              اختر القسم الأقرب لمشكلتك وسنوجّهك إلى نموذج الطلب المناسب.
            </p>
          </div>
        </div>

        <div className="help-grid">
          {helpCategories.map((category, index) => {
            const Icon =
              icons[category.icon as keyof typeof icons] ?? Building2;

            return (
              <Link
                to={`/requests/new?category=${category.id}`}
                className="help-card"
                key={category.id}
                style={{
                  "--help-index": index,
                } as CSSProperties}
              >
                <div
                  className={`help-card__icon help-card__icon--${category.color}`}
                >
                  <Icon size={23} />
                </div>

                <div className="help-card__content">
                  <div className="help-card__heading">
                    <h3>{category.title}</h3>
                    <span className="help-card__number">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </div>

                  <p>{category.description}</p>

                  <span className="help-card__action">
                    إرسال طلب
                    <ArrowLeft size={15} />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* FAQ */}
      <section className="content-section help-faq-section">
        <div className="section-title-row">
          <div>
            <span className="page-kicker">أسئلة شائعة</span>

            <h2>{search ? "نتائج البحث" : "ربما تجد إجابتك هنا"}</h2>

            <p className="help-section__description">
              تصفح الأسئلة الأكثر شيوعًا أو استخدم البحث للوصول إلى
              إجابة محددة.
            </p>
          </div>

          <span className="help-faq-count">
            {getQuestionLabel(filteredFaqs.length)}
          </span>
        </div>

        {/* FAQ Categories */}
        <div className="faq-filters" role="tablist" aria-label="تصنيفات الأسئلة">
          {faqCategories.map((category) => {
            const isActive = activeCategory === category;

            return (
              <button
                type="button"
                key={category}
                className={`faq-filter ${
                  isActive ? "faq-filter--active" : ""
                }`}
                onClick={() => handleCategoryChange(category)}
                aria-selected={isActive}
                role="tab"
              >
                {category}
              </button>
            );
          })}
        </div>

        {filteredFaqs.length > 0 ? (
          <div className="faq-list">
            {filteredFaqs.map((faq, index) => {
              const isOpen = openFaq === faq.id;
              const answerId = `faq-answer-${faq.id}`;

              return (
                <button
                  type="button"
                  className={`faq-item ${
                    isOpen ? "faq-item--open" : ""
                  }`}
                  key={faq.id}
                  onClick={() =>
                    setOpenFaq(isOpen ? null : faq.id)
                  }
                  aria-expanded={isOpen}
                  aria-controls={answerId}
                  style={{
                    "--faq-index": index,
                  } as React.CSSProperties}
                >
                  <div className="faq-item__question">
                    <span className="faq-item__question-number">
                      {String(index + 1).padStart(2, "0")}
                    </span>

                    <span className="faq-item__question-text">
                      {faq.question}
                    </span>

                    <span className="faq-item__toggle">
                      <ChevronDown
                        size={18}
                        className={
                          isOpen ? "faq-arrow--open" : ""
                        }
                      />
                    </span>
                  </div>

                  <div
                    id={answerId}
                    className={`faq-item__answer-wrapper ${
                      isOpen
                        ? "faq-item__answer-wrapper--open"
                        : ""
                    }`}
                  >
                    <p className="faq-item__answer">
                      {faq.answer}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="help-empty">
            <div className="help-empty__icon">
              <Search size={24} />
            </div>

            <span className="help-empty__eyebrow">
              لا توجد مطابقة
            </span>

            <h3>لم نجد إجابة مطابقة</h3>

            <p>
              جرّب استخدام كلمات مختلفة، أو أرسل لنا طلب مساعدة
              وسنساعدك في حل المشكلة.
            </p>

            <div className="help-empty__actions">
              <button
                type="button"
                className="button button--secondary"
                onClick={clearSearch}
              >
                مسح البحث
              </button>

              <Link
                to="/requests/new"
                className="button button--primary"
              >
                إرسال طلب مساعدة
                <ArrowLeft size={16} />
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* Direct Support */}
      <section className="help-support">
        <div className="help-support__content">
          <span className="help-support__eyebrow">
            لم تجد ما تبحث عنه؟
          </span>

          <h2>تواصل معنا مباشرة</h2>

          <p>
            يمكنك إرسال طلب مساعدة وسيتولى الفريق المختص
            متابعته معك حتى الوصول إلى الحل المناسب.
          </p>
        </div>

        <Link
          to="/requests/new"
          className="help-support__button"
        >
          إنشاء طلب
          <ArrowLeft size={17} />
        </Link>
      </section>
    </main>
  );
}