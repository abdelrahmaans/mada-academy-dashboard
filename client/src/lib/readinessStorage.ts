import type {
  BranchReadinessState,
  ReadinessCheckItem,
  ReadinessCompetition,
  ReadinessKit,
  ReadinessRoom,
} from "@/components/classes/readiness/types";

const STORAGE_PREFIX = "mada_readiness_";

function getStorageKey(branchId: string, tenantId?: string): string {
  const t = tenantId || "default";
  const b = branchId || "main";
  return `${STORAGE_PREFIX}${t}_${b}`;
}

const DEFAULT_ROOMS: ReadinessRoom[] = [
  {
    id: "room-1",
    name: "معمل الروبوتكس والذكاء الاصطناعي 1",
    type: "معمل عتاد وروبوتكس",
    capacity: 12,
    activeGroupsCount: 2,
    equipment: ["12 جهاز لابتوب Core i7", "شاشة تفاعلية 65 بوصة", "طاولة حلبة WRO الرسمية", "وحدات شحن متزامنة"],
    status: "AVAILABLE",
    notes: "جاهز تماماً للتشغيل ولا توجد أعطال في أجهزة اللابتوب.",
  },
  {
    id: "room-2",
    name: "قاعة البرمجة وتطوير الألعاب 2",
    type: "قاعة برمجيات وحواسيب",
    capacity: 15,
    activeGroupsCount: 1,
    equipment: ["15 محطة عمل متصلة بالإنترنت", "جهاز بروجيكتور تفاعلي", "سيرفر تدريب محلي", "سبورة بيضاء ذكية"],
    status: "AVAILABLE",
    notes: "تم تحديث بيئات عمل بايثون وVS Code في كافة الأجهزة.",
  },
  {
    id: "room-3",
    name: "معمل الإلكترونيات والمبتكر الصغير 3",
    type: "معمل دوائر وتجارب",
    capacity: 10,
    activeGroupsCount: 1,
    equipment: ["محطات تغذية باور سبلاي آمنة", "أجهزة راسم إشارة Oscilloscope", "طابعة ثلاثية الأبعاد 3D Printer", "أدوات قياس ديجيتال"],
    status: "AVAILABLE",
    notes: "محطات الأمان معتمدة ومطابقة لمواصفات تدريب الأطفال.",
  },
];

const DEFAULT_KITS: ReadinessKit[] = [
  {
    id: "kit-1",
    name: "حقائب LEGO Education SPIKE Prime",
    track: "روبوتكس ومسابقات",
    totalQuantity: 14,
    readyQuantity: 12,
    maintenanceQuantity: 2,
    supportsStudents: "24 طالباً (طالبان / حقيبة)",
    status: "READY",
    notes: "الحقائب مراجعة ومحدثة بآخر فيرموير. حقيبتان تخضعان لفحص حساس الألوان.",
  },
  {
    id: "kit-2",
    name: "أطقم Arduino Uno & Sensors Advanced",
    track: "دوائر إلكترونية و IoT",
    totalQuantity: 20,
    readyQuantity: 20,
    maintenanceQuantity: 0,
    supportsStudents: "20 طالباً (طالب / طقم)",
    status: "READY",
    notes: "متوفر مع كل طقم شيلد المحركات ومستشعرات المسافة والحرارة والبلوتوث.",
  },
  {
    id: "kit-3",
    name: "روبوتات VEX IQ System (Gen 2)",
    track: "الروبوتات التنافسية",
    totalQuantity: 4,
    readyQuantity: 4,
    maintenanceQuantity: 0,
    supportsStudents: "16 طالباً (4 طلاب / فريق تنافسي)",
    status: "READY",
    notes: "شامل حلبة التحدي الرسمية 6x8 والعناصر الميدانية للتدريب على بطولات VEX.",
  },
  {
    id: "kit-4",
    name: "كروت BBC Micro:bit v2 & Smart Car Kits",
    track: "المبتكر الصغير والبرمجة",
    totalQuantity: 18,
    readyQuantity: 18,
    maintenanceQuantity: 0,
    supportsStudents: "18 طالباً",
    status: "READY",
    notes: "جاهزة للمسار المبتدئ ومشاريع السيارات الذكية المتتبعة للضوء والمسار.",
  },
  {
    id: "kit-5",
    name: "طابعات ثلاثية الأبعاد Creality Ender 3 V3",
    track: "التصنيع الرقمي والنماذج",
    totalQuantity: 2,
    readyQuantity: 2,
    maintenanceQuantity: 0,
    supportsStudents: "تخدم كافة مجموعات المسابقات والمشاريع",
    status: "READY",
    notes: "متوفر خيوط PLA صديقة للبيئة بألوان متعددة لطباعة قطع الفرق.",
  },
];

