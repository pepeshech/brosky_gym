import type { AthleteProfile, WorkoutSession, ProgressEntry, NutritionLogEntry, NutritionFoodItem } from '../types';
import { defaultExercises } from '../store/staticData';

export interface ReportPeriodSummary {
  startDateStr: string;
  endDateStr: string;
  periodTitle: string;
  totalWorkouts: number;
  totalVolumeKg: number;
  totalSetsCompleted: number;
  avgDailyCalories: number;
  weightStartKg: number | null;
  weightEndKg: number | null;
  weightChangeKg: number | null;
  sessions: WorkoutSession[];
  progressLogs: ProgressEntry[];
  nutritionLogs: NutritionLogEntry[];
}

export const MONTH_NAMES_RU = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
];

/**
 * Рассчитывает статистику за любой указанный период дат [startDateStr..endDateStr]
 */
export function calculatePeriodStats(
  startDateStr: string,
  endDateStr: string,
  workoutSessions: WorkoutSession[],
  progress: ProgressEntry[],
  nutritionLogs: NutritionLogEntry[]
): ReportPeriodSummary {
  const start = new Date(startDateStr);
  start.setHours(0, 0, 0, 0);
  const end = new Date(endDateStr || startDateStr);
  end.setHours(23, 59, 59, 999);

  const sessions = workoutSessions.filter(s => {
    const d = new Date(s.date);
    return d >= start && d <= end;
  });

  const progressLogs = progress.filter(p => {
    const d = new Date(p.date);
    return d >= start && d <= end;
  }).sort((a, b) => a.date.localeCompare(b.date));

  const nutLogs = nutritionLogs.filter(n => {
    const d = new Date(n.date);
    return d >= start && d <= end;
  });

  let totalVolumeKg = 0;
  let totalSetsCompleted = 0;

  sessions.forEach(session => {
    if (!session.logs) return;
    Object.values(session.logs).forEach(log => {
      (log.sets || []).forEach(set => {
        if (set.isCompleted && set.weight > 0 && set.reps > 0) {
          totalVolumeKg += set.weight * set.reps;
          totalSetsCompleted += 1;
        }
      });
    });
  });

  const totalCalories = nutLogs.reduce((sum: number, n: NutritionLogEntry) => {
    const dayCals = (n.items || []).reduce((itemSum: number, item: NutritionFoodItem) => itemSum + (item.calories || 0), 0);
    return sum + (n.calories || dayCals || 0);
  }, 0);
  const avgDailyCalories = nutLogs.length > 0 ? Math.round(totalCalories / nutLogs.length) : 0;

  const weightStartKg = progressLogs.length > 0 ? (progressLogs[0].weight ?? null) : null;
  const weightEndKg = progressLogs.length > 0 ? (progressLogs[progressLogs.length - 1].weight ?? null) : null;
  const weightChangeKg = weightStartKg != null && weightEndKg != null ? Math.round((weightEndKg - weightStartKg) * 10) / 10 : null;

  const startFormatted = startDateStr.split('-').reverse().join('.');
  const endFormatted = endDateStr ? endDateStr.split('-').reverse().join('.') : startFormatted;

  return {
    startDateStr,
    endDateStr,
    periodTitle: `${startFormatted} — ${endFormatted}`,
    totalWorkouts: sessions.length,
    totalVolumeKg: Math.round(totalVolumeKg),
    totalSetsCompleted,
    avgDailyCalories,
    weightStartKg,
    weightEndKg,
    weightChangeKg,
    sessions,
    progressLogs,
    nutritionLogs: nutLogs,
  };
}

/**
 * Рассчитывает статистику за выбранный месяц
 */
