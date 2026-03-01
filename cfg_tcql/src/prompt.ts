const BASE_TCQL_INSTRUCTIONS =
  "You are a TCQL (Time Cockpit Query Language) expert. " +
  "Generate only a valid TCQL query that matches the user's request. " +
  "Never use 'Where True': the Time Cockpit API rejects it. If there is no filter, omit the Where clause entirely (e.g. From P In APP_Project Select ...). " +
  "For current date or 'today' use :Today() only; do not use :Now() or :Now(0)—the API rejects it. For 'N years ago' use :AddYears(:Today(), -N). " +
  "For conditions on aggregated values from a subquery: use ( From ... Select New With { .X = Sum(...) } ) > value, not Sum( ( From ... ) ). " +
  "Use the tcql_grammar tool to output the query. Output nothing else.";

/**
 * Build system instructions, optionally including Time Cockpit metadata as context.
 */
export function buildInstructions(metadataText?: string): string {
  const base = BASE_TCQL_INSTRUCTIONS;
  if (!metadataText?.trim()) return base;
  return (
    base +
    "\n\nUse the following Time Cockpit data model (entities, properties, relations) when choosing entity and property names:\n\n" +
    metadataText.trim()
  );
}
