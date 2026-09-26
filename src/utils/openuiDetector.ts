/**
 * Utility for detecting, validating, and extracting OpenUI Lang from model responses.
 * OpenUI Lang requires an explicit root component definition (e.g., `root = Stack(...)`).
 * Plain-text responses (such as natural language refusals, answers, or conversational text)
 * produce parser errors ("Code parsed but produced no renderable root component").
 * This module ensures plain-text responses are cleanly intercepted and routed to the fallback view.
 */

export interface OpenUIDetectionResult {
  /** Whether the content is valid or provisional OpenUI Lang */
  isOpenUI: boolean;
  /** Clean OpenUI DSL ready for OpenUI Renderer */
  dslContent: string;
  /** Plain text representation for fallback display */
  plainText: string;
  /** Synthesized OpenUI code wrapping the plain text in a Callout */
  openUiWrappedFallback: string;
  /** Classification of response format */
  classification: 'pure-openui' | 'fenced-openui' | 'plain-text' | 'streaming-provisional';
}

/**
 * Creates an OpenUI Lang valid wrapper for plain text content so it can optionally
 * be rendered as a native OpenUI Card/Callout.
 */
export function wrapPlainTextAsOpenUI(text: string, title = 'Assistant Response'): string {
  const sanitized = JSON.stringify(text.trim() || 'No response content.');
  const sanitizedTitle = JSON.stringify(title);
  return `root = Stack([msgCallout])\nmsgCallout = Callout("info", ${sanitizedTitle}, ${sanitized})`;
}

/**
 * Detects whether content is OpenUI Lang or plain natural language.
 */
export function detectOpenUI(
  rawContent: string,
  isStreaming = false
): OpenUIDetectionResult {
  if (!rawContent || !rawContent.trim()) {
    return {
      isOpenUI: false,
      dslContent: '',
      plainText: '',
      openUiWrappedFallback: wrapPlainTextAsOpenUI(''),
      classification: 'plain-text',
    };
  }

  const trimmed = rawContent.trim();

  // Pattern 1: Fenced code block (```openui ... ``` or ```python ... ``` or generic ``` ... ```)
  const fenceRegex = /```(?:openui|openui-lang|python|lang)?\s*\n([\s\S]*?)(?:```|$)/i;
  const fenceMatch = trimmed.match(fenceRegex);

  let candidate = trimmed;
  let hasValidFence = false;

  if (fenceMatch && fenceMatch[1]) {
    const extracted = fenceMatch[1].trim();
    // Verify if extracted block contains root assignment
    if (/root\s*=/i.test(extracted)) {
      candidate = extracted;
      hasValidFence = true;
    }
  }

  // Pattern 2: OpenUI Lang statement containing root definition
  const hasRootAssignment = /^\s*root\s*=\s*[A-Z][A-Za-z0-9_]*\s*\(/m.test(candidate);

  // Pattern 3: Streaming early chunk heuristics
  if (isStreaming && !hasRootAssignment) {
    // If the stream starts with a code fence
    if (/^`{1,3}(?:openui|python)?/i.test(trimmed)) {
      return {
        isOpenUI: true,
        dslContent: candidate,
        plainText: trimmed,
        openUiWrappedFallback: wrapPlainTextAsOpenUI(trimmed),
        classification: 'streaming-provisional',
      };
    }

    // If the stream starts with "r", "ro", "roo", "root"
    if (/^(?:r|ro|roo|root)(?:\s*=\s*[A-Za-z]*)?$/.test(trimmed)) {
      return {
        isOpenUI: true,
        dslContent: candidate,
        plainText: trimmed,
        openUiWrappedFallback: wrapPlainTextAsOpenUI(trimmed),
        classification: 'streaming-provisional',
      };
    }

    // If the stream starts with an identifier assignment: variable = Component(
    if (/^[a-zA-Z_][a-zA-Z0-9_]*\s*=\s*[A-Z]/.test(trimmed)) {
      return {
        isOpenUI: true,
        dslContent: candidate,
        plainText: trimmed,
        openUiWrappedFallback: wrapPlainTextAsOpenUI(trimmed),
        classification: 'streaming-provisional',
      };
    }

    // Otherwise, early stream is natural text
    return {
      isOpenUI: false,
      dslContent: '',
      plainText: trimmed,
      openUiWrappedFallback: wrapPlainTextAsOpenUI(trimmed),
      classification: 'plain-text',
    };
  }

  // Completed or mid-stream with valid fence
  if (hasValidFence && hasRootAssignment) {
    return {
      isOpenUI: true,
      dslContent: candidate,
      plainText: trimmed,
      openUiWrappedFallback: wrapPlainTextAsOpenUI(trimmed),
      classification: 'fenced-openui',
    };
  }

  // Pure OpenUI with root assignment
  if (hasRootAssignment) {
    return {
      isOpenUI: true,
      dslContent: candidate,
      plainText: trimmed,
      openUiWrappedFallback: wrapPlainTextAsOpenUI(trimmed),
      classification: 'pure-openui',
    };
  }

  // Fallback: Not OpenUI (plain text or natural language refusal/response)
  return {
    isOpenUI: false,
    dslContent: '',
    plainText: trimmed,
    openUiWrappedFallback: wrapPlainTextAsOpenUI(trimmed),
    classification: 'plain-text',
  };
}
