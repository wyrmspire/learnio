import { LessonSpec } from "../contracts/lesson";

export const cncCurriculum: LessonSpec[] = [
    {
        id: "lesson-print-reading",
        schemaVersion: "1.0.0",
        version: "v1.0.0",
        title: "Reading Engineering Prints",
        topic: "Machining",
        description: "Learn to interpret engineering drawings: orthographic views, axis detection, and feature recognition for holes, slots, chamfers, and more.",
        difficulty: "beginner",
        estimatedDuration: 50,
        tags: ["print-reading", "blueprint", "gdt", "feature-recognition", "axis-detection", "cnc", "machining"],
        capabilityIds: ["cap-machining"],
        cuIds: ["cu-print-reading"],
        stages: {
            plan: {
                blocks: [
                    {
                        id: "b-pr-plan-1",
                        type: "explainer",
                        markdown: "## Reading a Print: Orthographic Projection\n\nAn engineering print (blueprint) uses **orthographic projection** to represent a 3-D part on a 2-D page. Three standard views are arranged in a fixed layout:\n\n| View | Axes Shown | Position on Sheet |\n|------|-----------|------------------|\n| **Front view** | X (width) and Z (height) | Center |\n| **Top view** | X (width) and Y (depth) | Above front view |\n| **Right side view** | Y (depth) and Z (height) | Right of front view |\n\n> ⚠️ **Common mix-up**: Depth (Y) runs *into* the page on the front view, making it invisible — it only appears in the **top** and **right side** views. Always identify the view first before reading an axis dimension."
                    },
                    {
                        id: "b-pr-plan-2",
                        type: "explainer",
                        markdown: "## Feature Recognition on a Print\n\nCommon machined features have standardized drawing callouts:\n\n- **Hole**: A circle in one view, two hidden lines in the adjacent view. Callout shows diameter (Ø) and depth.\n- **Counterbore (⌴)**: Two concentric circles; the inner circle is the through-hole, the outer is the counterbore. Depth of counterbore is listed separately.\n- **Countersink (⌵)**: Two concentric circles where the outer includes a 90° or 82° included angle callout.\n- **Slot**: Rectangular in the top view, shown with hidden dashed lines in the front view.\n- **Chamfer**: An angled line at an edge; callout is `X × 45°` (e.g., `0.030 × 45°`).\n- **Radius / Fillet**: Marked with `R` prefix (e.g., `R0.125`).\n\nAlways cross-reference **at least two views** to confirm what you're seeing — a circle in one view could be a hole, a boss, or a cylinder depending on the other views."
                    },
                    {
                        id: "b-pr-plan-3",
                        type: "prediction",
                        prompt: "On an orthographic drawing, you see a circle in the TOP view but there is no corresponding circle in the FRONT view — instead you see two short dashed lines. What feature is most likely shown?",
                        placeholder: "I think the feature is...",
                        correctAnswerReveal: "A hole that passes through the part from top to bottom. Dashed (hidden) lines in adjacent views indicate hidden edges — here, the interior walls of the hole are not visible from the front, so they appear dashed."
                    }
                ]
            },
            do: {
                blocks: [
                    {
                        id: "b-pr-do-1",
                        type: "scenario",
                        title: "The Mounting Plate",
                        description: "You have a print for a rectangular aluminum mounting plate. The front view shows the plate's width (X = 4.000\") and height (Z = 0.500\"). The top view shows width (X = 4.000\") and depth (Y = 2.500\"). Four circles in the top view are positioned near the corners. In the front view, each circle position shows two dashed vertical lines."
                    },
                    {
                        id: "b-pr-do-2",
                        type: "quiz",
                        question: "On the mounting plate print, what do the four circles in the top view combined with the dashed lines in the front view indicate?",
                        options: [
                            { id: "o1", text: "Cylindrical bosses (raised posts) on the top surface.", isCorrect: false, feedback: "Bosses would show as solid lines in the front view, not dashed lines." },
                            { id: "o2", text: "Through-holes drilled from top to bottom (dashed = hidden interior walls).", isCorrect: true, feedback: "Correct! Dashed lines in the adjacent view confirm the feature is hidden — the hole's interior is not visible from the front." },
                            { id: "o3", text: "Counterbores on the bottom face.", isCorrect: false, feedback: "Counterbores show as two concentric circles in the top view. These are simple circles." }
                        ]
                    },
                    {
                        id: "b-pr-do-3",
                        type: "exercise",
                        prompt: "The hole callout on the print reads: `4× Ø0.257 THRU`. Translate this into plain English, and identify which axis the hole travels along if it is drilled from the top face of the plate.",
                        hints: [
                            "The `4×` prefix means this feature repeats 4 times.",
                            "Ø is the diameter symbol.",
                            "THRU means the hole goes completely through the part.",
                            "The top face of the plate is the X–Y plane. Drilling from this face goes along the Z axis."
                        ],
                        solution: "Four holes, each 0.257\" in diameter, drilled completely through the part. Because they are drilled from the top face (X–Y plane), they travel along the **Z axis**."
                    }
                ]
            },
            check: {
                blocks: [
                    {
                        id: "b-pr-check-1",
                        type: "quiz",
                        question: "Which two axes are visible in the FRONT view of a standard orthographic drawing?",
                        options: [
                            { id: "o1", text: "X (width) and Y (depth)", isCorrect: false, feedback: "Y (depth) runs into the page in the front view — it is not shown there. Y appears in the top and right side views." },
                            { id: "o2", text: "X (width) and Z (height)", isCorrect: true, feedback: "Correct. The front view always shows width (X) horizontally and height (Z) vertically." },
                            { id: "o3", text: "Y (depth) and Z (height)", isCorrect: false, feedback: "Y and Z together appear in the RIGHT SIDE view, not the front view." }
                        ]
                    },
                    {
                        id: "b-pr-check-2",
                        type: "quiz",
                        question: "A print callout reads `0.030 × 45°` at the corner of a part. What machined feature does this describe?",
                        options: [
                            { id: "o1", text: "A radius blend (fillet) of 0.030\".", isCorrect: false, feedback: "Fillets and radii use the `R` prefix (e.g., R0.030), not the `× 45°` notation." },
                            { id: "o2", text: "A chamfer: a 0.030\" flat cut at a 45° angle removing the sharp corner.", isCorrect: true, feedback: "Correct. The `dimension × 45°` format is the standard chamfer callout." },
                            { id: "o3", text: "A countersink with 45° included angle.", isCorrect: false, feedback: "Countersinks use the ⌵ symbol and list the included angle (typically 82° or 90°), not the `× 45°` shorthand." }
                        ]
                    }
                ]
            },
            act: {
                blocks: [
                    {
                        id: "b-pr-act-1",
                        type: "reflection",
                        prompt: "Think about the last time you (or someone you know) misread a dimension or feature on a print. Which view was misidentified, and which axis was mixed up? How would the three-view cross-reference rule have prevented the error?"
                    },
                    {
                        id: "b-pr-act-2",
                        type: "todo",
                        text: "Find a simple engineering print (or download one online). Identify every feature using the callout guide above — list: feature type, affected axis, and the view(s) where it is visible."
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