export function calculateMonthlyStats(
  year: number,
  month: number,
  workoutSessions: WorkoutSession[],
  progress: ProgressEntry[],
  nutritionLogs: NutritionLogEntry[]
) {
  const startDateStr = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const endDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  
  const stats = calculatePeriodStats(startDateStr, endDateStr, workoutSessions, progress, nutritionLogs);
  return {
    ...stats,
    year,
    month,
    monthName: MONTH_NAMES_RU[month] || '',
  };
}

/**
 * Экспорт статистики периода в CSV файл
 */
export function generatePeriodReportCSV(summary: ReportPeriodSummary): string {
  const lines: string[] = [];

  lines.push(`"Сводный отчет Brosky Gym за период ${summary.periodTitle}"`);
  lines.push(`"Количество тренировок";"${summary.totalWorkouts}"`);
  lines.push(`"Общий тоннаж (кг)";"${summary.totalVolumeKg}"`);
  lines.push(`"Выполнено подходов";"${summary.totalSetsCompleted}"`);
  lines.push(`"Средняя калорийность (ккал)";"${summary.avgDailyCalories}"`);
  if (summary.weightChangeKg != null) {
    lines.push(`"Динамика массы тела (кг)";"${summary.weightChangeKg > 0 ? '+' : ''}${summary.weightChangeKg}"`);
  }
  lines.push('');

  // Журнал тренировок
  lines.push('"--- ЖУРНАЛ ТРЕНИРОВОК ---"');
  lines.push('"Дата";"Программа";"Упражнение";"Подход";"Вес (кг)";"Повторения"');

  summary.sessions.forEach(s => {
    if (!s.logs) return;
    Object.entries(s.logs).forEach(([exId, log]) => {
      const ex = defaultExercises.find(e => e.id === exId);
      const exName = ex ? ex.name : exId;
      (log.sets || []).forEach((set, idx) => {
        if (set.isCompleted) {
          lines.push(`"${s.date}";"${s.templateName || 'Тренировка'}";"${exName}";"${idx + 1}";"${set.weight}";"${set.reps}"`);
        }
      });
    });
  });

  lines.push('');

  // Замеры тела
  lines.push('"--- ДИНАМИКА ЗАМЕРОВ ---"');
  lines.push('"Дата";"Вес (кг)";"% Жира";"Талия (см)";"Грудь (см)";"Бицепс (см)"');
  summary.progressLogs.forEach(p => {
    lines.push(`"${p.date}";"${p.weight ?? ''}";"${p.fatPercent ?? ''}";"${p.waist ?? ''}";"${p.chest ?? ''}";"${p.biceps ?? ''}"`);
  });

  return lines.join('\n');
}

/**
 * Для обратной совместимости
 */
export function generateMonthlyReportCSV(summary: ReportPeriodSummary): string {
  return generatePeriodReportCSV(summary);
}

/**
 * Скачивание файла CSV в браузере
 */
