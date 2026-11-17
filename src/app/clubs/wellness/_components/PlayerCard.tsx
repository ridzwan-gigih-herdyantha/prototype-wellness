"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Utensils } from "lucide-react";
import type { PlayerSummary } from "./wellness-types";
import { daysAgo, mealSummary } from "./wellness-helpers";
import { WellnessBar } from "./WellnessVisuals";
import { wellnessAverage } from "@/lib/wellness/canonical-checkins";
import type { WellnessRecord } from "@/lib/squad/types";
import { Tr } from "@/i18n/page-rest";

export default function PlayerCard({
  summary,
  expanded,
  onToggle,
  onLog,
  onShowTodayDetails,
  onShowHistoricalDetails,
}: {
  summary: PlayerSummary;
  expanded: boolean;
  onToggle: () => void;
  onLog: () => void;
  onShowTodayDetails: (record: WellnessRecord) => void;
  onShowHistoricalDetails: (record: WellnessRecord) => void;
}) {
  const {
    name,
    latest,
    today,
    avg,
    risk,
    history,
    hasNutritionPlan,
    todayMeals,
    todayMealTime,
    mealsByDate,
  } = summary;
  const todayMealBox = todayMeals.length > 0 && (
    <div className="mt-3 rounded-xl bg-ink/[0.04] px-3 py-2.5 flex items-start gap-2">
      <Utensils className="w-3.5 h-3.5 text-emerald-500/70 mt-0.5 flex-shrink-0" />
      <div className="min-w-0">
        <p className="text-xs text-foreground font-light">
          {mealSummary(todayMeals)}
        </p>
        <p className="text-[10px] text-ink/40 font-light mt-0.5">
          {todayMeals.length} {todayMeals.length === 1 ? "message" : "messages"}{" "}
          via {todayMeals.at(-1)?.source === "whatsapp" ? "WhatsApp" : "staff"},
          last {todayMealTime}
        </p>
      </div>
    </div>
  );
  const stale = daysAgo(latest.recorded_at) > 3;

  return (
    <div
      className={`rounded-2xl border border-line bg-background/60 backdrop-blur-sm transition-all ${stale ? "opacity-60" : ""}`}
    >
      <div className="p-4">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={expanded}
          className={`w-full text-left active:opacity-70 transition-opacity ${today ? "mb-3" : ""}`}
        >
          <div
            className={`flex items-center justify-between ${today ? "mb-3" : ""}`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-sm font-light text-foreground truncate">
                {name}
              </span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {risk === "HIGH RISK" && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-500/80 font-medium">
                  <Tr s={"High Risk"} />
                </span>
              )}
              <span className="text-[11px] text-ink/40 font-light">
                {today ? "Today" : "Not checked in today"}
              </span>
            </div>
          </div>
        </button>

        {today && (
          <>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Soreness", value: today.muscle_soreness },
                { label: "Energy", value: today.energy_level },
                { label: "Sleep", value: today.sleep_quality },
              ].map((m) => (
                <div key={m.label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-ink/40 font-light">
                      {m.label}
                    </span>
                    <span className="text-[11px] text-ink/60 tabular-nums font-light">
                      {m.value === null ? "--" : `${m.value}/5`}
                    </span>
                  </div>
                  <WellnessBar value={m.value} />
                </div>
              ))}
            </div>

            {todayMealBox}

            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-3">
                <span
                  className={`text-xs tabular-nums font-light ${avg !== null && avg <= 2 ? "text-red-400/80" : avg !== null && avg <= 3 ? "text-amber-400/80" : "text-emerald-500/70"}`}
                >
                  {avg === null ? "Avg --" : `Avg ${avg.toFixed(1)}`}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onShowTodayDetails(today)}
                  className="text-[11px] px-2.5 py-1 rounded-lg border border-line text-ink/50 hover:text-foreground hover:bg-hover transition-colors"
                >
                  Show details
                </button>
                {today.notes && (
                  <span className="text-[10px] text-ink/30 font-light truncate max-w-[100px]">
                    {today.notes}
                  </span>
                )}
                <span
                  className={`flex items-center gap-1 text-[10px] font-light ${hasNutritionPlan ? "text-emerald-500/60" : "text-ink/20"}`}
                >
                  <Utensils className="w-2.5 h-2.5" />
                  {hasNutritionPlan ? "Plan" : "No plan"}
                </span>
              </div>
            </div>
          </>
        )}
        {!today && todayMealBox}
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-1 border-t border-line">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] text-ink/30 uppercase tracking-wider font-light">
                  <Tr s={"14-Day History"} />
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onLog();
                  }}
                  className="text-[11px] px-3 py-1.5 bg-ink/[0.04] border border-line text-ink/60 hover:text-foreground hover:shadow-sm rounded-xl transition-all font-medium"
                >
                  Log Check-in
                </button>
              </div>
              <div className="space-y-2">
                {history.map((h) => {
                  const hAvg = wellnessAverage(h);
                  const dayMeals = mealSummary(
                    mealsByDate[h.recorded_at.slice(0, 10)] ?? [],
                  );
                  return (
                    <div key={h.id}>
                      <div className="flex items-center gap-3">
                        <span className="text-[11px] text-ink/40 font-light tabular-nums w-14 flex-shrink-0">
                          {new Date(h.recorded_at).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                          })}
                        </span>
                        <div className="flex-1">
                          <WellnessBar
                            value={hAvg === null ? null : Math.round(hAvg)}
                            size="sm"
                          />
                        </div>
                        <span className="text-[11px] text-ink/40 tabular-nums font-light w-6 text-right">
                          {hAvg === null ? "--" : hAvg.toFixed(1)}
                        </span>
                        <button
                          type="button"
                          onClick={() => onShowHistoricalDetails(h)}
                          className="text-[11px] px-2.5 py-1 rounded-lg border border-line text-ink/50 hover:text-foreground hover:bg-hover transition-colors whitespace-nowrap"
                        >
                          Show details
                        </button>
                      </div>
                      <p
                        className={`text-[11px] font-light mt-1 pl-16 ${dayMeals ? "text-ink/60" : "text-amber-500/80"}`}
                      >
                        {dayMeals || "No meal logged"}
                      </p>
                    </div>
                  );
                })}
              </div>
              {history.some((h) => h.notes) && (
                <div className="mt-3 pt-2 border-t border-ink/[0.04]">
                  {history
                    .filter((h) => h.notes)
                    .slice(0, 3)
                    .map((h) => (
                      <p
                        key={h.id}
                        className="text-[11px] text-ink/40 font-light mb-1"
                      >
                        <span className="text-ink/25">
                          {new Date(h.recorded_at).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                          })}
                          :
                        </span>{" "}
                        {h.notes}
                      </p>
                    ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
