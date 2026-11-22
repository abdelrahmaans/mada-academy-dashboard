import React, { useState, useEffect, useMemo } from "react";
import {
  Layers,
  Building2,
  Box,
  GraduationCap,
  Trophy,
  CheckCircle2,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import type { Course, Offering } from "@/pages/ClassesTypes";
import { useAuth } from "@/contexts/AuthContext";
import { readinessStorage } from "@/lib/readinessStorage";
import type {
  BranchReadinessState,
  ReadinessCheckItem,
  ReadinessCompetition,
  ReadinessKit,
  ReadinessRoom,
} from "./readiness/types";
import { ReadinessHeroRibbon } from "./readiness/ReadinessHeroRibbon";
import { ReadinessRoomsSection } from "./readiness/ReadinessRoomsSection";
import { ReadinessKitsSection } from "./readiness/ReadinessKitsSection";
import { ReadinessCompetitionsSection } from "./readiness/ReadinessCompetitionsSection";
import { ReadinessChecklistSection } from "./readiness/ReadinessChecklistSection";
import { RoomModal } from "./readiness/RoomModal";
import { KitModal } from "./readiness/KitModal";
import { CompetitionModal } from "./readiness/CompetitionModal";
import { KitInventoryDetailsModal, type KitItem } from "./KitInventoryDetailsModal";

interface BranchReadinessTabProps {
  branchName: string;
  courses: Course[];
  offerings: Offering[];
  onOpenCreateGroupForCourse?: (courseId: string) => void;
  onOpenCreateGroupModal: () => void;
}

type SectionKey = "ALL" | "ROOMS" | "KITS" | "COURSES" | "COMPETITIONS" | "CHECKLIST";

export function BranchReadinessTab({
  branchName,
  courses,
  offerings,
  onOpenCreateGroupForCourse,
  onOpenCreateGroupModal,
}: BranchReadinessTabProps) {
  const { me } = useAuth();
  const tenantId = me?.academy?.id || "default";

  // Dynamic state loaded per branch and tenant
  const [readinessState, setReadinessState] = useState<BranchReadinessState>(() =>
    readinessStorage.load(branchName, tenantId)
  );

  useEffect(() => {
    setReadinessState(readinessStorage.load(branchName, tenantId));
  }, [branchName, tenantId]);

  const [activeSection, setActiveSection] = useState<SectionKey>("ALL");

  // Modals state
  const [roomModalOpen, setRoomModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<ReadinessRoom | null>(null);

  const [kitModalOpen, setKitModalOpen] = useState(false);
  const [editingKit, setEditingKit] = useState<ReadinessKit | null>(null);

  const [compModalOpen, setCompModalOpen] = useState(false);
  const [editingComp, setEditingComp] = useState<ReadinessCompetition | null>(null);

  const [inspectingKit, setInspectingKit] = useState<KitItem | null>(null);

  // Sync active groups count with actual offerings
  const syncedRooms = useMemo(() => {
    return readinessState.rooms.map((room) => {
      const activeGroups = offerings.filter(
        (o) =>
          o.classroom.includes(room.name) ||
          room.name.includes(o.classroom) ||
          (room.id === "room-1" && o.classroom.includes("1")) ||
          (room.id === "room-2" && o.classroom.includes("2")) ||
          (room.id === "room-3" && o.classroom.includes("3"))
      ).length;
      return {
        ...room,
        activeGroupsCount: Math.max(room.activeGroupsCount || 0, activeGroups),
      };
    });
  }, [readinessState.rooms, offerings]);

  // Handlers for Rooms
  const handleSaveRoom = (room: ReadinessRoom) => {
    const updated = readinessStorage.saveRoom(branchName, room, tenantId);
    setReadinessState(updated);
    toast.success(editingRoom ? "تم تحديث بيانات القاعة بنجاح" : "تمت إضافة القاعة بنجاح");
    setEditingRoom(null);
  };

  const handleDeleteRoom = (roomId: string) => {
    const updated = readinessStorage.deleteRoom(branchName, roomId, tenantId);
    setReadinessState(updated);
    toast.success("تم حذف القاعة من الفرع");
  };

  // Handlers for Kits
  const handleSaveKit = (kit: ReadinessKit) => {
    const updated = readinessStorage.saveKit(branchName, kit, tenantId);
    setReadinessState(updated);
    toast.success(editingKit ? "تم تحديث بيانات الحقيبة والعتاد" : "تمت إضافة الحقيبة التدريبية بنجاح");
    setEditingKit(null);
  };

  const handleDeleteKit = (kitId: string) => {
    const updated = readinessStorage.deleteKit(branchName, kitId, tenantId);
    setReadinessState(updated);
    toast.success("تم حذف الحقيبة التدريبية");
  };

  // Handlers for Competitions
  const handleSaveComp = (comp: ReadinessCompetition) => {
    const updated = readinessStorage.saveCompetition(branchName, comp, tenantId);
    setReadinessState(updated);
    toast.success(editingComp ? "تم تحديث بيانات البطولة بنجاح" : "تم تسجيل البطولة بنجاح");
    setEditingComp(null);
  };

  const handleDeleteComp = (compId: string) => {
    const updated = readinessStorage.deleteCompetition(branchName, compId, tenantId);
    setReadinessState(updated);
    toast.success("تم حذف البطولة من الفرع");
  };

  // Handlers for Checklist
  const handleToggleChecklist = (itemId: string) => {
    const updated = readinessStorage.toggleChecklistItem(branchName, itemId, tenantId);
    setReadinessState(updated);
  };

  const handleAddChecklistItem = (
    title: string,
    category: ReadinessCheckItem["category"],
    role: string
  ) => {
    const updated = readinessStorage.addChecklistItem(branchName, title, category, role, tenantId);
    setReadinessState(updated);
    toast.success("تمت إضافة معيار الفحص بنجاح");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Hero Readiness Ribbon */}
      <ReadinessHeroRibbon
        branchName={branchName}
        state={{ ...readinessState, rooms: syncedRooms }}
        coursesCount={courses.length}
        onOpenCreateGroupModal={onOpenCreateGroupModal}
        onOpenAddRoom={() => {
          setEditingRoom(null);
          setRoomModalOpen(true);
        }}
        onOpenAddKit={() => {
          setEditingKit(null);
          setKitModalOpen(true);
        }}
      />

      {/* Sections Filter Tabs */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          flexWrap: "wrap",
          borderBottom: "1px solid #e2e8f0",
          paddingBottom: "10px",
        }}
      >
        <button
          type="button"
          onClick={() => setActiveSection("ALL")}
          style={{
            padding: "8px 16px",
            borderRadius: "20px",
            fontSize: "0.84rem",
            fontWeight: 700,
            border: 0,
            cursor: "pointer",
            background: activeSection === "ALL" ? "#0d9488" : "#f1f5f9",
            color: activeSection === "ALL" ? "#ffffff" : "#475569",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            transition: "all 0.15s ease",
          }}
        >
          <Layers size={15} />
          <span>كل تجهيزات الفرع</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection("ROOMS")}
          style={{
            padding: "8px 16px",
            borderRadius: "20px",
            fontSize: "0.84rem",
            fontWeight: 700,
            border: 0,
            cursor: "pointer",
            background: activeSection === "ROOMS" ? "#0d9488" : "#f1f5f9",
            color: activeSection === "ROOMS" ? "#ffffff" : "#475569",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            transition: "all 0.15s ease",
          }}
        >
          <Building2 size={15} />
          <span>القاعات والمعامل ({syncedRooms.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection("KITS")}
          style={{
            padding: "8px 16px",
            borderRadius: "20px",
            fontSize: "0.84rem",
            fontWeight: 700,
            border: 0,
            cursor: "pointer",
            background: activeSection === "KITS" ? "#0d9488" : "#f1f5f9",
            color: activeSection === "KITS" ? "#ffffff" : "#475569",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            transition: "all 0.15s ease",
          }}
        >
          <Box size={15} />
          <span>الحقائب والعتاد التدريبي ({readinessState.kits.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection("COURSES")}
          style={{
            padding: "8px 16px",
            borderRadius: "20px",
            fontSize: "0.84rem",
            fontWeight: 700,
            border: 0,
            cursor: "pointer",
            background: activeSection === "COURSES" ? "#0d9488" : "#f1f5f9",
            color: activeSection === "COURSES" ? "#ffffff" : "#475569",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            transition: "all 0.15s ease",
          }}
        >
          <GraduationCap size={15} />
          <span>الكورسات المعتمدة ({courses.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection("COMPETITIONS")}
          style={{
            padding: "8px 16px",
            borderRadius: "20px",
            fontSize: "0.84rem",
            fontWeight: 700,
            border: 0,
            cursor: "pointer",
            background: activeSection === "COMPETITIONS" ? "#0d9488" : "#f1f5f9",
            color: activeSection === "COMPETITIONS" ? "#ffffff" : "#475569",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            transition: "all 0.15s ease",
          }}
        >
          <Trophy size={15} />
          <span>بطولات الفرع ({readinessState.competitions.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection("CHECKLIST")}
          style={{
            padding: "8px 16px",
            borderRadius: "20px",
            fontSize: "0.84rem",
            fontWeight: 700,
            border: 0,
            cursor: "pointer",
            background: activeSection === "CHECKLIST" ? "#0d9488" : "#f1f5f9",
            color: activeSection === "CHECKLIST" ? "#ffffff" : "#475569",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            transition: "all 0.15s ease",
          }}
        >
          <CheckCircle2 size={15} />
          <span>قائمة الفحص اليومية ({readinessState.checklist.length})</span>
        </button>
      </div>

      {/* Section 1: Rooms & Labs */}
      {(activeSection === "ALL" || activeSection === "ROOMS") && (
        <ReadinessRoomsSection
          rooms={syncedRooms}
          onOpenAddRoom={() => {
            setEditingRoom(null);
            setRoomModalOpen(true);
          }}
          onEditRoom={(room) => {
            setEditingRoom(room);
            setRoomModalOpen(true);
          }}
          onDeleteRoom={handleDeleteRoom}
        />
      )}

      {/* Section 2: Hardware Kits */}
      {(activeSection === "ALL" || activeSection === "KITS") && (
        <ReadinessKitsSection
          kits={readinessState.kits}
          onOpenAddKit={() => {
            setEditingKit(null);
            setKitModalOpen(true);
          }}
          onEditKit={(kit) => {
            setEditingKit(kit);
            setKitModalOpen(true);
          }}
          onDeleteKit={handleDeleteKit}
          onInspectKit={(kitItem) => setInspectingKit(kitItem)}
        />
      )}

      {/* Section 3: Approved Courses */}
      {(activeSection === "ALL" || activeSection === "COURSES") && (
        <section style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800, color: "#0f172a" }}>
              الكورسات والمناهج المعتمدة بالفرع ({courses.length})
            </h3>
            <span style={{ fontSize: "0.82rem", color: "#64748b" }}>
              قوالب جاهزة لإنشاء مجموعات فورية
            </span>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "14px",
            }}
          >
            {courses.map((course) => (
              <div
                key={course.id}
                style={{
                  background: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "12px",
                  padding: "16px",
                  boxShadow: "0 2px 6px rgba(15, 23, 42, 0.04)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  gap: "12px",
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
                    <span
                      style={{
                        fontSize: "0.72rem",
                        fontWeight: 700,
                        background: "#f0fdfa",
                        color: "#0f766e",
                        padding: "2px 8px",
                        borderRadius: "6px",
                      }}
                    >
                      {course.track}
                    </span>
                    <span style={{ fontSize: "0.75rem", color: "#64748b" }}>{course.level}</span>
                  </div>
                  <h4 style={{ margin: "4px 0", fontSize: "0.98rem", fontWeight: 700, color: "#0f172a" }}>
                    {course.name}
                  </h4>
                  <p style={{ margin: 0, fontSize: "0.78rem", color: "#64748b", lineHeight: 1.5 }}>
                    {course.description}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (onOpenCreateGroupForCourse) {
                      onOpenCreateGroupForCourse(course.id);
                    } else {
                      onOpenCreateGroupModal();
                    }
                  }}
                  style={{
                    background: "#0d9488",
                    color: "#ffffff",
                    border: 0,
                    borderRadius: "8px",
                    padding: "8px 14px",
                    fontSize: "0.82rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                  }}
                >
                  <Plus size={14} />
                  <span>إنشاء مجموعة لهذا الكورس</span>
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Section 4: Competitions & Arenas */}
      {(activeSection === "ALL" || activeSection === "COMPETITIONS") && (
        <ReadinessCompetitionsSection
          competitions={readinessState.competitions}
          onOpenAddCompetition={() => {
            setEditingComp(null);
            setCompModalOpen(true);
          }}
          onEditCompetition={(comp) => {
            setEditingComp(comp);
            setCompModalOpen(true);
          }}
          onDeleteCompetition={handleDeleteComp}
        />
      )}

      {/* Section 5: Daily Operational Checklist */}
      {(activeSection === "ALL" || activeSection === "CHECKLIST") && (
        <ReadinessChecklistSection
          checklist={readinessState.checklist}
          onToggleItem={handleToggleChecklist}
          onAddItem={handleAddChecklistItem}
        />
      )}

      {/* Modals */}
      <RoomModal
        isOpen={roomModalOpen}
        onClose={() => {
          setRoomModalOpen(false);
          setEditingRoom(null);
        }}
        onSave={handleSaveRoom}
        initialRoom={editingRoom}
      />

      <KitModal
        isOpen={kitModalOpen}
        onClose={() => {
          setKitModalOpen(false);
          setEditingKit(null);
        }}
        onSave={handleSaveKit}
        initialKit={editingKit}
      />

      <CompetitionModal
        isOpen={compModalOpen}
        onClose={() => {
          setCompModalOpen(false);
          setEditingComp(null);
        }}
        onSave={handleSaveComp}
        initialComp={editingComp}
      />

      {inspectingKit && (
        <KitInventoryDetailsModal
          isOpen={Boolean(inspectingKit)}
          kit={inspectingKit}
          branchName={branchName}
          onClose={() => setInspectingKit(null)}
        />
      )}
    </div>
  );
}
