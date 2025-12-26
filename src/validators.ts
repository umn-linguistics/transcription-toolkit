  export function validHeaders(headers: string[], supportedHeaders: Object): string[] {
    if (headers.length < 1) {
        throw new Error('No headers found');
    }

    const supportedHeaderValues = Object.values(supportedHeaders);

    const missingHeaders: string[] = [];
    const duplicateHeaders: string[] = [];
    const validHeadersList: string[] = [];

    // Check that each supported header is in the existing headers once and only once
    for (const supportedHeader of supportedHeaderValues) {
        // Duplicate header
        if (validHeadersList.includes(supportedHeader)) {
        duplicateHeaders.push(supportedHeader);
        }
        // Missing header
        if (!headers.includes(supportedHeader)) {
        missingHeaders.push(supportedHeader);
        }
        validHeadersList.push(supportedHeader);
    }

    if (missingHeaders.length > 0) {
        throw new Error(`Worksheet is missing column(s): ${missingHeaders.join(', ')}`);
    }
    if (duplicateHeaders.length > 0) {
        throw new Error(`Worksheet has duplicate column(s): ${duplicateHeaders.join(', ')}`);
    }

    return headers;
  }