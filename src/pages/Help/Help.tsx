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

export default function Help() {
  const [search, setSearch] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState("الكل");

  const filteredFaqs = useMemo(() => {
    const value = search.trim().toLowerCase();

    return faqs.filter((faq) => {
      const matchesSearch =
        !value ||
        faq.question.toLowerCase().includes(value) ||
        faq.answer.toLowerCase().includes(value) ||
        faq.category.toLowerCase().includes(value);

      const matchesCategory =
        activeCategory === "الكل" ||
        faq.category === activeCategory;

      return matchesSearch && matchesCategory;
    });
  }, [search, activeCategory]);

  const faqCategories = useMemo(() => {
    return ["الكل", ...new Set(faqs.map((faq) => faq.category))];
  }, []);

  const clearSearch = () => {
    setSearch("");
    setOpenFaq(null);
  };

  return (
    <main className="page-shell help-page" dir="rtl">
      {/* Hero */}
      <section className="page-hero help-hero">
        <div>
          <span className="page-kicker">الدعم والمساعدة</span>

          <h1>مركز المساعدة</h1>

          <p>
            ماذا تحتاج اليوم؟ ابحث عن إجابتك أو اختر نوع
            المساعدة التي تحتاجها.
          </p>
        </div>

        <div className="page-hero__icon">
          <MessageSquareWarning size={30} />
        </div>
      </section>

      {/* Search */}
      <section className="help-search-wrapper">
        <div className="page-search help-search">
          <Search size={19} />

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
            >
              <X size={16} />
            </button>
          )}
        </div>

        {search && (
          <span className="help-search-result">
            {filteredFaqs.length} نتيجة
          </span>
        )}
      </section>

      {/* Help Categories */}
      <section className="content-section help-section">
        <div className="section-title-row">
          <div>
            <span className="page-kicker">اختر ما يناسبك</span>
            <h2>كيف يمكننا مساعدتك؟</h2>
          </div>
        </div>

        <div className="help-grid">
          {helpCategories.map((category) => {
            const Icon =
              icons[category.icon as keyof typeof icons] ??
              Building2;

            return (
              <Link
                to={`/requests/new?category=${category.id}`}
                className="help-card"
                key={category.id}
              >
                <div
                  className={`help-card__icon help-card__icon--${category.color}`}
                >
                  <Icon size={23} />
                </div>

                <div className="help-card__content">
                  <h3>{category.title}</h3>

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

            <h2>
              {search
                ? "نتائج البحث"
                : "ربما تجد إجابتك هنا"}
            </h2>
          </div>

          <span className="help-faq-count">
            {filteredFaqs.length} سؤال
          </span>
        </div>

        {/* FAQ Categories */}
        <div className="faq-filters">
          {faqCategories.map((category) => {
            const isActive = activeCategory === category;

            return (
              <button
                type="button"
                key={category}
                className={`faq-filter ${
                  isActive ? "faq-filter--active" : ""
                }`}
                onClick={() => {
                  setActiveCategory(category);
                  setOpenFaq(null);
                }}
              >
                {category}
              </button>
            );
          })}
        </div>

        {filteredFaqs.length > 0 ? (
          <div className="faq-list">
            {filteredFaqs.map((faq) => {
              const isOpen = openFaq === faq.id;

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
                >
                  <div className="faq-item__question">
                    <span>{faq.question}</span>

                    <ChevronDown
                      size={19}
                      className={
                        isOpen ? "faq-arrow--open" : ""
                      }
                    />
                  </div>

                  <div
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

            <h3>لم نجد إجابة مطابقة</h3>

            <p>
              جرّب استخدام كلمات مختلفة، أو أرسل لنا طلب
              مساعدة وسنساعدك في حل المشكلة.
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
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* Direct Support */}
      <section className="help-support">
        <div>
          <span className="help-support__eyebrow">
            لم تجد ما تبحث عنه؟
          </span>

          <h2>تواصل معنا مباشرة</h2>

          <p>
            يمكنك إرسال طلب مساعدة وسيتولى الفريق المختص
            متابعته معك.
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