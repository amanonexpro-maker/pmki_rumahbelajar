import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const hookRuntime = vi.hoisted(() => {
  const state = {
    states: [] as unknown[],
    refs: [] as Array<{ current: unknown }>,
    cleanups: [] as Array<() => void>,
    stateIndex: 0,
    refIndex: 0,
    effectRan: false,
    unmounted: false,
    isUploadingTransitions: [] as boolean[],
    setStateAfterUnmountCalls: 0,
  };

  return {
    state,
    reset() {
      state.states = [];
      state.refs = [];
      state.cleanups = [];
      state.stateIndex = 0;
      state.refIndex = 0;
      state.effectRan = false;
      state.unmounted = false;
      state.isUploadingTransitions = [];
      state.setStateAfterUnmountCalls = 0;
    },
  };
});

vi.mock("react", () => {
  return {
    useState: <T,>(initial: T | (() => T)) => {
      const idx = hookRuntime.state.stateIndex++;
      if (!(idx in hookRuntime.state.states)) {
        const initVal =
          typeof initial === "function" ? (initial as () => T)() : initial;
        hookRuntime.state.states[idx] = initVal;
        if (idx === 0 && typeof initVal === "boolean") {
          hookRuntime.state.isUploadingTransitions.push(initVal);
        }
      }
      const setState = (next: T | ((prev: T) => T)) => {
        if (hookRuntime.state.unmounted) {
          hookRuntime.state.setStateAfterUnmountCalls += 1;
        }
        const prev = hookRuntime.state.states[idx] as T;
        const resolved =
          typeof next === "function" ? (next as (p: T) => T)(prev) : next;
        hookRuntime.state.states[idx] = resolved;
        if (idx === 0 && typeof resolved === "boolean") {
          hookRuntime.state.isUploadingTransitions.push(resolved);
        }
      };
      return [hookRuntime.state.states[idx] as T, setState] as const;
    },
    useRef: <T,>(initial: T) => {
      const idx = hookRuntime.state.refIndex++;
      if (!(idx in hookRuntime.state.refs)) {
        hookRuntime.state.refs[idx] = { current: initial };
      }
      return hookRuntime.state.refs[idx] as { current: T };
    },
    useEffect: (effect: () => void | (() => void)) => {
      if (!hookRuntime.state.effectRan) {
        hookRuntime.state.effectRan = true;
        const cleanup = effect();
        if (typeof cleanup === "function") {
          hookRuntime.state.cleanups.push(cleanup);
        }
      }
    },
    useCallback: <T extends (...args: never[]) => unknown>(fn: T) => fn,
  };
});

const mockCreateUploadUrl = vi.fn();
const mockConfirmUpload = vi.fn();

vi.mock("../actions/media-actions", () => ({
  createMediaUploadUrlAction: (...args: unknown[]) =>
    mockCreateUploadUrl(...args),
  confirmMediaUploadAction: (...args: unknown[]) => mockConfirmUpload(...args),
}));

vi.mock("@/hooks/use-tier-c-guard", () => ({
  useTierCGuard: () => ({
    isOnline: true,
    checkOnline: () => true,
    withTierCGuard: async <T,>(action: () => Promise<T> | T) => await action(),
  }),
}));

import { useMediaUpload } from "./use-media-upload";

function mountUseMediaUpload() {
  const RenderHook = () => {
    hookRuntime.state.stateIndex = 0;
    hookRuntime.state.refIndex = 0;
    return useMediaUpload();
  };

  const unmount = () => {
    hookRuntime.state.unmounted = true;
    for (const cleanup of hookRuntime.state.cleanups) {
      cleanup();
    }
  };

  return { render: RenderHook, unmount };
}

function createSampleFile() {
  return new File(["fake-image-bytes"], "kegiatan-sabtu.jpg", {
    type: "image/jpeg",
  });
}

const sampleMetadata = {
  title: "Kegiatan Membaca Bersama",
  description: "Dokumentasi kelas pagi",
  category: "KEGIATAN" as const,
  capturedDate: "2026-11-25",
};

