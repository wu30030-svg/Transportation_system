# Identity Domain（身分領域）

- Version（版本）：2.0
- Status（狀態）：Approved（已核定）
- Last Updated（最後更新）：2026-08-08

## 1. Responsibility（職責）

Identity 負責：

- User Identity（使用者身分）
- Authentication（驗證）
- Role（角色）
- Permission（權限）
- Access Control（存取控制）

## 2. Not Responsible（非職責）

Identity 不負責：

- Mission Business Rules
- Route Planning
- Camera Query
- Vehicle Tracking

## 3. Role（角色）

Role 表示：

> 你是誰。

目前討論的角色包括：

- 指揮官
- 車長
- 監控人員
- 廠商

角色本身不直接等於功能權限。

## 4. Permission（權限）

Permission 表示：

> 你能做什麼。

例如：

```text
Mission.View
Mission.Create
Mission.Edit
Mission.Assign

Route.View
Route.Edit

Vehicle.View
Vehicle.Track

Camera.View
CameraGroup.Edit
```

## 5. Role ≠ Permission

架構必須避免：

```text
if role === commander
```

大量散落在程式中。

應逐步導向：

```text
User
 ↓
Role
 ↓
Permission
 ↓
Action
```

## 6. Hierarchy（階級）與 Permission

實際軍中階級與權限仍需由領域專家確認。

目前已確認的方向：

- 一般車長不能任意修改已核定 Mission。
- 高階車長在授權範圍內可處理較高權限操作。
- 指揮官具有更高層級的任務管理能力。

具體 Permission Matrix（權限矩陣）於後續 Identity / Permission Design 階段正式建立。

## 7. Business Rules（業務規則）

### ID-001
Role 不等於 Permission。

### ID-002
Permission 應控制實際 Action。

### ID-003
權限不足時由 Backend Enforcement（後端強制檢查）作為最終防線。

### ID-004
尚未確認的軍中權限規則不得自行假設。