const DEFAULT_COMPETITIONS: ReadinessCompetition[] = [
  {
    id: "comp-wro",
    name: "أولمبياد الروبوت العالمي (WRO - World Robot Olympiad)",
    tracks: ["RoboMission (Elementary & Junior)", "Future Innovators"],
    targetKits: "LEGO SPIKE Prime",
    registeredTeams: 3,
    studentsCount: 9,
    status: "ACTIVE_PREPARATION",
    notes: "تم تركيب الحلبة الرسمية في معمل 1 وبدء حصص البرمجة والتحدي الزمني.",
  },
  {
    id: "comp-fll",
    name: "بطولة فيرست ليجو العالمية (FIRST LEGO League - FLL)",
    tracks: ["FLL Challenge (عمر 9-16 سنة)", "FLL Explore (عمر 6-9 سنوات)"],
    targetKits: "SPIKE Prime + طقم الابتكار",
    registeredTeams: 2,
    studentsCount: 8,
    status: "ACTIVE_PREPARATION",
    notes: "الفرق تعمل حالياً على حل المشروع المبتكر وتصميم ذراع المهمات.",
  },
  {
    id: "comp-vex",
    name: "بطولة فيكس للروبوتات (VEX IQ Challenge)",
    tracks: ["Full Volume Challenge", "Teamwork Championship"],
    targetKits: "VEX IQ Gen 2",
    registeredTeams: 1,
    studentsCount: 4,
    status: "ENROLLED",
    notes: "فريق النجوم المتقدم؛ يجري التدريب على التحكم اليدوي والبرمجة المستقلة.",
  },
  {
    id: "comp-ai",
    name: "الأولمبياد الوطني للذكاء الاصطناعي والبرمجة",
    tracks: ["Computer Vision Challenge", "Python Problem Solving"],
    targetKits: "قاعة حواسيب AI Lab",
    registeredTeams: 2,
    studentsCount: 6,
    status: "ACTIVE_PREPARATION",
    notes: "الطلاب في مرحلة تدريب نماذج تصنيف الصور وحل الخوارزميات.",
  },
];

const DEFAULT_CHECKLIST: ReadinessCheckItem[] = [
  {
    id: "chk-1",
    title: "فحص اتصال شبكة الواي فاي والإنترنت فائق السرعة في كافة المعامل",
    category: "NETWORK",
    checked: true,
    assignedRole: "مسؤول تقنية المعلومات",
    updatedAt: "اليوم",
  },
  {
    id: "chk-2",
    title: "شحن ومطابقة بطاريات وحدات SPIKE و Micro:bit لـ 100%",
    category: "EQUIPMENT",
    checked: true,
    assignedRole: "مدرب المعمل",
    updatedAt: "اليوم",
  },
  {
    id: "chk-3",
    title: "تحديث بيئات تطوير Python و VS Code وحزم Scratch على أجهزة الطلاب",
    category: "EQUIPMENT",
    checked: true,
    assignedRole: "رئيس المدربين",
    updatedAt: "اليوم",
  },
  {
    id: "chk-4",
    title: "مراجعة حقائب الإسعافات الأولية ومخارج الطوارئ وتأمين التوصيلات الكهربائية",
    category: "SAFETY",
    checked: false,
    assignedRole: "مسؤول السلامة والفرع",
    updatedAt: "أمس",
  },
  {
    id: "chk-5",
    title: "معايرة ميزان حلبة المسابقة وتثبيت بساط WRO الرسمي",
    category: "FACILITY",
    checked: true,
    assignedRole: "كوتش المسابقات",
    updatedAt: "اليوم",
  },
];

