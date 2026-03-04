---
id: DOC-ARH-GEN-183
type: Legacy
layer: Archive
status: Draft
version: 0.1.0
owners: [@techlead]
last_updated: 2026-02-15
---

# RAI Enterprise Platform — Sidebar Technical Specification

## 1. Геометрия и Макет

*   **Ширина**: `350px` (Fixed).
*   **Основной контент**: `ml-[350px]` (Dynamic Margin matches Sidebar width).
*   **Высота**: `h-screen` (Viewport Height).
*   **Скролл**: `overflow-y-auto` (Vertical Scroll).
*   **Позиционирование**: `fixed left-0 top-0` (Sticky).
*   **Граница**: `border-r border-black/10` (Subtle separator).

## 2. Типографика

*   **Шрифт**: `GeistSans` (`font-geist`).
*   **Размер шрифта**:
    *   **Root Items (Core)**: `text-xs uppercase tracking-wider font-semibold` (Акцент на Core).
    *   **Root Items (Strategic/Other)**: `text-xs uppercase tracking-wide font-medium`.
    *   **Inner Items**: `text-sm font-medium` (Стандартный размер).
*   **Line-Height**: `leading-snug` (Оптимизировано для длинных названий строк).
*   **Цвет текста**:
    *   **Active Item**: `text-white`.
    *   **Active Domain (Core)**: `text-slate-900`.
    *   **Active Domain (Other)**: `text-gray-900`.
    *   **Inactive**: `text-gray-600` (`hover:text-gray-900`).
    *   **System Items**: `text-gray-400` (`hover:text-gray-700`).
    *   **Overview**: `text-gray-500` (`hover:text-gray-900`).

## 3. Цветовая Палитра

*   **Фон Sidebar**: `bg-white`.
*   **Фон Active Item**: `bg-black` (`shadow-sm`).
*   **Фон Active Domain (Core)**: `bg-slate-50/80` (Холодный оттенок).
*   **Фон Active Domain (Strategic)**: `bg-stone-50/80` (Теплый оттенок).
*   **Граница Active Domain (Core)**: `border-l-[3px] border-slate-400` (Сильный акцент слева).
*   **System Separator**: `border-gray-100/50`.

## 4. Ритм и Отступы (Density)

*   **Core Root Padding**: `py-3` (`mb-3`) — Выделение заголовка домена.
*   **Core Inner Padding**: `py-2` — Умеренная плотность для основного списка.
*   **Standard Item Padding**: `py-1.5` (`mb-0.5`) — Высокая плотность для вторичных списков.
*   **Micro-Grouping Margin**: `mt-2` — Визуальная пауза перед смысловыми блоками ('execution', 'results').
*   **System Block Margin**: `mt-6`, `pt-3` — Значительный отступ для системного блока.
*   **Indentation (Вложенность)**: `ml-5 pl-2` — Отступ для дочерних элементов относительно родителя.

## 5. Интерактивность и Состояния

*   **Hover**:
    *   Text: `text-gray-900`.
    *   Background: `hover:bg-gray-50`.
*   **Chevron (Стрелки)**:
    *   **Default**: `opacity-30` (Минимизация визуального шума).
    *   **Hover**: `opacity-100` (Полная видимость при наведении).
    *   **Size**: `14px`.
*   **Active State**:
    *   Background: Заливка на всю ширину внутри padding (`px-3 rounded-lg`).
    *   Text: Белый цвет для максимального контраста.

## 6. Структура (Domain Layers)

*   **Layer 1 (Core)**: 'crop'.
*   **Layer 2 (Strategic)**: 'strategy', 'economy', 'finance', 'gr'.
*   **Layer 3 (Physical)**: 'production'.
*   **Layer 4 (Cross-Layer)**: 'knowledge'.
*   **Layer 5 (System)**: 'settings'.

*Generated automatically from current implementation state.*