export function downloadCSV(filename: string, csvContent: string): void {
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Печать / Сохранение PDF-отчета за период
 */
export function generatePeriodReportPDFWindow(
  profile: AthleteProfile,
  summary: ReportPeriodSummary
): void {
  const printWindow = window.open('', '_blank', 'width=900,height=800');
  if (!printWindow) return;

  const html = `
    <!DOCTYPE html>
    <html lang="ru">
    <head>
      <meta charset="UTF-8">
      <title>Brosky Gym Report - ${summary.periodTitle}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #1e293b; padding: 30px; line-height: 1.5; background: #fff; }
        .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #2555df; padding-bottom: 16px; margin-bottom: 24px; }
        .brand { font-size: 24px; font-weight: 900; color: #0f172a; letter-spacing: -0.5px; }
        .brand span { color: #2555df; }
        .subtitle { font-size: 12px; color: #64748b; margin-top: 2px; }
        .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 28px; }
        .kpi-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px; text-align: center; }
        .kpi-value { font-size: 20px; font-weight: 800; color: #2555df; }
        .kpi-label { font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-top: 2px; }
        section { margin-bottom: 28px; }
        h2 { font-size: 15px; font-weight: 800; color: #0f172a; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; text-align: left; }
        th { background: #f1f5f9; color: #475569; font-weight: 700; padding: 8px 12px; border-bottom: 1px solid #cbd5e1; }
        td { padding: 8px 12px; border-bottom: 1px solid #f1f5f9; color: #334155; }
        .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 16px; }
        @media print {
          body { padding: 0; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="brand">BROSKY<span>GYM</span></div>
          <div class="subtitle">Отчёт об атлетическом прогрессе • ${summary.periodTitle}</div>
        </div>
        <div style="text-align: right; font-size: 12px;">
          <strong>Атлет:</strong> ${profile.username || 'Спортсмен'}<br>
          <strong>Цель:</strong> ${profile.selectedGoal === 'bulk' ? 'Массонабор' : profile.selectedGoal === 'cut' ? 'Сушка' : 'Поддержание'}
        </div>
      </div>

      <div class="grid">
        <div class="kpi-card">
          <div class="kpi-value">${summary.totalWorkouts}</div>
          <div class="kpi-label">Тренировок</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-value">${summary.totalVolumeKg.toLocaleString()} кг</div>
          <div class="kpi-label">Тоннаж</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-value">${summary.totalSetsCompleted}</div>
          <div class="kpi-label">Подходов</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-value">${summary.avgDailyCalories} ккал</div>
          <div class="kpi-label">Ср. Калории</div>
        </div>
      </div>

      <section>
        <h2>Выполненные тренировки</h2>
        <table>
          <thead>
            <tr>
              <th>Дата</th>
              <th>Программа</th>
              <th>Упражнения</th>
              <th>Подходов</th>
            </tr>
          </thead>
          <tbody>
            ${summary.sessions.map(s => {
              const exCount = s.logs ? Object.keys(s.logs).length : 0;
              const setsCount = s.logs ? Object.values(s.logs).reduce((sum, l) => sum + (l.sets ? l.sets.filter(st => st.isCompleted).length : 0), 0) : 0;
              return `
                <tr>
                  <td>${s.date.split('-').reverse().join('.')}</td>
                  <td><strong>${s.templateName || 'Тренировка'}</strong></td>
                  <td>${exCount} упражнений</td>
                  <td>${setsCount} подходов</td>
                </tr>
              `;
            }).join('')}
            ${summary.sessions.length === 0 ? '<tr><td colspan="4" style="text-align:center; color:#94a3b8;">Нет зафиксированных тренировок за этот период</td></tr>' : ''}
          </tbody>
        </table>
      </section>

      ${summary.progressLogs.length > 0 ? `
      <section>
        <h2>Динамика антропометрии и веса</h2>
        <table>
          <thead>
            <tr>
              <th>Дата</th>
              <th>Вес (кг)</th>
              <th>% Жира</th>
              <th>Талия (см)</th>
              <th>Бицепс (см)</th>
            </tr>
          </thead>
          <tbody>
            ${summary.progressLogs.map(p => `
              <tr>
                <td>${p.date.split('-').reverse().join('.')}</td>
                <td><strong>${p.weight != null ? p.weight + ' кг' : '—'}</strong></td>
                <td>${p.fatPercent != null ? p.fatPercent + '%' : '—'}</td>
                <td>${p.waist != null ? p.waist + ' см' : '—'}</td>
                <td>${p.biceps != null ? p.biceps + ' см' : '—'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </section>
      ` : ''}

      <div class="footer">
        Сгенерировано в Brosky Gym PWA • Все данные сохранены локально в браузере
      </div>

      <script>
        window.onload = function() {
          window.print();
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}

/**
 * Печать / Сохранение PDF-отчета за месяц (для обратной совместимости)
 */
export function generateMonthlyReportPDFWindow(
  profile: AthleteProfile,
  summary: ReportPeriodSummary
): void {
  generatePeriodReportPDFWindow(profile, summary);
}
