const INCIDENT_HEADING_RE =
  /^#{2,3} (?:🔴 Critical|🟠 High|🟡 Warning|🔵 Info) · (?:(?:[A-Z]+) · )?INC-[A-Z0-9_-]+\s*$/m;
const INCIDENT_SOURCE_LINE_RE = /^- \*\*Source:\*\* /;

export type IncidentMessageBodyParts = {
  details: string;
  primary: string;
};

/** Split the canonical incident projection without changing its desktop design. */
export function splitIncidentMessageBody(
  body: string,
): IncidentMessageBodyParts | null {
  if (
    !INCIDENT_HEADING_RE.test(body) ||
    !body.includes("- **Next action:** ")
  ) {
    return null;
  }

  const lines = body.split("\n");
  const detailsStart = lines.findIndex((line) =>
    INCIDENT_SOURCE_LINE_RE.test(line),
  );
  if (detailsStart < 0) return null;

  return {
    primary: lines.slice(0, detailsStart).join("\n").trimEnd(),
    details: lines.slice(detailsStart).join("\n").trim(),
  };
}