export const readinessStorage = {
  load(branchId: string, tenantId?: string): BranchReadinessState {
    if (typeof window === "undefined") {
      return {
        rooms: DEFAULT_ROOMS,
        kits: DEFAULT_KITS,
        competitions: DEFAULT_COMPETITIONS,
        checklist: DEFAULT_CHECKLIST,
      };
    }
    const key = getStorageKey(branchId, tenantId);
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored) as BranchReadinessState;
        if (parsed.rooms && parsed.kits) {
          return parsed;
        }
      }
    } catch {
      // fallback
    }

    const initial: BranchReadinessState = {
      rooms: DEFAULT_ROOMS,
      kits: DEFAULT_KITS,
      competitions: DEFAULT_COMPETITIONS,
      checklist: DEFAULT_CHECKLIST,
    };
    try {
      localStorage.setItem(key, JSON.stringify(initial));
    } catch {
      // ignore
    }
    return initial;
  },

  save(branchId: string, state: BranchReadinessState, tenantId?: string): void {
    if (typeof window === "undefined") return;
    const key = getStorageKey(branchId, tenantId);
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch {
      // ignore
    }
  },

  saveRoom(branchId: string, room: ReadinessRoom, tenantId?: string): BranchReadinessState {
    const state = this.load(branchId, tenantId);
    const existingIndex = state.rooms.findIndex((r) => r.id === room.id);
    if (existingIndex >= 0) {
      state.rooms[existingIndex] = room;
    } else {
      state.rooms.push({ ...room, id: room.id || `room-${Date.now()}` });
    }
    this.save(branchId, state, tenantId);
    return state;
  },

  deleteRoom(branchId: string, roomId: string, tenantId?: string): BranchReadinessState {
    const state = this.load(branchId, tenantId);
    state.rooms = state.rooms.filter((r) => r.id !== roomId);
    this.save(branchId, state, tenantId);
    return state;
  },

  saveKit(branchId: string, kit: ReadinessKit, tenantId?: string): BranchReadinessState {
    const state = this.load(branchId, tenantId);
    const existingIndex = state.kits.findIndex((k) => k.id === kit.id);
    if (existingIndex >= 0) {
      state.kits[existingIndex] = kit;
    } else {
      state.kits.push({ ...kit, id: kit.id || `kit-${Date.now()}` });
    }
    this.save(branchId, state, tenantId);
    return state;
  },

  deleteKit(branchId: string, kitId: string, tenantId?: string): BranchReadinessState {
    const state = this.load(branchId, tenantId);
    state.kits = state.kits.filter((k) => k.id !== kitId);
    this.save(branchId, state, tenantId);
    return state;
  },

  saveCompetition(branchId: string, comp: ReadinessCompetition, tenantId?: string): BranchReadinessState {
    const state = this.load(branchId, tenantId);
    const existingIndex = state.competitions.findIndex((c) => c.id === comp.id);
    if (existingIndex >= 0) {
      state.competitions[existingIndex] = comp;
    } else {
      state.competitions.push({ ...comp, id: comp.id || `comp-${Date.now()}` });
    }
    this.save(branchId, state, tenantId);
    return state;
  },

  deleteCompetition(branchId: string, compId: string, tenantId?: string): BranchReadinessState {
    const state = this.load(branchId, tenantId);
    state.competitions = state.competitions.filter((c) => c.id !== compId);
    this.save(branchId, state, tenantId);
    return state;
  },

  toggleChecklistItem(branchId: string, itemId: string, tenantId?: string): BranchReadinessState {
    const state = this.load(branchId, tenantId);
    const item = state.checklist.find((i) => i.id === itemId);
    if (item) {
      item.checked = !item.checked;
      item.updatedAt = "الآن";
      this.save(branchId, state, tenantId);
    }
    return state;
  },

  addChecklistItem(branchId: string, title: string, category: ReadinessCheckItem["category"], assignedRole: string, tenantId?: string): BranchReadinessState {
    const state = this.load(branchId, tenantId);
    state.checklist.push({
      id: `chk-${Date.now()}`,
      title,
      category,
      checked: false,
      assignedRole: assignedRole || "مدير الفرع",
      updatedAt: "الآن",
    });
    this.save(branchId, state, tenantId);
    return state;
  },
};
