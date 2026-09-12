// טיפוסי הליבה של המשחק

export interface PuzzleLetters {
  letters: string[]; // רשימת האותיות במעגל, למשל ['א','ב','ג','ד','ה','ו']
  requiredLetter?: string; // אופציונלי: אות חובה שכל מילה חייבת להכיל (כמו ב-Spelling Bee)
}

export interface FoundWord {
  word: string;
  score: number;
  isPangram: boolean; // האם המילה השתמשה בכל האותיות הזמינות
}

export interface GameState {
  puzzle: PuzzleLetters;
  foundWords: FoundWord[];
  totalScore: number;
  currentInput: string;
}

export type InvalidReason =
  | 'too_short'
  | 'missing_required_letter'
  | 'invalid_letters'
  | 'not_in_dictionary'
  | 'already_found';

export type ValidationResult = { valid: true } | { valid: false; reason: InvalidReason };

// === מערכת שלבים ===

export interface Level {
  index: number; // 0-based, גם המיקום בבנק החידות הממוין לפי קושי
  letters: string[];
  pangramWord: string;
  wordCount: number;
  difficulty: number;
  achievableScore: number; // סה"כ נקודות אפשריות אם מוצאים את כל המילים בשלב
  requiredScore: number; // כמה נקודות מצטברות (מכל השלבים) צריך כדי לפתוח
}

export interface StoredProgress {
  totalScore: number;
  // מילים שנמצאו בכל שלב, לפי אינדקס השלב (מפתח string כי זה JSON)
  foundWordsByLevel: Record<string, string[]>;
}
