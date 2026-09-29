import { Check, ChevronDown, UserRound } from "lucide-react";

export type FamilyChild = {
  id: string;
  name: string;
  initials: string;
  course: string;
  branch: string;
  color: string;
};

export type ChildrenSwitcherProps = {
  children: FamilyChild[];
  selectedId: string;
  onSelect: (id: string) => void;
};

export default function ChildrenSwitcher({
  children,
  selectedId,
  onSelect,
}: ChildrenSwitcherProps) {
  const selected =
    children.find(child => child.id === selectedId) ?? children[0];
  return (
    <section className="family-children-switcher" aria-label="اختيار الطفل">
      <div className="family-children-switcher-heading">
        <span>
          <UserRound size={16} />
        </span>
        <div>
          <small>حساب ولي الأمر</small>
          <strong>أطفالي المرتبطون</strong>
        </div>
        <ChevronDown size={15} />
      </div>
      <div className="family-children-list">
        {children.map(child => (
          <button
            type="button"
            key={child.id}
            className={child.id === selectedId ? "selected" : ""}
            onClick={() => onSelect(child.id)}
          >
            <span className={`family-child-avatar ${child.color}`}>
              {child.initials}
            </span>
            <span>
              <strong>{child.name}</strong>
              <small>{child.course}</small>
            </span>
            {child.id === selectedId && <Check size={14} />}
          </button>
        ))}
      </div>
      <p>
        أنت تشاهد الآن: <strong>{selected.name}</strong> · لا يظهر هنا أي طفل
        غير مرتبط بحسابك.
      </p>
    </section>
  );
}
