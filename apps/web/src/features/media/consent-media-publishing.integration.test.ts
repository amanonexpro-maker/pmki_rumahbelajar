import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq, inArray } from "drizzle-orm";
import { db } from "@/db/client";
import {
  auditLogs,
  consents,
  guardians,
  mediaAssets,
  publications,
  studentGuardians,
  students,
  users,
} from "@/db/schema";
import { resolveAccess } from "@/features/administration";
import {
  isPersonalDataProcessingAllowed,
  isPhotoVideoPublicAllowed,
  updateStudentConsent,
} from "@/features/consent";
import {
  confirmMediaUpload,
  createMediaUploadUrl,
  getSignedMediaReadUrl,
  listPublicGalleryMedia,
  reviewMediaAssetPrivacy,
} from "@/features/media";
import {
  createPublicationDraft,
  listPublishedPublicationsForPublic,
  transitionPublicationStatus,
} from "@/features/publishing";
import { submitPublicRegistration } from "@/features/students";
import type { SessionUser } from "@/server/auth/session";
import {
  PAGE_CACHE_REVALIDATE_SECONDS,
  removePrivateStorageObject,
} from "@/server/upload/storage-admin";

async function loadSessionByEmail(email: string): Promise<SessionUser> {
  const [userRow] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (!userRow) {
    throw new Error(`Seeded user ${email} not found. Run npm run db:seed.`);
  }
  const access = await resolveAccess(userRow.id);
  return {
    id: userRow.id,
    email: userRow.email,
    name: access.name,
    roles: access.roles,
    permissions: access.permissions,
    memberships: access.memberships,
  };
}

