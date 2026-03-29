


import type { StoryPdfData } from '../src/types';
import type { jsPDF } from 'jspdf';

const buildPdf = async (data: StoryPdfData): Promise<{doc: jsPDF, pdfFilename: string}> => {
  const { pureStoryText, storyTitle, generatedImageUrl, defaultTitle } = data;

  if (!pureStoryText) {
    throw new Error("El contenido de la historia está vacío. No se puede generar el PDF.");
  }
  
  // Dynamically import jsPDF
  const { jsPDF: JSPDF_CTOR } = await import('jspdf');

  const doc = new JSPDF_CTOR({
    orientation: 'p',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const maxLineWidth = pageWidth - margin * 2;
  let yPosition = margin;

  const FONT_SIZE_NORMAL = 12;
  const FONT_SIZE_TITLE = 18;
  const LINE_HEIGHT_FACTOR = 1.4;
  const PARAGRAPH_SPACING_FACTOR = 0.7;

  const calculateLineHeight = (fontSize: number, factor: number): number => {
    return (fontSize * 0.352778) * factor;
  };

  let baseLineHeight = calculateLineHeight(FONT_SIZE_NORMAL, LINE_HEIGHT_FACTOR);
  let titleLineHeight = calculateLineHeight(FONT_SIZE_TITLE, LINE_HEIGHT_FACTOR);

  // --- RENDERIZAR TÍTULO ---
  doc.setFontSize(FONT_SIZE_TITLE);
  const titleTextForPdf = storyTitle === "Generando título..." || storyTitle === defaultTitle ? "Una Historia Interactiva" : storyTitle;

  const titleLines = doc.splitTextToSize(titleTextForPdf, maxLineWidth);
  yPosition += titleLineHeight * 0.5;

  titleLines.forEach((line: string) => {
    if (yPosition + titleLineHeight > pageHeight - margin) {
      doc.addPage();
      yPosition = margin + titleLineHeight * 0.5;
    }
    const lineWidth = doc.getTextWidth(line);
    doc.text(line, (pageWidth - lineWidth) / 2, yPosition); // Título centrado
    yPosition += titleLineHeight;
  });
  yPosition += titleLineHeight * 0.5; // Espacio después del título

  // --- RENDERIZAR IMAGEN (si está disponible) ---
  if (generatedImageUrl && generatedImageUrl.startsWith('data:image/jpeg;base64,')) {
    try {
      const imgProps = doc.getImageProperties(generatedImageUrl);
      const maxImageWidthOnPdf = maxLineWidth;
      const maxImageHeightOnPdf = pageHeight * 0.4; // Limitar altura de imagen al 40% de la página
      
      let pdfImageWidth = imgProps.width;
      let pdfImageHeight = imgProps.height;
      const aspectRatio = imgProps.width / imgProps.height;

      if (pdfImageWidth > maxImageWidthOnPdf) {
        pdfImageWidth = maxImageWidthOnPdf;
        pdfImageHeight = pdfImageWidth / aspectRatio;
      }
      if (pdfImageHeight > maxImageHeightOnPdf) {
        pdfImageHeight = maxImageHeightOnPdf;
        pdfImageWidth = pdfImageHeight * aspectRatio;
      }
      if (pdfImageWidth > maxImageWidthOnPdf) { // Re-verificar ancho después del ajuste de altura
        pdfImageWidth = maxImageWidthOnPdf;
        pdfImageHeight = pdfImageWidth / aspectRatio;
      }
      
      const imageX = (pageWidth - pdfImageWidth) / 2; // Centrar imagen
      const spaceBeforeImage = baseLineHeight * 0.5;
      const spaceAfterImage = baseLineHeight;

      if (yPosition + spaceBeforeImage + pdfImageHeight + spaceAfterImage > pageHeight - margin) {
        doc.addPage();
        yPosition = margin;
      }
      
      yPosition += spaceBeforeImage;
      doc.addImage(generatedImageUrl, 'JPEG', imageX, yPosition, pdfImageWidth, pdfImageHeight);
      yPosition += pdfImageHeight + spaceAfterImage;

    } catch (imgError) {
      console.error("Error procesando la imagen para el PDF:", imgError);
    }
  }

  // --- RENDERIZAR CONTENIDO DE LA HISTORIA ---
  doc.setFontSize(FONT_SIZE_NORMAL);
  baseLineHeight = calculateLineHeight(FONT_SIZE_NORMAL, LINE_HEIGHT_FACTOR);

  const paragraphs = pureStoryText.split(/\n\s*\n/);

  paragraphs.forEach((paragraph, paraIndex) => {
    const trimmedParagraph = paragraph.trim();
    if (trimmedParagraph === '') return;

    const lines = doc.splitTextToSize(trimmedParagraph, maxLineWidth);

    lines.forEach((line: string) => {
      if (yPosition + baseLineHeight > pageHeight - margin) {
        doc.addPage();
        yPosition = margin;
      }
      doc.text(line, margin, yPosition);
      yPosition += baseLineHeight;
    });

    if (paraIndex < paragraphs.length - 1) {
        yPosition += baseLineHeight * PARAGRAPH_SPACING_FACTOR;
        // Comprobar si el espaciado en sí mismo causa un desbordamiento que necesita una nueva página.
        if (yPosition > pageHeight - margin && yPosition < pageHeight - margin + (baseLineHeight * PARAGRAPH_SPACING_FACTOR)) {
            doc.addPage();
            yPosition = margin;
        }
    }
  });
  
  // --- NUMERACIÓN DE PÁGINAS ---
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    // Tamaño de fuente para números de página.
    doc.setFontSize(10);
    const pageNumText = `Página ${i} de ${pageCount}`;
    const pageNumWidth = doc.getTextWidth(pageNumText);
    doc.text(pageNumText, (pageWidth - pageNumWidth) / 2, pageHeight - (margin / 2));
  }
  
  let pdfFilename = "historia_interactiva.pdf";
  if (storyTitle && storyTitle !== defaultTitle && storyTitle !== "Generando título...") {
    const sanitizedTitle = storyTitle
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^\w.-]+/g, '')
      .substring(0, 50);
    
    pdfFilename = sanitizedTitle ? `${sanitizedTitle}.pdf` : "historia_interactiva.pdf";
  }
  
  return { doc, pdfFilename };
};

export const generatePdfDocument = async (data: StoryPdfData): Promise<void> => {
  const { doc, pdfFilename } = await buildPdf(data);
  doc.save(pdfFilename);
};

export const generatePdfAsFile = async (data: StoryPdfData): Promise<File | null> => {
  try {
    const { doc, pdfFilename } = await buildPdf(data);
    const pdfBlob = doc.output('blob');
    return new File([pdfBlob], pdfFilename, { type: 'application/pdf' });
  } catch (error) {
    console.error("Fallo al generar el archivo PDF:", error);
    if (error instanceof Error) {
        throw error;
    }
    throw new Error("Un error desconocido ocurrió al generar el archivo PDF.");
  }
};
