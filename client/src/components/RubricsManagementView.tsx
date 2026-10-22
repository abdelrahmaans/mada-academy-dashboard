import { useState, useMemo, type FormEvent } from "react";
import {
  Award,
  BookOpen,
  Check,
  CheckCircle2,
  Copy,
  Edit3,
  Eye,
  Layers,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  rubricStorage,
  type DisciplineRubric,
  type RubricCriterion,
} from "@/lib/apiClient";

const TRACK_OPTIONS: Array<{ key: DisciplineRubric["trackKey"] | "all"; label: string }> = [
  { key: "all", label: "جميع التخصصات والمسارات" },
  { key: "robotics", label: "روبوتكس وميكاترونكس" },
  { key: "coding", label: "برمجة وتطوير ألعاب" },
  { key: "circuits", label: "دوائر إلكترونية وأنظمة مدمجة" },
  { key: "sports_swimming", label: "سباحة ورياضات مائية" },
  { key: "soft_skills", label: "مهارات قيادية وشخصية" },
  { key: "general", label: "التقييم الأكاديمي العام" },
];

const CATEGORY_OPTIONS: Array<{ key: RubricCriterion["category"]; label: string }> = [
  { key: "TECHNICAL", label: "مهارة فنية / تكنيك" },
  { key: "PRACTICAL", label: "تطبيق وممارسة عملية" },
  { key: "PHYSICAL", label: "لياقة وتوافق حركي" },
  { key: "BEHAVIORAL", label: "سلوك وانضباط" },
  { key: "CREATIVE", label: "إبداع وتفكير تحليلي" },
];

