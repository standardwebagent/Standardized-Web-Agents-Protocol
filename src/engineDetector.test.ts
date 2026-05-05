import { describe, it, expect, vi, beforeEach } from 'vitest';
import { detectEngine } from './engineDetector';

describe('engineDetector', () => {
  beforeEach(() => {
    vi.stubGlobal('navigator', {});
  });

  it('should use webnn if createContext resolves', async () => {
    vi.stubGlobal('navigator', {
      ml: {
        createContext: vi.fn().mockResolvedValue({})
      }
    });
    const result = await detectEngine();
    expect(result).toBe('webnn');
  });

  it('should fallback to next engine if webnn createContext returns null', async () => {
    vi.stubGlobal('navigator', {
      ml: {
        createContext: vi.fn().mockResolvedValue(null)
      },
      gpu: {
        requestAdapter: vi.fn().mockResolvedValue({})
      }
    });
    const result = await detectEngine();
    expect(result).toBe('webgpu');
  });

  it('should fallback to next engine if webnn createContext throws', async () => {
    vi.stubGlobal('navigator', {
      ml: {
        createContext: vi.fn().mockRejectedValue(new Error('ML Error'))
      },
      gpu: {
        requestAdapter: vi.fn().mockResolvedValue({})
      }
    });
    const result = await detectEngine();
    expect(result).toBe('webgpu');
  });

  it('should fallback to wasm if navigator.gpu and navigator.ml are undefined', async () => {
    const result = await detectEngine();
    expect(result).toBe('wasm');
  });

  it('should use webgpu if requestAdapter resolves', async () => {
    vi.stubGlobal('navigator', {
      gpu: {
        requestAdapter: vi.fn().mockResolvedValue({})
      }
    });
    const result = await detectEngine();
    expect(result).toBe('webgpu');
  });

  it('should fallback to wasm if requestAdapter returns null', async () => {
    vi.stubGlobal('navigator', {
      gpu: {
        requestAdapter: vi.fn().mockResolvedValue(null)
      }
    });
    const result = await detectEngine();
    expect(result).toBe('wasm');
  });

  it('should fallback to wasm if requestAdapter throws', async () => {
    vi.stubGlobal('navigator', {
      gpu: {
        requestAdapter: vi.fn().mockRejectedValue(new Error('GPU Error'))
      }
    });
    const result = await detectEngine();
    expect(result).toBe('wasm');
  });
});
