// EPUB reader utility functions

// Generate unique book identifier from metadata
export function generateBookId(metadata: any): string {
  const identifier = metadata.identifier || metadata.title || "unknown";

  return identifier.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();
}

// Format percentage for display
export function formatPercentage(percentage: number): string {
  return `${Math.round(percentage)}%`;
}

// Validate EPUB file
export function isValidEpubFile(file: File): boolean {
  return (
    file.type === "application/epub+zip" ||
    file.name.toLowerCase().endsWith(".epub")
  );
}

// Read file as ArrayBuffer
export function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) {
        resolve(reader.result);
      } else {
        reject(new Error("Failed to read file as ArrayBuffer"));
      }
    };

    reader.onerror = () => {
      reject(new Error("Failed to read file"));
    };

    reader.readAsArrayBuffer(file);
  });
}