describe("useMediaUpload", () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    hookRuntime.reset();
    vi.clearAllMocks();
    vi.stubGlobal("fetch", mockFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("executes 3-step upload happy path and transitions isUploading false -> true -> false", async () => {
    mockCreateUploadUrl.mockResolvedValueOnce({
      success: true,
      data: {
        signedUrl: "https://storage.local/upload/123",
        filePath: "media/unit-1/kegiatan-sabtu.jpg",
      },
    });
    mockFetch.mockResolvedValueOnce({ ok: true, status: 200 });
    mockConfirmUpload.mockResolvedValueOnce({
      success: true,
      data: { id: "asset-1" },
    });

    const { render } = mountUseMediaUpload();
    const hook = render();
    const succeeded = await hook.startUpload(createSampleFile(), sampleMetadata);
    const updated = render();

    expect(succeeded).toBe(true);
    expect(hookRuntime.state.isUploadingTransitions).toEqual([
      false,
      true,
      false,
    ]);
    expect(updated.isUploading).toBe(false);
    expect(updated.uploadError).toBeNull();
    expect(mockCreateUploadUrl).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith(
      "https://storage.local/upload/123",
      expect.objectContaining({
        method: "PUT",
        headers: { "Content-Type": "image/jpeg" },
      })
    );
    expect(mockConfirmUpload).toHaveBeenCalledWith(
      expect.objectContaining({
        title: sampleMetadata.title,
        filePath: "media/unit-1/kegiatan-sabtu.jpg",
        mimeType: "image/jpeg",
        category: "KEGIATAN",
      })
    );
  });

  it("stops at Step 1 when createMediaUploadUrlAction fails", async () => {
    mockCreateUploadUrl.mockResolvedValueOnce({
      success: false,
      error: { code: "FORBIDDEN", message: "Anda tidak memiliki izin unggah." },
    });

    const { render } = mountUseMediaUpload();
    const hook = render();
    const succeeded = await hook.startUpload(createSampleFile(), sampleMetadata);
    const updated = render();

    expect(succeeded).toBe(false);
    expect(updated.uploadError).toBe("Anda tidak memiliki izin unggah.");
    expect(updated.isUploading).toBe(false);
    expect(mockFetch).not.toHaveBeenCalled();
    expect(mockConfirmUpload).not.toHaveBeenCalled();
  });

  it("stops at Step 2 when PUT request fails and sets generic upload error", async () => {
    mockCreateUploadUrl.mockResolvedValueOnce({
      success: true,
      data: {
        signedUrl: "https://storage.local/upload/123",
        filePath: "media/unit-1/kegiatan-sabtu.jpg",
      },
    });
    mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });

    const { render } = mountUseMediaUpload();
    const hook = render();
    const succeeded = await hook.startUpload(createSampleFile(), sampleMetadata);
    const updated = render();

    expect(succeeded).toBe(false);
    expect(updated.uploadError).toBe(
      "Gagal mengunggah berkas ke penyimpanan privat."
    );
    expect(updated.isUploading).toBe(false);
    expect(mockConfirmUpload).not.toHaveBeenCalled();
  });

  it("handles Step 3 failure when confirmMediaUploadAction returns error", async () => {
    mockCreateUploadUrl.mockResolvedValueOnce({
      success: true,
      data: {
        signedUrl: "https://storage.local/upload/123",
        filePath: "media/unit-1/kegiatan-sabtu.jpg",
      },
    });
    mockFetch.mockResolvedValueOnce({ ok: true, status: 200 });
    mockConfirmUpload.mockResolvedValueOnce({
      success: false,
      error: { code: "VALIDATION_ERROR", message: "Metadata tidak valid." },
    });

    const { render } = mountUseMediaUpload();
    const hook = render();
    const succeeded = await hook.startUpload(createSampleFile(), sampleMetadata);
    const updated = render();

    expect(succeeded).toBe(false);
    expect(updated.uploadError).toBe("Metadata tidak valid.");
    expect(updated.isUploading).toBe(false);
  });

  it("aborts in-flight PUT request on unmount and avoids setState after unmount", async () => {
    const abortSpy = vi.spyOn(AbortController.prototype, "abort");

    mockCreateUploadUrl.mockResolvedValueOnce({
      success: true,
      data: {
        signedUrl: "https://storage.local/upload/123",
        filePath: "media/unit-1/kegiatan-sabtu.jpg",
      },
    });

    mockFetch.mockImplementationOnce(
      (_url: string, init?: RequestInit) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => {
            reject(new DOMException("The operation was aborted.", "AbortError"));
          });
        })
    );

    const { render, unmount } = mountUseMediaUpload();
    const hook = render();
    const uploadPromise = hook.startUpload(createSampleFile(), sampleMetadata);

    // Allow Step 1 microtask to resolve so Step 2 fetch is active with AbortSignal
    await Promise.resolve();
    await Promise.resolve();

    unmount();
    const succeeded = await uploadPromise;

    expect(succeeded).toBe(false);
    expect(abortSpy).toHaveBeenCalledTimes(1);
    expect(hookRuntime.state.setStateAfterUnmountCalls).toBe(0);
    expect(mockConfirmUpload).not.toHaveBeenCalled();
  });
});

