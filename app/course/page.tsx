"use client";

import { useState, useEffect } from "react";
import { eventStore } from "@/lib/events/store";
import { skillLoader } from "@/lib/skills/loader";
import {
    projectCourseProgress,
    projectSkillMastery,
    CourseProgress,
    SkillMastery,
} from "@/lib/events/read-models";
import { DomainEvent } from "@/lib/events/types";
import { SkillManifest, CourseManifest } from "@/lib/contracts/skills";
import Link from "next/link";
import {
    BookOpen,
    Trophy,
    CheckCircle2,
    Clock,
    ArrowRight,
    ChevronRight,
    Layers,
    Star,
    Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

// --- Types for dashboard state ---
interface SkillRow {
    skill: SkillManifest;
    mastery: SkillMastery;
    courses: Array<{
        course: CourseManifest;
        progress: CourseProgress;
    }>;
}

const MASTERY_CONFIG = {
    expert: {
        label: "Expert",
        color: "text-emerald-700",
        bg: "bg-emerald-50",
        border: "border-emerald-200",
        bar: "bg-emerald-500",
        icon: Trophy,
    },
    competent: {
        label: "Competent",
        color: "text-blue-700",
        bg: "bg-blue-50",
        border: "border-blue-200",
        bar: "bg-blue-500",
        icon: Star,
    },
    novice: {
        label: "Novice",
        color: "text-amber-700",
        bg: "bg-amber-50",
        border: "border-amber-200",
        bar: "bg-amber-400",
        icon: Zap,
    },
} as const;

export default function CourseOverviewPage() {
    const [skillRows, setSkillRows] = useState<SkillRow[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                const registry = await skillLoader.loadRegistry();
                const events: DomainEvent[] = eventStore.listEvents();

                const rows: SkillRow[] = [];

                for (const registryEntry of registry.skills) {
                    const skill = await skillLoader.loadSkillManifest(registryEntry.id);

                    // Gather all courses for this skill by trying to load them
                    // We know from loader mock that courses reference skill by skillId
                    const courseIds = (skill.branches ?? []).map((b) => b.targetCourseId);
                    const courseProgressMap = new Map<string, CourseProgress>();
                    const courseRows: SkillRow["courses"] = [];

                    for (const courseId of courseIds) {
                        try {
                            const course = await skillLoader.loadCourse(courseId);
                            const progress = projectCourseProgress(
                                events,
                                courseId,
                                course.lessonOrder
                            );
                            courseProgressMap.set(courseId, progress);
                            courseRows.push({ course, progress });
                        } catch {
                            // course not found, skip
                        }
                    }

                    const mastery = projectSkillMastery(skill.id, courseIds, courseProgressMap);
                    rows.push({ skill, mastery, courses: courseRows });
                }

                setSkillRows(rows);
            } finally {
                setLoading(false);
            }
        }

        load();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64 text-stone-500">
                Loading dashboard…
            </div>
        );
    }

    if (skillRows.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-4 text-stone-400">
                <Layers className="w-12 h-12 opacity-40" />
                <p className="text-sm">No skills installed yet.</p>
            </div>
        );
    }

    return (
        <div className="space-y-10 max-w-4xl mx-auto">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-semibold tracking-tight text-stone-900">
                    Course Overview
                </h1>
                <p className="text-stone-500 mt-2">
                    Live mastery state from your event history.
                </p>
            </div>

            {/* Skill Cards */}
            {skillRows.map(({ skill, mastery, courses }) => {
                const cfg = MASTERY_CONFIG[mastery.masteryLevel];
                const MasteryIcon = cfg.icon;

                return (
                    <div
                        key={skill.id}
                        className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-sm"
                    >
                        {/* Skill Header */}
                        <div className="p-6 border-b border-stone-100 flex items-start justify-between">
                            <div className="flex items-start gap-4">
                                <div
                                    className={cn(
                                        "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                                        cfg.bg,
                                        cfg.border,
                                        "border"
                                    )}
                                >
                                    <MasteryIcon className={cn("w-5 h-5", cfg.color)} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-semibold text-stone-900">
                                        {skill.name}
                                    </h2>
                                    <p className="text-sm text-stone-500 mt-0.5">
                                        {skill.description}
                                    </p>
                                    <div className="flex flex-wrap gap-1.5 mt-2">
                                        {skill.tags.map((tag) => (
                                            <span
                                                key={tag}
                                                className="px-2 py-0.5 bg-stone-100 text-stone-600 text-xs rounded-md font-medium"
                                            >
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Mastery Badge */}
                            <div
                                className={cn(
                                    "px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 shrink-0",
                                    cfg.bg,
                                    cfg.color,
                                    cfg.border,
                                    "border"
                                )}
                            >
                                <MasteryIcon className="w-4 h-4" />
                                {cfg.label}
                            </div>
                        </div>

                        {/* Mastery Progress Bar */}
                        <div className="px-6 py-4 bg-stone-50 border-b border-stone-100">
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-stone-600 font-medium">Skill Progress</span>
                                <span className="text-stone-800 font-semibold">
                                    {mastery.coursesCompleted} / {mastery.totalCourses} courses complete
                                </span>
                            </div>
                            <div className="h-2.5 bg-stone-200 rounded-full overflow-hidden">
                                <div
                                    className={cn(
                                        "h-full rounded-full transition-all duration-700",
                                        cfg.bar
                                    )}
                                    style={{
                                        width: `${mastery.totalCourses > 0
                                                ? (mastery.coursesCompleted / mastery.totalCourses) * 100
                                                : 0
                                            }%`,
                                    }}
                                />
                            </div>
                        </div>

                        {/* Course List */}
                        <div className="divide-y divide-stone-100">
                            {courses.map(({ course, progress }) => {
                                const pct = progress.percentComplete;
                                const isComplete = pct === 100;
                                const hasStarted = progress.startedAt !== "";

                                return (
                                    <div key={course.id} className="p-6">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-start gap-3">
                                                <div
                                                    className={cn(
                                                        "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
                                                        isComplete
                                                            ? "bg-emerald-100"
                                                            : hasStarted
                                                                ? "bg-blue-100"
                                                                : "bg-stone-100"
                                                    )}
                                                >
                                                    {isComplete ? (
                                                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                                    ) : hasStarted ? (
                                                        <BookOpen className="w-4 h-4 text-blue-600" />
                                                    ) : (
                                                        <Clock className="w-4 h-4 text-stone-400" />
                                                    )}
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-stone-900">
                                                        {course.title}
                                                    </h3>
                                                    <p className="text-sm text-stone-500 mt-0.5">
                                                        {course.description}
                                                    </p>
                                                </div>
                                            </div>

                                            <span
                                                className={cn(
                                                    "text-sm font-bold ml-4 shrink-0",
                                                    isComplete
                                                        ? "text-emerald-600"
                                                        : hasStarted
                                                            ? "text-blue-600"
                                                            : "text-stone-400"
                                                )}
                                            >
                                                {pct}%
                                            </span>
                                        </div>

                                        {/* Per-course progress bar */}
                                        <div className="mb-4">
                                            <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                                                <div
                                                    className={cn(
                                                        "h-full rounded-full transition-all duration-700",
                                                        isComplete
                                                            ? "bg-emerald-500"
                                                            : hasStarted
                                                                ? "bg-blue-500"
                                                                : "bg-stone-200"
                                                    )}
                                                    style={{ width: `${pct}%` }}
                                                />
                                            </div>
                                        </div>

                                        {/* Lesson pills */}
                                        <div className="flex flex-wrap gap-2 mb-4">
                                            {course.lessonOrder.map((lessonId) => {
                                                const isLessonDone =
                                                    progress.completedLessonIds.includes(lessonId);
                                                const isCurrent =
                                                    progress.currentLessonId === lessonId;

                                                return (
                                                    <span
                                                        key={lessonId}
                                                        className={cn(
                                                            "px-2.5 py-1 rounded-md text-xs font-medium border flex items-center gap-1",
                                                            isLessonDone
                                                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                                                : isCurrent
                                                                    ? "bg-blue-50 text-blue-700 border-blue-300 ring-1 ring-blue-200"
                                                                    : "bg-stone-50 text-stone-400 border-stone-200"
                                                        )}
                                                    >
                                                        {isLessonDone && (
                                                            <CheckCircle2 className="w-3 h-3" />
                                                        )}
                                                        {lessonId.replace("lesson-", "")}
                                                    </span>
                                                );
                                            })}
                                        </div>

                                        {/* CTA */}
                                        {!isComplete && progress.currentLessonId && (
                                            <Link
                                                href={`/learn?lessonId=${progress.currentLessonId}&courseId=${course.id}&skillId=${skill.id}`}
                                                className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                                            >
                                                Continue: {progress.currentLessonId.replace("lesson-", "")}
                                                <ChevronRight className="w-4 h-4" />
                                            </Link>
                                        )}
                                        {!isComplete && !progress.currentLessonId && !hasStarted && (
                                            <Link
                                                href={`/learn?lessonId=${course.lessonOrder[0]}&courseId=${course.id}&skillId=${skill.id}`}
                                                className="inline-flex items-center gap-1.5 text-sm font-medium text-stone-600 hover:text-stone-900 transition-colors"
                                            >
                                                Start Course
                                                <ArrowRight className="w-4 h-4" />
                                            </Link>
                                        )}
                                        {isComplete && (
                                            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600">
                                                <CheckCircle2 className="w-4 h-4" />
                                                Course Complete
                                            </span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
