import dayjs from "dayjs";

export type MovementType = "IN" | "OUT";

export interface RawMovement {
  time: string;
  type: MovementType;
  device: string;
}


export interface PairedMovement {
  index: number;             
  outTime: string;          
  inTime: string | null;     
  durationMinutes: number | null;
  classification: "official" | "personal" | "break" | null;
  permissionRequestId?: string | null;
  saving?: boolean;
}

export function pairMovements(raw: RawMovement[] = []): PairedMovement[] {
  const sorted = [...raw].sort(
    (a, b) => dayjs(a.time).valueOf() - dayjs(b.time).valueOf(),
  );

  const paired: PairedMovement[] = [];
  let pendingOut: string | null = null;

  const flush = (inTime: string | null) => {
    if (!pendingOut) return;
    const durationMinutes = inTime
      ? Math.max(
          0,
          dayjs(inTime).diff(dayjs(pendingOut), "minute"),
        )
      : null;
    paired.push({
      index: paired.length + 1,
      outTime: pendingOut,
      inTime,
      durationMinutes,
      classification: null,
    });
    pendingOut = null;
  };

  for (const m of sorted) {
    if (m.type === "OUT") {
      if (pendingOut) flush(null);
      pendingOut = m.time;
    } else if (m.type === "IN") {
      if (pendingOut) {
        flush(m.time);
      }
    }
  }
  if (pendingOut) flush(null);

  return paired;
}