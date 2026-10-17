import {
  TASK_PRIORITY_LABELS,
  TASK_STATUS_LABELS,
  type TaskPriority,
  type TaskStatus,
} from "@/lib/types";
import { TASK_STATUS_BADGE } from "@/lib/collab";

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  return (
    <span className={`badge ${TASK_STATUS_BADGE[status]}`}>
      {TASK_STATUS_LABELS[status]}
    </span>
  );
}

const PRIORITY_BADGE: Record<TaskPriority, string> = {
  low: "badge-gray",
  normal: "badge-blue",
  high: "badge-yellow",
  urgent: "badge-red",
};

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  return (
    <span className={`badge ${PRIORITY_BADGE[priority]}`}>
      {TASK_PRIORITY_LABELS[priority]}
    </span>
  );
}
