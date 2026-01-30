# UI Design Canon: MatrixGin Light

This document defines the mandatory visual standards for the MatrixGin project. Every new page and component must adhere to these rules to maintain the "Geit Canon" — a neat, thin, and premium aesthetic.

## 1. Typography (Geist Canon)

The font of choice is **Geist**. No fallbacks to Inter or Roboto are allowed.

| Element | Weight | Utility Class | Note |
| :--- | :--- | :--- | :--- |
| **Headers (h1-h4)** | 500 (Medium) | `font-medium` | Never use `bold` or `black`. |
| **Key Metrics/Numbers**| 500 (Medium) | `font-medium` | Emphasis comes from size, not weight. |
| **Body Text** | 400 (Normal) | `font-normal` | Clean and readable. |
| **Buttons/Labels** | 500 (Medium) | `font-medium` | Consistent emphasis. |
| **Mono Elements** | 400/500 | `font-mono` | For IDs and technical logs. |

## 2. Color Palette (MatrixGin Light)

We use a high-contrast, professional "Light" theme. Avoid pure blacks or generic grays.

| Variable | Hex Value | Utility (Tailwind) | Usage |
| :--- | :--- | :--- | :--- |
| **Primary Text** | `#030213` | `text-[#030213]` | Main headings and content. |
| **Secondary Text** | `#717182` | `text-[#717182]` | Descriptions, labels, muted info. |
| **Main Background** | `#F3F3F5` | `bg-[#F3F3F5]` | Layout background (Layout Body). |
| **Surface/Card** | `#FFFFFF` | `bg-white` | All interactive cards and sections. |
| **Border** | `rgba(0,0,0,0.1)`| `border-black/10`| Subtle separation. |
| **Accent Primary** | `#3B82F6` | `text-blue-500` | Links, primary icons. |
| **Accent Indigo** | `#4F46E5` | `bg-indigo-600` | Primary buttons. |

## 3. Component Standards

### Cards & Containers
- **Background:** Always `bg-white`.
- **Borders:** `border border-black/10`.
- **Radius:** `rounded-2xl` (16px) or `rounded-3xl` (24px) for large containers.
- **Shadow:** `shadow-sm` or `shadow-md` for hover states.

### Interactive Elements
- **Buttons (Primary):** `bg-indigo-600 text-white font-medium rounded-xl`.
- **Buttons (Ghost):** `bg-white border border-black/10 text-[#030213]`.
- **Inputs:** `bg-[#F3F3F5] border border-black/5 rounded-xl text-sm`.

## 4. "Scorched Earth" Policy (Legacy Cleanup)

When modifying old pages, you **MUST** replace these legacy patterns:
- Replace `bg-gray-900` / `bg-black` with `bg-white`.
- Replace `text-white` with `text-[#030213]` (unless on a dark button/pill).
- Replace `font-bold` / `font-semibold` with `font-medium`.
- Delete any inline `style={{ fontFamily: '...' }}`.

> [!IMPORTANT]
> **Принцип дизайна:** Никаких "жирных пятен". Интерфейс должен "дышать". Акцент создается за счет свободного пространства (whitespace) и каноничного шрифта Geist.
