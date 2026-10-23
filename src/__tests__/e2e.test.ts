import { describe, it, expect, vi, beforeEach } from 'vitest';
import schemaDriftDetectorPlugin from '../main';
import { driftStore } from '../store/driftStore';
import { runSchemaDriftCheck } from '../runner';

describe('Schema Drift Detector Plugin E2E', () => {
  beforeEach(() => {
    driftStore.resetAll();
  });

  it('initializes and registers response section and hook', async () => {
    let responseHandler: any;
    let registeredSection: any;
    let registeredStatusBarItem: any;

    const mockContext: any = {
      registerResponsePanelSection: vi.fn((section) => {
        registeredSection = section;
      }),
      onProcessResponse: vi.fn((handler) => {
        responseHandler = handler;
      }),
      registerStatusBarItem: vi.fn((item) => {
        registeredStatusBarItem = item;
      }),
      response: {
        getCurrentTabId: vi.fn(async () => 'tab-123'),
      },
      ui: {
        showToast: vi.fn(),
      },
    };

    const plugin = schemaDriftDetectorPlugin(mockContext);
    await plugin.onload();

    expect(mockContext.registerResponsePanelSection).toHaveBeenCalled();
    expect(mockContext.onProcessResponse).toHaveBeenCalled();
    expect(mockContext.registerStatusBarItem).toHaveBeenCalled();
    expect(registeredSection.id).toBe('schema-drift');

    // 1. First execution -> Records baseline
    await responseHandler({
      status: 200,
      url: 'https://api.example.com/items',
      body: [{ id: 1, title: 'Item 1' }],
    });

    let report = driftStore.getReport('tab-123');
    expect(report).toBeDefined();
    expect(report?.isNewBaseline).toBe(true);
    expect(registeredSection.hasResults('tab-123')).toBe(true);

    // 2. Second execution with modified type -> Detects breaking change
    await responseHandler({
      status: 200,
      url: 'https://api.example.com/items',
      body: [{ id: '1', title: 'Item 1' }],
    });

    report = driftStore.getReport('tab-123');
    expect(report).toBeDefined();
    expect(report?.isNewBaseline).toBe(false);
    expect(report?.hasBreakingChanges).toBe(true);
    expect(report?.summary.breaking).toBe(1);
    expect(mockContext.ui.showToast).toHaveBeenCalledWith(
      expect.stringContaining('breaking change(s) detected'),
      'warning'
    );
  });

  it('handles response with statusCode instead of status, and falls back to tab.getActiveTab', async () => {
    let responseHandler: any;
    let registeredSection: any;

    const mockContext: any = {
      registerResponsePanelSection: vi.fn((section) => {
        registeredSection = section;
      }),
      onProcessResponse: vi.fn((handler) => {
        responseHandler = handler;
      }),
      registerStatusBarItem: vi.fn(),
      response: {
        getCurrentTabId: vi.fn(async () => null), // Core REST handler already cleared it
      },
      tab: {
        getActiveTab: vi.fn(async () => ({ id: 'tab-real-active' })),
      },
      ui: {
        showToast: vi.fn(),
      },
    };

    const plugin = schemaDriftDetectorPlugin(mockContext);
    await plugin.onload();

    // 1. Initial run using Voiden BaseResponse shape (statusCode, no status property, Buffer body)
    const rawBuffer1 = Buffer.from(
      JSON.stringify({
        args: {},
        json: { id: 1, name: 'Voiden' },
      })
    );

    await responseHandler({
      statusCode: 200,
      url: 'https://httpbin.org/post',
      body: rawBuffer1,
    });

    const report1 = driftStore.getReport('tab-real-active');
    expect(report1).toBeDefined();
    expect(report1?.statusCode).toBe(200);
    expect(report1?.isNewBaseline).toBe(true);
    expect(registeredSection.hasResults('tab-real-active')).toBe(true);

    // 2. Second run: changing "id": 1 to "id": "1" and removing "name"
    const rawBuffer2 = Buffer.from(
      JSON.stringify({
        args: {},
        json: { id: '1' },
      })
    );

    await responseHandler({
      statusCode: 200,
      url: 'https://httpbin.org/post',
      body: rawBuffer2,
    });

    const report2 = driftStore.getReport('tab-real-active');
    expect(report2).toBeDefined();
    expect(report2?.isNewBaseline).toBe(false);
    expect(report2?.hasBreakingChanges).toBe(true);
    expect(report2?.summary.breaking).toBe(2);

    const diffPaths = report2?.differences.map((d) => d.path);
    expect(diffPaths).toEqual(['json.id', 'json.name']);
    expect(report2?.differences[0].kind).toBe('TYPE_CHANGED');
    expect(report2?.differences[1].kind).toBe('FIELD_REMOVED');
    expect(mockContext.ui.showToast).toHaveBeenCalledWith(
      expect.stringContaining('2 breaking change(s) detected'),
      'warning'
    );
  });

  it('runs programmatic CI schema drift check', () => {
    const baseline = {
      user: {
        id: 100,
        name: 'Alice',
        tags: ['admin', 'staff'],
      },
    };

    const changed = {
      user: {
        id: 100,
        name: 'Alice',
        tags: [1, 2], // breaking array type mutation
        newProfile: { bio: 'hi' },
      },
    };

    const result = runSchemaDriftCheck({
      baselineJsonOrSchema: baseline,
      currentResponseOrPayload: changed,
    });

    expect(result.success).toBe(false);
    expect(result.hasBreakingChanges).toBe(true);
    expect(result.markdown).toContain('BREAKING CHANGES DETECTED');
    expect(result.text).toContain('[BREAKING]');
  });
});
