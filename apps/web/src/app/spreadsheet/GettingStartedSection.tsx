import { CodeBlock } from "./CodeBlock";

const INSTALL = `npm install @widgetkit/spreadsheet-react
# or
pnpm add @widgetkit/spreadsheet-react`;

const IMPORT = `import { Spreadsheet } from "@widgetkit/spreadsheet-react";
import "@widgetkit/spreadsheet-react/styles.css";`;

const BASIC = `import { Spreadsheet } from "@widgetkit/spreadsheet-react";
import "@widgetkit/spreadsheet-react/styles.css";

export function App() {
  return (
    <Spreadsheet
      defaultCells={{
        A1: "Name",  B1: "Score",
        A2: "Alice", B2: 95,
        A3: "Bob",   B3: 87,
        A4: "Total", B4: "=SUM(B2:B3)",
      }}
      rows={10}
      cols={5}
    />
  );
}`;

export function GettingStartedSection() {
  return (
    <div>
      <p>Install the package from npm:</p>
      <CodeBlock code={INSTALL} compact />

      <p>Import the component and its stylesheet:</p>
      <CodeBlock code={IMPORT} compact />

      <p>
        Pass <code className="inline-code">defaultCells</code> for
        uncontrolled usage, or <code className="inline-code">cells</code>{" "}
        +{" "}<code className="inline-code">onCellsChange</code> for
        controlled:
      </p>
      <CodeBlock code={BASIC} />
    </div>
  );
}
