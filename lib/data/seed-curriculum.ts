import { LessonSpec } from "../contracts/lesson";
import { cncCurriculum } from "./seed-cnc-curriculum";

const baseCurriculum: LessonSpec[] = [
  {
    id: "lesson-ai-evals",
    schemaVersion: "1.0.0",
    version: "v1.0.0",
    title: "Designing Deterministic Evals",
    topic: "AI Engineering",
    description: "Learn how to build reliable measurement systems for non-deterministic AI models. Move from 'vibes-based' development to metric-driven engineering.",
    difficulty: "intermediate",
    estimatedDuration: 45,
    tags: ["ai", "evals", "engineering"],
    capabilityIds: ["cap-ai-eng"],
    cuIds: ["cu-evals"],
    stages: {
      plan: {
        blocks: [
          {
            id: "b-plan-1",
            type: "explainer",
            markdown: "## The 'Vibes' Problem\n\nBuilding with LLMs is easy; improving them reliably is hard. Most developers rely on 'vibes'—manually testing a few inputs and feeling good about the output.\n\nTo engineer reliable systems, we need **Deterministic Evals**: automated tests that score model outputs against fixed criteria."
          },
          {
            id: "b-plan-2",
            type: "prediction",
            prompt: "If you change your system prompt to be 'more polite', how will you know if you accidentally hurt factual accuracy?",
            placeholder: "I would check...",
            correctAnswerReveal: "Without a dataset of 'factual' questions and a scoring function, you can't know. You need a regression test suite."
          }
        ]
      },
      do: {
        blocks: [
          {
            id: "b-do-1",
            type: "scenario",
            title: "The Customer Support Bot",
            description: "You are building a support bot. You want to ensure it NEVER recommends competitors. You have a dataset of 50 user queries."
          },
          {
            id: "b-do-2",
            type: "exercise",
            prompt: "Write a simple 'assertion' function in pseudocode (or Python) that returns TRUE if the model output is safe, and FALSE if it mentions a competitor.",
            initialCode: "def is_safe(output: str) -> bool:\n    competitors = ['CompA', 'CompB']\n    # Your logic here\n    return True",
            language: "python",
            hints: [
              "Check if any string in `competitors` appears in `output`.",
              "Make sure to handle case sensitivity.",
              "Return False if a match is found."
            ],
            solution: "def is_safe(output: str) -> bool:\n    competitors = ['CompA', 'CompB']\n    output_lower = output.lower()\n    for c in competitors:\n        if c.lower() in output_lower:\n            return False\n    return True"
          }
        ]
      },
      check: {
        blocks: [
          {
            id: "b-check-1",
            type: "quiz",
            question: "What is the primary benefit of 'Model-Graded Evals' (using an LLM to score an LLM)?",
            options: [
              { id: "o1", text: "They are faster than code assertions.", isCorrect: false, feedback: "LLMs are slower than simple code checks." },
              { id: "o2", text: "They can judge semantic nuance (e.g., 'is this helpful?') better than regex.", isCorrect: true, feedback: "Correct. They act as a fuzzy judge." },
              { id: "o3", text: "They are always 100% accurate.", isCorrect: false, feedback: "LLM judges can also hallucinate or be biased." }
            ]
          }
        ]
      },
      act: {
        blocks: [
          {
            id: "b-act-1",
            type: "reflection",
            prompt: "How would you apply this to your current project? What is ONE metric you could track automatically?"
          },
          {
            id: "b-act-2",
            type: "todo",
            text: "Create a dataset of 10 'golden' inputs/outputs for your main feature."
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
    id: "lesson-rag-patterns",
    schemaVersion: "1.0.0",
    version: "v1.0.0",
    title: "RAG Architecture Patterns",
    topic: "AI Engineering",
    description: "Beyond simple vector search. Explore Hybrid Search, Re-ranking, and Query Expansion.",
    difficulty: "advanced",
    estimatedDuration: 60,
    tags: ["ai", "rag", "architecture"],
    capabilityIds: ["cap-ai-eng"],
    cuIds: ["cu-rag"],
    stages: {
      plan: {
        blocks: [
          {
            id: "b-plan-1",
            type: "explainer",
            markdown: "## Why Vector Search Isn't Enough\n\nSemantic search is great for concepts, but terrible for keywords. If a user searches for 'Part #12345', vector search might return 'Part #12346' because they are semantically similar (both parts).\n\n**Hybrid Search** combines Keyword (BM25) and Vector (Cosine Similarity) to get the best of both worlds."
          },
          {
            id: "b-plan-2",
            type: "diagram",
            diagramType: "mermaid",
            content: "graph LR\n  Q[User Query] --> K[Keyword Search]\n  Q --> V[Vector Search]\n  K --> M[Merge & Rank]\n  V --> M\n  M --> C[Context Window]",
            caption: "Hybrid Search Pipeline"
          }
        ]
      },
      do: {
        blocks: [
          {
            id: "b-do-1",
            type: "scenario",
            title: "The Legal Discovery Bot",
            description: "Lawyers need to find documents mentioning specific case numbers (exact match) AND general precedents (semantic match)."
          },
          {
            id: "b-do-2",
            type: "exercise",
            prompt: "Design a retrieval strategy. Which search type would you prioritize for 'Case 19-cv-001' vs 'cases about water rights'?",
            hints: [
              "Case numbers are unique identifiers.",
              "'Water rights' is a broad concept.",
              "How do you combine them?"
            ],
            solution: "Use Hybrid Search. Boost Keyword score for regex-like patterns (case numbers). Boost Vector score for natural language queries."
          }
        ]
      },
      check: {
        blocks: [
          {
            id: "b-check-1",
            type: "quiz",
            question: "What is 'Re-ranking' in a RAG pipeline?",
            options: [
              { id: "o1", text: "Sorting results alphabetically.", isCorrect: false },
              { id: "o2", text: "Using a high-precision model (Cross-Encoder) to re-score the top N results from the fast retriever.", isCorrect: true, feedback: "Yes. Retrieval is fast/coarse; Re-ranking is slow/precise." },
              { id: "o3", text: "Running the query multiple times.", isCorrect: false }
            ]
          }
        ]
      },
      act: {
        blocks: [
          {
            id: "b-act-1",
            type: "reflection",
            prompt: "Does your current knowledge base search fail on keywords or concepts? Which is the bigger pain point?"
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
    id: "lesson-tool-use",
    schemaVersion: "1.0.0",
    version: "v1.0.0",
    title: "Tool Use & Agency",
    topic: "AI Engineering",
    description: "Give LLMs hands. How to define tools, handle arguments, and prevent loops.",
    difficulty: "intermediate",
    estimatedDuration: 50,
    tags: ["ai", "agents", "tools"],
    capabilityIds: ["cap-ai-eng"],
    cuIds: ["cu-tools"],
    stages: {
      plan: {
        blocks: [
          {
            id: "b-plan-1",
            type: "explainer",
            markdown: "## LLMs are Brains in Jars\n\nBy default, an LLM can only output text. To take action (send email, query DB), we must give it **Tools**.\n\nA Tool is just a function definition (JSON Schema) that we show to the model. The model outputs JSON arguments, we run the function, and give the result back."
          }
        ]
      },
      do: {
        blocks: [
          {
            id: "b-do-1",
            type: "exercise",
            prompt: "Define a JSON Schema for a tool called `get_weather(location: str, unit: 'c' | 'f')`.",
            initialCode: "{\n  \"name\": \"get_weather\",\n  \"description\": \"Get current weather\",\n  \"parameters\": {\n    \"type\": \"object\",\n    \"properties\": {\n      // ...\n    }\n  }\n}",
            language: "json",
            hints: [
              "Use standard JSON Schema format.",
              "Define 'location' as a string.",
              "Define 'unit' as an enum."
            ],
            solution: "{\n  \"name\": \"get_weather\",\n  \"description\": \"Get current weather\",\n  \"parameters\": {\n    \"type\": \"object\",\n    \"properties\": {\n      \"location\": { \"type\": \"string\" },\n      \"unit\": { \"type\": \"string\", \"enum\": [\"c\", \"f\"] }\n    },\n    \"required\": [\"location\"]\n  }\n}"
          }
        ]
      },
      check: {
        blocks: [
          {
            id: "b-check-1",
            type: "quiz",
            question: "What happens if the model outputs invalid JSON for the tool arguments?",
            options: [
              { id: "o1", text: "The tool runs anyway.", isCorrect: false },
              { id: "o2", text: "The system crashes.", isCorrect: false },
              { id: "o3", text: "You must catch the error and feed it back to the model so it can self-correct.", isCorrect: true, feedback: "Correct. This is the 'repair loop'." }
            ]
          }
        ]
      },
      act: {
        blocks: [
          {
            id: "b-act-1",
            type: "todo",
            text: "Implement a simple 'calculator' tool for your chatbot."
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

export const seedCurriculum: LessonSpec[] = [...baseCurriculum, ...cncCurriculum];
