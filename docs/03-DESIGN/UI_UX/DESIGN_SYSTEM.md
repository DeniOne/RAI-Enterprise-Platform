---
id: guideline-design-system-canon
type: guideline
status: approved
owners: [designers]
aligned_with: [principle-axioms]
---

# UI Design Canon: RAI Enterprise Platform

> **Scope:** Enterprise (Contour 1) & Field (Contour 2)
> **Base Style:** MatrixGin Light (Geist Canon)

## 1. Концепция: Два Интерфейса

### 🏢 Contour 1: Enterprise Web (Admin/Office)
*   **Целевая аудитория:** CEO, HR, Бухгалтер, Диспетчер.
*   **Среда:** Desktop (23" - 27" Monitors), Laptop.
*   **Стиль:** **Information Dense**. Много таблиц, дашбордов, мелких контролов. Воздух между блоками.
*   **Theme:** Light Mode Only (Professional).

### 🚜 Contour 2: Field Mobile (Agro/Machinery)
*   **Целевая аудитория:** Агроном, Механизатор.
*   **Среда:** Планшет в кабине трактора, Телефон в поле (яркое солнце / ночь).
*   **Стиль:** **Touch First**. Огромные кнопки, минимум текста, высокая контрастность.
*   **Theme:** Auto (Light for Day, High-Contrast Dark for Night).

---

## 2. Typography (Geist Canon)
**Font:** Geist Sans. No fallbacks.

| Element | Weight | Utility | Note |
| :--- | :--- | :--- | :--- |
| **Headers** | 500 | `font-medium` | Без Bold. Акцент размером. |
| **Body (Desktop)** | 400 | `text-sm` | 14px. Читаемость. |
| **Body (Mobile)** | 500 | `text-base` | 16px+. Чтобы читать в тряске. |
| **Numbers** | 500 | `font-mono` | Для цифр (урожайность, деньги). |

---

## 3. Color Palette by Contour

### Shared (Base)
*   `bg-white`: Surface.
*   `text-[#030213]`: Ink.
*   `text-[#717182]`: Muted.

### 🏢 Enterprise Colors
*   **Primary:** Indigo-600 (`#4F46E5`). Строгость.
*   **Background:** `#F3F3F5` (Pro Gray).
*   **Borders:** `border-black/10`.

### 🚜 Field Colors (High Vis)
*   **Action:** Emerald-600 (`#059669`). "Запустить" / "Ок".
*   **Stop/Danger:** Rose-600 (`#E11D48`). "Стоп" / "Проблема".
*   **Contrast Bg:** `#F8FAFC` (Day) / `#0F172A` (Night).

---

## 4. Component Rules

### Card (Office)
*   `rounded-2xl`, `border-black/5`, `shadow-sm`.
*   Compact padding (`p-4`).

### Card (Field)
*   `rounded-3xl`, `border-black/10`, `shadow-md`.
*   Large padding (`p-6`).
*   **Touch Targets:** Минимум 48x48px.

---

## 5. "Scorched Earth" Policy
1.  **NO** Pure Black (`#000000`). Use `#030213`.
2.  **NO** Generic Gray (`#CCCCCC`). Use Tailwind Zinc/Slate.
3.  **NO** Bold text in Body. Only Headers.
