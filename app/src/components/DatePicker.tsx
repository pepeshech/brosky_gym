import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from './BroskyIcon';

interface DatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (value: string) => void;
  className?: string;
  align?: 'left' | 'right';
  id?: string;
}

export const DatePicker: React.FC<DatePickerProps> = ({ value, onChange, className, align = 'left', id }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [popupStyle, setPopupStyle] = useState<React.CSSProperties>({});

  const safeDate = (dateStr: string | undefined | null) => {
    if (!dateStr) return new Date();
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? new Date() : d;
  };

  const [currentDate, setCurrentDate] = useState(safeDate(value));
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popupRef  = useRef<HTMLDivElement>(null);

  const rawYear  = currentDate.getFullYear();
  const rawMonth = currentDate.getMonth();
  const year  = isNaN(rawYear)  ? new Date().getFullYear() : rawYear;
  const month = isNaN(rawMonth) ? new Date().getMonth()    : rawMonth;

  const daysInMonth  = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7; // пн = 0

  const monthNames = [
    'Январь','Февраль','Март','Апрель','Май','Июнь',
    'Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь',
  ];

  /* ── Вычисление позиции попапа ─────────────────────────────── */
  const calcPosition = useCallback(() => {
    if (!buttonRef.current) return;
    const rect  = buttonRef.current.getBoundingClientRect();
    const vw    = window.innerWidth;
    const vh    = window.innerHeight;
    const pw    = 288; // ширина попапа (w-72)
    const POPUP_H = 320; // примерная высота
    const GAP   = 8;

    // Показываем ниже кнопки если влезает, иначе — выше
    const spaceBelow = vh - rect.bottom - GAP;
    const spaceAbove = rect.top - GAP;
    let top: number;
    if (spaceBelow >= POPUP_H || spaceBelow >= spaceAbove) {
      top = rect.bottom + GAP;
    } else {
      top = rect.top - POPUP_H - GAP;
    }

    // Горизонталь: align right (прижимаем правый край к кнопке), но не выходим за экран
    let left: number;
    if (align === 'right') {
      left = rect.right - pw;
    } else {
      left = rect.left;
    }
    // Ограничиваем в пределах экрана
    left = Math.max(8, Math.min(left, vw - pw - 8));

    setPopupStyle({ top, left, width: pw, position: 'fixed' });
  }, [align]);

  const openCalendar = () => {
    calcPosition();
    setIsOpen(true);
  };

  // Пересчёт при ресайзе/скролле
  useEffect(() => {
    if (!isOpen) return;
    const update = () => calcPosition();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [isOpen, calcPosition]);

  // Клик вне — закрываем
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (
        popupRef.current  && !popupRef.current.contains(e.target as Node) &&
        buttonRef.current && !buttonRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  // Синхронизация при внешнем изменении value
  useEffect(() => {
    if (value) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setCurrentDate(d);
      }
    }
  }, [value]);

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleDaySelect = (dayNum: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const mm = String(month + 1).padStart(2, '0');
    const dd = String(dayNum).padStart(2, '0');
    onChange(`${year}-${mm}-${dd}`);
    setIsOpen(false);
  };

  const formatDateLabel = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const [y, m, d] = parts;
    const mIdx = parseInt(m) - 1;
    if (isNaN(mIdx) || mIdx < 0 || mIdx > 11) return dateStr;
    const months = ['янв','фев','мар','апр','мая','июня','июля','авг','сен','окт','ноя','дек'];
    return `${parseInt(d)} ${months[mIdx]} ${y}`;
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const isWFull  = className?.includes('w-full');

  return (
    <div className={`${isWFull ? 'w-full block' : 'inline-block'} text-left`}>
      <button
        id={id}
        ref={buttonRef}
        type="button"
        onClick={openCalendar}
        className={`w-full bg-white/70 border border-gym-border rounded-xl px-4 text-sm text-gray-700 font-semibold focus:outline-none focus:border-gym-accent flex items-center justify-center gap-1.5 hover:bg-white transition-all cursor-pointer h-[46px] ${className || ''}`}
      >
        <CalendarIcon size={14} className="text-gym-accent" />
        <span>{formatDateLabel(value)}</span>
      </button>

      {isOpen && createPortal(
        <>
          {/* Затемнение на мобиле */}
          <div
            className="fixed inset-0 bg-black/30 z-[9998] md:hidden animate-fadeIn"
            onClick={() => setIsOpen(false)}
          />

          {/* Попап — позиционируется через JS, всегда в viewport */}
          <div
            ref={popupRef}
            style={{
              ...popupStyle,
              zIndex: 9999,
              backgroundColor: '#ffffff',
            }}
            className="rounded-2xl p-4 shadow-2xl border border-gym-border animate-fadeIn"
          >
            {/* Навигация по месяцам */}
            <div className="flex justify-between items-center border-b border-gym-border/40 pb-2 mb-3">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1 hover:bg-gray-100 rounded-lg transition-all cursor-pointer border border-gym-border/40 btn-interactive btn-interactive-nav-left"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="text-xs font-bold text-gray-700">
                {monthNames[month]} {year}
              </span>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1 hover:bg-gray-100 rounded-lg transition-all cursor-pointer border border-gym-border/40 btn-interactive btn-interactive-nav-right"
              >
                <ChevronRight size={14} />
              </button>
            </div>

            {/* Дни недели */}
            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-gray-400 mb-1">
              <span>Пн</span><span>Вт</span><span>Ср</span>
              <span>Чт</span><span>Пт</span><span>Сб</span><span>Вс</span>
            </div>

            {/* Сетка дней */}
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: firstDayIndex }).map((_, i) => (
                <div key={`e-${i}`} className="h-7" />
              ))}
              {Array.from({ length: daysInMonth }).map((_, idx) => {
                const dayNum = idx + 1;
                const mm = String(month + 1).padStart(2, '0');
                const dd = String(dayNum).padStart(2, '0');
                const dateStr   = `${year}-${mm}-${dd}`;
                const isSelected = dateStr === value;
                const isToday    = dateStr === todayStr;
                return (
                  <button
                    key={dateStr}
                    type="button"
                    onClick={(e) => handleDaySelect(dayNum, e)}
                    className={`h-7 w-7 rounded-lg flex items-center justify-center transition-all cursor-pointer text-xs font-semibold ${
                      isSelected
                        ? 'bg-gym-accent text-white shadow-xs'
                        : 'hover:bg-gray-100 text-gray-700'
                    } ${isToday && !isSelected ? 'ring-2 ring-emerald-500' : ''}`}
                  >
                    {dayNum}
                  </button>
                );
              })}
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  );
};
