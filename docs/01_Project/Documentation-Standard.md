# Documentation Standard（文件標準）

- Version（版本）：1.0
- Status（狀態）：Approved（已核定）
- Last Updated（最後更新）：2026-08-08

---

## 1. Purpose（目的）

本文件規範運輸戰略中心所有技術文件的命名、內容與版本管理方式。

文件的目的不是保存聊天紀錄，而是保存：

> **已確認的設計、決策、規則與實作基準。**

---

## 2. Language Standard（語言標準）

第一次出現的專業名詞：

> **English（中文）**

例如：

- Mission（任務）
- Route（路線）
- Vehicle（車輛）
- Aggregate（聚合）
- Entity（實體）
- Value Object（值物件）
- Permission（權限）

後續可依上下文使用英文或中文，但核心術語必須保持一致。

---

## 3. Domain Documentation Standard（領域文件標準）

每一個 Domain（領域）至少需要定義：

### Responsibility（職責）

這個 Domain 負責什麼。

### Not Responsible（非職責）

這個 Domain 明確不負責什麼。

### Aggregate（聚合）

有哪些 Aggregate。

### Entity（實體）

有哪些 Entity。

### Value Object（值物件）

有哪些 Value Object。

### Relationship（關聯）

與其他 Domain 如何互動。

### Business Rules（業務規則）

有哪些不可違反的規則。

### Related ADR（相關架構決策）

有哪些 ADR 支持這個設計。

---

## 4. ADR Standard（架構決策紀錄標準）

每一個重要架構決策使用 ADR（Architecture Decision Record）。

基本格式：

```markdown
# ADR-XXX

## Title

## Status

## Context（背景）

## Decision（決策）

## Consequences（影響）

## Related Documents（相關文件）
```

ADR 的目的：

> **記錄「為什麼這樣設計」，而不只是「最後長什麼樣子」。**

---

## 5. Change Rule（變更規則）

需求變更時：

```text
Requirement（需求）
        ↓
Domain Review（領域檢查）
        ↓
Architecture Decision（架構決策）
        ↓
ADR / Document Update（文件更新）
        ↓
Implementation（實作）
```

不應直接修改程式而讓文件落後。

---

## 6. Status Standard（文件狀態）

建議使用：

- Draft（草稿）
- Proposed（提案）
- Approved（核定）
- Deprecated（棄用）
- Superseded（被新版本取代）

---

## 7. Version Standard（版本標準）

文件版本與產品版本分開。

例如：

```text
Product Version:
V2.0

Document Version:
1.0
```

文件內容有重大架構變更時才提升文件版本。

---

## 8. Project Principle（專案原則）

文件應遵守：

1. 不把聊天紀錄直接當正式規格。
2. 不在沒有領域確認的情況下自行假設軍中流程。
3. 不為尚未需要的功能提前設計完整資料模型。
4. 所有命名保持一致。
5. 重要架構決策必須留下 ADR。
6. 文件必須能讓未參與討論的新工程師理解目前設計。
7. 程式與文件應保持一致。

---

## 9. Source of Truth（真實來源）

在設計階段：

> **Approved Documentation（已核定文件）是架構決策的主要依據。**

在實作階段：

> **Code + Database Migration + Approved Documentation 必須保持一致。**

若三者不一致，應先確認差異，而不是默認程式就是正確答案。

---

## 10. Handover Standard（交接標準）

每完成一個 Milestone（里程碑），產生：

```text
Handover_Mx.md
```

至少包含：

- Completed（已完成）
- Decisions（已決策）
- Open Questions（尚未決定）
- Known Limitations（已知限制）
- Next Milestone（下一階段）
- Related Documents（相關文件）

目的：

> **下一個對話、下一位工程師或未來的自己，都能從文件直接接續工作。**
