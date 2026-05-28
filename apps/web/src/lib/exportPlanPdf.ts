import { jsPDF } from "jspdf";
import type { PlanSummary } from "@/lib/types";

export function exportPlanToPdf(plan: PlanSummary, userName: string): void {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const margin = 14;
  const pageWidth = doc.internal.pageSize.getWidth();
  const usableWidth = pageWidth - margin * 2;
  const totalExercises = plan.workouts.reduce((acc, workout) => acc + workout.exercises.length, 0);
  const totalMinutes = plan.workouts.reduce((acc, workout) => acc + workout.estimated_minutes, 0);
  const avgMinutes = plan.workouts.length ? Math.round(totalMinutes / plan.workouts.length) : 0;
  let y = 18;

  const ensureSpace = (requiredHeight: number): void => {
    if (y + requiredHeight <= 282) return;
    doc.addPage();
    y = 18;
  };

  // Header stripe
  doc.setFillColor(15, 53, 107);
  doc.roundedRect(margin, y - 10, usableWidth, 30, 3, 3, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Plano de Treino", margin + 4, y + 2);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Atleta: ${userName}`, margin + 4, y + 9);
  y += 28;

  doc.setTextColor(20, 20, 20);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(plan.program_name, margin, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(70, 70, 70);
  doc.text(`Split: ${plan.weekly_split}`, margin, y);
  y += 10;

  // Key metrics only
  const metrics: readonly string[] = [
    `${plan.workouts.length} dias de treino`,
    `${totalExercises} exercícios na semana`,
    `Média de ${avgMinutes} min por sessão`,
  ];
  doc.setFillColor(244, 247, 252);
  doc.roundedRect(margin, y - 5, usableWidth, 20, 2, 2, "F");
  doc.setTextColor(35, 35, 35);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(metrics.join("  •  "), margin + 4, y + 5);
  y += 22;

  for (const workout of plan.workouts) {
    ensureSpace(18);
    doc.setFillColor(236, 244, 255);
    doc.roundedRect(margin, y - 5, usableWidth, 11, 2, 2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(18, 52, 86);
    doc.text(workout.day_label, margin + 3, y + 1.5);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`${workout.estimated_minutes} min`, pageWidth - margin - 20, y + 1.5);
    y += 10;

    for (const exercise of workout.exercises) {
      ensureSpace(7);
      doc.setTextColor(35, 35, 35);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      const line = `• ${exercise.name}  |  ${exercise.sets}x${exercise.reps}`;
      const wrapped = doc.splitTextToSize(line, usableWidth - 4);
      doc.text(wrapped, margin + 2, y);
      y += wrapped.length * 5;
    }
    y += 4;
  }

  const safeName = userName.toLowerCase().replace(/\s+/g, "-");
  doc.save(`plano-treino-${safeName}.pdf`);
}
