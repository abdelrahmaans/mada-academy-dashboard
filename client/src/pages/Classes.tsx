import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Activity } from "lucide-react";
import { useLocation } from "wouter";
import { ClassesTopbar } from "@/components/classes/ClassesTopbar";
import { ClassesHeader } from "@/components/classes/ClassesHeader";
import { ClassesStatsCards } from "@/components/classes/ClassesStatsCards";
import {
  apiClient,
  waitlistStorage,
  type CourseTemplateRecord,
  type GroupRecord,
  type LeadRecord,
  type SchedulingClassroom,
  type SchedulingInstructor,
  type StudentRecord,
  type WaitlistEntry,
} from "@/lib/apiClient";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import RoleDashboardShell from "@/components/RoleDashboardShell";
import { getRoleDefinition } from "@/lib/roleNavigation";
import type { RoleCode } from "@/contexts/RoleScopeContext";
import ClassesCatalogPanel from "@/components/ClassesCatalogPanel";
import ClassesDetailDialogs from "@/components/ClassesDetailDialogs";
import { ClassesCreateDialogs } from "@/components/ClassesCreateDialogs";

import {
  type Track,
  type CourseStatus,
  type OfferingStatus,
  type Course,
  type Offering,
  type TabKey,
  trackLabels,
  levelLabels,
  courseStatusLabels,
  offeringStatusLabels,
  branches,
  seedCourses,
  seedOfferings,
  trackIcons,
  formatArabicTime,
  apiWeekdays,
  normalizeTrack,
  courseFromApi,
  offeringFromApi,
} from "./ClassesTypes";

export type {
  Track,
  CourseStatus,
  OfferingStatus,
  Course,
  Offering,
  TabKey,
};

export {
  trackLabels,
  levelLabels,
  courseStatusLabels,
  offeringStatusLabels,
  branches,
  seedCourses,
  seedOfferings,
  trackIcons,
  formatArabicTime,
  apiWeekdays,
  normalizeTrack,
  courseFromApi,
  offeringFromApi,
};

