export type DeadlineItem = {
  raw_text: string;
  normalized_date?: string | null;
  confidence: number;
};

export type ActionItem = {
  title: string;
  why_it_matters: string;
  priority: string;
};

export type FieldHelpItem = {
  field_name: string;
  what_to_fill: string;
  example_value?: string | null;
};

export type BureaucracyResponse = {
  detected_document_type: string;
  main_topic: string;
  plain_language_summary: string;
  what_you_need_to_do_now: ActionItem[];
  deadlines: DeadlineItem[];
  required_documents: string[];
  risks_if_ignored: string[];
  fill_help: FieldHelpItem[];
  questions_to_ask: string[];
  important_entities: string[];
  urgency: string;
  confidence: number;
  extracted_text?: string | null;
  llm: {
    mode: string;
    used: boolean;
    model?: string | null;
  };
};

export type Profile = {
  id: number;
  full_name: string;
  age?: number;
  grade_level?: string;
  language: string;
  reading_goal?: string;
  notes?: string;
  created_at: string;
};

export type ReadingMistake = {
  kind: string;
  expected?: string | null;
  spoken?: string | null;
  position: number;
};

export type ReadingExercise = {
  title: string;
  instruction: string;
  target_words: string[];
};

export type ReadingResponse = {
  profile_id?: number | null;
  accuracy_score: number;
  words_per_minute: number;
  words_expected: number;
  words_spoken: number;
  reading_level: string;
  parent_feedback: string;
  student_feedback: string;
  next_session_plan: string[];
  mistakes: ReadingMistake[];
  exercises: ReadingExercise[];
  comprehension_questions: string[];
  llm: {
    mode: string;
    used: boolean;
    model?: string | null;
  };
};
