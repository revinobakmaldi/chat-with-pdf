import type { DocumentInfo } from "./types";

export function buildDocumentContext(doc: DocumentInfo): string {
  const pageTexts = doc.pages
    .map((p) => `[Page ${p.pageNumber}]\n${p.text}`)
    .join("\n\n");

  return pageTexts;
}

export function generateSuggestedQuestions(doc: DocumentInfo): string[] {
  const questions: string[] = [];

  questions.push("What is this document about?");
  questions.push("Summarize the key points of this document");

  if (doc.pageCount > 3) {
    questions.push("What are the main topics covered?");
  }

  if (doc.pageCount > 1) {
    questions.push("What conclusions does the document reach?");
  } else {
    questions.push("List the important details mentioned");
  }

  return questions.slice(0, 4);
}
