import { describe, expect, it, vi } from "vitest";
import { setupWorkflowSettings, workflowGroup } from "./workflow-settings";

describe("workflow-settings module", () => {
  it("assigns each formatter to a single workflow module", () => {
    expect(workflowGroup("correct-title-sentence-case")).toBe("title");
    expect(workflowGroup("correct-bookTitle-sentence-case")).toBe("title");
    expect(workflowGroup("correct-proceedingsTitle-sentence-case")).toBe("title");
    expect(workflowGroup("correct-publication-title-case")).toBe("publication");
    expect(workflowGroup("correct-creators-case")).toBe("creators");
    expect(workflowGroup("require-doi")).toBe("identifiers");
    expect(workflowGroup("correct-pages-range")).toBe("pagination");
    expect(workflowGroup("correct-attachment-roles")).toBe("attachments");
    expect(workflowGroup("correct-date-format")).toBe("other");
  });

  it("configures metadata source priority radio buttons with real interactive click handling", () => {
    const preferences = new Map<string, unknown>();
    preferences.set("rule.tool-update-metadata.option.mode", "blank");
    preferences.set("workflow.updateBibliographic", true);

    vi.stubGlobal("addon", {
      data: {
        alive: true,
        config: { addonID: "metaflow@groele", prefsPrefix: "extensions.zotero.metaref" },
      },
    });

    vi.stubGlobal("Zotero", {
      Prefs: {
        get: (key: string) => {
          const stripped = key.replace("extensions.zotero.metaref.", "");
          return preferences.get(stripped);
        },
        set: (key: string, val: unknown) => {
          const stripped = key.replace("extensions.zotero.metaref.", "");
          preferences.set(stripped, val);
        },
      },
    });

    // Mock DOM elements
    const elements = new Map<string, any>();
    const host = {
      children: [] as any[],
      insertBefore: vi.fn((node: any) => host.children.push(node)),
      querySelector: (sel: string) => sel === "#metaref-additional-menu-options" ? elements.get("additional") : null,
    };
    elements.set("additional", { id: "metaref-additional-menu-options" });

    const xulGroup = {
      id: "metaref-metadata-source-priority",
      value: "blank",
      dispatchEvent: vi.fn(),
    };
    elements.set("#metaref-metadata-source-priority", xulGroup);

    const createdElements: any[] = [];
    const mockDoc = {
      defaultView: {
        AbortController,
        Event: class MockEvent {
          constructor(public type: string, public options?: any) {}
        },
      },
      l10n: {
        setAttributes: vi.fn(),
      },
      createElementNS: (_ns: string, tag: string) => {
        const el: any = {
          tagName: tag,
          className: "",
          classList: {
            toggle: vi.fn(),
          },
          attributes: new Map<string, string>(),
          children: [] as any[],
          style: {},
          setAttribute: (k: string, v: string) => el.attributes.set(k, v),
          getAttribute: (k: string) => el.attributes.get(k),
          append: (...nodes: any[]) => el.children.push(...nodes),
          appendChild: (node: any) => el.children.push(node),
          insertBefore: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        };
        createdElements.push(el);
        return el;
      },
    };

    const pane: any = {
      ownerDocument: mockDoc,
      querySelector: (sel: string) => {
        if (sel === "#metaref-core-workflows")
          return host;
        if (sel === "#metaref-metadata-source-priority")
          return xulGroup;
        if (sel.includes("data-core-menu-command")) {
          return {
            id: sel,
            children: [],
          };
        }
        return null;
      },
      querySelectorAll: () => [],
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    };

    try {
      setupWorkflowSettings(pane);

      // Verify the radio inputs were created
      const radioLocal = createdElements.find(el => el.id === "metaref-source-priority-blank");
      const radioCloud = createdElements.find(el => el.id === "metaref-source-priority-all");
      expect(radioLocal).toBeDefined();
      expect(radioCloud).toBeDefined();
      expect(radioLocal.type).toBe("radio");
      expect(radioCloud.type).toBe("radio");
      expect(radioLocal.checked).toBe(true);
      expect(radioCloud.checked).toBe(false);

      // Verify click listener on cloud radio
      const cloudClick = radioCloud.addEventListener.mock.calls.find((call: any[]) => call[0] === "click");
      expect(cloudClick).toBeDefined();

      // Trigger click to change priority to "all" (cloud)
      cloudClick[1](new mockDoc.defaultView.Event("click"));
      expect(preferences.get("rule.tool-update-metadata.option.mode")).toBe("all");
      expect(radioCloud.checked).toBe(true);
      expect(radioLocal.checked).toBe(false);

      // Trigger click on local radio to revert to "blank" (local)
      const localClick = radioLocal.addEventListener.mock.calls.find((call: any[]) => call[0] === "click");
      expect(localClick).toBeDefined();
      localClick[1](new mockDoc.defaultView.Event("click"));
      expect(preferences.get("rule.tool-update-metadata.option.mode")).toBe("blank");
      expect(radioLocal.checked).toBe(true);
      expect(radioCloud.checked).toBe(false);
    }
    finally {
      vi.unstubAllGlobals();
    }
  });
});
