import type { DocumentInfo, PageInfo } from "./types";

export async function loadPDF(file: File): Promise<DocumentInfo> {
  const pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdfDoc = await loadingTask.promise;

  const pages: PageInfo[] = [];
  let totalChars = 0;

  for (let i = 1; i <= pdfDoc.numPages; i++) {
    const page = await pdfDoc.getPage(i);
    const textContent = await page.getTextContent();
    const text = textContent.items
      .map((item) => ("str" in item ? (item as { str: string }).str : ""))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();

    pages.push({ pageNumber: i, text });
    totalChars += text.length;
  }

  return {
    fileName: file.name,
    pageCount: pdfDoc.numPages,
    pages,
    totalChars,
  };
}

export function closePDF() {
  // No-op — PDF is parsed once and stored in state
}
