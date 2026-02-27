import { LessonSpec } from "../contracts/lesson";

export const cncCurriculum: LessonSpec[] = [
    {
        id: "lesson-manual-basics",
        schemaVersion: "1.0.0",
        version: "v1.0.0",
        title: "Manual Machining Basics",
        topic: "Machining",
        description: "Understand the foundational principles of chip making, feeds, speeds, and essential shop safety.",
        difficulty: "beginner",
        estimatedDuration: 45,
        tags: ["machining", "manual", "safety", "foundations"],
        capabilityIds: ["cap-machining"],
        cuIds: ["cu-manual-basics"],
        stages: {
            plan: {
                blocks: [
                    {
                        id: "b-m-plan-1",
                        type: "explainer",
                        markdown: "## The Fundamentals of Chip Making\n\nMachining is essentially the process of removing material to shape a part. Knowing your material, selecting the right tool, and calculating proper Feeds and Speeds are critical to success."
                    }
                ]
            },
            do: {
                blocks: [
                    {
                        id: "b-m-do-1",
                        type: "prediction",
                        prompt: "If you double the spindle RPM without changing the feed rate, what happens to the chip load?",
                        placeholder: "The chip load will...",
                        correctAnswerReveal: "It gets cut in half. Chip load (feed per tooth) decreases as RPM increases, assuming feed rate stays constant."
                    }
                ]
            },
            check: {
                blocks: [
                    {
                        id: "b-m-check-1",
                        type: "quiz",
                        question: "Why is coolant used during machining operations?",
                        options: [
                            { id: "o1", text: "To make the part shiny.", isCorrect: false },
                            { id: "o2", text: "To reduce heat, clear chips, and lubricate the cut.", isCorrect: true, feedback: "Correct! Heat management and chip evacuation are vital." },
                            { id: "o3", text: "To harden the material.", isCorrect: false }
                        ]
                    }
                ]
            },
            act: {
                blocks: [
                    {
                        id: "b-m-act-1",
                        type: "todo",
                        text: "Memorize the basic SFM (Surface Feet per Minute) for Aluminum and Mild Steel."
                    }
                ]
            }
        },
        provenance: {
            generatorModel: "human-author",
            promptBundleVersion: "v0.0.0"
        }
    },
    {
        id: "lesson-grinding-ht",
        schemaVersion: "1.0.0",
        version: "v1.0.0",
        title: "Grinding & Heat Treating",
        topic: "Machining",
        description: "Learn precision surface finishing and how to alter material properties through heat treatment.",
        difficulty: "intermediate",
        estimatedDuration: 60,
        tags: ["grinding", "heat-treat", "metallurgy", "precision"],
        capabilityIds: ["cap-machining"],
        cuIds: ["cu-grinding-ht"],
        stages: {
            plan: {
                blocks: [
                    {
                        id: "b-ght-plan-1",
                        type: "explainer",
                        markdown: "## Attaining Tight Tolerances\n\nWhen a lathe or mill can't get you to the exact tenth (0.0001\"), surface grinders are used. Combined with **Heat Treating** (Hardening, Tempering, Annealing), you can create parts that are both wear-resistant and precisely dimensioned."
                    }
                ]
            },
            do: {
                blocks: [
                    {
                        id: "b-ght-do-1",
                        type: "scenario",
                        title: "The Hardened Pin",
                        description: "You need a dowel pin that won't wear down. You machine it from O1 Tool Steel, then harden it."
                    },
                    {
                        id: "b-ght-do-2",
                        type: "quiz",
                        question: "Why must you temper a part immediately after quenching it?",
                        options: [
                            { id: "o1", text: "It prevents rust.", isCorrect: false },
                            { id: "o2", text: "Quenching leaves the steel extremely brittle; tempering relieves internal stresses and restores toughness.", isCorrect: true, feedback: "Without tempering, the part could shatter like glass." },
                            { id: "o3", text: "It makes it easier to polish.", isCorrect: false }
                        ]
                    }
                ]
            },
            check: {
                blocks: [
                    {
                        id: "b-ght-check-1",
                        type: "quiz",
                        question: "What is 'spark out' in surface grinding?",
                        options: [
                            { id: "o1", text: "When the grinding wheel catches fire.", isCorrect: false },
                            { id: "o2", text: "Making passes without downfeeding until no sparks are visible, ensuring the wheel has deflected back to its true position.", isCorrect: true, feedback: "Spark out is crucial for hitting exact dimensions and surface finish." },
                            { id: "o3", text: "The process of dressing the wheel.", isCorrect: false }
                        ]
                    }
                ]
            },
            act: {
                blocks: [
                    {
                        id: "b-ght-act-1",
                        type: "reflection",
                        prompt: "Think of an application where a part requires a hard wear surface but a tough, ductile core. How would you heat treat it?"
                    }
                ]
            }
        },
        provenance: {
            generatorModel: "human-author",
            promptBundleVersion: "v0.0.0"
        }
    },
    {
        id: "lesson-cnc-intro",
        schemaVersion: "1.0.0",
        version: "v1.0.0",
        title: "Introduction to CNC Machining",
        topic: "Machining",
        description: "Transitioning from manual handwheels to Computer Numerical Control, coordinate systems, and automation.",
        difficulty: "intermediate",
        estimatedDuration: 55,
        tags: ["cnc", "automation", "coordinates", "g-code"],
        capabilityIds: ["cap-machining"],
        cuIds: ["cu-cnc-intro"],
        stages: {
            plan: {
                blocks: [
                    {
                        id: "b-cnc-plan-1",
                        type: "explainer",
                        markdown: "## Cartesian Coordinates in the Shop\n\nCNC machines operate on the Cartesian coordinate system (X, Y, Z). To command the machine, we use **G-Code**, a language that tells the machine where to move, how fast to move, and what path to follow."
                    }
                ]
            },
            do: {
                blocks: [
                    {
                        id: "b-cnc-do-1",
                        type: "exercise",
                        prompt: "Write a G-code line to rapidly move the tool to X0 Y0, then feed down to Z-0.5 at a feedrate of 10 IPM.",
                        initialCode: "G00 ...\nG01 ...",
                        language: "gcode",
                        hints: [
                            "G00 is Rapid traverse.",
                            "G01 is Linear interpolation (feeding).",
                            "Use F to specify the feedrate."
                        ],
                        solution: "G00 X0 Y0\nG01 Z-0.5 F10.0"
                    }
                ]
            },
            check: {
                blocks: [
                    {
                        id: "b-cnc-check-1",
                        type: "quiz",
                        question: "What does G90 vs G91 represent in G-code?",
                        options: [
                            { id: "o1", text: "Spindle On / Spindle Off", isCorrect: false },
                            { id: "o2", text: "Absolute Positioning vs Incremental Positioning", isCorrect: true, feedback: "Correct. G90 refers to a fixed origin, whereas G91 refers to the current tool position." },
                            { id: "o3", text: "Metric vs Imperial units", isCorrect: false }
                        ]
                    }
                ]
            },
            act: {
                blocks: [
                    {
                        id: "b-cnc-act-1",
                        type: "todo",
                        text: "Locate exactly where the X, Y, and Z zeroes (Work Offset) are located on your setup."
                    }
                ]
            }
        },
        provenance: {
            generatorModel: "human-author",
            promptBundleVersion: "v0.0.0"
        }
    }
];
