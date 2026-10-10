import { useMemo } from "react";
import { Joyride, EVENTS, STATUS } from "react-joyride";
import type { EventData, Step } from "react-joyride";
import GlassTooltip from "./GlassTooltip";
import { TOURS, TOUR_SHEET_EVENT } from "./tours";
import type { TourId } from "./tours";

interface Props {
  tour: TourId;
  onClose: () => void;
  onTab: (tab: string) => void;
}

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export default function Walkthrough({ tour, onClose, onTab }: Props) {
  const steps = useMemo<Step[]>(
    () =>
      TOURS[tour].steps.map((s) => ({
        target: s.target ? `[data-tour="${s.target}"]` : "body",
        placement: s.target ? "auto" : "center",
        title: s.title,
        content: s.body,
        before: async () => {
          if (s.tab) {
            onTab(s.tab);
            await wait(350);
          }
          if (s.sheet) {
            window.dispatchEvent(
              new CustomEvent(TOUR_SHEET_EVENT, { detail: s.sheet }),
            );
            await wait(450);
          }
        },
      })),
    [tour, onTab],
  );

  const handleEvent = (data: EventData) => {
    if (
      data.type === EVENTS.TOUR_END ||
      data.status === STATUS.FINISHED ||
      data.status === STATUS.SKIPPED
    ) {
      window.dispatchEvent(
        new CustomEvent(TOUR_SHEET_EVENT, { detail: "closed" }),
      );
      onClose();
    }
  };

  return (
    <Joyride
      run
      continuous
      steps={steps}
      onEvent={handleEvent}
      options={{
        zIndex: 3000,
        showProgress: true,
        skipBeacon: true,
        closeButtonAction: "skip",
        buttons: ["back", "primary", "skip"],
        primaryColor: "#00e5ff",
        backgroundColor: "#141720",
        textColor: "#e2e8f0",
        arrowColor: "#141720",
        overlayColor: "rgba(5, 6, 10, 0.72)",
        spotlightRadius: 12,
        spotlightPadding: 8,
        scrollOffset: 120,
        targetWaitTimeout: 1500,
        width: 340,
      }}
      tooltipComponent={GlassTooltip}
      floatingOptions={{ hideArrow: true }}
      styles={{
        spotlight: {
          stroke: "rgba(0, 229, 255, 0.7)",
          strokeWidth: 1.5,
        },
      }}
    />
  );
}
