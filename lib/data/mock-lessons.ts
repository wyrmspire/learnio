import { LessonSpec } from "../contracts/lesson";

export const mockRustLesson: LessonSpec = {
  id: "lesson-rust-ownership-101",
  schemaVersion: "1.0.0",
  version: "v1.0.0",
  title: "Understanding Rust Ownership",
  topic: "Rust Memory Safety",
  description: "Master the core concept of ownership, borrowing, and lifetimes in Rust.",
  difficulty: "intermediate",
  estimatedDuration: 45,
  tags: ["rust", "memory-safety", "systems-programming"],
  capabilityIds: ["cap-rust-basics"],
  cuIds: ["cu-ownership-rules"],
  prerequisites: ["lesson-rust-syntax"],
  
  stages: {
    plan: {
      blocks: [
        {
          id: "block-plan-1",
          type: "explainer",
          markdown: "## The Ownership Problem\nIn languages like C++, you manage memory manually. In Java, a garbage collector does it for you. Rust uses a third approach: **Ownership**.\n\nOwnership is a set of rules that the compiler checks at compile time. No garbage collector, no manual `free()` calls.",
        },
        {
          id: "block-plan-2",
          type: "diagram",
          diagramType: "mermaid",
          content: `graph TD
    A[Stack] -->|Pointer| B[Heap Data]
    C[Owner Variable] --> A
    D[Borrower] -.->|Reference| B`,
          caption: "Visualizing Stack vs Heap ownership",
        },
        {
          id: "block-plan-3",
          type: "prediction",
          prompt: "What happens if you try to use a variable after moving its ownership to another function?",
          placeholder: "I think the compiler will...",
          correctAnswerReveal: "The compiler will throw an error: 'use of moved value'. The original variable is no longer valid.",
        },
      ],
    },
    do: {
      blocks: [
        {
          id: "block-do-1",
          type: "scenario",
          title: "The Double Free Error",
          description: "You are writing a function that processes a string. You want to pass the string to a helper function, but then print it again in the main function.",
        },
        {
          id: "block-do-2",
          type: "exercise",
          prompt: "Fix the following code so it compiles. The `process_data` function should take ownership, but we still need to print `s` afterwards.",
          initialCode: `fn main() {
    let s = String::from("hello");
    process_data(s);
    println!("{}", s); // Error here
}

fn process_data(input: String) {
    println!("Processing: {}", input);
}`,
          language: "rust",
          hints: [
            "Consider cloning the string if you want two independent copies.",
            "Alternatively, could `process_data` take a reference instead?",
            "Try changing the function signature to `fn process_data(input: &String)`.",
          ],
          solution: `fn main() {
    let s = String::from("hello");
    process_data(&s);
    println!("{}", s);
}

fn process_data(input: &String) {
    println!("Processing: {}", input);
}`,
        },
      ],
    },
    check: {
      blocks: [
        {
          id: "block-check-1",
          type: "quiz",
          question: "Which of the following rules is TRUE about Rust ownership?",
          options: [
            { id: "opt-1", text: "A value can have multiple owners at the same time.", isCorrect: false, feedback: "No, a value can only have one owner at a time." },
            { id: "opt-2", text: "When the owner goes out of scope, the value is dropped.", isCorrect: true, feedback: "Correct! This is the core of RAII in Rust." },
            { id: "opt-3", text: "You must manually free memory when done.", isCorrect: false, feedback: "Rust handles this automatically via the Drop trait." },
          ],
        },
      ],
    },
    act: {
      blocks: [
        {
          id: "block-act-1",
          type: "reflection",
          prompt: "How does the concept of 'Ownership' change how you think about passing variables to functions compared to Python or JavaScript?",
        },
        {
          id: "block-act-2",
          type: "todo",
          text: "Refactor your previous 'File Parser' project to use borrowing instead of cloning strings.",
        },
      ],
    },
  },
  
  provenance: {
    generatorModel: "gpt-4-turbo",
    promptBundleVersion: "v2.1.0",
  },
  
  citations: [
    {
      id: "cit-1",
      text: "The Rust Programming Language, Chapter 4",
      url: "https://doc.rust-lang.org/book/ch04-01-what-is-ownership.html",
    },
  ],
};