export default function RubricsManagementView() {
  const [rubrics, setRubrics] = useState<DisciplineRubric[]>(() => rubricStorage.getRubrics());
  const [selectedTrack, setSelectedTrack] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [editorModalOpen, setEditorModalOpen] = useState(false);
  const [previewModalRubric, setPreviewModalRubric] = useState<DisciplineRubric | null>(null);
  const [editingRubricId, setEditingRubricId] = useState<string | null>(null);

  // Form State for Create/Edit
  const [formData, setFormData] = useState<{
    trackKey: DisciplineRubric["trackKey"];
    trackLabel: string;
    title: string;
    description: string;
    scaleMax: number;
    isDefault: boolean;
    criteria: RubricCriterion[];
  }>({
    trackKey: "robotics",
    trackLabel: "روبوتكس وميكاترونكس",
    title: "",
    description: "",
    scaleMax: 5,
    isDefault: true,
    criteria: [
      {
        id: "c1",
        key: "tech_skill",
        label: "المهارة الفنية الأساسية",
        category: "TECHNICAL",
        categoryLabel: "مهارة فنية",
        maxScore: 5,
        weightPercent: 35,
        hint: "إتقان المفاهيم والخطوات الفنية المحددة للحصة.",
      },
      {
        id: "c2",
        key: "practical_app",
        label: "التطبيق العملي والتنفيذ",
        category: "PRACTICAL",
        categoryLabel: "تطبيق عملي",
        maxScore: 5,
        weightPercent: 35,
        hint: "استخدام الأدوات وإنجاز المهمة بالشكل المطلوب.",
      },
      {
        id: "c3",
        key: "behavior_team",
        label: "الانضباط والمشاركة الإيجابية",
        category: "BEHAVIORAL",
        categoryLabel: "سلوك وانضباط",
        maxScore: 5,
        weightPercent: 30,
        hint: "الالتزام بتوجيهات المدرب والتعاون مع الزملاء.",
      },
    ],
  });

  const reload = () => {
    setRubrics(rubricStorage.getRubrics());
  };

  const totalCriteriaCount = useMemo(
    () => rubrics.reduce((acc, r) => acc + r.criteria.length, 0),
    [rubrics]
  );

  const coveredDisciplinesCount = useMemo(() => {
    const set = new Set(rubrics.map(r => r.trackKey));
    return set.size;
  }, [rubrics]);

  const filteredRubrics = useMemo(() => {
    return rubrics.filter(r => {
      const matchesTrack = selectedTrack === "all" || r.trackKey === selectedTrack;
      const q = search.trim().toLowerCase();
      const matchesQuery =
        !q ||
        r.title.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.trackLabel.toLowerCase().includes(q) ||
        r.criteria.some(c => c.label.toLowerCase().includes(q));
      return matchesTrack && matchesQuery;
    });
  }, [rubrics, selectedTrack, search]);

  const openCreateModal = () => {
    setEditingRubricId(null);
    setFormData({
      trackKey: "robotics",
      trackLabel: "روبوتكس وميكاترونكس",
      title: "",
      description: "",
      scaleMax: 5,
      isDefault: false,
      criteria: [
        {
          id: "c1",
          key: "tech_skill",
          label: "المهارة الفنية والتكنيك",
          category: "TECHNICAL",
          categoryLabel: "مهارة فنية",
          maxScore: 5,
          weightPercent: 35,
          hint: "إتقان المفاهيم والخطوات الفنية المحددة للحصة.",
        },
        {
          id: "c2",
          key: "practical_app",
          label: "التطبيق العملي والتنفيذ",
          category: "PRACTICAL",
          categoryLabel: "تطبيق عملي",
          maxScore: 5,
          weightPercent: 35,
          hint: "استخدام الأدوات وإنجاز المهمة بالشكل المطلوب.",
        },
        {
          id: "c3",
          key: "behavior_team",
          label: "الانضباط والمشاركة الإيجابية",
          category: "BEHAVIORAL",
          categoryLabel: "سلوك وانضباط",
          maxScore: 5,
          weightPercent: 30,
          hint: "الالتزام بتوجيهات المدرب والتعاون مع الزملاء.",
        },
      ],
    });
    setEditorModalOpen(true);
  };

  const openEditModal = (rubric: DisciplineRubric) => {
    setEditingRubricId(rubric.id);
    setFormData({
      trackKey: rubric.trackKey,
      trackLabel: rubric.trackLabel,
      title: rubric.title,
      description: rubric.description,
      scaleMax: rubric.scaleMax,
      isDefault: rubric.isDefault,
      criteria: [...rubric.criteria],
    });
    setEditorModalOpen(true);
  };

  const handleCloneRubric = (rubric: DisciplineRubric) => {
    rubricStorage.createRubric({
      trackKey: rubric.trackKey,
      trackLabel: rubric.trackLabel,
      title: `${rubric.title} (نسخة معدلة)`,
      description: rubric.description,
      scaleMax: rubric.scaleMax,
      criteria: rubric.criteria.map(c => ({ ...c, id: `crt-${Date.now().toString().slice(-4)}-${Math.random().toString().slice(2, 5)}` })),
      isActive: true,
      isDefault: false,
      authorName: "مريم حسن (رئيس المدربين)",
    });
    reload();
    toast.success(`تم نسخ نموذج "${rubric.title}" بنجاح! يمكنك الآن تعديل معاييره.`);
  };

  const handleSetDefault = (id: string, title: string) => {
    rubricStorage.setDefault(id);
    reload();
    toast.success(`تم اعتماد نموذج "${title}" كنموذج افتراضي لهذا التخصص بنجاح.`);
  };

  const handleDeleteRubric = (rubric: DisciplineRubric) => {
    if (rubric.isDefault && rubrics.filter(r => r.trackKey === rubric.trackKey).length > 1) {
      toast.error("لا يمكن حذف النموذج الافتراضي، يرجى اعتماد نموذج آخر كافتراضي أولاً.");
      return;
    }
    if (confirm(`هل أنت متأكد من حذف نموذج التقييم "${rubric.title}"؟`)) {
      rubricStorage.deleteRubric(rubric.id);
      reload();
      toast.info("تم حذف نموذج التقييم بنجاح.");
    }
  };

  const handleAddCriterionRow = () => {
    setFormData(prev => ({
      ...prev,
      criteria: [
        ...prev.criteria,
        {
          id: `c-${Date.now()}`,
          key: `criterion_${prev.criteria.length + 1}`,
          label: "",
          category: "PRACTICAL",
          categoryLabel: "تطبيق وممارسة",
          maxScore: prev.scaleMax,
          weightPercent: 25,
          hint: "",
        },
      ],
    }));
  };

  const handleRemoveCriterionRow = (index: number) => {
    if (formData.criteria.length <= 2) {
      toast.error("يجب أن يحتوي نموذج التقييم على معيارين على الأقل.");
      return;
    }
    setFormData(prev => ({
      ...prev,
      criteria: prev.criteria.filter((_, idx) => idx !== index),
    }));
  };

  const handleFormSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error("يرجى كتابة عنوان نموذج التقييم");
      return;
    }

    const invalidCriterion = formData.criteria.find(c => !c.label.trim());
    if (invalidCriterion) {
      toast.error("يرجى تسمية جميع المعايير في النموذج");
      return;
    }

    const trackOpt = TRACK_OPTIONS.find(t => t.key === formData.trackKey);
    const trackLabel = trackOpt ? trackOpt.label : "تخصص عام";

    if (editingRubricId) {
      const existing = rubrics.find(r => r.id === editingRubricId);
      if (existing) {
        rubricStorage.saveRubric({
          ...existing,
          title: formData.title.trim(),
          description: formData.description.trim() || existing.description,
          trackKey: formData.trackKey,
          trackLabel,
          scaleMax: formData.scaleMax,
          criteria: formData.criteria.map(c => ({
            ...c,
            maxScore: formData.scaleMax,
            key: c.key || c.label.trim().toLowerCase().replace(/\s+/g, "_"),
          })),
          isDefault: formData.isDefault,
        });
        toast.success(`تم تحديث نموذج التقييم "${formData.title}" بنجاح!`);
      }
    } else {
      rubricStorage.createRubric({
        trackKey: formData.trackKey,
        trackLabel,
        title: formData.title.trim(),
        description: formData.description.trim() || `معايير تقييم تخصصية لمسار ${trackLabel}.`,
        scaleMax: formData.scaleMax,
        criteria: formData.criteria.map(c => ({
          ...c,
          maxScore: formData.scaleMax,
          key: c.key || c.label.trim().toLowerCase().replace(/\s+/g, "_"),
        })),
        isActive: true,
        isDefault: formData.isDefault,
        authorName: "مريم حسن (رئيس المدربين)",
      });
      toast.success(`تم إنشاء واعتماد نموذج التقييم الجديد بنجاح!`);
    }

    reload();
    setEditorModalOpen(false);
  };

  return (
    <div className="rubrics-view-container">
      {/* 4 Summary Stats */}
      <div className="rubrics-kpis-grid">
        <div className="rubric-kpi-card kpi-teal">
          <div className="kpi-icon-wrap">
            <Award size={22} />
          </div>
          <div className="kpi-info">
            <span className="kpi-label">نماذج التقييم المعتمدة</span>
            <strong className="kpi-val">{rubrics.length}</strong>
            <small>نماذج جاهزة للتطبيق بالحانات</small>
          </div>
        </div>

        <div className="rubric-kpi-card kpi-blue">
          <div className="kpi-icon-wrap">
            <Layers size={22} />
          </div>
          <div className="kpi-info">
            <span className="kpi-label">إجمالي المعايير التخصصية</span>
            <strong className="kpi-val">{totalCriteriaCount}</strong>
            <small>معايير موزونة حسب التخصص</small>
          </div>
        </div>

        <div className="rubric-kpi-card kpi-purple">
          <div className="kpi-icon-wrap">
            <Sparkles size={22} />
          </div>
          <div className="kpi-info">
            <span className="kpi-label">مسارات وتخصصات مغطاة</span>
            <strong className="kpi-val">{coveredDisciplinesCount}</strong>
            <small>روبوتكس، برمجة، سباحة، مهارات</small>
          </div>
        </div>

        <div className="rubric-kpi-card kpi-amber">
          <div className="kpi-icon-wrap">
            <Star size={22} />
          </div>
          <div className="kpi-info">
            <span className="kpi-label">مقياس التقييم القياسي</span>
            <strong className="kpi-val">5 ★ نجوم</strong>
            <small>مع حساب الأوزان النسبية تلقائياً</small>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="rubrics-toolbar">
        <div className="toolbar-left-group">
          <div className="rubrics-search-box">
            <Search size={16} />
            <input
              type="text"
              placeholder="ابحث باسم النموذج، المعيار أو التخصص..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button className="clear-btn" onClick={() => setSearch("")}>
                <X size={14} />
              </button>
            )}
          </div>

          <div className="track-pill-tabs">
            {TRACK_OPTIONS.map(opt => (
              <button
                key={opt.key}
                type="button"
                className={`track-pill ${selectedTrack === opt.key ? "active" : ""}`}
                onClick={() => setSelectedTrack(opt.key)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          className="button button-primary add-rubric-btn"
          onClick={openCreateModal}
        >
          <Plus size={16} />
          <span>إنشاء نموذج تقييم جديد</span>
        </button>
      </div>

      {/* Rubrics Grid */}
      <div className="rubrics-cards-grid">
        {filteredRubrics.map(rubric => {
          return (
            <article key={rubric.id} className="rubric-card">
              <div className="rubric-card-header">
                <div className="rubric-badges-row">
                  <span className={`rubric-track-badge track-${rubric.trackKey}`}>
                    <BookOpen size={13} /> {rubric.trackLabel}
                  </span>
                  {rubric.isDefault && (
                    <span className="rubric-default-tag">
                      <CheckCircle2 size={12} /> معتمد كافتراضي
                    </span>
                  )}
                  <span className="rubric-scale-badge">
                    مقياس من {rubric.scaleMax} نجوم
                  </span>
                </div>

                <div className="rubric-actions-menu">
                  <button
                    type="button"
                    className="icon-action-btn"
                    title="معاينة استمارة المدرب"
                    onClick={() => setPreviewModalRubric(rubric)}
                  >
                    <Eye size={15} />
                  </button>
                  <button
                    type="button"
                    className="icon-action-btn"
                    title="تعديل النموذج"
                    onClick={() => openEditModal(rubric)}
                  >
                    <Edit3 size={15} />
                  </button>
                  <button
                    type="button"
                    className="icon-action-btn"
                    title="نسخ النموذج"
                    onClick={() => handleCloneRubric(rubric)}
                  >
                    <Copy size={15} />
                  </button>
                  <button
                    type="button"
                    className="icon-action-btn btn-danger"
                    title="حذف النموذج"
                    onClick={() => handleDeleteRubric(rubric)}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              <div className="rubric-title-block">
                <h3>{rubric.title}</h3>
                <p>{rubric.description}</p>
              </div>

              {/* Criteria List */}
              <div className="rubric-criteria-section">
                <div className="criteria-section-title">
                  <span>المعايير المعتمدة ({rubric.criteria.length})</span>
                  <small>الوزن النسبي والحد الأقصى</small>
                </div>

                <div className="criteria-list">
                  {rubric.criteria.map((crit, idx) => (
                    <div key={crit.id || idx} className="criterion-row">
                      <div className="criterion-info">
                        <span className="criterion-number">{idx + 1}</span>
                        <div>
                          <strong>{crit.label}</strong>
                          {crit.hint && <p className="criterion-hint">{crit.hint}</p>}
                        </div>
                      </div>

                      <div className="criterion-meta">
                        <span className={`category-tag cat-${crit.category?.toLowerCase()}`}>
                          {crit.categoryLabel || crit.category}
                        </span>
                        <span className="weight-tag">
                          {crit.maxScore} درجات {crit.weightPercent ? `(${crit.weightPercent}%)` : ""}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rubric-card-footer">
                <span className="author-subtext">
                  <ShieldCheck size={13} /> {rubric.authorName || "رئيس المدربين"} · {rubric.updatedAt.slice(0, 10)}
                </span>

                <div className="footer-buttons">
                  <button
                    type="button"
                    className="btn-text-action"
                    onClick={() => setPreviewModalRubric(rubric)}
                  >
                    <Eye size={13} /> محاكاة تقييم المدرب
                  </button>
                  {!rubric.isDefault && (
                    <button
                      type="button"
                      className="btn-set-default"
                      onClick={() => handleSetDefault(rubric.id, rubric.title)}
                    >
                      <Check size={13} /> تعيين كافتراضي
                    </button>
                  )}
                </div>
              </div>
            </article>
          );
        })}

        {!filteredRubrics.length && (
          <div className="rubrics-empty-state">
            <Award size={36} />
            <h4>لا توجد نماذج تقييم مطابقة للبحث</h4>
            <p>يمكنك إنشاء نموذج تقييم مخصص جديد لهذا المسار وتحديد معاييره بكل سهولة.</p>
            <button
              type="button"
              className="button button-primary"
              onClick={openCreateModal}
            >
              <Plus size={16} /> إنشاء نموذج تقييم الآن
            </button>
          </div>
        )}
      </div>

      {/* Modal 1: Create / Edit Rubric Modal */}
      {editorModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-dialog rubric-editor-modal">
            <div className="modal-header">
              <div>
                <h3>{editingRubricId ? "تعديل نموذج معايير التقييم" : "إنشاء نموذج معايير تقييم تخصصي"}</h3>
                <p>تخصيص بنك المعايير والأوزان النسبية حسب الرياضة أو التخصص الأكاديمي</p>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setEditorModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="rubric-form">
              <div className="form-row-2">
                <div className="form-group">
                  <label>
                    <span>المسار / التخصص الأكاديمي *</span>
                    <select
                      value={formData.trackKey}
                      onChange={e => {
                        const val = e.target.value as DisciplineRubric["trackKey"];
                        const opt = TRACK_OPTIONS.find(t => t.key === val);
                        setFormData({
                          ...formData,
                          trackKey: val,
                          trackLabel: opt ? opt.label : "تخصص عام",
                        });
                      }}
                    >
                      {TRACK_OPTIONS.filter(t => t.key !== "all").map(t => (
                        <option key={t.key} value={t.key}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="form-group">
                  <label>
                    <span>مقياس التقييم لكل معيار</span>
                    <select
                      value={formData.scaleMax}
                      onChange={e =>
                        setFormData({
                          ...formData,
                          scaleMax: Number(e.target.value),
                        })
                      }
                    >
                      <option value={5}>مقياس 5 نجوم (★ 1 إلى 5 - القياسي)</option>
                      <option value={10}>مقياس 10 درجات (1 إلى 10)</option>
                    </select>
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label>
                  <span>عنوان نموذج التقييم *</span>
                  <input
                    type="text"
                    required
                    placeholder="مثال: نموذج تقييم مهارات البرمجة والخوارزميات للمرحلة المتوسطة"
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                  />
                </label>
              </div>

              <div className="form-group">
                <label>
                  <span>وصف النموذج والغرض الأكاديمي منه</span>
                  <textarea
                    rows={2}
                    placeholder="مثال: يركز هذا النموذج على الدقة المنطقية وإتقان الحلقات التكرارية..."
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                  />
                </label>
              </div>

              {/* Dynamic Criteria List */}
              <div className="form-criteria-builder">
                <div className="criteria-builder-header">
                  <div>
                    <strong>معايير التقييم التفصيلية ({formData.criteria.length})</strong>
                    <p>أضف معايير المهارات الفنية، السلوكية، والتطبيقية الخاصة بالرياضة أو المادة</p>
                  </div>
                  <button
                    type="button"
                    className="button button-secondary btn-sm"
                    onClick={handleAddCriterionRow}
                  >
                    <Plus size={14} /> إضافة معيار جديد
                  </button>
                </div>

                <div className="criteria-inputs-list">
                  {formData.criteria.map((crit, index) => (
                    <div key={crit.id || index} className="criterion-input-card">
                      <div className="card-top-row">
                        <span className="card-index-tag">المعيار #{index + 1}</span>
                        <button
                          type="button"
                          className="btn-remove-crit"
                          onClick={() => handleRemoveCriterionRow(index)}
                          title="حذف هذا المعيار"
                        >
                          <X size={15} />
                        </button>
                      </div>

                      <div className="form-row-2">
                        <div className="form-group">
                          <label>
                            <span>اسم المعيار *</span>
                            <input
                              type="text"
                              required
                              placeholder="مثال: دقة حركة الذراعين والانسيابية"
                              value={crit.label}
                              onChange={e => {
                                const updated = [...formData.criteria];
                                updated[index].label = e.target.value;
                                setFormData({ ...formData, criteria: updated });
                              }}
                            />
                          </label>
                        </div>

                        <div className="form-group">
                          <label>
                            <span>تصنيف المعيار</span>
                            <select
                              value={crit.category}
                              onChange={e => {
                                const val = e.target.value as RubricCriterion["category"];
                                const catOpt = CATEGORY_OPTIONS.find(c => c.key === val);
                                const updated = [...formData.criteria];
                                updated[index].category = val;
                                updated[index].categoryLabel = catOpt ? catOpt.label : val;
                                setFormData({ ...formData, criteria: updated });
                              }}
                            >
                              {CATEGORY_OPTIONS.map(c => (
                                <option key={c.key} value={c.key}>
                                  {c.label}
                                </option>
                              ))}
                            </select>
                          </label>
                        </div>
                      </div>

                      <div className="form-row-2">
                        <div className="form-group">
                          <label>
                            <span>الوزن النسبي (%)</span>
                            <input
                              type="number"
                              min={5}
                              max={100}
                              value={crit.weightPercent || 25}
                              onChange={e => {
                                const updated = [...formData.criteria];
                                updated[index].weightPercent = Number(e.target.value);
                                setFormData({ ...formData, criteria: updated });
                              }}
                            />
                          </label>
                        </div>

                        <div className="form-group">
                          <label>
                            <span>إرشادات التقييم للمدرب (Hint)</span>
                            <input
                              type="text"
                              placeholder="مثال: يمنح 5 عند ثبات الجذع والتنفس المنتظم بدون توقف"
                              value={crit.hint}
                              onChange={e => {
                                const updated = [...formData.criteria];
                                updated[index].hint = e.target.value;
                                setFormData({ ...formData, criteria: updated });
                              }}
                            />
                          </label>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="form-checkbox-row">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.isDefault}
                    onChange={e => setFormData({ ...formData, isDefault: e.target.checked })}
                  />
                  <span>اعتماد هذا النموذج كنموذج التقييم الافتراضي لمسار ({formData.trackLabel})</span>
                </label>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={() => setEditorModalOpen(false)}
                >
                  إلغاء
                </button>
                <button type="submit" className="button button-primary">
                  <Check size={16} /> حفظ واعتماد النموذج
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Coach View Simulation Modal */}
      {previewModalRubric && (
        <div className="modal-backdrop">
          <div className="modal-dialog coach-preview-modal">
            <div className="modal-header">
              <div>
                <span className="preview-kicker">
                  <Eye size={14} /> محاكاة استمارة المدرب (Coach Evaluation View)
                </span>
                <h3>{previewModalRubric.title}</h3>
                <p>هكذا تظهر المعايير للمدربين (R04) عند تقييم الطلاب في نهاية الحصة</p>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setPreviewModalRubric(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="coach-preview-body">
              <div className="mock-student-banner">
                <div className="avatar-mock">يع</div>
                <div>
                  <strong>ياسين محمد علي</strong>
                  <span>طالب بمجموعة {previewModalRubric.trackLabel} · جلسة اليوم</span>
                </div>
                <span className="live-pill">جلسة تجريبية</span>
              </div>

              <div className="simulated-rubric-form">
                {previewModalRubric.criteria.map((crit, idx) => (
                  <div key={crit.id || idx} className="simulated-crit-card">
                    <div className="crit-header-row">
                      <div>
                        <strong>{crit.label}</strong>
                        <p>{crit.hint || "تقييم مستوى أداء الطالب في هذا المعيار."}</p>
                      </div>
                      <span className="cat-badge">{crit.categoryLabel || crit.category}</span>
                    </div>

                    <div className="rating-stars-row">
                      {[1, 2, 3, 4, 5].slice(0, previewModalRubric.scaleMax).map(star => (
                        <button
                          key={star}
                          type="button"
                          className={`star-mock-btn ${star <= 4 ? "active" : ""}`}
                        >
                          <Star size={18} fill={star <= 4 ? "#f59e0b" : "none"} />
                          <span>{star}</span>
                        </button>
                      ))}
                      <span className="score-label">4 من {previewModalRubric.scaleMax}</span>
                    </div>
                  </div>
                ))}

                <div className="mock-notes-area">
                  <label>
                    <span>ملاحظات المدرب التوجيهية لولي الأمر ورئيس المدربين:</span>
                    <textarea
                      readOnly
                      rows={2}
                      value="أظهر الطالب تميزاً ملحوظاً في التطبيق العملي واستيعاب المفاهيم، يحتاج لمزيد من التدريب على الدقة في المراحل الختامية."
                    />
                  </label>
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="button button-primary"
                onClick={() => setPreviewModalRubric(null)}
              >
                إغلاق المعاينة
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
