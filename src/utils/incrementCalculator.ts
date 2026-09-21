import type { RevisionTemplate, SalaryComponentValue } from "../services/modules/payrollServices/salaryRevision";

const round = (value: number, rule?: string) => {
  switch (rule) {
    case "NEAREST_100":
      return Math.round(value / 100) * 100;
    case "NEAREST_1000":
      return Math.round(value / 1000) * 1000;
    default:
      return Math.round(value);
  }
};

export function calculateIncrement(
  currentCtc: number,
  template: RevisionTemplate
): number {
  const { type, config } = template;
  let increment = 0;

  switch (type) {
    case "PERCENT":
      increment = (currentCtc * (config.percent || 0)) / 100;
      break;
    case "FLAT":
      increment = config.flatAmount || 0;
      break;
    case "SLAB": {
      const slab = config.slabs?.find(
        (s) => currentCtc >= s.from && currentCtc <= s.to
      );
      increment = slab ? (currentCtc * slab.percent) / 100 : 0;
      break;
    }
    case "CTC_BASED":
      break;
  }

  if (config.minIncrement) increment = Math.max(increment, config.minIncrement);
  if (config.maxIncrement) increment = Math.min(increment, config.maxIncrement);

  return round(increment, config.roundingRule);
}

export function distributeAcrossComponents(
  increment: number,
  components: SalaryComponentValue[]
): SalaryComponentValue[] {
  const basic = components.find((c) => c.componentName === "Basic");
  if (!basic) {
    return components.map((c) => ({ ...c, delta: 0, deltaPercent: 0 }));
  }

  const basicIncrement = round(increment * 0.4, "NEAREST_100");
  const hraIncrement = round(increment * 0.2, "NEAREST_100");
  const specialInc = increment - basicIncrement - hraIncrement;

  return components.map((c) => {
    let add = 0;
    if (c.componentName === "Basic") add = basicIncrement;
    else if (c.componentName === "HRA") add = hraIncrement;
    else if (c.componentName === "Special Allowance") add = specialInc;

    const newValue = c.oldValue + add;
    return {
      ...c,
      newValue,
      delta: add,
      deltaPercent: c.oldValue ? (add / c.oldValue) * 100 : 0,
    };
  });
}