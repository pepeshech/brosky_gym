import React, { useState, useContext, useMemo, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { MUSCLE_COLORS } from '../store/gymStore';

// Ссылочные мышечные группы для карты
type MuscleGroupKey =
  | 'Грудь'
  | 'Широчайшие'
  | 'Трапеции'
  | 'Поясница'
  | 'Плечи'
  | 'Бицепс'
  | 'Трицепс'
  | 'Предплечья'
  | 'Квадрицепс'
  | 'Бицепс бедра'
  | 'Ягодицы'
  | 'Икры'
  | 'Пресс'
  | 'Шея'
  | 'Приводящие'
  | 'Абдукторы'
  | 'Зубчатые';

interface AnatomyModelProps {
  activeMain?: string | null;            // Активная основная группа
  activeSecondary?: string[];            // Активные дополнительные группы
  selectedFilter?: string | null;        // Текущий выбранный фильтр мышечной группы
  onSelectMuscle?: (muscle: MuscleGroupKey | null) => void;
  // Новые параметры для режима Heatmap
  mode?: 'filter' | 'heatmap' | 'fatigue';
  onModeChange?: (mode: 'filter' | 'heatmap' | 'fatigue') => void;
  weeklyLoads?: Record<string, number>;  // Количество подходов или % утомляемости
}

const AnatomyContext = React.createContext<{
  getFillColor: (group: MuscleGroupKey) => string;
  getStrokeColor: (group: MuscleGroupKey) => string;
  getFilterEffect: (group: MuscleGroupKey) => string | undefined;
  handleGroupClick: (group: MuscleGroupKey) => void;
  setHovered: (group: MuscleGroupKey | null) => void;
  selectedFilter?: string | null;
  activeMain?: string | null;
} | null>(null);

const MuscleGroup: React.FC<{ group: MuscleGroupKey; children: React.ReactNode }> = React.memo(({
  group,
  children,
}) => {
  const ctx = useContext(AnatomyContext);
  const groupRef = useRef<SVGGElement>(null);

  if (!ctx) return <g>{children}</g>;

  const fillColor = ctx.getFillColor(group);
  const strokeColor = ctx.getStrokeColor(group);
  const filterEffect = ctx.getFilterEffect(group);
  const isSelected = ctx.selectedFilter === group || ctx.activeMain === group;

  useEffect(() => {
    if (groupRef.current) {
      gsap.to(groupRef.current, {
        fill: fillColor,
        stroke: strokeColor,
        duration: 0.6,
        ease: 'power1.inOut'
      });
    }
  }, [fillColor, strokeColor]);

  useEffect(() => {
    if (!groupRef.current) return;
    if (isSelected) {
      const tween = gsap.to(groupRef.current, {
        strokeWidth: 2.5,
        duration: 0.8,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut'
      });
      return () => {
        tween.kill();
        if (groupRef.current) {
          gsap.set(groupRef.current, { strokeWidth: 0.5 });
        }
      };
    } else {
      gsap.set(groupRef.current, { strokeWidth: 0.5 });
    }
  }, [isSelected]);

  return (
    <g
      ref={groupRef}
      onClick={() => ctx.handleGroupClick(group)}
      onMouseEnter={() => ctx.setHovered(group)}
      onMouseLeave={() => ctx.setHovered(null)}
      className="cursor-pointer select-none"
      style={{
        fill: fillColor,
        stroke: strokeColor,
        strokeWidth: 0.5,
        strokeLinejoin: 'round',
        filter: filterEffect,
      }}
    >
      {children}
    </g>
  );
});

// Научно обоснованные лимиты подходов в неделю по доктору Майку Израэтелю (Renaissance Periodization)
const muscleThresholds: Record<string, { mev: number; mavMin: number; mavMax: number; mrv: number }> = {
  'Грудь': { mev: 8, mavMin: 10, mavMax: 18, mrv: 22 },
  'Широчайшие': { mev: 10, mavMin: 12, mavMax: 20, mrv: 24 },
  'Поясница': { mev: 6, mavMin: 8, mavMax: 14, mrv: 18 },
  'Трапеции': { mev: 6, mavMin: 8, mavMax: 14, mrv: 18 },
  'Плечи': { mev: 8, mavMin: 10, mavMax: 18, mrv: 22 },
  'Бицепс': { mev: 6, mavMin: 8, mavMax: 14, mrv: 18 },
  'Трицепс': { mev: 6, mavMin: 8, mavMax: 14, mrv: 18 },
  'Предплечья': { mev: 6, mavMin: 8, mavMax: 14, mrv: 18 },
  'Квадрицепс': { mev: 8, mavMin: 10, mavMax: 16, mrv: 20 },
  'Бицепс бедра': { mev: 8, mavMin: 10, mavMax: 16, mrv: 20 },
  'Ягодицы': { mev: 6, mavMin: 8, mavMax: 14, mrv: 18 },
  'Икры': { mev: 6, mavMin: 8, mavMax: 14, mrv: 18 },
  'Пресс': { mev: 4, mavMin: 6, mavMax: 12, mrv: 16 },
  'Шея': { mev: 4, mavMin: 6, mavMax: 12, mrv: 16 },
  'Приводящие': { mev: 6, mavMin: 8, mavMax: 14, mrv: 18 },
  'Абдукторы': { mev: 6, mavMin: 8, mavMax: 14, mrv: 18 },
  'Зубчатые': { mev: 4, mavMin: 6, mavMax: 12, mrv: 16 },
};

// Данные полигонов вида спереди
const ANTERIOR_DATA = [
  {
    muscle: 'Грудь' as MuscleGroupKey,
    points: [
      '51.8367347 41.6326531 51.0204082 55.1020408 57.9591837 57.9591837 67.755102 55.5102041 70.6122449 47.3469388 62.0408163 41.6326531',
      '29.7959184 46.5306122 31.4285714 55.5102041 40.8163265 57.9591837 48.1632653 55.1020408 47.755102 42.0408163 37.5510204 42.0408163'
    ]
  },
  {
    muscle: 'Пресс' as MuscleGroupKey,
    points: [
      '56.3265306 59.1836735 57.9591837 64.0816327 58.3673469 77.9591837 58.3673469 92.6530612 56.3265306 98.3673469 55.1020408 104.081633 51.4285714 107.755102 51.0204082 84.4897959 50.6122449 67.3469388 51.0204082 57.1428571',
      '43.6734694 58.7755102 48.5714286 57.1428571 48.9795918 67.3469388 48.5714286 84.4897959 48.1632653 107.346939 44.4897959 103.673469 40.8163265 91.4285714 40.8163265 78.3673469 41.2244898 64.4897959',
      '68.5714286 63.2653061 67.3469388 57.1428571 58.7755102 59.5918367 60 64.0816327 60.4081633 83.2653061 65.7142857 78.7755102 66.5306122 69.7959184',
      '33.877551 78.3673469 33.0612245 71.8367347 31.0204082 63.2653061 32.244898 57.1428571 40.8163265 59.1836735 39.1836735 63.2653061 39.1836735 83.6734694'
    ]
  },
  {
    muscle: 'Бицепс' as MuscleGroupKey,
    points: [
      '16.7346939 68.1632653 17.9591837 71.4285714 22.8571429 66.122449 28.9795918 53.877551 27.755102 49.3877551 20.4081633 55.9183673',
      '71.4285714 49.3877551 70.2040816 54.6938776 76.3265306 66.122449 81.6326531 71.8367347 82.8571429 68.9795918 78.7755102 55.5102041'
    ]
  },
  {
    muscle: 'Трицепс' as MuscleGroupKey,
    points: [
      '69.3877551 55.5102041 69.3877551 61.6326531 75.9183673 72.6530612 77.5510204 70.2040816 75.5102041 67.3469388',
      '22.4489796 69.3877551 29.7959184 55.5102041 29.7959184 60.8163265 22.8571429 73.0612245'
    ]
  },
  {
    muscle: 'Шея' as MuscleGroupKey,
    points: [
      '55.5102041 23.6734694 50.6122449 33.4693878 50.6122449 39.1836735 61.6326531 40 70.6122449 44.8979592 69.3877551 36.7346939 63.2653061 35.1020408 58.3673469 30.6122449',
      '28.9795918 44.8979592 30.2040816 37.1428571 36.3265306 35.1020408 41.2244898 30.2040816 44.4897959 24.4897959 48.9795918 33.877551 48.5714286 39.1836735 37.9591837 39.5918367'
    ]
  },
  {
    muscle: 'Плечи' as MuscleGroupKey,
    points: [
      '78.3673469 53.0612245 79.5918367 47.755102 79.1836735 41.2244898 75.9183673 37.9591837 71.0204082 36.3265306 72.244898 42.8571429 71.4285714 47.3469388',
      '28.1632653 47.3469388 21.2244898 53.0612245 20 47.755102 20.4081633 40.8163265 24.4897959 37.1428571 28.5714286 37.1428571 26.9387755 43.2653061'
    ]
  },
  {
    muscle: 'Абдукторы' as MuscleGroupKey,
    points: [
      '52.6530612 110.204082 54.2857143 124.897959 60 110.204082 62.0408163 100 64.8979592 94.2857143 60 92.6530612 56.7346939 104.489796'
    ]
  },
  {
    muscle: 'Приводящие' as MuscleGroupKey,
    points: [
      '47.755102 110.612245 44.8979592 125.306122 42.0408163 115.918367 40.4081633 113.061224 39.5918367 107.346939 37.9591837 102.44898 34.6938776 93.877551 39.5918367 92.244898 41.6326531 99.1836735 43.6734694 105.306122'
    ]
  },
  {
    muscle: 'Квадрицепс' as MuscleGroupKey,
    points: [
      '34.6938776 98.7755102 37.1428571 108.163265 37.1428571 127.755102 34.2857143 137.142857 31.0204082 132.653061 29.3877551 120 28.1632653 111.428571 29.3877551 100.816327 32.244898 94.6938776',
      '63.2653061 105.714286 64.4897959 100 66.9387755 94.6938776 70.2040816 101.22449 71.0204082 111.836735 68.1632653 133.061224 65.3061224 137.55102 62.4489796 128.571429 62.0408163 111.428571',
      '38.7755102 129.387755 38.3673469 112.244898 41.2244898 118.367347 44.4897959 129.387755 42.8571429 135.102041 40 146.122449 36.3265306 146.530612 35.5102041 140',
      '59.5918367 145.714286 55.5102041 128.979592 60.8163265 113.877551 61.2244898 130.204082 64.0816327 139.591837 62.8571429 146.530612',
      '32.6530612 138.367347 26.5306122 145.714286 25.7142857 136.734694 25.7142857 127.346939 26.9387755 114.285714 29.3877551 133.469388',
      '71.8367347 113.061224 73.877551 124.081633 73.877551 140.408163 72.6530612 145.714286 66.5306122 138.367347 70.2040816 133.469388'
    ]
  },
  {
    muscle: 'Икры' as MuscleGroupKey,
    points: [
      '71.4285714 160.408163 73.4693878 153.469388 76.7346939 161.22449 79.5918367 167.755102 78.3673469 187.755102 79.5918367 195.510204 74.6938776 195.510204',
      '24.8979592 194.693878 27.755102 164.897959 28.1632653 160.408163 26.122449 154.285714 24.8979592 157.55102 22.4489796 161.632653 20.8163265 167.755102 22.0408163 188.163265 20.8163265 195.510204',
      '72.6530612 195.102041 69.7959184 159.183673 65.3061224 158.367347 64.0816327 162.44898 64.0816327 165.306122 65.7142857 177.142857',
      '35.5102041 158.367347 35.9183673 162.44898 35.9183673 166.938776 35.1020408 172.244898 35.1020408 176.734694 32.244898 182.040816 30.6122449 187.346939 26.9387755 194.693878 27.3469388 187.755102 28.1632653 180.408163 28.5714286 175.510204 28.9795918 169.795918 29.7959184 164.081633 30.2040816 158.77551'
    ]
  },
  {
    muscle: 'Предплечья' as MuscleGroupKey,
    points: [
      '6.12244898 88.5714286 10.2040816 75.1020408 14.6938776 70.2040816 16.3265306 74.2857143 19.1836735 73.4693878 4.48979592 97.5510204 0 100',
      '84.4897959 69.7959184 83.2653061 73.4693878 80 73.0612245 95.1020408 98.3673469 100 100.408163 93.4693878 89.3877551 89.7959184 76.3265306',
      '77.5510204 72.244898 77.5510204 77.5510204 80.4081633 84.0816327 85.3061224 89.7959184 92.244898 101.22449 94.6938776 99.5918367',
      '6.93877551 101.22449 13.4693878 90.6122449 18.7755102 84.0816327 21.6326531 77.1428571 21.2244898 71.8367347 4.89795918 98.7755102'
    ]
  }
];

// Данные полигонов вида сзади
const POSTERIOR_DATA = [
  {
    muscle: 'Трапеции' as MuscleGroupKey,
    points: [
      '44.6808511 21.7021277 47.6595745 21.7021277 47.2340426 38.2978723 47.6595745 64.6808511 38.2978723 53.1914894 35.3191489 40.8510638 31.0638298 36.5957447 39.1489362 33.1914894 43.8297872 27.2340426',
      '52.3404255 21.7021277 55.7446809 21.7021277 56.5957447 27.2340426 60.8510638 32.7659574 68.9361702 36.5957447 64.6808511 40.4255319 61.7021277 53.1914894 52.3404255 64.6808511 52.3191489 38.2978723'
    ]
  },
  {
    muscle: 'Плечи' as MuscleGroupKey,
    points: [
      '29.3617021 37.0212766 22.9787234 39.1489362 17.4468085 44.2553191 18.2978723 53.6170213 24.2553191 49.3617021 27.2340426 46.3829787',
      '71.0638298 37.0212766 78.2978723 39.5744681 82.5531915 44.6808511 81.7021277 53.6170213 74.893617 48.9361702 72.3404255 45.106383'
    ]
  },
  {
    muscle: 'Широчайшие' as MuscleGroupKey,
    points: [
      '31.0638298 38.7234043 28.0851064 48.9361702 28.5106383 55.3191489 34.0425532 75.3191489 47.2340426 71.0638298 47.2340426 66.3829787 36.5957447 54.0425532 33.6170213 41.2765957',
      '68.9361702 38.7234043 71.9148936 49.3617021 71.4893617 56.1702128 65.9574468 75.3191489 52.7659574 71.0638298 52.7659574 66.3829787 63.4042553 54.4680851 66.3829787 41.7021277'
    ]
  },
  {
    muscle: 'Трицепс' as MuscleGroupKey,
    points: [
      '26.8085106 49.787234 17.8723404 55.7446809 14.4680851 72.3404255 16.5957447 81.7021277 21.7021277 63.8297872 26.8085106 55.7446809',
      '73.6170213 50.212766 82.1276596 55.7446809 85.9574468 73.1914894 83.4042553 82.1276596 77.8723404 62.9787234 73.1914894 55.7446809',
      '26.8085106 58.2978723 26.8085106 68.5106383 22.9787234 75.3191489 19.1489362 77.4468085 22.5531915 65.5319149',
      '72.7659574 58.2978723 77.0212766 64.6808511 80.4255319 77.4468085 76.5957447 75.3191489 72.7659574 68.9361702'
    ]
  },
  {
    muscle: 'Поясница' as MuscleGroupKey,
    points: [
      '47.6595745 72.7659574 34.4680851 77.0212766 35.3191489 83.4042553 49.3617021 102.12766 46.8085106 82.9787234',
      '52.3404255 72.7659574 65.5319149 77.0212766 64.6808511 83.4042553 50.6382979 102.12766 53.1914894 83.8297872'
    ]
  },
  {
    muscle: 'Предплечья' as MuscleGroupKey,
    points: [
      '86.3829787 75.7446809 91.0638298 83.4042553 93.1914894 94.0425532 100 106.382979 96.1702128 104.255319 88.0851064 89.3617021 84.2553191 83.8297872',
      '13.6170213 75.7446809 8.93617021 83.8297872 6.80851064 93.6170213 0 106.382979 3.82978723 104.255319 12.3404255 88.5106383 15.7446809 82.9787234',
      '81.2765957 79.5744681 77.4468085 77.8723404 79.1489362 84.6808511 91.0638298 103.829787 93.1914894 108.93617 94.4680851 104.680851',
      '18.7234043 79.5744681 22.1276596 77.8723404 20.8510638 84.2553191 9.36170213 102.978723 6.80851064 108.510638 5.10638298 104.680851'
    ]
  },
  {
    muscle: 'Ягодицы' as MuscleGroupKey,
    points: [
      '44.6808511 99.5744681 30.212766 108.510638 29.787234 118.723404 31.4893617 125.957447 47.2340426 121.276596 49.3617021 114.893617',
      '55.3191489 99.1489362 51.0638298 114.468085 52.3404255 120.851064 68.0851064 125.957447 69.787234 119.148936 69.3617021 108.510638'
    ]
  },
  {
    muscle: 'Приводящие' as MuscleGroupKey,
    points: [
      '48.0851064 122.978723 44.6808511 122.978723 41.2765957 125.531915 45.106383 144.255319 48.5106383 135.744681 48.9361702 129.361702'
    ]
  },
  {
    muscle: 'Абдукторы' as MuscleGroupKey,
    points: [
      '51.9148936 122.553191 55.7446809 123.404255 59.1489362 125.957447 54.893617 144.255319 51.9148936 136.170213 51.0638298 129.361702'
    ]
  },
  {
    muscle: 'Бицепс бедра' as MuscleGroupKey,
    points: [
      '28.9361702 122.12766 31.0638298 129.361702 36.5957447 125.957447 35.3191489 135.319149 34.4680851 150.212766 29.3617021 158.297872 28.9361702 146.808511 27.6595745 141.276596 27.2340426 131.489362',
      '71.4893617 121.702128 69.3617021 128.93617 63.8297872 125.957447 65.5319149 136.595745 66.3829787 150.212766 71.0638298 158.297872 71.4893617 147.659574 72.7659574 142.12766 73.6170213 131.914894',
      '38.7234043 125.531915 44.2553191 145.957447 40.4255319 166.808511 36.1702128 152.765957 37.0212766 135.319149',
      '61.7021277 125.531915 63.4042553 136.170213 64.2553191 153.191489 60 166.808511 56.1702128 146.382979'
    ]
  },
  {
    muscle: 'Икры' as MuscleGroupKey,
    points: [
      '29.3617021 160.425532 28.5106383 167.234043 24.6808511 179.574468 23.8297872 192.765957 25.5319149 197.021277 28.5106383 193.191489 29.787234 180 31.9148936 171.06383 31.9148936 166.808511',
      '37.4468085 165.106383 35.3191489 167.659574 33.1914894 171.914894 31.0638298 180.425532 30.212766 191.914894 34.0425532 200 38.7234043 190.638298 39.1489362 168.93617',
      '62.9787234 165.106383 61.2765957 168.510638 61.7021277 190.638298 66.3829787 199.574468 70.6382979 191.914894 68.9361702 179.574468 66.8085106 170.212766',
      '70.6382979 160.425532 72.3404255 168.510638 75.7446809 179.148936 76.5957447 192.765957 74.4680851 196.595745 72.3404255 193.617021 70.6382979 179.574468 68.0851064 168.085106',
      '28.5106383 195.744681 30.212766 195.744681 33.6170213 201.702128 30.6382979 220 28.5106383 213.617021 26.8085106 198.297872',
      '69.787234 195.744681 71.9148936 195.744681 73.6170213 198.297872 71.9148936 213.191489 70.212766 219.574468 67.2340426 202.12766'
    ]
  }
];

export const AnatomyModel: React.FC<AnatomyModelProps> = React.memo(({
  activeMain,
  activeSecondary = [],
  selectedFilter = null,
  onSelectMuscle,
  // Heatmap параметры
  mode = 'filter',
  onModeChange,
  weeklyLoads = {},
}) => {
  const [hovered, setHovered] = useState<MuscleGroupKey | null>(null);

  // Карта цветов по уровню утомляемости
  const getFatigueColor = (group: MuscleGroupKey, isStroke = false) => {
    const fatigue = weeklyLoads[group] || 0;
    if (fatigue < 10) return isStroke ? '#475569' : '#334155'; // Восстановлена (Slate)
    if (fatigue < 40) return isStroke ? '#16a34a' : '#86efac'; // Готова к работе (Green)
    if (fatigue < 70) return isStroke ? '#ca8a04' : '#fef08a'; // Восстанавливается (Yellow)
    return isStroke ? '#dc2626' : '#fca5a5'; // Утомлена (Red)
  };

  // Карта цветов по уровню нагрузки (светофор)
  const getHeatmapColor = (group: MuscleGroupKey, isStroke = false) => {
    const sets = weeklyLoads[group] || 0;
    if (sets === 0) return isStroke ? '#475569' : '#334155'; // Приглушенный цвет в покое (slate-700 / slate-600)
    
    const lim = muscleThresholds[group] || { mev: 6, mavMin: 8, mavMax: 14, mrv: 18 };
    
    if (sets < lim.mev) {
      return isStroke ? '#3b82f6' : '#93c5fd';  // Тонус (Sky-400)
    }
    if (sets < lim.mavMax) {
      return isStroke ? '#6d28d9' : '#8b5cf6';  // Оптимальный MAV (Violet-500)
    }
    if (sets <= lim.mrv) {
      return isStroke ? '#be185d' : '#ec4899';  // Предел MRV (Pink-600)
    }
    return isStroke ? '#b91c1c' : '#ef4444';    // Перегрузка (Red-500)
  };

  // Описание текущего статуса нагрузки для баджа
  const getStatusExplanation = (group: MuscleGroupKey) => {
    if (mode === 'fatigue') {
      const fatigue = weeklyLoads[group] || 0;
      if (fatigue < 10) return 'Восстановлена (0-9%)';
      if (fatigue < 40) return `Готова к работе (Утомление ${fatigue}%)`;
      if (fatigue < 70) return `Восстанавливается (Утомление ${fatigue}%)`;
      return `Утомлена (Утомление ${fatigue}%, нужен отдых!)`;
    }

    const sets = weeklyLoads[group] || 0;
    if (sets === 0) return 'Покой';
    
    const lim = muscleThresholds[group] || { mev: 6, mavMin: 8, mavMax: 14, mrv: 18 };
    if (sets < lim.mev) return `${sets} подх. (тонус)`;
    if (sets < lim.mavMax) return `${sets} подх. (рост MAV)`;
    if (sets <= lim.mrv) return `${sets} подх. (предел MRV)`;
    return `${sets} подх. (перегрузка!)`;
  };

  // Определение цвета заливки для конкретной мышечной группы
  const getFillColor = (group: MuscleGroupKey) => {
    if (mode === 'heatmap') {
      return getHeatmapColor(group, false);
    }
    if (mode === 'fatigue') {
      return getFatigueColor(group, false);
    }

    const isFilter = selectedFilter === group;
    const isMain = activeMain === group;
    const isSecondary = activeSecondary.includes(group);

    if (isFilter) return 'rgba(59, 130, 246, 0.85)'; // Blue для активного фильтра
    if (isMain) return 'rgba(244, 63, 94, 0.85)'; // Rose для основной мышцы
    if (isSecondary) return 'rgba(245, 158, 11, 0.85)'; // Amber для синергистов
    if (hovered === group) return '#cbd5e1'; // Hover-эффект (slate-300)
    return '#e2e8f0'; // Сплошная плотная заливка по умолчанию
  };

  // Определение цвета обводки
  const getStrokeColor = (group: MuscleGroupKey) => {
    if (mode === 'heatmap') {
      return getHeatmapColor(group, true);
    }
    if (mode === 'fatigue') {
      return getFatigueColor(group, true);
    }

    const isFilter = selectedFilter === group;
    const isMain = activeMain === group;
    const isSecondary = activeSecondary.includes(group);

    if (isFilter) return '#2563eb';
    if (isMain) return '#e11d48';
    if (isSecondary) return '#d97706';
    if (hovered === group) return '#94a3b8';
    return '#cbd5e1'; // Контрастная граница по умолчанию
  };

  // Определение эффекта свечения (drop-shadow)
  const getFilterEffect = (group: MuscleGroupKey) => {
    if (mode === 'heatmap') {
      const sets = weeklyLoads[group] || 0;
      if (sets === 0) return undefined;
      const color = getHeatmapColor(group, false);
      return `drop-shadow(0px 2px 5px ${color}50)`;
    }
    if (mode === 'fatigue') {
      const fatigue = weeklyLoads[group] || 0;
      if (fatigue < 10) return undefined;
      const color = getFatigueColor(group, false);
      return `drop-shadow(0px 2px 5px ${color}50)`;
    }

    const isFilter = selectedFilter === group;
    const isMain = activeMain === group;
    const isSecondary = activeSecondary.includes(group);

    if (isMain) return 'drop-shadow(0px 2px 6px rgba(244, 63, 94, 0.4))';
    if (isSecondary) return 'drop-shadow(0px 2px 6px rgba(245, 158, 11, 0.4))';
    if (isFilter) return 'drop-shadow(0px 2px 8px rgba(59, 130, 246, 0.45))';
    return undefined;
  };

  const handleGroupClick = (group: MuscleGroupKey) => {
    // В режиме Heatmap клик по мышце также сработает как фильтр в списке упражнений
    if (onSelectMuscle) {
      if (selectedFilter === group) {
        onSelectMuscle(null);
      } else {
        onSelectMuscle(group);
      }
    }
  };

  const contextValue = useMemo(() => ({
    getFillColor,
    getStrokeColor,
    getFilterEffect,
    handleGroupClick,
    setHovered,
    selectedFilter,
    activeMain
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [activeMain, activeSecondary, selectedFilter, hovered, mode, weeklyLoads]);

  return (
    <AnatomyContext.Provider value={contextValue}>
      <div className="flex flex-col items-center w-full">
        {/* Инфо-панель сверху над силуэтами */}
        <div className="flex flex-col items-center w-full mb-3 h-10 relative justify-center">
          <div className="h-7 flex items-center justify-center">
            {hovered ? (
              <span
                className="text-xs font-bold px-3 py-1 rounded-full border shadow-sm transition-all duration-300 font-display animate-fadeInUp"
                style={{
                  background: mode === 'heatmap' 
                    ? `${getHeatmapColor(hovered)}15` 
                    : mode === 'fatigue' 
                    ? `${getFatigueColor(hovered)}15` 
                    : `${MUSCLE_COLORS[hovered]}12`,
                  color: mode === 'heatmap' 
                    ? getHeatmapColor(hovered, true) 
                    : mode === 'fatigue' 
                    ? getFatigueColor(hovered, true) 
                    : MUSCLE_COLORS[hovered],
                  borderColor: mode === 'heatmap' 
                    ? `${getHeatmapColor(hovered)}35` 
                    : mode === 'fatigue' 
                    ? `${getFatigueColor(hovered)}35` 
                    : `${MUSCLE_COLORS[hovered]}35`,
                  boxShadow: `0 2px 8px ${
                    mode === 'heatmap' 
                      ? getHeatmapColor(hovered) 
                      : mode === 'fatigue' 
                      ? getFatigueColor(hovered) 
                      : MUSCLE_COLORS[hovered]
                  }12`,
                }}
              >
                {hovered} {(mode === 'heatmap' || mode === 'fatigue') && `: ${getStatusExplanation(hovered)}`}
              </span>
            ) : selectedFilter ? (
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-100/70 shadow-sm animate-fadeInUp">
                Фильтр: {selectedFilter}
              </span>
            ) : activeMain ? (
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest animate-fadeIn">
                Мышцы упражнения
              </span>
            ) : (
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest animate-fadeIn">
                Интерактивный атлас
              </span>
            )}
          </div>
        </div>

        {/* Переключатель режимов атласа (Filter vs Heatmap) */}
        {onModeChange && (
          <div className="flex bg-slate-100 p-0.5 rounded-xl mb-4 w-full max-w-[220px] select-none text-[10px] font-bold border border-slate-200/50">
            <button
              onClick={() => onModeChange('filter')}
              className={`flex-1 py-1 rounded-lg text-center transition-all cursor-pointer ${
                mode === 'filter'
                  ? 'bg-white text-slate-800 shadow-xs'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Фильтр мышц
            </button>
            <button
              onClick={() => onModeChange('heatmap')}
              className={`flex-1 py-1 rounded-lg text-center transition-all cursor-pointer ${
                mode === 'heatmap'
                  ? 'bg-white text-slate-800 shadow-xs'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Карта нагрузок
            </button>
          </div>
        )}

        <div className="relative w-full max-w-[260px] aspect-[220/208] mx-auto">
          <svg
            viewBox="0 0 220 208"
            className="w-full h-full drop-shadow-sm select-none"
          >
            {/* VIEW FRONT */}
            <g id="poly-front" transform="translate(0, 0)" style={{ filter: 'drop-shadow(0px 3px 6px rgba(15, 23, 42, 0.08))' }}>
              {/* Голова (неинтерактивная) */}
              <polygon
                points="42.4489796 2.85714286 40 11.8367347 42.0408163 19.5918367 46.122449 23.2653061 49.7959184 25.3061224 54.6938776 22.4489796 57.5510204 19.1836735 59.1836735 10.2040816 57.1428571 2.44897959 49.7959184 0"
                fill={mode === 'heatmap' ? '#334155' : '#f1f5f9'}
                stroke={mode === 'heatmap' ? '#475569' : '#cbd5e1'}
                strokeWidth={0.5}
              />
              {/* Колени (неинтерактивные) */}
              <polygon
                points="33.877551 140 34.6938776 143.265306 35.5102041 147.346939 36.3265306 151.020408 35.1020408 156.734694 29.7959184 156.734694 27.3469388 152.653061 27.3469388 147.346939 30.2040816 144.081633"
                fill={mode === 'heatmap' ? '#334155' : '#f1f5f9'}
                stroke={mode === 'heatmap' ? '#475569' : '#cbd5e1'}
                strokeWidth={0.5}
              />
              <polygon
                points="65.7142857 140 72.244898 147.755102 72.244898 152.244898 69.7959184 157.142857 64.8979592 156.734694 62.8571429 151.020408"
                fill={mode === 'heatmap' ? '#334155' : '#f1f5f9'}
                stroke={mode === 'heatmap' ? '#475569' : '#cbd5e1'}
                strokeWidth={0.5}
              />

              {ANTERIOR_DATA.map((item) => (
                <MuscleGroup key={item.muscle} group={item.muscle}>
                  {item.points.map((pts, idx) => (
                    <polygon key={idx} points={pts} />
                  ))}
                </MuscleGroup>
              ))}

              <text x="50" y="204" textAnchor="middle" className="text-[7.5px] font-bold fill-slate-400 tracking-wider">
                СПЕРЕДИ
              </text>
            </g>

            {/* VIEW BACK */}
            <g id="poly-back" transform="translate(120, 0)" style={{ filter: 'drop-shadow(0px 3px 6px rgba(15, 23, 42, 0.08))' }}>
              {/* Голова (неинтерактивная) */}
              <polygon
                points="50.6382979 0 45.9574468 0.85106383 40.8510638 5.53191489 40.4255319 12.7659574 45.106383 20 55.7446809 20 59.1489362 13.6170213 59.5744681 4.68085106 55.7446809 1.27659574"
                fill={mode === 'heatmap' ? '#334155' : '#f1f5f9'}
                stroke={mode === 'heatmap' ? '#475569' : '#cbd5e1'}
                strokeWidth={0.5}
              />
              {/* Колени (неинтерактивные) */}
              <polygon
                points="34.4680851 153.191489 31.0638298 159.148936 33.6170213 166.382979 37.4468085 162.553191"
                fill={mode === 'heatmap' ? '#334155' : '#f1f5f9'}
                stroke={mode === 'heatmap' ? '#475569' : '#cbd5e1'}
                strokeWidth={0.5}
              />
              <polygon
                points="66.3829787 153.617021 62.9787234 162.978723 66.8085106 166.382979 69.3617021 159.148936"
                fill={mode === 'heatmap' ? '#334155' : '#f1f5f9'}
                stroke={mode === 'heatmap' ? '#475569' : '#cbd5e1'}
                strokeWidth={0.5}
              />

              {POSTERIOR_DATA.map((item) => (
                <MuscleGroup key={item.muscle} group={item.muscle}>
                  {item.points.map((pts, idx) => (
                    <polygon key={idx} points={pts} />
                  ))}
                </MuscleGroup>
              ))}

              <text x="50" y="204" textAnchor="middle" className="text-[7.5px] font-bold fill-slate-400 tracking-wider">
                СЗАДИ
              </text>
            </g>
          </svg>
        </div>

        {/* Легенда в стиле премиальных чипсов */}
        {mode === 'filter' ? (
          <div className="flex flex-wrap justify-center gap-1.5 mt-5 pt-3 border-t border-slate-200/50 w-full select-none max-w-[240px]">
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 border border-rose-100 text-[9px] font-bold transition-all hover:bg-rose-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-sm" />
              Основные
            </div>
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 border border-amber-100 text-[9px] font-bold transition-all hover:bg-amber-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-sm" />
              Синергисты
            </div>
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200/60 text-[9px] font-bold transition-all hover:bg-slate-200/50">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shadow-sm" />
              Нецелевые
            </div>
          </div>
        ) : mode === 'fatigue' ? (
          <div className="flex flex-wrap justify-center gap-1 mt-5 pt-3 border-t border-slate-200/50 w-full select-none max-w-[260px]">
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-slate-200 text-slate-700 border border-slate-300 text-[8px] font-bold">
              <span className="w-1 h-1 rounded-full bg-slate-500" />
              Восстановлена
            </div>
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[8px] font-bold">
              <span className="w-1 h-1 rounded-full bg-emerald-500" />
              Готова
            </div>
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-yellow-50 text-yellow-700 border border-yellow-200 text-[8px] font-bold">
              <span className="w-1 h-1 rounded-full bg-yellow-500" />
              Восстанавливается
            </div>
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 text-[8px] font-bold">
              <span className="w-1 h-1 rounded-full bg-red-500" />
              Утомлена
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap justify-center gap-1 mt-5 pt-3 border-t border-slate-200/50 w-full select-none max-w-[250px]">
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-slate-200 text-slate-600 border border-slate-300 text-[8px] font-bold">
              <span className="w-1 h-1 rounded-full bg-slate-500" />
              Покой
            </div>
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100 text-[8px] font-bold">
              <span className="w-1 h-1 rounded-full bg-blue-400" />
              Тонус
            </div>
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-violet-50 text-violet-600 border border-violet-100 text-[8px] font-bold">
              <span className="w-1 h-1 rounded-full bg-violet-500" />
              Рост MAV
            </div>
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-pink-50 text-pink-600 border border-pink-100 text-[8px] font-bold">
              <span className="w-1 h-1 rounded-full bg-pink-500" />
              Предел MRV
            </div>
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-100 text-[8px] font-bold">
              <span className="w-1 h-1 rounded-full bg-red-500" />
              Перегрузка
            </div>
          </div>
        )}


      </div>
    </AnatomyContext.Provider>
  );
});
