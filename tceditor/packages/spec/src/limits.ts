/**
 * 驗證器的上限與節點 id 格式。catalog（Task 8）與驗證器（Task 9）都會用到，
 * 放在這個獨立模組，讓 validator 不必 import convert/*。
 */
export type ValidatorLimits = {
  maxBytes: number;
  maxDepth: number;
  maxBlocks: number;
  maxIssues: number;
};

/** 規格 §6.2：2 MB（UTF-8 位元組）、32 層、5,000 個區塊、最多回報 100 筆。 */
export const DEFAULT_LIMITS: ValidatorLimits = Object.freeze({
  maxBytes: 2_097_152,
  maxDepth: 32,
  maxBlocks: 5000,
  maxIssues: 100,
});

/** 規格 §6.2 #6：props.id 的格式（另外不得是 "root"）。 */
export const NODE_ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;
