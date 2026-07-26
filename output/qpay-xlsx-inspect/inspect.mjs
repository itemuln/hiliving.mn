import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const paths = process.argv.slice(2);

for (const path of paths) {
  const workbook = await SpreadsheetFile.importXlsx(await FileBlob.load(path));
  const sheets = await workbook.inspect({ kind: "sheet", include: "id,name", maxChars: 8000 });
  const matches = await workbook.inspect({
    kind: "match",
    searchTerm: "qPay_shortUrl|qPay_deeplink|invoice_id|invoice_receiver_code|qr_image|qr_text",
    options: { useRegex: true, maxResults: 200 },
    maxChars: 30000,
  });
  process.stdout.write(`FILE ${path}\nSHEETS\n${sheets.ndjson}\nMATCHES\n${matches.ndjson}\n`);
}