function ClassesPage() {
  const [, setLocation] = useLocation();
  const { me } = useAuth();
  const userRoleCode = me?.role ? (me.role.replace(/_.*$/, "") as RoleCode) : undefined;
  const activeRoleCode: RoleCode = userRoleCode || "R02";
  const roleDef = getRoleDefinition(activeRoleCode);
  const branchContext = me?.branchId ? me.branches?.find(b => b.id === me.branchId)?.name : undefined;
  const [liveMode, setLiveMode] = useState(() => apiClient.hasSession());
  const [loading, setLoading] = useState(() => apiClient.hasSession());
  const [courses, setCourses] = useState(() => apiClient.hasSession() ? [] : seedCourses);
  const [offerings, setOfferings] = useState(() => apiClient.hasSession() ? [] : seedOfferings);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [tab, setTab] = useState<TabKey>(() => {
    if (typeof window !== "undefined") {
      const hash = window.location.hash.replace("#", "");
      if (hash === "readiness" || hash === "branch_readiness" || hash === "kits" || hash === "rooms") return "readiness";
      if (hash === "courses") return "courses";
      if (hash === "waitlist") return "waitlist";
    }
    return "groups";
  });

  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace("#", "");
      if (hash === "readiness" || hash === "branch_readiness" || hash === "kits" || hash === "rooms") {
        setTab("readiness");
      } else if (hash === "courses") {
        setTab("courses");
      } else if (hash === "waitlist") {
        setTab("waitlist");
      } else if (hash === "groups") {
        setTab("groups");
      }
    };
    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, []);
  const [search, setSearch] = useState("");
  const [trackFilter, setTrackFilter] = useState<Track | "all">("all");
  const [branchFilter, setBranchFilter] = useState("كل الفروع");
  const [statusFilter, setStatusFilter] = useState("all");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [branchMenuOpen, setBranchMenuOpen] = useState(false);
  const [courseModalOpen, setCourseModalOpen] = useState(false);
  const [offeringModalOpen, setOfferingModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedOffering, setSelectedOffering] = useState<Offering | null>(
    null
  );
  const [courseName, setCourseName] = useState("");
  const [newTrack, setNewTrack] = useState<Track>("robotics");
  const [newCourseType, setNewCourseType] = useState<"hard" | "soft">("hard");
  const [ageGroup, setAgeGroup] = useState("10-12");
  const [level, setLevel] = useState<Course["level"]>("beginner");
  const [totalSessions, setTotalSessions] = useState("10");
  const [durationHours, setDurationHours] = useState("1.5");
  const [price, setPrice] = useState("");
  const [offeringCourseId, setOfferingCourseId] = useState(seedCourses[0].id);
  const [instructor, setInstructor] = useState("");
  const [selectedInstructorId, setSelectedInstructorId] = useState("");
  const [selectedSupervisorId, setSelectedSupervisorId] = useState("");
  const [offeringBranch, setOfferingBranch] = useState("مدينة نصر");
  const [offeringBranchId, setOfferingBranchId] = useState("");
  const [classroom, setClassroom] = useState("معمل 1");
  const [selectedClassroomId, setSelectedClassroomId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [maxStudents, setMaxStudents] = useState("12");
  const [scheduleDays, setScheduleDays] = useState<string[]>([
    "السبت",
    "الثلاثاء",
  ]);
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("11:30");
  const [liveClassrooms, setLiveClassrooms] = useState<SchedulingClassroom[]>(
    []
  );
  const [liveInstructors, setLiveInstructors] = useState<
    SchedulingInstructor[]
  >([]);
  const [liveStudents, setLiveStudents] = useState<StudentRecord[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [waitlistEntries, setWaitlistEntries] = useState<WaitlistEntry[]>(() =>
    apiClient.hasSession() ? [] : waitlistStorage.getEntries()
  );

  const mapServerWaitlists = (leads: LeadRecord[], currentOfferings: Offering[]): WaitlistEntry[] => {
    const relevant = leads.filter(
      l =>
        l.status === "WAITLISTED" ||
        l.status === "NOTIFIED" ||
        l.status === "CANCELLED" ||
        l.channel === "WAITLIST" ||
        l.channel === "DIRECT_WAITLIST"
    );
    const rankByGroup: Record<string, number> = {};
    return relevant.map(lead => {
      const grp = currentOfferings.find(o => o.id === (lead.courseOfferingId ?? ""));
      const mappedStatus: WaitlistEntry["status"] =
        lead.status === "NOTIFIED"
          ? "NOTIFIED"
          : lead.status === "REGISTERED"
          ? "ENROLLED"
          : lead.status === "CANCELLED" || lead.status === "ARCHIVED"
          ? "CANCELLED"
          : "WAITING";
      const gKey = lead.courseOfferingId ?? "general";
      if (mappedStatus === "WAITING") {
        rankByGroup[gKey] = (rankByGroup[gKey] ?? 0) + 1;
      }
      return {
        id: lead.id,
        studentId: lead.convertedStudentId ?? undefined,
        studentName: lead.childName,
        parentName: lead.parentName,
        phone: lead.phone,
        groupId: lead.courseOfferingId ?? "",
        courseName: lead.courseName ?? grp?.courseName ?? "كورس الأكاديمية",
        branchName: lead.branchName ?? grp?.branch ?? "فرع الأكاديمية",
        status: mappedStatus,
        priorityRank: rankByGroup[gKey] ?? 1,
        addedAt: lead.createdAt,
        notes: lead.notes ?? undefined,
      };
    });
  };

  const reloadWaitlist = async (currentOfferings?: Offering[]) => {
    if (!apiClient.hasSession()) {
      setWaitlistEntries(waitlistStorage.getEntries());
      return;
    }
    try {
      const [leadsRes, groupsRes] = await Promise.all([
        apiClient.listLeads(),
        currentOfferings ? Promise.resolve(null) : apiClient.listGroups().catch(() => null),
      ]);
      const nextOfferings = groupsRes ? groupsRes.items.map(offeringFromApi) : (currentOfferings ?? offerings);
      if (groupsRes) setOfferings(nextOfferings);
      setWaitlistEntries(mapServerWaitlists(leadsRes.items, nextOfferings));
    } catch {
      // Keep current state if transient network error occurs on background refresh
    }
  };

  const handleNotifyWaitlist = async (id: string) => {
    if (liveMode) {
      const entry = waitlistEntries.find(e => e.id === id);
      try {
        await apiClient.updateLeadStatus(id, "NOTIFIED");
        await reloadWaitlist();
        toast.success(
          `تم إشعار ولي أمر الطالب ${entry?.studentName ?? ""} بتوفر المقعد وتسجيل الحالة في قاعدة البيانات.`
        );
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "تعذر تحديث حالة قائمة الانتظار");
      }
      return;
    }
    const updated = waitlistStorage.notifyEntry(id);
    setWaitlistEntries(waitlistStorage.getEntries());
    toast.success(
      `تم إرسال إشعار توفر مقعد شاغر للطالب ${updated.studentName} بنجاح عبر واتساب!`
    );
  };

  const handleEnrollWaitlist = async (id: string, withInvoice = true) => {
    if (liveMode) {
      const entry = waitlistEntries.find(e => e.id === id);
      if (!entry) return;
      try {
        const result = await apiClient.convertLead(id, {
          courseOfferingId: entry.groupId || undefined,
          createInvoice: withInvoice,
          joinWaitlistIfFull: false,
        });
        await reloadWaitlist();
        if (result.invoiceNumber) {
          toast.success(
            `تم تسكين الطالب ${result.studentName} وتفعيل اشتراكه وإصدار الفاتورة ${result.invoiceNumber} بنجاح!`
          );
        } else {
          toast.success(
            `تم تسكين الطالب ${result.studentName} وتفعيل اشتراكه في المجموعة بنجاح!`
          );
        }
      } catch (err) {
        toast.error(
          err instanceof Error
            ? err.message
            : "تعذر تسكين الطالب (تأكد من وجود مقعد شاغر في المجموعة)."
        );
      }
      return;
    }
    const updated = waitlistStorage.enrollEntry(id);
    setOfferings(current =>
      current.map(o =>
        o.id === updated.groupId
          ? { ...o, enrolledStudents: Math.min(o.maxStudents, o.enrolledStudents + 1) }
          : o
      )
    );
    setWaitlistEntries(waitlistStorage.getEntries());
    if (withInvoice) {
      toast.success(
        `تم تسكين الطالب ${updated.studentName} وتفعيل اشتراكه مع إصدار فاتورة المصاريف بنجاح!`
      );
    } else {
      toast.success(
        `تم تسكين الطالب ${updated.studentName} وتفعيل اشتراكه في المجموعة بنجاح!`
      );
    }
  };

  const handleAddWaitlistEntry = async (
    input: Omit<WaitlistEntry, "id" | "status" | "priorityRank" | "addedAt">
  ) => {
    if (liveMode) {
      try {
        await apiClient.createLead({
          childName: input.studentName,
          parentName: input.parentName || "ولي الأمر",
          phone: input.phone || "+201000000000",
          courseOfferingId: input.groupId || undefined,
          notes: input.notes,
          channel: "WAITLIST",
          status: "WAITLISTED",
        });
        await reloadWaitlist();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "تعذر إضافة الطالب لقائمة الانتظار");
        throw err;
      }
      return;
    }
    waitlistStorage.addEntry(input);
    setWaitlistEntries(waitlistStorage.getEntries());
  };

  const handleCancelWaitlistEntry = async (id: string) => {
    if (liveMode) {
      try {
        await apiClient.updateLeadStatus(id, "CANCELLED");
        await reloadWaitlist();
        toast.info("تم إلغاء الطلب من قائمة الانتظار.");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "تعذر إلغاء الطلب");
      }
      return;
    }
    waitlistStorage.cancelEntry(id);
    setWaitlistEntries(waitlistStorage.getEntries());
  };

  const handleDeleteWaitlistEntry = async (id: string) => {
    if (liveMode) {
      try {
        await apiClient.deleteLead(id);
        await reloadWaitlist();
        toast.info("تم حذف السجل من قائمة الانتظار.");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "تعذر حذف السجل");
      }
      return;
    }
    waitlistStorage.deleteEntry(id);
    setWaitlistEntries(waitlistStorage.getEntries());
  };

  useEffect(() => {
    if (!apiClient.hasSession()) {
      setLiveMode(false);
      setLoading(false);
      setCourses(seedCourses);
      setOfferings(seedOfferings);
      return;
    }
    setLiveMode(true);
    setLoading(true);
    setLoadError(null);
    Promise.allSettled([
      apiClient.courseTemplates(),
      apiClient.listGroups(),
      apiClient.schedulingClassrooms(),
      apiClient.schedulingInstructors(),
      apiClient.listStudents(),
      apiClient.listLeads(),
    ]).then(
      ([
        courseResult,
        groupResult,
        roomResult,
        instructorResult,
        studentResult,
        leadsResult,
      ]) => {
        if (
          courseResult.status === "rejected" ||
          groupResult.status === "rejected"
        ) {
          setCourses([]);
          setOfferings([]);
          setLiveClassrooms([]);
          setLiveInstructors([]);
          setLiveStudents([]);
          const cause =
            courseResult.status === "rejected"
              ? courseResult.reason
              : groupResult.status === "rejected"
                ? groupResult.reason
                : "تعذر تحميل بيانات الكورسات والمجموعات من الخادم.";
          setLoadError(
            cause instanceof Error
              ? cause.message
              : "تعذر تحميل الكورسات والمجموعات من الخادم."
          );
          return;
        }

        const mappedCourses = courseResult.value.items.map(courseFromApi);
        const mappedOfferings = groupResult.value.items.map(offeringFromApi);
        setCourses(mappedCourses);
        setOfferings(mappedOfferings);
        if (leadsResult.status === "fulfilled") {
          setWaitlistEntries(mapServerWaitlists(leadsResult.value.items, mappedOfferings));
        }

        const rooms =
          roomResult.status === "fulfilled" ? roomResult.value.items : [];
        const instructors =
          instructorResult.status === "fulfilled"
            ? instructorResult.value.items
            : [];
        const students =
          studentResult.status === "fulfilled" ? studentResult.value.items : [];
        setLiveClassrooms(rooms);
        setLiveInstructors(instructors);
        setLiveStudents(students);
        setOfferingCourseId(mappedCourses[0]?.id ?? "");
        const firstRoom = rooms.find(room => room.status === "AVAILABLE");
        if (firstRoom) {
          setOfferingBranchId(firstRoom.branchId);
          setOfferingBranch(firstRoom.branchName);
          setSelectedClassroomId(firstRoom.id);
          setClassroom(firstRoom.name);
        }
        const firstInstructor = instructors[0];
        if (firstInstructor) {
          setSelectedInstructorId(firstInstructor.id);
          setInstructor(firstInstructor.name ?? "");
        }

        const optionalFailure = [
          roomResult,
          instructorResult,
          studentResult,
        ].find(result => result.status === "rejected");
        if (optionalFailure?.status === "rejected") {
          setLoadError(
            "تم تحميل الكورسات والمجموعات؛ بعض بيانات إنشاء المجموعة غير متاحة لصلاحيات الحساب الحالية."
          );
        }
      }
    ).finally(() => {
      setLoading(false);
    });
  }, []);

  const filteredCourses = useMemo(
    () =>
      courses.filter(course => {
        const query = search.trim().toLocaleLowerCase("ar");
        const matchesQuery =
          !query ||
          `${course.name} ${course.id} ${trackLabels[course.track]}`
            .toLocaleLowerCase("ar")
            .includes(query);
        const matchesTrack =
          trackFilter === "all" || course.track === trackFilter;
        const matchesStatus =
          statusFilter === "all" || course.status === statusFilter;
        return matchesQuery && matchesTrack && matchesStatus;
      }),
    [courses, search, trackFilter, statusFilter]
  );

  const filteredOfferings = useMemo(
    () =>
      offerings.filter(offering => {
        const query = search.trim().toLocaleLowerCase("ar");
        const matchesQuery =
          !query ||
          `${offering.courseName} ${offering.instructor} ${offering.classroom} ${offering.id}`
            .toLocaleLowerCase("ar")
            .includes(query);
        const matchesTrack =
          trackFilter === "all" || offering.track === trackFilter;
        const matchesBranch =
          branchFilter === "كل الفروع" || offering.branch === branchFilter;
        const matchesStatus =
          statusFilter === "all" || offering.status === statusFilter;
        return matchesQuery && matchesTrack && matchesBranch && matchesStatus;
      }),
    [offerings, search, trackFilter, branchFilter, statusFilter]
  );

  const activeCourses = courses.filter(
    course => course.status === "active"
  ).length;
  const activeGroups = offerings.filter(
    offering => offering.status === "ongoing" || offering.status === "upcoming"
  ).length;
  const enrolledTotal = offerings.reduce(
    (sum, offering) => sum + offering.enrolledStudents,
    0
  );
  const availableSeats = offerings.reduce(
    (sum, offering) => sum + offering.maxStudents - offering.enrolledStudents,
    0
  );

  const resetCourseForm = () => {
    setCourseName("");
    setNewTrack("robotics");
    setNewCourseType("hard");
    setAgeGroup("10-12");
    setLevel("beginner");
    setTotalSessions("10");
    setDurationHours("1.5");
    setPrice("");
  };
  const resetOfferingForm = () => {
    setOfferingCourseId(courses[0]?.id ?? "");
    const firstRoom = liveClassrooms.find(room => room.status === "AVAILABLE");
    const firstInstructor = liveInstructors[0];
    setInstructor(firstInstructor?.name ?? "");
    setSelectedInstructorId(firstInstructor?.id ?? "");
    setSelectedSupervisorId("");
    setOfferingBranch(firstRoom?.branchName ?? "مدينة نصر");
    setOfferingBranchId(firstRoom?.branchId ?? "");
    setClassroom(firstRoom?.name ?? "معمل 1");
    setSelectedClassroomId(firstRoom?.id ?? "");
    setStartDate("");
    setMaxStudents("12");
    setScheduleDays(["السبت", "الثلاثاء"]);
    setStartTime("10:00");
    setEndTime("11:30");
    setSelectedStudentIds([]);
  };

  const addCourse = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (
      !courseName.trim() ||
      Number(totalSessions) < 1 ||
      Number(durationHours) <= 0 ||
      Number(price) <= 0
    ) {
      toast.error("راجع بيانات الكورس المطلوبة");
      return;
    }
    if (liveMode) {
      try {
        const saved = await apiClient.createCourseTemplate({
          name: courseName.trim(),
          track: newTrack,
          type: newCourseType,
          ageGroup,
          level,
          totalSessions: Number(totalSessions),
          sessionDurationHours: Number(durationHours),
          basePricePiastres: Math.round(Number(price) * 100),
        });
        const course = courseFromApi(saved);
        setCourses(current => [course, ...current]);
        setTab("courses");
        setTrackFilter("all");
        setStatusFilter("all");
        setSearch("");
        setCourseModalOpen(false);
        resetCourseForm();
        toast.success("تم حفظ قالب الكورس على الخادم كمسودة.");
      } catch (cause) {
        toast.error("تعذر حفظ قالب الكورس", {
          description:
            cause instanceof Error ? cause.message : "فشل الاتصال بالخادم.",
        });
      }
      return;
    }
    const course: Course = {
      id: `CRS-${String(19 + courses.length - seedCourses.length).padStart(3, "0")}`,
      name: courseName.trim(),
      track: newTrack,
      type: newCourseType,
      ageGroup,
      level,
      totalSessions: Number(totalSessions),
      durationHours: Number(durationHours),
      basePricePiasters: Math.round(Number(price) * 100),
      status: "draft",
      description: "كورس جديد — أضف وصف المحتوى قبل نشره.",
    };
    setCourses(current => [course, ...current]);
    setTab("courses");
    setTrackFilter("all");
    setStatusFilter("all");
    setSearch("");
    setCourseModalOpen(false);
    resetCourseForm();
    toast.success("تمت إضافة الكورس كمسودة", {
      description: "اتضاف لبيانات العرض التجريبية فقط.",
    });
  };

  const addOffering = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (
      !offeringCourseId ||
      !instructor.trim() ||
      !startDate ||
      !scheduleDays.length ||
      Number(maxStudents) < 1
    ) {
      toast.error("أكمل بيانات المجموعة والجدول");
      return;
    }
    if (endTime <= startTime) {
      toast.error("وقت نهاية الحصة لازم يكون بعد بدايتها");
      return;
    }
    const course = courses.find(item => item.id === offeringCourseId);
    if (liveMode) {
      const room = liveClassrooms.find(
        item =>
          item.id === selectedClassroomId &&
          item.branchId === offeringBranchId &&
          item.status === "AVAILABLE"
      );
      const selectedInstructor = liveInstructors.find(
        item => item.id === selectedInstructorId
      );
      if (!course || !room || !selectedInstructor || !offeringBranchId) {
        toast.error(
          "اختر قالب كورس، مدربًا، فرعًا وقاعة نشطة من بيانات الخادم."
        );
        return;
      }
      const startMinutes =
        Number(startTime.slice(0, 2)) * 60 + Number(startTime.slice(3, 5));
      const endMinutes =
        Number(endTime.slice(0, 2)) * 60 + Number(endTime.slice(3, 5));
      const durationMinutes = (endMinutes - startMinutes + 1440) % 1440;
      if (durationMinutes <= 0) {
        toast.error("مدة المجموعة غير صالحة.");
        return;
      }
      const weekdays = scheduleDays
        .map(day => apiWeekdays.indexOf(day))
        .filter(day => day >= 0);
      const cursor = new Date(`${startDate}T00:00:00`);
      let scheduled = 0;
      let endDate = startDate;
      let guard = 0;
      while (scheduled < course.totalSessions && guard < 730) {
        if (weekdays.includes(cursor.getDay())) {
          scheduled += 1;
          endDate = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}-${String(cursor.getDate()).padStart(2, "0")}`;
        }
        cursor.setDate(cursor.getDate() + 1);
        guard += 1;
      }
      if (scheduled < course.totalSessions) {
        toast.error("تعذر حساب تاريخ نهاية المجموعة.");
        return;
      }
      try {
        const response = await apiClient.createGroup({
          branchId: offeringBranchId,
          courseTemplateId: course.id,
          instructorId: selectedInstructor.id,
          classroomId: room.id,
          startDate,
          endDate,
          daysOfWeek: weekdays,
          startTime,
          durationMinutes,
          maxStudents: Number(maxStudents),
          studentIds: selectedStudentIds,
          finalPricePiastres: course.basePricePiasters,
        });
        if (selectedSupervisorId) {
          try {
            await apiClient.grantGroupSupervision({
              supervisorUserId: selectedSupervisorId,
              courseOfferingId: response.groupId,
              canReadAttendance: true,
              canReadEvaluations: true,
              canDecideEvaluations: true,
            });
          } catch {
            // non-fatal, supervisor can also be managed in /supervision-assignments
          }
        }
        setOfferingModalOpen(false);
        resetOfferingForm();
        toast.success("تم حفظ المجموعة وتوليد جلساتها على الخادم.", {
          description: `${response.sessionsCreated} جلسة · ${response.studentCount} طالب`,
        });
        try {
          setOfferings(
            (await apiClient.listGroups()).items.map(offeringFromApi)
          );
        } catch (refreshError) {
          setLoadError(
            refreshError instanceof Error
              ? refreshError.message
              : "تم الحفظ، لكن تعذر تحديث القائمة."
          );
        }
      } catch (cause) {
        toast.error("تعذر حفظ المجموعة", {
          description:
            cause instanceof Error ? cause.message : "فشل الاتصال بالخادم.",
        });
      }
      return;
    }
    const duplicateRoomSlot = offerings.find(
      item =>
        item.branch === offeringBranch &&
        item.classroom === classroom.trim() &&
        item.days.some(day => scheduleDays.includes(day)) &&
        startTime < item.endTime &&
        endTime > item.startTime
    );
    if (duplicateRoomSlot) {
      toast.error("تعارض حجز القاعة", {
        description: `القاعة محجوزة بالفعل مع «${duplicateRoomSlot.courseName}» في يوم مشترك. غيّر القاعة أو الوقت.`,
      });
      return;
    }
    const localCourse = course ?? courses[0];
    const newOffering: Offering = {
      id: `GRP-${String(43 + offerings.length - seedOfferings.length).padStart(3, "0")}`,
      courseId: localCourse.id,
      courseName: localCourse.name,
      track: localCourse.track,
      instructor: instructor.trim(),
      branch: offeringBranch,
      classroom: classroom.trim() || "قاعة 1",
      startDate,
      schedule: `${scheduleDays.join(" و")} · ${formatArabicTime(startTime)}`,
      days: scheduleDays,
      startTime,
      endTime,
      status: "upcoming",
      maxStudents: Number(maxStudents),
      enrolledStudents: 0,
    };
    setOfferings(current => [newOffering, ...current]);
    setTab("groups");
    setTrackFilter("all");
    setBranchFilter("كل الفروع");
    setStatusFilter("all");
    setSearch("");
    setOfferingModalOpen(false);
    resetOfferingForm();
    toast.success("تمت إضافة المجموعة", {
      description: "المجموعة مضافة في بيانات العرض التجريبية فقط.",
    });
  };

  const toggleDay = (day: string) =>
    setScheduleDays(days =>
      days.includes(day) ? days.filter(item => item !== day) : [...days, day]
    );
  const clearFilters = () => {
    setSearch("");
    setTrackFilter("all");
    setStatusFilter("all");
    setBranchFilter("كل الفروع");
  };
  const trackOptions = Object.entries(trackLabels) as [Track, string][];
  const liveBranchNames = Array.from(
    new Set(liveClassrooms.map(room => room.branchName))
  );

  return (
    <RoleDashboardShell
      className="app-shell classes-shell"
      roleCode={activeRoleCode}
      roleLabel={me?.roleLabel || roleDef.label}
      scopeLevel={roleDef.scopeLevel}
      scopeLabel={roleDef.defaultScopeLabel}
      tenantName={me?.academy?.name}
      branchName={branchContext}
      demo={!liveMode}
      mobileOpen={mobileNavOpen}
      onCloseMobile={() => setMobileNavOpen(false)}
    >
      <main className="main-panel">
        <ClassesTopbar
          onOpenMobileNav={() => setMobileNavOpen(true)}
          branchFilter={branchFilter}
          branchMenuOpen={branchMenuOpen}
          setBranchMenuOpen={setBranchMenuOpen}
          onSelectBranch={setBranchFilter}
          liveMode={liveMode}
          branches={branches}
          liveBranchNames={liveBranchNames}
          search={search}
          onSearchChange={setSearch}
          userDisplayName={me?.user?.displayName}
          roleLabel={me?.roleLabel}
        />

        <div className="workspace classes-workspace">
          <ClassesHeader
            onNavigateHome={() => setLocation("/")}
            tab={tab}
            onOpenCourseModal={() => setCourseModalOpen(true)}
            onOpenOfferingModal={() => setOfferingModalOpen(true)}
            liveMode={liveMode}
            loadError={loadError}
          />

          <ClassesStatsCards
            loading={loading}
            liveMode={liveMode}
            activeCourses={activeCourses}
            totalCourses={courses.length}
            activeGroups={activeGroups}
            enrolledTotal={enrolledTotal}
            availableSeats={availableSeats}
          />

          <ClassesCatalogPanel
            tab={tab}
            setTab={setTab}
            courses={courses}
            offerings={offerings}
            filteredCourses={filteredCourses}
            filteredOfferings={filteredOfferings}
            trackFilter={trackFilter}
            setTrackFilter={setTrackFilter}
            branchFilter={branchFilter}
            setBranchFilter={setBranchFilter}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            trackOptions={trackOptions}
            branches={branches}
            trackLabels={trackLabels}
            trackIcons={trackIcons}
            levelLabels={levelLabels}
            courseStatusLabels={courseStatusLabels}
            offeringStatusLabels={offeringStatusLabels}
            liveMode={liveMode}
            clearFilters={clearFilters}
            setSelectedCourse={setSelectedCourse}
            setSelectedOffering={setSelectedOffering}
            waitlistEntries={waitlistEntries}
            onNotifyWaitlist={handleNotifyWaitlist}
            onEnrollWaitlist={handleEnrollWaitlist}
            onAddWaitlistEntry={handleAddWaitlistEntry}
            onCancelWaitlistEntry={handleCancelWaitlistEntry}
            onDeleteWaitlistEntry={handleDeleteWaitlistEntry}
            onOpenOfferingModal={() => setOfferingModalOpen(true)}
            onOpenCourseModal={() => setCourseModalOpen(true)}
            branchName={branchContext}
          />
          <div className="students-demo-note">
            <Activity size={14} />
            <span>
              {liveMode
                ? "إنشاء قوالب الكورسات والمجموعات يُحفظ في قاعدة البيانات. تعديل/أرشفة القوالب والمجموعات غير متاح بعد."
                : "المحتوى والجداول والأسعار المعروضة تجريبية. الإضافة مؤقتة داخل الواجهة ولا تُحفظ في قاعدة بيانات."}
            </span>
          </div>
          <footer className="workspace-footer">
            <span>© مدى 2026</span>
            <span>
              {liveMode
                ? "واجهة مرتبطة بـAPI — إصدار 0.1"
                : "واجهة تجريبية — إصدار 0.1"}
            </span>
          </footer>
        </div>
      </main>

      <ClassesCreateDialogs
        courseModalOpen={courseModalOpen}
        offeringModalOpen={offeringModalOpen}
        setCourseModalOpen={setCourseModalOpen}
        setOfferingModalOpen={setOfferingModalOpen}
        resetCourseForm={resetCourseForm}
        resetOfferingForm={resetOfferingForm}
        addCourse={addCourse}
        addOffering={addOffering}
        liveMode={liveMode}
        courseName={courseName}
        setCourseName={setCourseName}
        newTrack={newTrack}
        setNewTrack={setNewTrack}
        newCourseType={newCourseType}
        setNewCourseType={setNewCourseType}
        ageGroup={ageGroup}
        setAgeGroup={setAgeGroup}
        level={level}
        setLevel={setLevel}
        totalSessions={totalSessions}
        setTotalSessions={setTotalSessions}
        durationHours={durationHours}
        setDurationHours={setDurationHours}
        price={price}
        setPrice={setPrice}
        trackOptions={trackOptions}
        levelLabels={levelLabels}
        courses={courses}
        offeringCourseId={offeringCourseId}
        setOfferingCourseId={setOfferingCourseId}
        instructor={instructor}
        setInstructor={setInstructor}
        selectedInstructorId={selectedInstructorId}
        setSelectedInstructorId={setSelectedInstructorId}
        selectedSupervisorId={selectedSupervisorId}
        setSelectedSupervisorId={setSelectedSupervisorId}
        liveInstructors={liveInstructors}
        startDate={startDate}
        setStartDate={setStartDate}
        offeringBranch={offeringBranch}
        setOfferingBranch={setOfferingBranch}
        offeringBranchId={offeringBranchId}
        setOfferingBranchId={setOfferingBranchId}
        liveClassrooms={liveClassrooms}
        classroom={classroom}
        setClassroom={setClassroom}
        selectedClassroomId={selectedClassroomId}
        setSelectedClassroomId={setSelectedClassroomId}
        branches={branches}
        scheduleDays={scheduleDays}
        toggleDay={toggleDay}
        startTime={startTime}
        setStartTime={setStartTime}
        endTime={endTime}
        setEndTime={setEndTime}
        maxStudents={maxStudents}
        setMaxStudents={setMaxStudents}
        liveStudents={liveStudents}
        selectedStudentIds={selectedStudentIds}
        setSelectedStudentIds={setSelectedStudentIds}
      />

      <ClassesDetailDialogs
        selectedCourse={selectedCourse}
        selectedOffering={selectedOffering}
        trackLabels={trackLabels}
        trackIcons={trackIcons}
        levelLabels={levelLabels}
        courseStatusLabels={courseStatusLabels}
        offeringStatusLabels={offeringStatusLabels}
        onCloseCourse={() => setSelectedCourse(null)}
        onCloseOffering={() => setSelectedOffering(null)}
        onCreateOfferingFromCourse={courseId => {
          setOfferingCourseId(courseId);
          setSelectedCourse(null);
          setOfferingModalOpen(true);
        }}
      />
    </RoleDashboardShell>
  );
}

export default ClassesPage;
