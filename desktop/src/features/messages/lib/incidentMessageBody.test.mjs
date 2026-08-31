import assert from "node:assert/strict";
import test from "node:test";

import { splitIncidentMessageBody } from "./incidentMessageBody.ts";

const ROOT_INCIDENT = `## 🟠 High · INC-ABC123
**Database backup verification failed**
- **Detected:** 2026-08-27 21:00 MDT
- **Impact:** Recovery point uncertain.
- **Owner:** \`ops\`
- **State:** \`blocked\`
- **Next action:** Verify newest snapshot.
- **Source:** Kanban card \`t_abc123\`

Buzz is visibility only. Telegram/Kanban policy remains approvals. Kanban remains source of truth.`;

test("splits incident provenance from the primary mobile body", () => {
  assert.deepEqual(splitIncidentMessageBody(ROOT_INCIDENT), {
    primary: `## 🟠 High · INC-ABC123
**Database backup verification failed**
- **Detected:** 2026-08-27 21:00 MDT
- **Impact:** Recovery point uncertain.
- **Owner:** \`ops\`
- **State:** \`blocked\`
- **Next action:** Verify newest snapshot.`,
    details: `- **Source:** Kanban card \`t_abc123\`

Buzz is visibility only. Telegram/Kanban policy remains approvals. Kanban remains source of truth.`,
  });
});

test("supports transition incident headings", () => {
  const transition = ROOT_INCIDENT.replace(
    "## 🟠 High · INC-ABC123",
    "### 🟠 High · INVESTIGATING · INC-ABC123",
  );
  assert.ok(splitIncidentMessageBody(transition));
});

test("does not alter ordinary messages that mention incidents", () => {
  assert.equal(
    splitIncidentMessageBody(
      "INC-ABC123 needs another look.\n- **Source:** notes",
    ),
    null,
  );
});
