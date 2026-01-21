"use client";

import { useState } from "react";
import { mockTasks, mockClients } from "@/lib/mock-data";
import type { Task, TaskStatus, TaskPriority } from "@/lib/types";

const PRIORITY_CONFIG: Record<TaskPriority, { label: string; color: string; bgColor: string }> = {
  urgent: { label: "Urgent", color: "text-red-700", bgColor: "bg-red-50 border-red-200" },
  high: { label: "High", color: "text-orange-700", bgColor: "bg-orange-50 border-orange-200" },
  medium: { label: "Medium", color: "text-[#2D4A43]", bgColor: "bg-[#2D4A43]/5 border-[#2D4A43]/20" },
  low: { label: "Low", color: "text-gray-600", bgColor: "bg-gray-50 border-gray-200" },
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const [filter, setFilter] = useState<"all" | TaskStatus>("all");
  const [showAddModal, setShowAddModal] = useState(false);

  const filteredTasks = filter === "all"
    ? tasks.filter(t => t.status !== "cancelled")
    : tasks.filter(t => t.status === filter);

  const pendingCount = tasks.filter(t => t.status === "pending").length;
  const inProgressCount = tasks.filter(t => t.status === "in_progress").length;
  const completedCount = tasks.filter(t => t.status === "completed").length;

  const getClientName = (clientId: string | null) => {
    if (!clientId) return null;
    const client = mockClients.find(c => c.id === clientId);
    return client ? `${client.first_name} ${client.last_name}` : null;
  };

  const formatDueDate = (dueDate: string | null) => {
    if (!dueDate) return null;
    const date = new Date(dueDate);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return { text: "Today", isOverdue: false, isUrgent: true };
    }
    if (date.toDateString() === tomorrow.toDateString()) {
      return { text: "Tomorrow", isOverdue: false, isUrgent: true };
    }
    if (date < today) {
      return { text: "Overdue", isOverdue: true, isUrgent: true };
    }
    return {
      text: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      isOverdue: false,
      isUrgent: false
    };
  };

  const toggleTaskStatus = (taskId: string) => {
    setTasks(prev => prev.map(task => {
      if (task.id === taskId) {
        const newStatus: TaskStatus = task.status === "completed" ? "pending" : "completed";
        return {
          ...task,
          status: newStatus,
          completed_at: newStatus === "completed" ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        };
      }
      return task;
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-brand-heading text-2xl font-semibold text-gray-900">
            Tasks
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your work and stay on top of deadlines
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-[#2D4A43] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#3D5A53] transition-all shadow-sm"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Task
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pending</p>
              <p className="text-2xl font-semibold text-gray-900 mt-1">{pendingCount}</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-yellow-50 flex items-center justify-center">
              <svg className="h-5 w-5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">In Progress</p>
              <p className="text-2xl font-semibold text-gray-900 mt-1">{inProgressCount}</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Completed</p>
              <p className="text-2xl font-semibold text-gray-900 mt-1">{completedCount}</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-emerald-50 flex items-center justify-center">
              <svg className="h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="border-b border-gray-100">
          <nav className="flex gap-1 p-1">
            {[
              { value: "all", label: "All Tasks" },
              { value: "pending", label: "Pending" },
              { value: "in_progress", label: "In Progress" },
              { value: "completed", label: "Completed" },
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => setFilter(tab.value as "all" | TaskStatus)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                  filter === tab.value
                    ? "bg-[#2D4A43] text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Task List */}
        <div className="divide-y divide-gray-100">
          {filteredTasks.length === 0 ? (
            <div className="p-8 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              <p className="mt-3 text-sm text-gray-500">No tasks found</p>
            </div>
          ) : (
            filteredTasks.map((task) => {
              const clientName = getClientName(task.client_id);
              const dueInfo = formatDueDate(task.due_date);
              const priorityConfig = PRIORITY_CONFIG[task.priority];

              return (
                <div
                  key={task.id}
                  className={`p-4 hover:bg-gray-50/50 transition-all ${
                    task.status === "completed" ? "opacity-60" : ""
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Checkbox */}
                    <button
                      onClick={() => toggleTaskStatus(task.id)}
                      className={`mt-0.5 h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all ${
                        task.status === "completed"
                          ? "bg-emerald-500 border-emerald-500"
                          : "border-gray-300 hover:border-[#2D4A43]"
                      }`}
                    >
                      {task.status === "completed" && (
                        <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>

                    {/* Task Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className={`text-sm font-medium ${
                            task.status === "completed" ? "text-gray-500 line-through" : "text-gray-900"
                          }`}>
                            {task.title}
                          </h3>
                          {task.description && (
                            <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">
                              {task.description}
                            </p>
                          )}
                          <div className="flex items-center gap-3 mt-2">
                            {clientName && (
                              <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                {clientName}
                              </span>
                            )}
                            {dueInfo && (
                              <span className={`inline-flex items-center gap-1 text-xs ${
                                dueInfo.isOverdue ? "text-red-600" : dueInfo.isUrgent ? "text-orange-600" : "text-gray-500"
                              }`}>
                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                {dueInfo.text}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Priority Badge */}
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border ${priorityConfig.bgColor} ${priorityConfig.color}`}>
                          {priorityConfig.label}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Add Task Modal Placeholder */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h2 className="font-brand-heading text-lg font-semibold text-gray-900 mb-4">
              Add New Task
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              Task creation form will be implemented with database integration.
            </p>
            <div className="flex justify-end">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
