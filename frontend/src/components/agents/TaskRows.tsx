"use client";

export type TaskStatus = "idle" | "running" | "completed" | "error";

export interface TaskItem {
  id: string;
  label: string;
  detail?: string;
  status: TaskStatus;
}

interface TaskRowsProps {
  tasks: TaskItem[];
}

export default function TaskRows({ tasks }: TaskRowsProps) {
  return (
    <div className="card divide-y divide-[#ece7df] border border-[#e4dfd7] rounded-xl bg-white overflow-hidden shadow-xs">
      {tasks.map((task, index) => {
        return (
          <div
            key={task.id}
            className={`p-3.5 flex items-center justify-between transition-colors ${
              task.status === "running" ? "bg-[#faf7ff]" : ""
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-6 h-6 rounded-full text-xs font-mono">
                {task.status === "completed" && (
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                    ✓
                  </span>
                )}
                {task.status === "running" && (
                  <span className="w-4 h-4 rounded-full border-2 border-[#451ebb] border-t-transparent animate-spin" />
                )}
                {task.status === "idle" && (
                  <span className="w-5 h-5 rounded-full bg-[#f3efe8] text-[#797586] flex items-center justify-center">
                    {index + 1}
                  </span>
                )}
                {task.status === "error" && (
                  <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                    !
                  </span>
                )}
              </div>

              <div>
                <div
                  className={`text-xs font-medium ${
                    task.status === "running"
                      ? "text-[#451ebb]"
                      : task.status === "completed"
                      ? "text-[#1c1c1a]"
                      : task.status === "error"
                      ? "text-rose-600"
                      : "text-[#797586]"
                  }`}
                >
                  {task.label}
                </div>
                {task.detail && (
                  <p className="text-[11px] text-[#797586] truncate max-w-[280px] sm:max-w-[400px]">
                    {task.detail}
                  </p>
                )}
              </div>
            </div>

            <div>
              {task.status === "completed" && (
                <span className="text-[10px] font-mono uppercase bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                  Done
                </span>
              )}
              {task.status === "running" && (
                <span className="text-[10px] font-mono uppercase bg-[#f2ecff] text-[#451ebb] border border-[#d8ceff] px-2 py-0.5 rounded-full animate-pulse">
                  Processing
                </span>
              )}
              {task.status === "idle" && (
                <span className="text-[10px] font-mono uppercase bg-[#f5f2eb] text-[#a19cae] px-2 py-0.5 rounded-full">
                  Pending
                </span>
              )}
              {task.status === "error" && (
                <span className="text-[10px] font-mono uppercase bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-full">
                  Failed
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
