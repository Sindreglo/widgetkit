"use client";

import { useState } from "react";
import { Spreadsheet } from "@widgetkit/spreadsheet-react";
import type { CellMap, CellFormat, MergeRegion } from "@widgetkit/spreadsheet-react";

const cells: CellMap = {
  // Header
  A1: "Product Catalog — 2024",

  // Column headers
  A2: "Product",    B2: "Category",  C2: "Price",    D2: "Units Sold",
  E2: "Revenue",    F2: "Cost",      G2: "Profit",   H2: "Margin %",

  // Data rows
  A3: "Pro Keyboard",   B3: "Hardware",  C3: 129,  D3: 412,
  A4: "Wireless Mouse", B4: "Hardware",  C4: 49,   D4: 873,
  A5: "USB-C Hub",      B5: "Hardware",  C5: 79,   D5: 654,
  A6: "Webcam 4K",      B6: "Hardware",  C6: 199,  D6: 218,
  A7: "Desk Lamp",      B7: "Furniture", C7: 59,   D7: 1102,
  A8: "Monitor Stand",  B8: "Furniture", C8: 89,   D8: 540,
  A9: "Cable Tray",     B9: "Furniture", C9: 35,   D9: 789,
  A10: "Laptop Stand",  B10: "Furniture",C10: 45,  D10: 934,
  A11: "Note-taking App",B11: "Software",C11: 9,   D11: 3204,
  A12: "Task Manager",  B12: "Software", C12: 12,  D12: 2871,
  A13: "PDF Editor",    B13: "Software", C13: 29,  D13: 1540,
  A14: "VPN Client",    B14: "Software", C14: 8,   D14: 4210,
  A15: "Screen Recorder",B15:"Software", C15: 19,  D15: 2108,
  A16: "Cloud Storage", B16: "Software", C16: 6,   D16: 6300,
  A17: "Totals",

  // Revenue = Price * Units Sold
  E3:  "=C3*D3",  E4:  "=C4*D4",  E5:  "=C5*D5",  E6:  "=C6*D6",
  E7:  "=C7*D7",  E8:  "=C8*D8",  E9:  "=C9*D9",  E10: "=C10*D10",
  E11: "=C11*D11",E12: "=C12*D12",E13: "=C13*D13",E14: "=C14*D14",
  E15: "=C15*D15",E16: "=C16*D16",

  // Cost = Revenue * 0.55 (approximate COGS)
  F3:  "=E3*0.55",  F4:  "=E4*0.55",  F5:  "=E5*0.55",  F6:  "=E6*0.55",
  F7:  "=E7*0.55",  F8:  "=E8*0.55",  F9:  "=E9*0.55",  F10: "=E10*0.55",
  F11: "=E11*0.3",  F12: "=E12*0.3",  F13: "=E13*0.3",  F14: "=E14*0.3",
  F15: "=E15*0.3",  F16: "=E16*0.3",

  // Profit = Revenue - Cost
  G3:  "=E3-F3",  G4:  "=E4-F4",  G5:  "=E5-F5",  G6:  "=E6-F6",
  G7:  "=E7-F7",  G8:  "=E8-F8",  G9:  "=E9-F9",  G10: "=E10-F10",
  G11: "=E11-F11",G12: "=E12-F12",G13: "=E13-F13",G14: "=E14-F14",
  G15: "=E15-F15",G16: "=E16-F16",

  // Margin % = Profit / Revenue
  H3:  "=G3/E3",  H4:  "=G4/E4",  H5:  "=G5/E5",  H6:  "=G6/E6",
  H7:  "=G7/E7",  H8:  "=G8/E8",  H9:  "=G9/E9",  H10: "=G10/E10",
  H11: "=G11/E11",H12: "=G12/E12",H13: "=G13/E13",H14: "=G14/E14",
  H15: "=G15/E15",H16: "=G16/E16",

  // Totals row
  D17: "=SUM(D3:D16)",
  E17: "=SUM(E3:E16)",
  F17: "=SUM(F3:F16)",
  G17: "=SUM(G3:G16)",
  H17: "=G17/E17",
};

const headerBg: CellFormat = { bold: true, background: "#f1f5f9" };
const currency: CellFormat = { numberFormat: "currency" };
const currencyGreen: CellFormat = { numberFormat: "currency", color: "#16a34a" };
const percent: CellFormat = { numberFormat: "percent", decimalPlaces: 1 };
const percentGreen: CellFormat = { numberFormat: "percent", decimalPlaces: 1, color: "#16a34a" };
const totalRow: CellFormat = { bold: true, background: "#f1f5f9" };
const totalCurrency: CellFormat = { bold: true, background: "#f1f5f9", numberFormat: "currency" };
const totalProfit: CellFormat = { bold: true, background: "#f0fdf4", numberFormat: "currency", color: "#16a34a" };
const totalMargin: CellFormat = { bold: true, background: "#f0fdf4", numberFormat: "percent", decimalPlaces: 1, color: "#16a34a" };

const formats: Record<string, CellFormat> = {
  A1: { bold: true, background: "#1e293b", color: "#ffffff" },
  A2: headerBg, B2: headerBg, C2: headerBg, D2: headerBg,
  E2: headerBg, F2: headerBg, G2: headerBg, H2: headerBg,

  C3: currency, C4: currency, C5: currency, C6: currency,
  C7: currency, C8: currency, C9: currency, C10: currency,
  C11: currency, C12: currency, C13: currency, C14: currency,
  C15: currency, C16: currency,

  E3: currency, E4: currency, E5: currency, E6: currency,
  E7: currency, E8: currency, E9: currency, E10: currency,
  E11: currency, E12: currency, E13: currency, E14: currency,
  E15: currency, E16: currency,

  F3: currency, F4: currency, F5: currency, F6: currency,
  F7: currency, F8: currency, F9: currency, F10: currency,
  F11: currency, F12: currency, F13: currency, F14: currency,
  F15: currency, F16: currency,

  G3: currencyGreen, G4: currencyGreen, G5: currencyGreen, G6: currencyGreen,
  G7: currencyGreen, G8: currencyGreen, G9: currencyGreen, G10: currencyGreen,
  G11: currencyGreen, G12: currencyGreen, G13: currencyGreen, G14: currencyGreen,
  G15: currencyGreen, G16: currencyGreen,

  H3: percent, H4: percent, H5: percent, H6: percent,
  H7: percent, H8: percent, H9: percent, H10: percent,
  H11: percentGreen, H12: percentGreen, H13: percentGreen, H14: percentGreen,
  H15: percentGreen, H16: percentGreen,

  A17: totalRow, B17: totalRow, C17: totalRow,
  D17: totalRow,
  E17: totalCurrency, F17: totalCurrency,
  G17: totalProfit,
  H17: totalMargin,
};

const merges: Record<string, MergeRegion> = {
  A1: { colSpan: 8, rowSpan: 1 },
};

export function LargeDataDemo() {
  const [currentCells, setCurrentCells] = useState<CellMap>(cells);
  const [currentFormats, setCurrentFormats] = useState(formats);
  const [currentMerges, setCurrentMerges] = useState(merges);

  return (
    <Spreadsheet
      cells={currentCells}
      formats={currentFormats}
      merges={currentMerges}
      rows={30}
      cols={10}
      maxHeight={420}
      autoExpandRows
      resizableCols
      onCellsChange={setCurrentCells}
      onFormatsChange={setCurrentFormats}
      onMergesChange={setCurrentMerges}
      aria-label="Product catalog spreadsheet"
    />
  );
}
