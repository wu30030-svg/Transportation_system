# Architecture Decision Flow（架構決策流程）

- Version（版本）：2.0
- Status（狀態）：Approved（已核定）
- Last Updated（最後更新）：2026-08-08

## 1. Standard Flow（標準流程）

```text
需求
 ↓
確認真實使用情境
 ↓
判斷所屬 Domain
 ↓
判斷是否為 Decision / Dynamic Data
 ↓
確認 Aggregate Boundary
 ↓
確認 Permission
 ↓
確認 API Boundary
 ↓
建立 / 更新 Architecture Document
 ↓
必要時建立 ADR
 ↓
Database Design
 ↓
Implementation
```

## 2. New Feature Checklist（新功能檢查）

每新增功能前，至少回答：

1. 它服務哪一個 Domain？
2. 它是不是 Mission 的 Decision？
3. 它是 Static Data 還是 Dynamic Data？
4. 誰擁有這筆資料？
5. 誰可以修改？
6. 執行開始後是否仍可修改？
7. 是否需要保存歷史？
8. 是否需要 API？
9. 是否涉及大型運算？
10. 是否需要新增資料表？

## 3. Unclear Requirement（需求不明確）

如果上述問題中有任何一項涉及尚未確認的實際流程：

> 停止自行設計，先向產品負責人確認。

## 4. Performance Check（效能檢查）

任何新增地圖／空間功能：

- 是否需要大量資料？
- 是否需要 Spatial Query（空間查詢）？
- 是否能由 Backend 處理？
- 是否會增加 Browser DOM？
- 是否會重複查詢 CCTV？
- 是否能利用既有 Cache（快取）？

先回答，再實作。
