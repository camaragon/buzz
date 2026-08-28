import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { partitionMentionRouting } from "./useMentionSendFlow.helpers.ts";

const MEMBER_AGENT = "a".repeat(64);
const NONMEMBER_AGENT = "b".repeat(64);
const NONMEMBER_PERSON = "c".repeat(64);
const CREATED_PERSONA = "d".repeat(64);

const isAgentPubkey = (pubkey) =>
  [MEMBER_AGENT, NONMEMBER_AGENT, CREATED_PERSONA].includes(pubkey);

describe("partitionMentionRouting", () => {
  test("keeps member agents notifying and makes nonmember agents reference-only", () => {
    assert.deepEqual(
      partitionMentionRouting({
        channelType: "private",
        membershipResolved: true,
        mentionPubkeys: [MEMBER_AGENT, NONMEMBER_AGENT, NONMEMBER_PERSON],
        memberPubkeys: new Set([MEMBER_AGENT]),
        createdPersonaAgentPubkeys: [],
        isAgentPubkey,
      }),
      {
        notifyingPubkeys: [MEMBER_AGENT, NONMEMBER_PERSON],
        referenceOnlyPubkeys: [NONMEMBER_AGENT],
        promptNonMemberPubkeys: [NONMEMBER_PERSON],
      },
    );
  });

  test("fails closed for agent notification while membership is unresolved", () => {
    assert.deepEqual(
      partitionMentionRouting({
        channelType: "private",
        membershipResolved: false,
        mentionPubkeys: [MEMBER_AGENT, NONMEMBER_AGENT, NONMEMBER_PERSON],
        memberPubkeys: new Set(),
        createdPersonaAgentPubkeys: [],
        isAgentPubkey,
      }),
      {
        notifyingPubkeys: [NONMEMBER_PERSON],
        referenceOnlyPubkeys: [MEMBER_AGENT, NONMEMBER_AGENT],
        promptNonMemberPubkeys: [],
      },
    );
  });

  test("fails closed when channel type and membership are unresolved", () => {
    assert.deepEqual(
      partitionMentionRouting({
        channelType: null,
        membershipResolved: false,
        mentionPubkeys: [NONMEMBER_AGENT, NONMEMBER_PERSON],
        memberPubkeys: new Set(),
        createdPersonaAgentPubkeys: [],
        isAgentPubkey,
      }),
      {
        notifyingPubkeys: [NONMEMBER_PERSON],
        referenceOnlyPubkeys: [NONMEMBER_AGENT],
        promptNonMemberPubkeys: [],
      },
    );
  });

  test("does not downgrade a persona just created as a channel agent", () => {
    assert.deepEqual(
      partitionMentionRouting({
        channelType: "private",
        membershipResolved: true,
        mentionPubkeys: [CREATED_PERSONA],
        memberPubkeys: new Set(),
        createdPersonaAgentPubkeys: [CREATED_PERSONA],
        isAgentPubkey,
      }),
      {
        notifyingPubkeys: [CREATED_PERSONA],
        referenceOnlyPubkeys: [],
        promptNonMemberPubkeys: [],
      },
    );
  });

  test("leaves DM routing unchanged", () => {
    assert.deepEqual(
      partitionMentionRouting({
        channelType: "dm",
        membershipResolved: false,
        mentionPubkeys: [NONMEMBER_AGENT],
        memberPubkeys: new Set(),
        createdPersonaAgentPubkeys: [],
        isAgentPubkey,
      }),
      {
        notifyingPubkeys: [NONMEMBER_AGENT],
        referenceOnlyPubkeys: [],
        promptNonMemberPubkeys: [],
      },
    );
  });
});