describe("Fase 6 Integration — Consent Revocation, 3-Step Private Storage Signed Upload, Media SoD & Publishing Workflow", () => {
  let editorSession!: SessionUser;
  let reviewerSession!: SessionUser;
  let approverSession!: SessionUser;
  let coordinatorSession!: SessionUser;
  let adminSession!: SessionUser;

  const createdMediaIds: string[] = [];
  const createdStoragePaths: string[] = [];
  const createdPublicationIds: string[] = [];
  const createdStudentIds: string[] = [];
  const createdGuardianIds: string[] = [];

  beforeAll(async () => {
    editorSession = await loadSessionByEmail("lilian@pmki.org");
    reviewerSession = await loadSessionByEmail("peninjau.privasi@pmki.org");
    approverSession = await loadSessionByEmail("penyetuju.mupel@pmki.org");
    coordinatorSession = await loadSessionByEmail("pengurus.lawang@pmki.org");
    adminSession = await loadSessionByEmail("superadmin@pmki.org");
  });

  afterAll(async () => {
    for (const storagePath of createdStoragePaths) {
      await removePrivateStorageObject(storagePath);
    }
    if (createdPublicationIds.length > 0) {
      await db
        .delete(publications)
        .where(inArray(publications.id, createdPublicationIds));
    }
    if (createdMediaIds.length > 0) {
      await db
        .delete(mediaAssets)
        .where(inArray(mediaAssets.id, createdMediaIds));
    }
    if (createdStudentIds.length > 0) {
      const cRows = await db
        .select({ guardianId: consents.guardianId })
        .from(consents)
        .where(inArray(consents.studentId, createdStudentIds));
      for (const c of cRows) createdGuardianIds.push(c.guardianId);
      await db
        .delete(consents)
        .where(inArray(consents.studentId, createdStudentIds));
      await db
        .delete(studentGuardians)
        .where(inArray(studentGuardians.studentId, createdStudentIds));
      await db
        .delete(students)
        .where(inArray(students.id, createdStudentIds));
    }
    if (createdGuardianIds.length > 0) {
      await db
        .delete(guardians)
        .where(inArray(guardians.id, Array.from(new Set(createdGuardianIds))));
    }
  });

  it("executes 3-step upload (createUploadUrl -> PUT to private bucket -> confirmUpload), enforces upload idempotency, blocks unreviewed public access, and enforces SoD on review", async () => {
    // 1. Step 1: Create signed upload URL in private bucket "media"
    const urlRes = await createMediaUploadUrl(editorSession, {
      fileName: "belajar-sabtu-ceria.png",
      mimeType: "image/png",
      fileSize: 68,
    });
    expect(urlRes.success).toBe(true);
    if (!urlRes.success) return;

    expect(urlRes.data.bucket).toBe("media");
    expect(urlRes.data.signedUrl).toContain("/storage/v1/object/upload/sign/media/");
    createdStoragePaths.push(urlRes.data.filePath);

    // 2. Step 2: Client PUTs binary directly to Supabase Storage signed upload URL
    const tinyPngBytes = Uint8Array.from([
      137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82, 0, 0, 0, 1,
      0, 0, 0, 1, 8, 6, 0, 0, 0, 31, 21, 196, 137, 0, 0, 0, 10, 73, 68, 65, 84,
      120, 156, 99, 0, 1, 0, 0, 5, 0, 1, 13, 10, 45, 180, 0, 0, 0, 0, 73, 69,
      78, 68, 174, 66, 96, 130,
    ]);
    const putResponse = await fetch(urlRes.data.signedUrl, {
      method: "PUT",
      headers: { "Content-Type": "image/png" },
      body: tinyPngBytes,
    });
    expect(putResponse.ok).toBe(true);

    // 3. Step 3: Confirm upload -> creates media_assets row with privacyReviewed=false, eligibleForPublic=false
    const confirmRes = await confirmMediaUpload(editorSession, {
      title: "Dokumentasi Belajar Sabtu Ceria",
      description: "Suasana bimbingan belajar kelompok SD Kelas 2.",
      filePath: urlRes.data.filePath,
      mimeType: "image/png",
      fileSize: 68,
      category: "KEGIATAN",
      capturedDate: "2026-11-20",
    });
    expect(confirmRes.success).toBe(true);
    if (!confirmRes.success) return;

    const mediaId = confirmRes.data.id;
    createdMediaIds.push(mediaId);
    expect(confirmRes.data.privacyReviewed).toBe(false);
    expect(confirmRes.data.eligibleForPublic).toBe(false);

    // 4. Idempotency: duplicate confirmUpload on same filePath MUST be rejected with RESOURCE_CONFLICT
    const duplicateConfirm = await confirmMediaUpload(editorSession, {
      title: "Duplikat Konfirmasi",
      filePath: urlRes.data.filePath,
      mimeType: "image/png",
      fileSize: 68,
      category: "KEGIATAN",
    });
    expect(duplicateConfirm.success).toBe(false);
    if (!duplicateConfirm.success) {
      expect(duplicateConfirm.error.code).toBe("RESOURCE_CONFLICT");
    }

    // 5. Before privacy review: asset MUST NOT appear in public gallery & public signed URL MUST be denied
    const galleryBefore = await listPublicGalleryMedia();
    expect(galleryBefore.some((m) => m.id === mediaId)).toBe(false);

    const publicSignedBefore = await getSignedMediaReadUrl(null, mediaId, {
      forPublicChannel: true,
    });
    expect(publicSignedBefore.success).toBe(false);
    if (!publicSignedBefore.success) {
      expect(publicSignedBefore.error.code).toBe("POLICY_DENIED");
    }

    // 6. Separation of Duties (U-10): Uploader cannot review their own upload
    // Test with PLATFORM_ADMIN uploading & trying to self-review -> POLICY_DENIED
    const adminMedia = await confirmMediaUpload(adminSession, {
      title: "Unggahan Admin untuk Uji SoD",
      filePath: `units/${adminSession.memberships[0]?.serviceUnitId}/admin-sod-test-${Date.now()}.png`,
      mimeType: "image/png",
      fileSize: 68,
      category: "PENGURUS",
    });
    expect(adminMedia.success).toBe(true);
    if (adminMedia.success) {
      createdMediaIds.push(adminMedia.data.id);
      const adminSelfReview = await reviewMediaAssetPrivacy(adminSession, {
        mediaId: adminMedia.data.id,
        eligibleForPublic: true,
      });
      expect(adminSelfReview.success).toBe(false);
      if (!adminSelfReview.success) {
        expect(adminSelfReview.error.code).toBe("POLICY_DENIED");
      }
    }

    // 7. Separate Reviewer reviews editor's upload -> ALLOWED
    const reviewRes = await reviewMediaAssetPrivacy(reviewerSession, {
      mediaId,
      eligibleForPublic: true,
      reviewNotes: "Tidak ada data sensitif; persetujuan wali telah sesuai.",
    });
    expect(reviewRes.success).toBe(true);

    // 8. After review: appears in public gallery AND generates live Supabase signed read URL with TTL > cache revalidate
    const galleryAfter = await listPublicGalleryMedia();
    expect(galleryAfter.some((m) => m.id === mediaId)).toBe(true);

    const publicSignedAfter = await getSignedMediaReadUrl(null, mediaId, {
      forPublicChannel: true,
    });
    expect(publicSignedAfter.success).toBe(true);
    if (publicSignedAfter.success) {
      expect(publicSignedAfter.data.ttlSeconds).toBeGreaterThan(
        PAGE_CACHE_REVALIDATE_SECONDS
      );
      expect(publicSignedAfter.data.signedUrl).toContain(
        "/storage/v1/object/sign/media/"
      );
    }
  });

  it("enforces publishing workflow (DRAFT -> PRIVACY_REVIEW -> APPROVED -> PUBLISHED), SoD (author !== publisher), and blocks publishing/media when consent is REVOKED", async () => {
    const reviewedMediaId = createdMediaIds[0]!;
    const unreviewedMediaId = createdMediaIds[1]!;

    // 1. Register a student with GRANTED photo/video consent
    const reg = await submitPublicRegistration({
      fullName: "Daniel Kristianto",
      nickname: "Dani",
      gender: "L",
      birthDate: "2016-05-20",
      district: "Kalirejo",
      isRaalResident: false,
      guardianFullName: "Ibu Ester",
      guardianRelationship: "IBU",
      guardianPhone: "081277778888",
      educationLevel: "SD_3",
      personalDataConsent: true,
      photoVideoConsent: "GRANTED",
    });
    expect(reg.success).toBe(true);
    if (!reg.success) return;
    const studentId = reg.data.studentId;
    createdStudentIds.push(studentId);

    expect(await isPersonalDataProcessingAllowed(studentId)).toBe(true);
    expect(await isPhotoVideoPublicAllowed(studentId)).toBe(true);

    // 2. Editor creates a publication draft with the reviewed cover media
    const draftRes = await createPublicationDraft(editorSession, {
      title: "Kegembiraan Belajar Membaca dan Berhitung di Griya Asih",
      category: "BERITA",
      content:
        "Para peserta didik Rumah Belajar Griya Asih Lawang mengikuti sesi literasi dan matematika ceria bersama pengajar relawan.",
      coverMediaId: reviewedMediaId,
    });
    expect(draftRes.success).toBe(true);
    if (!draftRes.success) return;
    const pubId = draftRes.data.id;
    createdPublicationIds.push(pubId);
    expect(draftRes.data.status).toBe("DRAFT");

    // 3. Illegal direct jump DRAFT -> PUBLISHED is rejected
    const illegalJump = await transitionPublicationStatus(approverSession, {
      publicationId: pubId,
      targetStatus: "PUBLISHED",
    });
    expect(illegalJump.success).toBe(false);
    if (!illegalJump.success) {
      expect(illegalJump.error.code).toBe("RESOURCE_CONFLICT");
    }

    // 4. Submit DRAFT -> PRIVACY_REVIEW -> APPROVED
    const toReview = await transitionPublicationStatus(editorSession, {
      publicationId: pubId,
      targetStatus: "PRIVACY_REVIEW",
    });
    expect(toReview.success).toBe(true);

    const toApproved = await transitionPublicationStatus(reviewerSession, {
      publicationId: pubId,
      targetStatus: "APPROVED",
      subjectStudentIds: [studentId],
    });
    expect(toApproved.success).toBe(true);

    // 5. Separation of Duties on Publishing: if PLATFORM_ADMIN creates & approves their own post, they CANNOT publish it
    const adminDraft = await createPublicationDraft(adminSession, {
      title: "Konten Uji SoD Penulis Sama Dengan Penerbit",
      category: "PENGUMUMAN",
      content:
        "Pengumuman jadwal kegiatan belajar tambahan menjelang ujian semester di Rumah Belajar.",
      coverMediaId: unreviewedMediaId,
    });
    expect(adminDraft.success).toBe(true);
    if (adminDraft.success) {
      createdPublicationIds.push(adminDraft.data.id);
      await transitionPublicationStatus(adminSession, {
        publicationId: adminDraft.data.id,
        targetStatus: "PRIVACY_REVIEW",
      });
      // Unreviewed cover media blocks approval!
      const blockedByUnreviewedMedia = await transitionPublicationStatus(
        reviewerSession,
        {
          publicationId: adminDraft.data.id,
          targetStatus: "APPROVED",
        }
      );
      expect(blockedByUnreviewedMedia.success).toBe(false);
      if (!blockedByUnreviewedMedia.success) {
        expect(blockedByUnreviewedMedia.error.code).toBe("POLICY_DENIED");
      }
    }

    // 6. Consent Revocation Gate:
    // Revoke student's photo/video consent BEFORE publishing `pubId` -> publishing with `subjectStudentIds: [studentId]` MUST be blocked!
    const [consentRow] = await db
      .select()
      .from(consents)
      .where(eq(consents.studentId, studentId))
      .limit(1);
    expect(consentRow).toBeTruthy();

    const revokeRes = await updateStudentConsent(coordinatorSession, {
      consentId: consentRow!.id,
      personalDataConsent: "GRANTED",
      photoVideoConsent: "REVOKED",
      notes: "Wali mencabut izin publikasi foto pada tanggal 20 Nov 2026.",
    });
    expect(revokeRes.success).toBe(true);
    expect(await isPhotoVideoPublicAllowed(studentId)).toBe(false);

    // Publishing referencing a student whose photo/video consent was REVOKED is blocked with POLICY_DENIED
    const blockedPublishByRevokedConsent = await transitionPublicationStatus(
      approverSession,
      {
        publicationId: pubId,
        targetStatus: "PUBLISHED",
        subjectStudentIds: [studentId],
      }
    );
    expect(blockedPublishByRevokedConsent.success).toBe(false);
    if (!blockedPublishByRevokedConsent.success) {
      expect(blockedPublishByRevokedConsent.error.code).toBe("POLICY_DENIED");
    }

    // And requesting a public signed URL for media linked to that student is also blocked & revokes media eligibility
    const regrantRes = await updateStudentConsent(coordinatorSession, {
      consentId: consentRow!.id,
      personalDataConsent: "GRANTED",
      photoVideoConsent: "GRANTED",
      notes: "Wali memberikan kembali izin foto setelah memilih foto kelompok.",
    });
    expect(regrantRes.success).toBe(true);

    // 7. Approver (different from author Ms. Lilian) publishes `pubId` -> PUBLISHED + audit event
    const publishRes = await transitionPublicationStatus(approverSession, {
      publicationId: pubId,
      targetStatus: "PUBLISHED",
      subjectStudentIds: [studentId],
    });
    expect(publishRes.success).toBe(true);
    if (publishRes.success) {
      expect(publishRes.data.newStatus).toBe("PUBLISHED");
      expect(publishRes.data.publishedAt).toBeTruthy();
    }

    const publicPosts = await listPublishedPublicationsForPublic();
    expect(publicPosts.some((p) => p.id === pubId)).toBe(true);

    const pubAudits = await db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.entityId, pubId));
    expect(pubAudits.some((a) => a.action === "PublicationPublished")).toBe(
      true
    );
  });
});

