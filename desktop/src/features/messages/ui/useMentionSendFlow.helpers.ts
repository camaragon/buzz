import type { ManagedAgent } from "@/shared/api/types";
import type { ImetaMedia } from "@/features/messages/lib/imetaMediaMarkdown";
import type { QueuedMediaAttachment } from "@/features/messages/lib/backgroundMediaUploadStore";
import type { DraftMentionRef } from "@/features/messages/lib/useDrafts";
import { normalizePubkey } from "@/shared/lib/pubkey";
import { MENTION_REFERENCE_TAG } from "@/shared/lib/resolveMentionNames";

export { MENTION_REFERENCE_TAG };

export type PendingNonMemberMentionSend = {
  capturedChannelId: string | null;
  capturedThreadContext: {
    parentEventId: string | null;
    threadHeadId: string | null;
  } | null;
  trimmed: string;
  mentionPubkeys: string[];
  nonMemberPubkeys: string[];
  outgoingTags?: string[][];
  preparedManagedAgents?: ManagedAgent[];
  readyAgentPubkeys?: string[];
  savedContent: string;
  savedImeta: ImetaMedia[];
  queuedAttachments: QueuedMediaAttachment[];
  savedSpoileredAttachmentUrls: Set<string>;
  sentDraftKey: string | null | undefined;
  recoveryDraftKey: string | null | undefined;
  savedMentionRefs: DraftMentionRef[];
  audienceGeneration: number;
  audienceRevision: number | null;
  explicitAgentPubkeys: string[];
};

export type SendMessageWithMentionFlowInput = {
  capturedChannelId: string | null;
  capturedThreadContext?: PendingNonMemberMentionSend["capturedThreadContext"];
  pendingImeta: ImetaMedia[];
  queuedAttachments?: QueuedMediaAttachment[];
  linkPreviewTags?: string[][];
  sentDraftKey: string | null | undefined;
  recoveryDraftKey: string | null | undefined;
  spoileredAttachmentUrls?: ReadonlySet<string>;
  trimmed: string;
  audienceGeneration?: number;
  audienceRevision?: number | null;
};

export function mergeOutgoingTagsWithReferenceMentions(
  outgoingTags: string[][] | undefined,
  pubkeys: Iterable<string>,
) {
  const normalizedPubkeys = uniqueNormalizedPubkeys(pubkeys);
  if (normalizedPubkeys.length === 0) {
    return outgoingTags;
  }

  return [
    ...(outgoingTags ?? []),
    ...normalizedPubkeys.map((pubkey) => [MENTION_REFERENCE_TAG, pubkey]),
  ];
}

export function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

export function uniqueNormalizedPubkeys(pubkeys: Iterable<string>) {
  return [...new Set([...pubkeys].map(normalizePubkey))].filter(Boolean);
}

/**
 * Only proven channel members may receive notifying agent mentions. Agent
 * names outside membership remain renderable through reference-only tags.
 */
export function partitionMentionRouting({
  channelType,
  membershipResolved,
  mentionPubkeys,
  memberPubkeys,
  createdPersonaAgentPubkeys,
  isAgentPubkey,
}: {
  channelType: string | null;
  membershipResolved: boolean;
  mentionPubkeys: Iterable<string>;
  memberPubkeys: ReadonlySet<string>;
  createdPersonaAgentPubkeys: Iterable<string>;
  isAgentPubkey: (pubkey: string) => boolean;
}) {
  const normalized = uniqueNormalizedPubkeys(mentionPubkeys);
  if (channelType === null || channelType === "dm") {
    return {
      notifyingPubkeys: normalized,
      referenceOnlyPubkeys: [],
      promptNonMemberPubkeys: [],
    };
  }

  const createdPersonas = new Set(
    uniqueNormalizedPubkeys(createdPersonaAgentPubkeys),
  );
  const normalizedMembers = new Set(
    [...memberPubkeys].map(normalizePubkey).filter(Boolean),
  );
  const provenNonMembers = membershipResolved
    ? normalized.filter(
        (pubkey) =>
          !normalizedMembers.has(pubkey) && !createdPersonas.has(pubkey),
      )
    : normalized.filter(
        (pubkey) => isAgentPubkey(pubkey) && !createdPersonas.has(pubkey),
      );
  const referenceOnlyPubkeys = provenNonMembers.filter(isAgentPubkey);
  const referenceOnlySet = new Set(referenceOnlyPubkeys);

  return {
    notifyingPubkeys: normalized.filter(
      (pubkey) => !referenceOnlySet.has(pubkey),
    ),
    referenceOnlyPubkeys,
    promptNonMemberPubkeys: provenNonMembers.filter(
      (pubkey) => !isAgentPubkey(pubkey),
    ),
  };
}

export function isManagedAgentRunning(agent: ManagedAgent) {
  return agent.status === "running" || agent.status === "deployed";
}

export function isProviderBackedAgent(agent: ManagedAgent) {
  return agent.backend.type === "provider";
}
